"""
OCR Text Extraction Script with Hallway Detection

Extracts text from images using Tesseract OCR with advanced OpenCV preprocessing.
Also detects hallways/corridors as elongated horizontal/vertical lines.

Usage:
    python ocr_extract.py <image_path>

Output:
    Saves <imageName>-ocr.json in the same folder as the input image.
"""

import cv2
import numpy as np
import pytesseract
import json
import sys
import os

# Configure Tesseract path for Windows
if sys.platform == 'win32':
    tesseract_paths = [
        r'C:\Program Files\Tesseract-OCR\tesseract.exe',
        r'C:\Program Files (x86)\Tesseract-OCR\tesseract.exe',
    ]
    for path in tesseract_paths:
        if os.path.exists(path):
            pytesseract.pytesseract.tesseract_cmd = path
            break


def detect_skew_angle(image: np.ndarray) -> float:
    """Detect skew angle using Hough Line Transform."""
    if len(image.shape) == 3:
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    else:
        gray = image.copy()
    
    edges = cv2.Canny(gray, 50, 150, apertureSize=3)
    lines = cv2.HoughLines(edges, 1, np.pi / 180, threshold=200)
    
    if lines is None:
        return 0.0
    
    angles = []
    for line in lines:
        rho, theta = line[0]
        angle_deg = theta * 180 / np.pi
        
        if angle_deg < 10:
            angles.append(angle_deg)
        elif angle_deg > 170:
            angles.append(angle_deg - 180)
        elif 80 < angle_deg < 100:
            angles.append(angle_deg - 90)
    
    return float(np.median(angles)) if angles else 0.0


def deskew_image(image: np.ndarray, angle: float) -> np.ndarray:
    """Rotate image to correct skew."""
    h, w = image.shape[:2]
    center = (w // 2, h // 2)
    M = cv2.getRotationMatrix2D(center, angle, 1.0)
    return cv2.warpAffine(image, M, (w, h), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)


def transform_coordinates(x: int, y: int, w: int, h: int, 
                         angle: float, img_w: int, img_h: int) -> tuple:
    """Transform coordinates from deskewed image back to original."""
    if abs(angle) < 0.1:
        return x, y, w, h
    
    cx, cy = img_w // 2, img_h // 2
    box_cx, box_cy = x + w // 2, y + h // 2
    
    rad = np.radians(-angle)
    cos_a, sin_a = np.cos(rad), np.sin(rad)
    
    dx, dy = box_cx - cx, box_cy - cy
    new_cx = cx + dx * cos_a - dy * sin_a
    new_cy = cy + dx * sin_a + dy * cos_a
    
    return int(new_cx - w // 2), int(new_cy - h // 2), w, h


def transform_point(px: int, py: int, angle: float, img_w: int, img_h: int) -> tuple:
    """Transform a single point from deskewed image back to original."""
    if abs(angle) < 0.1:
        return int(px), int(py)
    
    cx, cy = img_w // 2, img_h // 2
    rad = np.radians(-angle)
    cos_a, sin_a = np.cos(rad), np.sin(rad)
    
    dx, dy = px - cx, py - cy
    return int(cx + dx * cos_a - dy * sin_a), int(cy + dx * sin_a + dy * cos_a)


def preprocess_image(image: np.ndarray) -> tuple:
    """Preprocess image for OCR with improved contrast handling."""
    # Detect and correct skew
    skew_angle = detect_skew_angle(image)
    if abs(skew_angle) > 1.0:
        image = deskew_image(image, skew_angle)
    else:
        skew_angle = 0.0
    
    # Convert to grayscale
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY) if len(image.shape) == 3 else image.copy()
    deskewed_gray = gray.copy()
    
    # Noise removal with bilateral filter (preserves edges better)
    denoised = cv2.bilateralFilter(gray, 9, 75, 75)
    
    # Contrast enhancement with higher clip limit for floor plans
    clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
    contrast = clahe.apply(denoised)
    
    # Sharpen to make text edges clearer
    sharpen_kernel = np.array([[-1,-1,-1], [-1,9,-1], [-1,-1,-1]])
    sharpened = cv2.filter2D(contrast, -1, sharpen_kernel)
    
    # Adaptive thresholding with larger block size for floor plans
    binary = cv2.adaptiveThreshold(
        sharpened, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
        cv2.THRESH_BINARY, 21, 5
    )
    
    # Morphological operations to clean up
    kernel = np.ones((2, 2), np.uint8)
    cleaned = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, kernel)
    
    return cleaned, skew_angle, deskewed_gray


