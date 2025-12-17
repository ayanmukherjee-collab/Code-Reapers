"""
Wall Detection Module

Detects walls in floor plan images using Hough Line Transform.
Based on the reference implementation approach.
"""

import cv2
import numpy as np
from typing import List, Dict, Tuple


def detect_walls(
    binary_image: np.ndarray,
    edges_image: np.ndarray,
    min_length: int = None,
    max_gap: int = None
) -> List[Dict]:
    """
    Detect walls as straight lines using Probabilistic Hough Transform.
    Uses adaptive parameters based on image size for better detection.
    
    Args:
        binary_image: Binary thresholded image
        edges_image: Edge-detected image
        min_length: Minimum line length (auto-calculated if None)
        max_gap: Maximum gap between segments (auto-calculated if None)
        
    Returns:
        List of wall dictionaries with x1, y1, x2, y2, confidence
    """
    walls = []
    h, w = edges_image.shape[:2]
    
    # Adaptive parameters based on image size
    if min_length is None:
        min_length = max(20, min(h, w) // 50)  # At least 20px, scales with image
    if max_gap is None:
        max_gap = max(5, min(h, w) // 100)  # Allow small gaps
    
    # Adaptive threshold - lower for smaller images
    threshold = max(30, min(h, w) // 40)
    
    # Apply morphological operations to connect broken lines
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
    edges_cleaned = cv2.morphologyEx(edges_image, cv2.MORPH_CLOSE, kernel)
    
    # Use edges for Hough detection with adaptive parameters
    lines = cv2.HoughLinesP(
        edges_cleaned,
        rho=1,
        theta=np.pi / 180,
        threshold=threshold,
        minLineLength=min_length,
        maxLineGap=max_gap
    )
    
    if lines is None:
        # Try with even lower threshold
        lines = cv2.HoughLinesP(
            edges_cleaned,
            rho=1,
            theta=np.pi / 180,
            threshold=max(15, threshold // 2),
            minLineLength=min_length // 2,
            maxLineGap=max_gap * 2
        )
    
    if lines is None:
        return walls
    
    # Process detected lines
    for line in lines:
        x1, y1, x2, y2 = line[0]
        
        # Calculate line length
        length = np.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)
        
        # Skip very short lines (but be lenient)
        if length < min_length * 0.7:
            continue
        
        # Filter nearly horizontal/vertical lines (walls are usually at 0/90 degrees)
        angle = np.degrees(np.arctan2(abs(y2 - y1), abs(x2 - x1)))
        is_horizontal = angle < 15
        is_vertical = angle > 75
        
        # Give higher confidence to horizontal/vertical lines (typical walls)
        if is_horizontal or is_vertical:
            base_confidence = 0.7
        else:
            base_confidence = 0.5
        
        # Calculate confidence based on line strength
        confidence = min(0.95, base_confidence + (length / (max(h, w) * 2)))
        
        walls.append({
            'x1': int(x1),
            'y1': int(y1),
            'x2': int(x2),
            'y2': int(y2),
            'length': float(length),
            'confidence': float(confidence),
            'is_horizontal': is_horizontal,
            'is_vertical': is_vertical
        })
    
    # Merge nearby parallel walls
    walls = merge_nearby_walls(walls, distance_threshold=max(10, min(h, w) // 100), angle_threshold=15)
    
    # Filter duplicates
    walls = filter_duplicate_walls(walls, min_distance=max(10, min(h, w) // 80))
    
    return walls


def merge_nearby_walls(
    walls: List[Dict],
    distance_threshold: float = 15,
    angle_threshold: float = 10
) -> List[Dict]:
    """
    Merge nearby parallel wall segments into longer walls.
    
    Args:
        walls: List of wall dictionaries
        distance_threshold: Maximum perpendicular distance to merge
        angle_threshold: Maximum angle difference (degrees) to merge
        
    Returns:
        List of merged walls
    """
    if len(walls) <= 1:
        return walls
    
    # Calculate angles for all walls
    for wall in walls:
        dx = wall['x2'] - wall['x1']
        dy = wall['y2'] - wall['y1']
        wall['angle'] = np.degrees(np.arctan2(dy, dx)) % 180
    
    merged = []
    used = set()
    
    for i, wall in enumerate(walls):
        if i in used:
            continue
        
        # Find walls to merge with this one
        merge_group = [wall]
        used.add(i)
        
        for j, other in enumerate(walls):
            if j in used:
                continue
            
            # Check if parallel
            angle_diff = abs(wall['angle'] - other['angle'])
            if angle_diff > 90:
                angle_diff = 180 - angle_diff
            
            if angle_diff > angle_threshold:
                continue
            
            # Check if close enough
            if walls_are_close(wall, other, distance_threshold):
                merge_group.append(other)
                used.add(j)
        
        # Merge the group
        if len(merge_group) > 1:
            merged_wall = merge_wall_group(merge_group)
            merged.append(merged_wall)
        else:
            merged.append(wall)
    
    return merged


def walls_are_close(wall1: Dict, wall2: Dict, threshold: float) -> bool:
    """Check if two walls are close enough to merge."""
    # Get all endpoints
    p1 = np.array([wall1['x1'], wall1['y1']])
    p2 = np.array([wall1['x2'], wall1['y2']])
    p3 = np.array([wall2['x1'], wall2['y1']])
    p4 = np.array([wall2['x2'], wall2['y2']])
    
    # Check minimum distance between any endpoints
    distances = [
        np.linalg.norm(p1 - p3),
        np.linalg.norm(p1 - p4),
        np.linalg.norm(p2 - p3),
        np.linalg.norm(p2 - p4)
    ]
    
    return min(distances) < threshold * 3


def merge_wall_group(walls: List[Dict]) -> Dict:
    """Merge a group of walls into a single wall."""
    # Get all endpoints
    points = []
    for wall in walls:
        points.append([wall['x1'], wall['y1']])
        points.append([wall['x2'], wall['y2']])
    
    points = np.array(points)
    
    # Fit a line to all points
    vx, vy, x0, y0 = cv2.fitLine(points, cv2.DIST_L2, 0, 0.01, 0.01)
    vx, vy, x0, y0 = float(vx), float(vy), float(x0), float(y0)
    
    # Project all points onto the line
    projections = []
    for px, py in points:
        t = vx * (px - x0) + vy * (py - y0)
        projections.append((t, px, py))
    
    # Get extreme points
    projections.sort(key=lambda x: x[0])
    _, x1, y1 = projections[0]
    _, x2, y2 = projections[-1]
    
    # Calculate merged confidence
    avg_confidence = np.mean([w['confidence'] for w in walls])
    
    return {
        'x1': int(x1),
        'y1': int(y1),
        'x2': int(x2),
        'y2': int(y2),
        'length': float(np.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)),
        'confidence': float(min(0.95, avg_confidence + 0.05))
    }


def filter_duplicate_walls(walls: List[Dict], min_distance: float = 10) -> List[Dict]:
    """Remove nearly identical wall segments."""
    if len(walls) <= 1:
        return walls
    
    unique = []
    
    for wall in walls:
        is_duplicate = False
        center = ((wall['x1'] + wall['x2']) / 2, (wall['y1'] + wall['y2']) / 2)
        
        for existing in unique:
            existing_center = ((existing['x1'] + existing['x2']) / 2, 
                              (existing['y1'] + existing['y2']) / 2)
            
            dist = np.sqrt((center[0] - existing_center[0]) ** 2 + 
                          (center[1] - existing_center[1]) ** 2)
            
            if dist < min_distance:
                # Keep the longer one
                if wall['length'] > existing['length']:
                    unique.remove(existing)
                    unique.append(wall)
                is_duplicate = True
                break
        
        if not is_duplicate:
            unique.append(wall)
    
    return unique


def get_wall_endpoints(walls: List[Dict]) -> List[Tuple[int, int]]:
    """Get all wall endpoints as potential door hinge locations."""
    endpoints = []
    for wall in walls:
        endpoints.append((wall['x1'], wall['y1']))
        endpoints.append((wall['x2'], wall['y2']))
    return endpoints


def cluster_endpoints(
    endpoints: List[Tuple[int, int]],
    distance: float = 15
) -> List[Tuple[int, int]]:
    """Cluster nearby endpoints and return cluster centers."""
    if not endpoints:
        return []
    
    points = np.array(endpoints, dtype=np.float32)
    clusters = []
    used = set()
    
    for i, pt in enumerate(points):
        if i in used:
            continue
        
        cluster = [pt]
        used.add(i)
        
        for j, pt2 in enumerate(points):
            if j in used:
                continue
            if np.linalg.norm(pt - pt2) < distance:
                cluster.append(pt2)
                used.add(j)
        
        center = np.mean(cluster, axis=0)
        clusters.append((int(center[0]), int(center[1])))
    
    return clusters
