"""
Room Detection Module

Detects rooms in floor plan images using contour analysis.
Rooms are identified as enclosed regions bounded by walls.
"""

import cv2
import numpy as np
from typing import List, Dict, Tuple


def detect_rooms(
    binary_image: np.ndarray,
    walls: List[Dict],
    image_width: int,
    image_height: int,
    min_area: int = None,
    max_area_ratio: float = 0.6
) -> List[Dict]:
    """
    Detect rooms as enclosed regions in the floor plan.
    Uses adaptive parameters and multi-pass detection for better results.
    
    Args:
        binary_image: Binary thresholded image (walls are white)
        walls: List of detected walls (for validation)
        image_width: Original image width
        image_height: Original image height
        min_area: Minimum room area (auto-calculated if None)
        max_area_ratio: Maximum room area as ratio of image
        
    Returns:
        List of room dictionaries with bounding box and area
    """
    rooms = []
    total_area = image_width * image_height
    max_area = total_area * max_area_ratio
    
    # Adaptive minimum area based on image size
    if min_area is None:
        min_area = max(500, total_area // 2000)  # At least 500px or 0.05% of image
    
    # Invert binary so rooms are white (walls are black)
    inverted = cv2.bitwise_not(binary_image)
    
    # Use multiple kernel sizes to catch rooms of different detail levels
    for kernel_size in [3, 5, 7]:
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (kernel_size, kernel_size))
        
        # Close small gaps in walls
        closed = cv2.morphologyEx(inverted, cv2.MORPH_CLOSE, kernel)
        
        # Apply opening to remove small noise
        opened = cv2.morphologyEx(closed, cv2.MORPH_OPEN, 
                                   cv2.getStructuringElement(cv2.MORPH_RECT, (2, 2)))
        
        # Fill holes to get solid room regions
        filled = fill_holes(opened)
        
        # Find contours (potential rooms)
        contours, hierarchy = cv2.findContours(
            filled, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE
        )
        
        if hierarchy is None:
            continue
        
        for i, contour in enumerate(contours):
            area = cv2.contourArea(contour)
            
            # Filter by area
            if area < min_area or area > max_area:
                continue
            
            # Get bounding rectangle
            x, y, w, h = cv2.boundingRect(contour)
            
            # Skip very tiny bounding boxes
            if w < 10 or h < 10:
                continue
            
            # Filter very thin regions (likely corridors or hallways)
            aspect_ratio = max(w, h) / (min(w, h) + 1)
            if aspect_ratio > 8:  # Increased from 6 to allow more elongated rooms
                continue
            
            # Filter regions touching multiple edges (likely background)
            edge_count = 0
            margin = 5
            if x <= margin:
                edge_count += 1
            if y <= margin:
                edge_count += 1
            if (x + w) >= image_width - margin:
                edge_count += 1
            if (y + h) >= image_height - margin:
                edge_count += 1
            if edge_count >= 2:
                continue
            
            # Check if this room overlaps with any existing room
            is_duplicate = False
            for existing in rooms:
                overlap = calculate_overlap({'x': x, 'y': y, 'width': w, 'height': h}, existing)
                smaller = min(area, existing['area'])
                if smaller > 0 and overlap / smaller > 0.6:
                    is_duplicate = True
                    break
            
            if is_duplicate:
                continue
            
            # Calculate confidence based on contour properties
            confidence = calculate_room_confidence(contour, area, w, h, walls)
            
            # Get approximate polygon
            epsilon = 0.02 * cv2.arcLength(contour, True)
            approx = cv2.approxPolyDP(contour, epsilon, True)
            
            rooms.append({
                'x': int(x),
                'y': int(y),
                'width': int(w),
                'height': int(h),
                'area': float(area),
                'vertices': len(approx),
                'name': classify_room(area, w, h, aspect_ratio, total_area),
                'confidence': float(confidence)
            })
    
    # Remove overlapping rooms (keep larger ones)
    rooms = remove_overlapping_rooms(rooms, overlap_threshold=0.4)
    
    # Sort by area (largest first)
    rooms.sort(key=lambda r: r['area'], reverse=True)
    
    return rooms