def simplify_polyline(polyline: list, epsilon: float = 10.0) -> list:
    """Simplify polyline using Douglas-Peucker algorithm (Ramer-Douglas-Peucker)."""
    if len(polyline) < 3:
        return polyline
    
    # Convert to numpy array
    points = np.array(polyline, dtype=float)
    
    # Find point with max distance from line between first and last
    start, end = points[0], points[-1]
    
    # Distance from each point to line
    line_vec = end - start
    line_len = np.linalg.norm(line_vec)
    if line_len == 0:
        return [polyline[0]]
    
    line_unit = line_vec / line_len
    
    # Calculate perpendicular distance for all intermediate points
    distances = []
    for i in range(1, len(points) - 1):
        point_vec = points[i] - start
        proj_len = np.dot(point_vec, line_unit)
        proj = start + proj_len * line_unit
        dist = np.linalg.norm(points[i] - proj)
        distances.append((i, dist))
    
    if not distances:
        return [polyline[0], polyline[-1]]
    
    max_idx, max_dist = max(distances, key=lambda x: x[1])
    
    if max_dist > epsilon:
        # Recursively simplify
        left = simplify_polyline([list(p) for p in points[:max_idx+1]], epsilon)
        right = simplify_polyline([list(p) for p in points[max_idx:]], epsilon)
        return left[:-1] + right
    else:
        return [polyline[0], polyline[-1]]


def detect_hallways(gray_image: np.ndarray, skew_angle: float, 
                    img_w: int, img_h: int, min_length: int = 300) -> list:
    """
    Detect hallways by finding long horizontal and vertical lines.
    Uses Hough Line Transform to detect corridor axes.
    Returns list of hallways with simplified polylines.
    """
    # Edge detection
    edges = cv2.Canny(gray_image, 50, 150, apertureSize=3)
    
    # Dilate edges to connect nearby lines
    kernel = np.ones((3, 3), np.uint8)
    dilated_edges = cv2.dilate(edges, kernel, iterations=1)
    
    # Detect lines using Hough Transform
    lines = cv2.HoughLinesP(dilated_edges, rho=1, theta=np.pi/180, 
                            threshold=100, minLineLength=min_length, maxLineGap=30)
    
    if lines is None:
        return []
    
    hallways = []
    horizontal_lines = []
    vertical_lines = []
    
    for line in lines:
        x1, y1, x2, y2 = line[0]
        length = np.sqrt((x2 - x1)**2 + (y2 - y1)**2)
        
        if length < min_length:
            continue
        
        angle = np.abs(np.degrees(np.arctan2(y2 - y1, x2 - x1)))
        
        # Horizontal lines (0° ± 15°)
        if angle < 15 or angle > 165:
            horizontal_lines.append((x1, y1, x2, y2, length))
        # Vertical lines (90° ± 15°)
        elif 75 < angle < 105:
            vertical_lines.append((x1, y1, x2, y2, length))
    
    # Merge and create polylines for horizontal corridors
    horizontal_lines.sort(key=lambda l: l[1])
    merged_h = merge_parallel_lines(horizontal_lines, 'horizontal', 50)
    
    for line_group in merged_h:
        polyline = []
        for x1, y1, x2, y2, _ in sorted(line_group, key=lambda l: l[0]):
            tx1, ty1 = transform_point(x1, y1, skew_angle, img_w, img_h)
            tx2, ty2 = transform_point(x2, y2, skew_angle, img_w, img_h)
            if not polyline or polyline[-1] != [tx1, ty1]:
                polyline.append([tx1, ty1])
            polyline.append([tx2, ty2])
        if len(polyline) >= 2:
            hallways.append({"polyline": polyline})
    
    # Merge and create polylines for vertical corridors
    vertical_lines.sort(key=lambda l: l[0])
    merged_v = merge_parallel_lines(vertical_lines, 'vertical', 50)
    
    for line_group in merged_v:
        polyline = []
        for x1, y1, x2, y2, _ in sorted(line_group, key=lambda l: l[1]):
            tx1, ty1 = transform_point(x1, y1, skew_angle, img_w, img_h)
            tx2, ty2 = transform_point(x2, y2, skew_angle, img_w, img_h)
            if not polyline or polyline[-1] != [tx1, ty1]:
                polyline.append([tx1, ty1])
            polyline.append([tx2, ty2])
        if len(polyline) >= 2:
            hallways.append({"polyline": polyline})
    
    # Simplify each hallway polyline to remove redundant points
    simplified_hallways = []
    for hallway in hallways:
        simplified = simplify_polyline(hallway['polyline'], epsilon=10.0)
        if len(simplified) >= 2:
            # Convert numpy arrays back to lists if needed
            simplified = [[int(p[0]), int(p[1])] if hasattr(p, '__iter__') else p for p in simplified]
            simplified_hallways.append({'polyline': simplified})
    
    return simplified_hallways


