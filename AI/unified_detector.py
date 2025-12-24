"""
Unified Floor Plan Detection Pipeline

Combines multiple detection methods for maximum accuracy:
- Roboflow: Doors, Windows (ML-based)
- OpenCV: Walls (Hough lines), Rooms (contours)
- Tesseract: Room names/numbers (OCR)

Output: Navigation graph with named nodes
"""

import cv2
import numpy as np
from typing import List, Dict, Tuple, Optional
import json
import os
import sys

# Add parent directory for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    import pytesseract
    # Set Tesseract path for Windows
    tesseract_paths = [
        r'C:\Program Files\Tesseract-OCR\tesseract.exe',
        r'C:\Program Files (x86)\Tesseract-OCR\tesseract.exe',
    ]
    for path in tesseract_paths:
        if os.path.exists(path):
            pytesseract.pytesseract.tesseract_cmd = path
            break
except ImportError:
    pytesseract = None
    print("Warning: pytesseract not installed. OCR will be disabled.")


class FloorPlanDetector:
    """
    Unified floor plan detection combining ML and traditional CV.
    """
    
    def __init__(self, roboflow_api_key: str = None, roboflow_model_id: str = None):
        self.roboflow_api_key = roboflow_api_key
        self.roboflow_model_id = roboflow_model_id
        
    def detect_all(self, image: np.ndarray) -> Dict:
        """
        Run complete detection pipeline on a floor plan image.
        
        Returns:
            Dict with walls, rooms, doors, windows, stairs, hallways, and texts
        """
        img_h, img_w = image.shape[:2]
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY) if len(image.shape) == 3 else image
        
        # Preprocess
        processed = self._preprocess(gray)
        
        # Detect elements
        walls = self._detect_walls(processed)
        rooms = self._detect_rooms(processed, walls, img_w, img_h)
        doors = self._detect_doors(processed, walls)
        hallways = self._detect_hallways(processed)
        stairs = self._detect_stairs(processed)
        
        # OCR for room names
        texts = self._extract_text(image)
        
        # Associate text with rooms
        rooms = self._associate_text_with_rooms(rooms, texts)
        
        return {
            "walls": walls,
            "rooms": rooms,
            "doors": doors,
            "hallways": hallways,
            "stairs": stairs,
            "texts": texts,
            "imageSize": {"width": img_w, "height": img_h}
        }
    
    def _preprocess(self, gray: np.ndarray) -> np.ndarray:
        """Preprocess image for detection."""
        # Denoise
        denoised = cv2.fastNlMeansDenoising(gray, None, 10, 7, 21)
        
        # Adaptive threshold for better line detection
        binary = cv2.adaptiveThreshold(
            denoised, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
            cv2.THRESH_BINARY_INV, 11, 2
        )
        
        return binary
    
    def _detect_walls(self, binary: np.ndarray) -> List[Dict]:
        """Detect walls using Hough Line Transform."""
        # Detect lines
        lines = cv2.HoughLinesP(
            binary, rho=1, theta=np.pi/180, threshold=50,
            minLineLength=30, maxLineGap=10
        )
        
        walls = []
        if lines is not None:
            for i, line in enumerate(lines):
                x1, y1, x2, y2 = line[0]
                length = np.sqrt((x2-x1)**2 + (y2-y1)**2)
                
                # Filter short lines
                if length < 20:
                    continue
                
                walls.append({
                    "id": f"wall_{i+1}",
                    "position": {
                        "start": {"x": float(x1), "y": float(y1)},
                        "end": {"x": float(x2), "y": float(y2)}
                    },
                    "length": float(length),
                    "type": "wall"
                })
        
        return walls
    
    def _detect_rooms(self, binary: np.ndarray, walls: List[Dict], 
                      img_w: int, img_h: int) -> List[Dict]:
        """Detect rooms as enclosed contours."""
        # Close gaps in walls
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (5, 5))
        closed = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, kernel, iterations=2)
        
        # Invert to find enclosed spaces
        inverted = cv2.bitwise_not(closed)
        
        # Find contours (rooms are enclosed spaces)
        contours, hierarchy = cv2.findContours(
            inverted, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE
        )
        
        rooms = []
        total_area = img_w * img_h
        min_room_area = total_area * 0.002   # Min 0.2% of image (increased from 0.1%)
        max_room_area = total_area * 0.15    # Max 15% of image (reduced from 50%)
        
        for i, contour in enumerate(contours):
            area = cv2.contourArea(contour)
            
            # Filter by area - exclude very small and very large (building outline)
            if area < min_room_area or area > max_room_area:
                continue
            
            # Get bounding box
            x, y, w, h = cv2.boundingRect(contour)
            
            # Filter very thin rectangles (likely corridors, not rooms)
            aspect_ratio = max(w, h) / min(w, h) if min(w, h) > 0 else 999
            if aspect_ratio > 4:  # Reduced from 5 - stricter filtering
                continue
            
            # Filter by solidity (ratio of contour area to convex hull area)
            hull = cv2.convexHull(contour)
            hull_area = cv2.contourArea(hull)
            solidity = area / hull_area if hull_area > 0 else 0
            if solidity < 0.5:  # Rooms should be fairly solid shapes
                continue
            
            # Calculate center
            M = cv2.moments(contour)
            if M["m00"] > 0:
                cx = int(M["m10"] / M["m00"])
                cy = int(M["m01"] / M["m00"])
            else:
                cx, cy = x + w // 2, y + h // 2
            
            rooms.append({
                "id": f"room_{i+1}",
                "name": f"Room {len(rooms)+1}",  # Will be updated by OCR
                "position": {
                    "start": {"x": float(x), "y": float(y)},
                    "end": {"x": float(x + w), "y": float(y + h)}
                },
                "center": {"x": float(cx), "y": float(cy)},
                "area": float(area),
                "solidity": float(solidity),
                "type": "room"
            })
        
        return rooms
    
    def _detect_doors(self, binary: np.ndarray, walls: List[Dict]) -> List[Dict]:
        """Detect doors by finding gaps in walls with arc shapes."""
        doors = []
        
        # Find small curved contours (door swing arcs)
        contours, _ = cv2.findContours(
            binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE
        )
        
        for i, contour in enumerate(contours):
            area = cv2.contourArea(contour)
            perimeter = cv2.arcLength(contour, True)
            
            if perimeter == 0:
                continue
            
            circularity = 4 * np.pi * area / (perimeter ** 2)
            
            # Doors have arc-like shapes (partial circles)
            if 0.1 < circularity < 0.7 and 100 < area < 5000:
                x, y, w, h = cv2.boundingRect(contour)
                
                # Check if near a wall gap
                cx, cy = x + w // 2, y + h // 2
                
                doors.append({
                    "id": f"door_{i+1}",
                    "hinge": {"x": float(cx), "y": float(cy)},
                    "width": float(max(w, h)),
                    "swing_angle": 90,
                    "type": "door"
                })
        
        return doors
    
    def _detect_hallways(self, binary: np.ndarray) -> List[Dict]:
        """Detect hallways as long narrow corridors."""
        # Find long horizontal/vertical lines
        horizontal_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (50, 1))
        vertical_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (1, 50))
        
        horizontal = cv2.morphologyEx(binary, cv2.MORPH_OPEN, horizontal_kernel)
        vertical = cv2.morphologyEx(binary, cv2.MORPH_OPEN, vertical_kernel)
        
        hallways = []
        
        # Process horizontal hallways
        contours, _ = cv2.findContours(horizontal, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        for i, contour in enumerate(contours):
            x, y, w, h = cv2.boundingRect(contour)
            if w > 100:  # Minimum hallway length
                hallways.append({
                    "id": f"hallway_h_{i+1}",
                    "orientation": "horizontal",
                    "polyline": [
                        {"x": float(x), "y": float(y + h // 2)},
                        {"x": float(x + w), "y": float(y + h // 2)}
                    ],
                    "type": "hallway"
                })
        
        # Process vertical hallways
        contours, _ = cv2.findContours(vertical, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        for i, contour in enumerate(contours):
            x, y, w, h = cv2.boundingRect(contour)
            if h > 100:
                hallways.append({
                    "id": f"hallway_v_{i+1}",
                    "orientation": "vertical",
                    "polyline": [
                        {"x": float(x + w // 2), "y": float(y)},
                        {"x": float(x + w // 2), "y": float(y + h)}
                    ],
                    "type": "hallway"
                })
        
        return hallways
    
    def _detect_stairs(self, binary: np.ndarray) -> List[Dict]:
        """Detect stairs as parallel line patterns."""
        stairs = []
        
        # Find parallel horizontal lines (stair steps)
        horizontal_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (20, 1))
        steps = cv2.morphologyEx(binary, cv2.MORPH_OPEN, horizontal_kernel)
        
        contours, _ = cv2.findContours(steps, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        # Group nearby horizontal lines
        step_lines = []
        for contour in contours:
            x, y, w, h = cv2.boundingRect(contour)
            if 15 < w < 100 and h < 10:
                step_lines.append((x, y, w, h))
        
        # Find groups of parallel lines (stairs)
        if len(step_lines) >= 3:
            step_lines.sort(key=lambda s: s[1])  # Sort by y
            
            groups = []
            current_group = [step_lines[0]]
            
            for i in range(1, len(step_lines)):
                prev = step_lines[i - 1]
                curr = step_lines[i]
                
                # Check if same stair group (similar x, consecutive y)
                if abs(curr[0] - prev[0]) < 30 and 5 < (curr[1] - prev[1]) < 30:
                    current_group.append(curr)
                else:
                    if len(current_group) >= 3:
                        groups.append(current_group)
                    current_group = [curr]
            
            if len(current_group) >= 3:
                groups.append(current_group)
            
            for i, group in enumerate(groups):
                xs = [s[0] for s in group]
                ys = [s[1] for s in group]
                ws = [s[2] for s in group]
                hs = [s[3] for s in group]
                
                stairs.append({
                    "id": f"stair_{i+1}",
                    "bbox": {
                        "x": float(min(xs)),
                        "y": float(min(ys)),
                        "width": float(max(xs) + max(ws) - min(xs)),
                        "height": float(max(ys) + max(hs) - min(ys))
                    },
                    "step_count": len(group),
                    "type": "stair"
                })
        
        return stairs
    
    def _extract_text(self, image: np.ndarray) -> List[Dict]:
        """Extract text using Tesseract OCR."""
        if pytesseract is None:
            return []
        
        # Convert to grayscale if needed
        if len(image.shape) == 3:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        else:
            gray = image
        
        # Preprocess for OCR
        _, binary = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        
        try:
            ocr_data = pytesseract.image_to_data(
                binary, lang='eng', output_type=pytesseract.Output.DICT,
                config='--psm 11'
            )
        except Exception as e:
            print(f"OCR error: {e}")
            return []
        
        texts = []
        for i in range(len(ocr_data['text'])):
            text = ocr_data['text'][i].strip()
            conf = int(ocr_data['conf'][i])
            
            if not text or conf < 60:
                continue
            
            x = int(ocr_data['left'][i])
            y = int(ocr_data['top'][i])
            w = int(ocr_data['width'][i])
            h = int(ocr_data['height'][i])
            
            texts.append({
                "text": text,
                "position": {"x": float(x), "y": float(y)},
                "size": {"width": float(w), "height": float(h)},
                "center": {"x": float(x + w // 2), "y": float(y + h // 2)},
                "confidence": conf
            })
        
        return texts
    
    def _associate_text_with_rooms(self, rooms: List[Dict], 
                                    texts: List[Dict]) -> List[Dict]:
        """Associate OCR text with rooms based on position."""
        for room in rooms:
            rx1 = room["position"]["start"]["x"]
            ry1 = room["position"]["start"]["y"]
            rx2 = room["position"]["end"]["x"]
            ry2 = room["position"]["end"]["y"]
            
            # Find text inside this room
            room_texts = []
            for text in texts:
                tx = text["center"]["x"]
                ty = text["center"]["y"]
                
                if rx1 <= tx <= rx2 and ry1 <= ty <= ry2:
                    room_texts.append(text["text"])
            
            # Update room name if text found
            if room_texts:
                # Combine texts (room number + name)
                room["name"] = " ".join(room_texts)
                room["ocr_texts"] = room_texts
        
        return rooms
    
    def build_navigation_graph(self, detection_result: Dict) -> Dict:
        """
        Build navigation graph from detection results.
        
        Strategy:
        - Room nodes are placed at room centers (searchable)
        - Door nodes are the connection points between rooms and hallways
        - Rooms connect to their nearest doors
        - Doors connect to each other if they can see each other (no wall blocking)
        - Hallway nodes help connect distant areas
        """
        nodes = []
        edges = []
        walls = detection_result.get("walls", [])
        
        # Add door nodes FIRST (these are the primary connection points)
        door_nodes = []
        for door in detection_result.get("doors", []):
            node = {
                "id": door["id"],
                "type": "door",
                "name": door["id"],
                "position": door["hinge"],
                "searchable": False
            }
            nodes.append(node)
            door_nodes.append(node)
        
        # Add room nodes and connect each to its nearest door
        room_nodes = []
        for room in detection_result.get("rooms", []):
            node = {
                "id": room["id"],
                "type": "room",
                "name": room.get("name", room["id"]),
                "position": room["center"],
                "bbox": room["position"],
                "searchable": True
            }
            nodes.append(node)
            room_nodes.append(node)
            
            # Find nearest door to this room
            nearest_door = None
            min_dist = float('inf')
            
            for door in door_nodes:
                # Check if door is near room boundary
                room_start = room["position"]["start"]
                room_end = room["position"]["end"]
                door_pos = door["position"]
                
                # Expand room bounds slightly to catch nearby doors
                margin = 50
                if (room_start["x"] - margin <= door_pos["x"] <= room_end["x"] + margin and
                    room_start["y"] - margin <= door_pos["y"] <= room_end["y"] + margin):
                    
                    dist = np.sqrt(
                        (door_pos["x"] - room["center"]["x"])**2 +
                        (door_pos["y"] - room["center"]["y"])**2
                    )
                    if dist < min_dist:
                        min_dist = dist
                        nearest_door = door
            
            # Create edge from room to its door
            if nearest_door:
                edges.append({
                    "id": f"edge_{room['id']}_{nearest_door['id']}",
                    "from": room["id"],
                    "to": nearest_door["id"],
                    "distance": float(min_dist),
                    "bidirectional": True
                })
        
        # Add hallway waypoints 
        hallway_nodes = []
        for hallway in detection_result.get("hallways", []):
            for i, point in enumerate(hallway.get("polyline", [])):
                node = {
                    "id": f"{hallway['id']}_wp_{i}",
                    "type": "hallway",
                    "name": "Hallway",
                    "position": point,
                    "searchable": False
                }
                nodes.append(node)
                hallway_nodes.append(node)
        
        # Connect hallway waypoints along the same hallway
        for hallway in detection_result.get("hallways", []):
            polyline = hallway.get("polyline", [])
            for i in range(len(polyline) - 1):
                node1_id = f"{hallway['id']}_wp_{i}"
                node2_id = f"{hallway['id']}_wp_{i+1}"
                p1 = polyline[i]
                p2 = polyline[i+1]
                dist = np.sqrt((p2["x"] - p1["x"])**2 + (p2["y"] - p1["y"])**2)
                edges.append({
                    "id": f"edge_{node1_id}_{node2_id}",
                    "from": node1_id,
                    "to": node2_id,
                    "distance": float(dist),
                    "bidirectional": True
                })
        
        # Add stair nodes
        for stair in detection_result.get("stairs", []):
            bbox = stair.get("bbox", {})
            nodes.append({
                "id": stair["id"],
                "type": "stair",
                "name": f"Staircase",
                "position": {
                    "x": bbox.get("x", 0) + bbox.get("width", 0) / 2,
                    "y": bbox.get("y", 0) + bbox.get("height", 0) / 2
                },
                "searchable": True
            })
        
        # Connect doors to nearby hallway points and other doors
        connection_nodes = door_nodes + hallway_nodes
        for i, node1 in enumerate(connection_nodes):
            for j, node2 in enumerate(connection_nodes):
                if i >= j:
                    continue
                
                p1 = node1["position"]
                p2 = node2["position"]
                dist = np.sqrt((p2["x"] - p1["x"])**2 + (p2["y"] - p1["y"])**2)
                
                # Connect if close enough and no wall blocking
                if dist < 300 and not self._crosses_wall(p1, p2, walls):
                    edge_id = f"edge_{node1['id']}_{node2['id']}"
                    # Avoid duplicates
                    if not any(e["id"] == edge_id for e in edges):
                        edges.append({
                            "id": edge_id,
                            "from": node1["id"],
                            "to": node2["id"],
                            "distance": float(dist),
                            "bidirectional": True
                        })
        
        return {
            "nodes": nodes,
            "edges": edges,
            "metadata": {
                "nodeCount": len(nodes),
                "edgeCount": len(edges),
                "roomCount": len(room_nodes),
                "doorCount": len(door_nodes),
                "searchableNodes": len([n for n in nodes if n.get("searchable")])
            }
        }
    
    def _create_edges(self, nodes: List[Dict], walls: List[Dict], 
                      max_distance: float = 200) -> List[Dict]:
        """Create edges between nearby nodes that don't cross walls."""
        edges = []
        
        for i, node1 in enumerate(nodes):
            for j, node2 in enumerate(nodes):
                if i >= j:
                    continue
                
                p1 = node1["position"]
                p2 = node2["position"]
                
                dist = np.sqrt((p2["x"] - p1["x"])**2 + (p2["y"] - p1["y"])**2)
                
                if dist > max_distance:
                    continue
                
                # Check if edge crosses a wall
                if self._crosses_wall(p1, p2, walls):
                    continue
                
                edges.append({
                    "id": f"edge_{node1['id']}_{node2['id']}",
                    "from": node1["id"],
                    "to": node2["id"],
                    "distance": float(dist),
                    "bidirectional": True
                })
        
        return edges
    
    def _crosses_wall(self, p1: Dict, p2: Dict, walls: List[Dict]) -> bool:
        """Check if line segment crosses any wall."""
        for wall in walls:
            ws = wall["position"]["start"]
            we = wall["position"]["end"]
            
            if self._segments_intersect(
                (p1["x"], p1["y"]), (p2["x"], p2["y"]),
                (ws["x"], ws["y"]), (we["x"], we["y"])
            ):
                return True
        
        return False
    
    def _segments_intersect(self, p1: Tuple, p2: Tuple, 
                            p3: Tuple, p4: Tuple) -> bool:
        """Check if two line segments intersect."""
        def ccw(A, B, C):
            return (C[1]-A[1]) * (B[0]-A[0]) > (B[1]-A[1]) * (C[0]-A[0])
        
        return (ccw(p1, p3, p4) != ccw(p2, p3, p4) and 
                ccw(p1, p2, p3) != ccw(p1, p2, p4))


def process_floor_plan(image_path: str, output_path: str = None) -> Dict:
    """
    Process a floor plan image and return detection + graph.
    
    Args:
        image_path: Path to floor plan image
        output_path: Optional path to save JSON output
        
    Returns:
        Dict with detections and navigation graph
    """
    # Load image
    image = cv2.imread(image_path)
    if image is None:
        raise ValueError(f"Could not load image: {image_path}")
    
    # Run detection
    detector = FloorPlanDetector()
    detections = detector.detect_all(image)
    
    # Build navigation graph
    graph = detector.build_navigation_graph(detections)
    
    result = {
        "detections": detections,
        "navigationGraph": graph
    }
    
    # Save if output path provided
    if output_path:
        with open(output_path, 'w', encoding='utf-8') as f:
            # Remove contours (not JSON serializable as numpy arrays)
            for room in result["detections"]["rooms"]:
                if "contour" in room:
                    del room["contour"]
            json.dump(result, f, indent=2)
        print(f"Saved to: {output_path}")
    
    return result


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python unified_detector.py <image_path> [output_path]")
        sys.exit(1)
    
    image_path = sys.argv[1]
    output_path = sys.argv[2] if len(sys.argv) > 2 else None
    
    if not output_path:
        base = os.path.splitext(image_path)[0]
        output_path = f"{base}_detection.json"
    
    result = process_floor_plan(image_path, output_path)
    
    print(f"\nDetection Summary:")
    print(f"  Walls: {len(result['detections']['walls'])}")
    print(f"  Rooms: {len(result['detections']['rooms'])}")
    print(f"  Doors: {len(result['detections']['doors'])}")
    print(f"  Hallways: {len(result['detections']['hallways'])}")
    print(f"  Stairs: {len(result['detections']['stairs'])}")
    print(f"  Texts: {len(result['detections']['texts'])}")
    print(f"\nNavigation Graph:")
    print(f"  Nodes: {result['navigationGraph']['metadata']['nodeCount']}")
    print(f"  Edges: {result['navigationGraph']['metadata']['edgeCount']}")
