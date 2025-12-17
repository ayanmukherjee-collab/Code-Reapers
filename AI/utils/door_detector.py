"""
Door Detection Module

Detects doors in floor plan images by finding quarter-circle arcs near wall endpoints.
Based on the original door_detector.py implementation.
"""

import cv2
import numpy as np
from typing import List, Dict, Tuple


def detect_doors(
    gray_image: np.ndarray,
    walls: List[Dict],
    search_radius: int = 80,
    min_radius: float = 15
) -> List[Dict]:
    """
    Main door detection pipeline.
    
    Args:
        gray_image: Grayscale input image
        walls: List of detected walls for reference
        search_radius: Radius to search for arcs near wall endpoints
        min_radius: Minimum door arc radius
        
    Returns:
        List of door dictionaries with hinge point and swing angle
    """
    # Get wall endpoints
    endpoints = get_wall_endpoints(walls)
    
    # Cluster nearby endpoints
    clustered = cluster_endpoints(endpoints, distance=20)
    
    # Find arcs near wall endpoints
    doors = find_arcs_near_walls(gray_image, clustered, search_radius)
    
    # Remove duplicates and filter by radius
    doors = remove_duplicates(doors, min_dist=35, min_radius=min_radius)
    
    return doors


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


def find_arcs_near_walls(
    gray_image: np.ndarray,
    wall_endpoints: List[Tuple[int, int]],
    search_radius: int = 80
) -> List[Dict]:
    """
    Find door arcs by looking for curved contours near wall endpoints.
    
    Args:
        gray_image: Grayscale input image
        wall_endpoints: Clustered wall endpoint positions
        search_radius: Radius to search for arcs
        
    Returns:
        List of detected door arcs
    """
    # Threshold to get lines
    _, binary = cv2.threshold(gray_image, 200, 255, cv2.THRESH_BINARY_INV)
    
    # Find contours
    contours, _ = cv2.findContours(binary, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)
    
    arcs = []
    
    for contour in contours:
        # Skip very small or very large contours
        arc_length = cv2.arcLength(contour, closed=False)
        if arc_length < 30 or arc_length > 400:
            continue
        
        if len(contour) < 5:
            continue
        
        # Get bounding box
        x, y, w, h = cv2.boundingRect(contour)
        
        # Skip if too elongated (likely a wall, not an arc)
        aspect_ratio = max(w, h) / (min(w, h) + 1)
        if aspect_ratio > 4:
            continue
        
        # Fit line and check curvature
        try:
            vx, vy, x0, y0 = cv2.fitLine(contour, cv2.DIST_L2, 0, 0.01, 0.01)
            vx, vy, x0, y0 = float(vx), float(vy), float(x0), float(y0)
        except:
            continue
        
        # Calculate maximum deviation from the fitted line
        max_dev = 0
        for pt in contour:
            px, py = pt[0]
            dev = abs(vy * (px - x0) - vx * (py - y0))
            max_dev = max(max_dev, dev)
        
        # Check curvature
        curvature = max_dev / (arc_length + 1)
        if curvature < 0.03:  # Too straight
            continue
        
        # Get contour center
        M = cv2.moments(contour)
        if M['m00'] == 0:
            continue
        cx = int(M['m10'] / M['m00'])
        cy = int(M['m01'] / M['m00'])
        
        # Check if near any wall endpoint
        for ex, ey in wall_endpoints:
            dist = np.sqrt((cx - ex) ** 2 + (cy - ey) ** 2)
            if dist < search_radius:
                # This contour is near a wall endpoint - likely a door arc
                start_pt = contour[0][0]
                end_pt = contour[-1][0]
                
                # Determine hinge (closest point to wall endpoint)
                d_start = np.sqrt((start_pt[0] - ex) ** 2 + (start_pt[1] - ey) ** 2)
                d_end = np.sqrt((end_pt[0] - ex) ** 2 + (end_pt[1] - ey) ** 2)
                
                if d_start < d_end:
                    hinge = (int(start_pt[0]), int(start_pt[1]))
                    swing_end = (int(end_pt[0]), int(end_pt[1]))
                else:
                    hinge = (int(end_pt[0]), int(end_pt[1]))
                    swing_end = (int(start_pt[0]), int(start_pt[1]))
                
                # Estimate radius
                radius = np.sqrt((swing_end[0] - hinge[0]) ** 2 + (swing_end[1] - hinge[1]) ** 2)
                
                # Calculate swing angle
                swing_angle = np.degrees(np.arctan2(
                    swing_end[1] - hinge[1],
                    swing_end[0] - hinge[0]
                ))
                
                arcs.append({
                    'hinge': list(hinge),
                    'arc_center': [cx, cy],
                    'swing_start': 0.0,
                    'swing_end': round(swing_angle % 360, 1),
                    'radius': round(radius, 1),
                    'wall_endpoint': [ex, ey],
                    'confidence': 0.7 + (curvature * 2)  # Higher curvature = more likely a door
                })
                break
    
    return arcs


def remove_duplicates(
    doors: List[Dict],
    min_dist: float = 40,
    min_radius: float = 15
) -> List[Dict]:
    """
    Remove duplicate door detections and filter out small radii.
    
    Args:
        doors: List of detected doors
        min_dist: Minimum distance between door hinges
        min_radius: Minimum door arc radius
        
    Returns:
        Filtered list of unique doors
    """
    # Filter by minimum radius
    doors = [d for d in doors if d['radius'] >= min_radius]
    
    # Clamp confidence values
    for door in doors:
        door['confidence'] = min(0.95, door['confidence'])
    
    unique = []
    for door in doors:
        h = door['hinge']
        is_dup = False
        
        for u in unique:
            uh = u['hinge']
            if np.sqrt((h[0] - uh[0]) ** 2 + (h[1] - uh[1]) ** 2) < min_dist:
                # Keep the one with higher confidence
                if door['confidence'] > u['confidence']:
                    unique.remove(u)
                    unique.append(door)
                is_dup = True
                break
        
        if not is_dup:
            unique.append(door)
    
    return unique