def merge_parallel_lines(lines: list, axis: str, merge_distance: int = 50) -> list:
    """Merge lines that are parallel and close together."""
    if not lines:
        return []
    
    groups = []
    used = set()
    
    for i, line1 in enumerate(lines):
        if i in used:
            continue
        
        group = [line1]
        used.add(i)
        x1_1, y1_1, x2_1, y2_1, _ = line1
        
        for j, line2 in enumerate(lines):
            if j in used:
                continue
            
            x1_2, y1_2, x2_2, y2_2, _ = line2
            
            if axis == 'horizontal':
                y_center1 = (y1_1 + y2_1) / 2
                y_center2 = (y1_2 + y2_2) / 2
                if abs(y_center1 - y_center2) < merge_distance:
                    group.append(line2)
                    used.add(j)
            else:
                x_center1 = (x1_1 + x2_1) / 2
                x_center2 = (x1_2 + x2_2) / 2
                if abs(x_center1 - x_center2) < merge_distance:
                    group.append(line2)
                    used.add(j)
        
        groups.append(group)
    
    return groups


# =============================================================================
# DOOR DETECTION
# =============================================================================

def detect_walls(gray_image: np.ndarray, min_length: int = 50) -> list:
    """
    Detect walls as long straight Hough lines only.
    Returns list of wall line segments: [(x1, y1, x2, y2), ...]
    """
    # Edge detection
    edges = cv2.Canny(gray_image, 50, 150, apertureSize=3)
    
    # Detect straight lines using Hough Transform
    lines = cv2.HoughLinesP(
        edges, rho=1, theta=np.pi/180, 
        threshold=50, minLineLength=min_length, maxLineGap=10
    )
    
    if lines is None:
        return []
    
    walls = []
    for line in lines:
        x1, y1, x2, y2 = line[0]
        length = np.sqrt((x2 - x1)**2 + (y2 - y1)**2)
        
        if length >= min_length:
            walls.append((int(x1), int(y1), int(x2), int(y2)))
    
    return walls