def fill_holes(binary_image: np.ndarray) -> np.ndarray:
    """
    Fill holes in a binary image using flood fill.
    
    Args:
        binary_image: Binary input image
        
    Returns:
        Image with holes filled
    """
    # Create a mask slightly larger than the image
    h, w = binary_image.shape
    mask = np.zeros((h + 2, w + 2), np.uint8)
    
    # Copy image
    filled = binary_image.copy()
    
    # Flood fill from the corners (background)
    cv2.floodFill(filled, mask, (0, 0), 128)
    
    # Invert the flooded image
    filled = cv2.bitwise_not(filled)
    
    # Combine with original
    result = binary_image | filled
    
    return result


def calculate_room_confidence(
    contour: np.ndarray,
    area: float,
    width: int,
    height: int,
    walls: List[Dict]
) -> float:
    """
    Calculate confidence score for a room detection.
    
    Args:
        contour: Room contour
        area: Room area in pixels
        width: Bounding box width
        height: Bounding box height
        walls: Detected walls for validation
        
    Returns:
        Confidence score between 0 and 1
    """
    confidence = 0.5
    
    # Bonus for regular shape (high solidity)
    hull = cv2.convexHull(contour)
    hull_area = cv2.contourArea(hull)
    if hull_area > 0:
        solidity = area / hull_area
        confidence += solidity * 0.2
    
    # Bonus for reasonable aspect ratio
    aspect_ratio = max(width, height) / (min(width, height) + 1)
    if aspect_ratio < 3:
        confidence += 0.1
    
    # Bonus for having walls nearby
    x, y, w, h = cv2.boundingRect(contour)
    center_x = x + w / 2
    center_y = y + h / 2
    
    walls_nearby = 0
    for wall in walls:
        wall_center_x = (wall['x1'] + wall['x2']) / 2
        wall_center_y = (wall['y1'] + wall['y2']) / 2
        dist = np.sqrt((center_x - wall_center_x) ** 2 + (center_y - wall_center_y) ** 2)
        if dist < max(w, h) * 1.5:
            walls_nearby += 1
    
    if walls_nearby > 2:
        confidence += 0.15
    
    return min(0.95, confidence)


def classify_room(
    area: float,
    width: int,
    height: int,
    aspect_ratio: float,
    total_area: float = None
) -> str:
    """
    Classify room type based on its properties.
    
    Args:
        area: Room area in pixels
        width: Room width
        height: Room height
        aspect_ratio: Width/height ratio
        total_area: Total image area for relative sizing
        
    Returns:
        Room classification string
    """
    # Use relative sizing if total_area provided
    if total_area and total_area > 0:
        ratio = area / total_area
        if aspect_ratio > 4:
            return "Corridor"
        elif ratio < 0.005:
            return "Small Room"
        elif ratio < 0.02:
            return "Medium Room"
        elif ratio < 0.05:
            return "Large Room"
        else:
            return "Hall"
    
    # Fallback to absolute thresholds
    if aspect_ratio > 4:
        return "Corridor"
    elif area < 5000:
        return "Small Room"
    elif area < 15000:
        return "Medium Room"
    elif area < 40000:
        return "Large Room"
    else:
        return "Hall"


def remove_overlapping_rooms(
    rooms: List[Dict],
    overlap_threshold: float = 0.5
) -> List[Dict]:
    """
    Remove rooms that significantly overlap with larger rooms.
    
    Args:
        rooms: List of detected rooms
        overlap_threshold: Minimum overlap ratio to consider duplicate
        
    Returns:
        Filtered list of rooms
    """
    if len(rooms) <= 1:
        return rooms
    
    # Sort by area descending
    sorted_rooms = sorted(rooms, key=lambda r: r['area'], reverse=True)
    
    unique = []
    for room in sorted_rooms:
        is_overlapping = False
        
        for existing in unique:
            overlap = calculate_overlap(room, existing)
            smaller_area = min(room['area'], existing['area'])
            
            if smaller_area > 0 and overlap / smaller_area > overlap_threshold:
                is_overlapping = True
                break
        
        if not is_overlapping:
            unique.append(room)
    
    return unique


def calculate_overlap(room1: Dict, room2: Dict) -> float:
    """Calculate overlap area between two rooms."""
    x1 = max(room1['x'], room2['x'])
    y1 = max(room1['y'], room2['y'])
    x2 = min(room1['x'] + room1['width'], room2['x'] + room2['width'])
    y2 = min(room1['y'] + room1['height'], room2['y'] + room2['height'])
    
    if x1 < x2 and y1 < y2:
        return (x2 - x1) * (y2 - y1)
    return 0