def detect_curved_contours(gray_image: np.ndarray, min_arc_length: int = 20) -> list:
    """
    Detect curved contours (door swing arcs) separately from straight walls.
    Returns list of arc contours with their properties.
    """
    # Threshold
    _, binary = cv2.threshold(gray_image, 200, 255, cv2.THRESH_BINARY_INV)
    
    # Find all contours
    contours, _ = cv2.findContours(binary, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)
    
    arcs = []
    for contour in contours:
        arc_length = cv2.arcLength(contour, closed=False)
        
        if arc_length < min_arc_length:
            continue
        
        # Fit ellipse to detect curved shapes
        if len(contour) < 5:
            continue
        
        # Calculate circularity: 4*pi*area / perimeter^2
        area = cv2.contourArea(contour)
        if arc_length > 0:
            circularity = 4 * np.pi * area / (arc_length ** 2)
        else:
            continue
        
        # Curved arcs have low circularity (not full circles) but are curved
        # Fit a line and check residual to determine if curved
        [vx, vy, x0, y0] = cv2.fitLine(contour, cv2.DIST_L2, 0, 0.01, 0.01)
        
        # Calculate max distance from fitted line
        max_dist = 0
        for point in contour:
            px, py = point[0]
            # Distance from point to line
            dist = abs(vy * (px - x0) - vx * (py - y0))
            max_dist = max(max_dist, dist)
        
        # If max distance from line is significant, it's curved
        curvature_ratio = float(max_dist) / max(arc_length, 1)
        
        if curvature_ratio > 0.05:  # More curved than a straight line
            # Get bounding box and center
            x, y, w, h = cv2.boundingRect(contour)
            
            # Determine arc orientation (swing direction)
            moments = cv2.moments(contour)
            if moments['m00'] > 0:
                cx = int(moments['m10'] / moments['m00'])
                cy = int(moments['m01'] / moments['m00'])
            else:
                cx, cy = x + w // 2, y + h // 2
            
            # Determine swing direction based on arc shape
            # Check which quadrant the arc bends towards
            swing_direction = determine_swing_direction(contour, cx, cy)
            
            arcs.append({
                'contour': contour,
                'center': (int(cx), int(cy)),
                'bbox': (int(x), int(y), int(w), int(h)),
                'arc_length': float(arc_length),
                'curvature': float(curvature_ratio),
                'swing_direction': swing_direction
            })
    
    return arcs


def determine_swing_direction(contour: np.ndarray, cx: int, cy: int) -> str:
    """Determine door swing direction based on arc orientation."""
    if len(contour) < 2:
        return "unknown"
    
    # Get start and end points of the arc
    start = contour[0][0]
    end = contour[-1][0]
    
    # Calculate angle from center to start and end
    start_angle = np.degrees(np.arctan2(start[1] - cy, start[0] - cx))
    end_angle = np.degrees(np.arctan2(end[1] - cy, end[0] - cx))
    
    # Determine primary direction
    avg_angle = (start_angle + end_angle) / 2
    
    if -45 <= avg_angle < 45:
        return "right"
    elif 45 <= avg_angle < 135:
        return "down"
    elif avg_angle >= 135 or avg_angle < -135:
        return "left"
    else:
        return "up"


def find_wall_gaps(walls: list, gap_threshold: int = 80) -> list:
    """
    Find gaps in wall segments that could be doorways.
    Returns list of gap locations with nearby wall endpoints.
    """
    gaps = []
    
    # Group walls by orientation (horizontal/vertical)
    horizontal_walls = []
    vertical_walls = []
    
    for x1, y1, x2, y2 in walls:
        angle = abs(np.degrees(np.arctan2(y2 - y1, x2 - x1)))
        if angle < 30 or angle > 150:
            horizontal_walls.append((x1, y1, x2, y2))
        elif 60 < angle < 120:
            vertical_walls.append((x1, y1, x2, y2))
    
    # Find gaps in horizontal walls (sorted by Y, then X)
    horizontal_walls.sort(key=lambda w: (w[1] + w[3]) // 2)
    gaps.extend(find_gaps_in_wall_group(horizontal_walls, 'horizontal', gap_threshold))
    
    # Find gaps in vertical walls
    vertical_walls.sort(key=lambda w: (w[0] + w[2]) // 2)
    gaps.extend(find_gaps_in_wall_group(vertical_walls, 'vertical', gap_threshold))
    
    return gaps


def find_gaps_in_wall_group(walls: list, orientation: str, gap_threshold: int) -> list:
    """Find gaps between wall segments in a group."""
    gaps = []
    
    if len(walls) < 2:
        return gaps
    
    for i, wall1 in enumerate(walls):
        x1_1, y1_1, x2_1, y2_1 = wall1
        
        for wall2 in walls[i+1:]:
            x1_2, y1_2, x2_2, y2_2 = wall2
            
            if orientation == 'horizontal':
                # Check if walls are on same horizontal line
                y_center1 = (y1_1 + y2_1) / 2
                y_center2 = (y1_2 + y2_2) / 2
                
                if abs(y_center1 - y_center2) > 20:
                    continue
                
                # Find horizontal gap
                right1 = max(x1_1, x2_1)
                left2 = min(x1_2, x2_2)
                left1 = min(x1_1, x2_1)
                right2 = max(x1_2, x2_2)
                
                if left2 > right1:
                    gap_width = left2 - right1
                    if 15 < gap_width < gap_threshold:
                        gap_center_x = (right1 + left2) // 2
                        gap_center_y = int((y_center1 + y_center2) / 2)
                        gaps.append({
                            'center': (gap_center_x, gap_center_y),
                            'width': int(gap_width),
                            'orientation': orientation,
                            'endpoints': [(right1, int(y_center1)), (left2, int(y_center2))]
                        })
                elif left1 > right2:
                    gap_width = left1 - right2
                    if 15 < gap_width < gap_threshold:
                        gap_center_x = (right2 + left1) // 2
                        gap_center_y = int((y_center1 + y_center2) / 2)
                        gaps.append({
                            'center': (gap_center_x, gap_center_y),
                            'width': int(gap_width),
                            'orientation': orientation,
                            'endpoints': [(right2, int(y_center2)), (left1, int(y_center1))]
                        })
            
            else:  # vertical
                # Check if walls are on same vertical line
                x_center1 = (x1_1 + x2_1) / 2
                x_center2 = (x1_2 + x2_2) / 2
                
                if abs(x_center1 - x_center2) > 20:
                    continue
                
                # Find vertical gap
                bottom1 = max(y1_1, y2_1)
                top2 = min(y1_2, y2_2)
                top1 = min(y1_1, y2_1)
                bottom2 = max(y1_2, y2_2)
                
                if top2 > bottom1:
                    gap_width = top2 - bottom1
                    if 15 < gap_width < gap_threshold:
                        gap_center_x = int((x_center1 + x_center2) / 2)
                        gap_center_y = (bottom1 + top2) // 2
                        gaps.append({
                            'center': (gap_center_x, gap_center_y),
                            'width': int(gap_width),
                            'orientation': orientation,
                            'endpoints': [(int(x_center1), bottom1), (int(x_center2), top2)]
                        })
                elif top1 > bottom2:
                    gap_width = top1 - bottom2
                    if 15 < gap_width < gap_threshold:
                        gap_center_x = int((x_center1 + x_center2) / 2)
                        gap_center_y = (bottom2 + top1) // 2
                        gaps.append({
                            'center': (gap_center_x, gap_center_y),
                            'width': int(gap_width),
                            'orientation': orientation,
                            'endpoints': [(int(x_center2), bottom2), (int(x_center1), top1)]
                        })
    
    return gaps


def detect_doors(gray_image: np.ndarray, skew_angle: float, 
                 img_w: int, img_h: int) -> list:
    """
    Detect doors by finding wall gaps with curved contours (door swing arcs).
    
    Rules:
    1. Walls = only long straight Hough lines
    2. Extract curved contours separately (door arcs)
    3. If gap in wall AND curved contour touches that gap -> door
    
    Returns list of door objects with center, width, and swing direction.
    """
    # Step 1: Detect straight wall lines
    walls = detect_walls(gray_image, min_length=50)
    
    # Step 2: Detect curved arc contours
    arcs = detect_curved_contours(gray_image, min_arc_length=30)
    
    # Step 3: Find wall gaps
    gaps = find_wall_gaps(walls, gap_threshold=80)
    
    doors = []
    used_arcs = set()
    
    # Step 4: Match gaps with nearby arcs
    for gap in gaps:
        gap_cx, gap_cy = gap['center']
        gap_width = gap['width']
        
        # Look for arcs near this gap
        for i, arc in enumerate(arcs):
            if i in used_arcs:
                continue
            
            arc_cx, arc_cy = arc['center']
            arc_bbox = arc['bbox']
            
            # Check if arc is near the gap (within ~100px)
            distance = np.sqrt((arc_cx - gap_cx)**2 + (arc_cy - gap_cy)**2)
            
            if distance < max(gap_width * 2, 100):
                # This arc is near the gap - likely a door
                # Transform coordinates back to original
                tx, ty = transform_point(gap_cx, gap_cy, skew_angle, img_w, img_h)
                
                doors.append({
                    'center_x': tx,
                    'center_y': ty,
                    'width': gap_width,
                    'swing_direction': arc['swing_direction'],
                    'orientation': gap['orientation']
                })
                
                used_arcs.add(i)
                break
    
    # Also detect doors at gaps without arcs (open doorways)
    for gap in gaps:
        gap_cx, gap_cy = gap['center']
        
        # Check if this gap already matched
        already_matched = False
        for door in doors:
            if abs(door['center_x'] - gap_cx) < 20 and abs(door['center_y'] - gap_cy) < 20:
                already_matched = True
                break
        
        if not already_matched and gap['width'] > 25:
            tx, ty = transform_point(gap_cx, gap_cy, skew_angle, img_w, img_h)
            doors.append({
                'center_x': tx,
                'center_y': ty,
                'width': gap['width'],
                'swing_direction': 'unknown',
                'orientation': gap['orientation']
            })
    
    return doors


def deduplicate_doors(doors: list, distance_threshold: int = 15) -> list:
    """Remove duplicate door detections that are too close together."""
    if not doors:
        return []
    
    unique_doors = []
    for door in doors:
        is_duplicate = False
        for existing in unique_doors:
            dx = abs(door['center_x'] - existing['center_x'])
            dy = abs(door['center_y'] - existing['center_y'])
            if dx < distance_threshold and dy < distance_threshold:
                # Keep the one with larger width
                if door['width'] > existing['width']:
                    unique_doors.remove(existing)
                    unique_doors.append(door)
                is_duplicate = True
                break
        if not is_duplicate:
            unique_doors.append(door)
    
    return unique_doors


# =============================================================================
# STAIR DETECTION
# =============================================================================

def detect_stairs(gray_image: np.ndarray, skew_angle: float, 
                  img_w: int, img_h: int, min_steps: int = 3) -> list:
    """
    Detect stairs by finding parallel lines in close proximity (stair pattern).
    Stairs appear as multiple short parallel lines arranged in sequence.
    """
    # Edge detection  
    edges = cv2.Canny(gray_image, 50, 150, apertureSize=3)
    
    # Detect short lines that could be stair steps
    lines = cv2.HoughLinesP(edges, rho=1, theta=np.pi/180,
                            threshold=30, minLineLength=20, maxLineGap=5)
    
    if lines is None:
        return []
    
    # Group lines by proximity and orientation
    horizontal_steps = []  # For horizontal stairs
    vertical_steps = []    # For vertical stairs
    
    for line in lines:
        x1, y1, x2, y2 = line[0]
        length = np.sqrt((x2 - x1)**2 + (y2 - y1)**2)
        angle = np.abs(np.degrees(np.arctan2(y2 - y1, x2 - x1)))
        
        # Short horizontal lines (potential stair steps)
        if 20 < length < 100:
            if angle < 20 or angle > 160:
                horizontal_steps.append((x1, y1, x2, y2, (y1 + y2) / 2))
            elif 70 < angle < 110:
                vertical_steps.append((x1, y1, x2, y2, (x1 + x2) / 2))
    
    stairs = []
    
    # Find groups of horizontal steps (sorted by y)
    if len(horizontal_steps) >= min_steps:
        horizontal_steps.sort(key=lambda s: s[4])
        groups = find_stair_groups(horizontal_steps, axis='horizontal', 
                                   spacing_range=(8, 30), min_steps=min_steps)
        
        for group in groups:
            bbox = calculate_group_bbox(group)
            cx, cy = transform_point(
                bbox['x'] + bbox['width'] // 2,
                bbox['y'] + bbox['height'] // 2,
                skew_angle, img_w, img_h
            )
            stairs.append({
                'center_x': cx,
                'center_y': cy,
                'bbox': bbox,
                'orientation': 'horizontal',
                'num_steps': len(group)
            })
    
    # Find groups of vertical steps (sorted by x)
    if len(vertical_steps) >= min_steps:
        vertical_steps.sort(key=lambda s: s[4])
        groups = find_stair_groups(vertical_steps, axis='vertical',
                                   spacing_range=(8, 30), min_steps=min_steps)
        
        for group in groups:
            bbox = calculate_group_bbox(group)
            cx, cy = transform_point(
                bbox['x'] + bbox['width'] // 2,
                bbox['y'] + bbox['height'] // 2,
                skew_angle, img_w, img_h
            )
            stairs.append({
                'center_x': cx,
                'center_y': cy,
                'bbox': bbox,
                'orientation': 'vertical',
                'num_steps': len(group)
            })
    
    return stairs


def find_stair_groups(steps: list, axis: str, spacing_range: tuple, 
                      min_steps: int) -> list:
    """Find groups of evenly-spaced parallel lines that form stairs."""
    groups = []
    used = set()
    min_spacing, max_spacing = spacing_range
    
    for i, step1 in enumerate(steps):
        if i in used:
            continue
        
        group = [step1]
        used.add(i)
        last_pos = step1[4]
        
        for j, step2 in enumerate(steps[i+1:], start=i+1):
            if j in used:
                continue
            
            spacing = abs(step2[4] - last_pos)
            if min_spacing <= spacing <= max_spacing:
                group.append(step2)
                used.add(j)
                last_pos = step2[4]
        
        if len(group) >= min_steps:
            groups.append(group)
    
    return groups


def calculate_group_bbox(lines: list) -> dict:
    """Calculate bounding box for a group of lines."""
    all_x = []
    all_y = []
    for x1, y1, x2, y2, _ in lines:
        all_x.extend([x1, x2])
        all_y.extend([y1, y2])
    
    return {
        'x': int(min(all_x)),
        'y': int(min(all_y)),
        'width': int(max(all_x) - min(all_x)),
        'height': int(max(all_y) - min(all_y))
    }


def extract_text(image: np.ndarray, skew_angle: float, 
                 img_w: int, img_h: int, min_confidence: int = 70) -> list:
    """Run Tesseract OCR and extract text with positions."""
    ocr_data = pytesseract.image_to_data(image, lang='eng', 
                                         output_type=pytesseract.Output.DICT, config='--psm 11')
    
    results = []
    for i in range(len(ocr_data['text'])):
        text = ocr_data['text'][i].strip()
        conf = int(ocr_data['conf'][i])
        
        if not text or conf < min_confidence:
            continue
        
        x = int(ocr_data['left'][i])
        y = int(ocr_data['top'][i])
        w = int(ocr_data['width'][i])
        h = int(ocr_data['height'][i])
        
        if abs(skew_angle) > 1.0:
            x, y, w, h = transform_coordinates(x, y, w, h, skew_angle, img_w, img_h)
        
        x = max(0, min(x, img_w - 1))
        y = max(0, min(y, img_h - 1))
        w = min(w, img_w - x)
        h = min(h, img_h - y)
        
        results.append({
            "text": text,
            "left": x,
            "top": y,
            "width": w,
            "height": h,
            "confidence": conf
        })
    
    return results


def main():
    if len(sys.argv) < 2:
        print("Usage: python ocr_extract.py <image_path>")
        sys.exit(1)
    
    image_path = sys.argv[1]
    
    if not os.path.exists(image_path):
        print(f"Error: Image not found: {image_path}")
        sys.exit(1)
    
    image_dir = os.path.dirname(os.path.abspath(image_path))
    image_name = os.path.splitext(os.path.basename(image_path))[0]
    output_path = os.path.join(image_dir, f"{image_name}-ocr.json")
    
    # Load image
    image = cv2.imread(image_path)
    if image is None:
        print(f"Error: Could not load image: {image_path}")
        sys.exit(1)
    
    img_h, img_w = image.shape[:2]
    
    # Preprocess
    processed, skew_angle, deskewed_gray = preprocess_image(image)
    
    # Detect doors with de-duplication
    doors = detect_doors(deskewed_gray, skew_angle, img_w, img_h)
    doors = deduplicate_doors(doors, distance_threshold=15)
    
    # Detect stairs
    stairs = detect_stairs(deskewed_gray, skew_angle, img_w, img_h)
    
    # Extract text
    text_results = extract_text(processed, skew_angle, img_w, img_h, min_confidence=70)
    
    # Detect hallways (with simplified polylines)
    hallways = detect_hallways(deskewed_gray, skew_angle, img_w, img_h)
    
    # Build output with stairs
    output = {
        "texts": text_results,
        "doors": doors,
        "stairs": stairs,
        "hallways": hallways
    }
    
    # Save JSON
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(output, f, indent=2, ensure_ascii=False)
    
    print(output_path)


if __name__ == '__main__':
    main()
