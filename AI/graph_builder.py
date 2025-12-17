"""
Navigation Graph Builder Module

Converts floor plan detection results into a navigation graph suitable
for pathfinding and indoor navigation.
"""

import numpy as np
from typing import List, Dict, Tuple, Optional
import uuid


def generate_id(prefix: str = 'node') -> str:
    """Generate a unique ID for graph elements."""
    return f"{prefix}_{uuid.uuid4().hex[:8]}"


def build_navigation_graph(
    walls: List[Dict],
    rooms: List[Dict],
    doors: List[Dict],
    options: Dict = None
) -> Dict:
    """
    Build a complete navigation graph from detected floor plan elements.
    
    Args:
        walls: Detected walls list
        rooms: Detected rooms list
        doors: Detected doors list
        options: Graph building options:
            - floor: Floor number (default: 1)
            - corridor_spacing: Node spacing in corridors (default: 50)
            - max_edge_distance: Max distance for auto connections (default: 100)
            
    Returns:
        Navigation graph dictionary with nodes and edges
    """
    if options is None:
        options = {}
    
    floor = options.get('floor', 1)
    corridor_spacing = options.get('corridor_spacing', 50)
    max_edge_distance = options.get('max_edge_distance', 100)
    
    nodes = []
    edges = []
    
    # Create room nodes
    for room in rooms:
        center_x = room['x'] + room['width'] / 2
        center_y = room['y'] + room['height'] / 2
        
        node = {
            'id': generate_id('room'),
            'type': 'room',
            'label': room.get('name', 'Room'),
            'floor': floor,
            'position': {
                'x': float(center_x),
                'y': float(center_y)
            },
            'bounds': {
                'x': float(room['x']),
                'y': float(room['y']),
                'width': float(room['width']),
                'height': float(room['height'])
            },
            'properties': {
                'area': float(room.get('area', 0)),
                'confidence': float(room.get('confidence', 0.75))
            }
        }
        nodes.append(node)
    
    # Create door nodes
    door_nodes = []
    for door in doors:
        node = {
            'id': generate_id('door'),
            'type': 'door',
            'label': 'Door',
            'floor': floor,
            'position': {
                'x': float(door['hinge']['x']),
                'y': float(door['hinge']['y'])
            },
            'properties': {
                'swing_angle': float(door.get('swing_angle', 90)),
                'radius': float(door.get('radius', 30)),
                'confidence': float(door.get('confidence', 0.7))
            }
        }
        nodes.append(node)
        door_nodes.append(node)
    
    # Create corridor/path nodes based on areas between rooms
    corridor_nodes = create_corridor_nodes(rooms, walls, floor, corridor_spacing)
    nodes.extend(corridor_nodes)
    
    # Create edges between nearby nodes
    all_nodes = nodes.copy()
    
    for i, node in enumerate(all_nodes):
        pos1 = (node['position']['x'], node['position']['y'])
        
        for other in all_nodes[i + 1:]:
            pos2 = (other['position']['x'], other['position']['y'])
            
            dist = distance(pos1, pos2)
            
            # Auto-connect nodes within threshold
            if dist < max_edge_distance:
                # Check if connection is valid (not through a wall)
                if not crosses_wall(pos1, pos2, walls):
                    edge = {
                        'id': generate_id('edge'),
                        'from': node['id'],
                        'to': other['id'],
                        'weight': float(dist),
                        'type': determine_edge_type(node, other)
                    }
                    edges.append(edge)
    
    # Connect doors to nearby rooms
    for door_node in door_nodes:
        door_pos = (door_node['position']['x'], door_node['position']['y'])
        
        # Find closest room nodes
        for room_node in [n for n in nodes if n['type'] == 'room']:
            room_pos = (room_node['position']['x'], room_node['position']['y'])
            dist = distance(door_pos, room_pos)
            
            if dist < max_edge_distance * 1.5:
                # Add edge if not already connected
                existing = any(
                    (e['from'] == door_node['id'] and e['to'] == room_node['id']) or
                    (e['from'] == room_node['id'] and e['to'] == door_node['id'])
                    for e in edges
                )
                
                if not existing:
                    edges.append({
                        'id': generate_id('edge'),
                        'from': door_node['id'],
                        'to': room_node['id'],
                        'weight': float(dist),
                        'type': 'door_connection'
                    })
    
    # Remove duplicate edges
    edges = remove_duplicate_edges(edges)
    
    return {
        'version': '2.0',
        'floor': floor,
        'nodes': nodes,
        'edges': edges,
        'metadata': {
            'total_rooms': len([n for n in nodes if n['type'] == 'room']),
            'total_doors': len([n for n in nodes if n['type'] == 'door']),
            'total_connections': len(edges)
        }
    }


def create_corridor_nodes(
    rooms: List[Dict],
    walls: List[Dict],
    floor: int,
    spacing: int
) -> List[Dict]:
    """
    Create navigation nodes in corridor areas (spaces between rooms).
    
    Args:
        rooms: Detected rooms
        walls: Detected walls
        floor: Floor number
        spacing: Node spacing in pixels
        
    Returns:
        List of corridor nodes
    """
    nodes = []
    
    # Simple approach: create nodes at wall intersections and endpoints
    # that are not inside rooms
    
    for wall in walls:
        # Check midpoint of each wall
        mid_x = (wall['x1'] + wall['x2']) / 2
        mid_y = (wall['y1'] + wall['y2']) / 2
        
        # Skip if inside a room
        in_room = False
        for room in rooms:
            if point_in_rect(mid_x, mid_y, room):
                in_room = True
                break
        
        if not in_room:
            # Create a corridor node near the wall
            # Offset perpendicular to wall
            dx = wall['x2'] - wall['x1']
            dy = wall['y2'] - wall['y1']
            length = np.sqrt(dx * dx + dy * dy)
            
            if length > 0:
                # Perpendicular offset
                px = -dy / length * 30
                py = dx / length * 30
                
                node = {
                    'id': generate_id('path'),
                    'type': 'path',
                    'label': 'Corridor',
                    'floor': floor,
                    'position': {
                        'x': float(mid_x + px),
                        'y': float(mid_y + py)
                    },
                    'properties': {
                        'auto_generated': True
                    }
                }
                nodes.append(node)
    
    return nodes


def distance(p1: Tuple[float, float], p2: Tuple[float, float]) -> float:
    """Calculate Euclidean distance between two points."""
    return np.sqrt((p2[0] - p1[0]) ** 2 + (p2[1] - p1[1]) ** 2)


def point_in_rect(x: float, y: float, rect: Dict) -> bool:
    """Check if point is inside a rectangle."""
    return (rect['x'] <= x <= rect['x'] + rect['width'] and
            rect['y'] <= y <= rect['y'] + rect['height'])


def crosses_wall(
    p1: Tuple[float, float],
    p2: Tuple[float, float],
    walls: List[Dict]
) -> bool:
    """
    Check if a line segment crosses any wall.
    
    Args:
        p1: Start point
        p2: End point
        walls: List of walls
        
    Returns:
        True if the segment crosses a wall
    """
    for wall in walls:
        wall_p1 = (wall['x1'], wall['y1'])
        wall_p2 = (wall['x2'], wall['y2'])
        
        if segments_intersect(p1, p2, wall_p1, wall_p2):
            return True
    
    return False


def segments_intersect(
    p1: Tuple[float, float],
    p2: Tuple[float, float],
    p3: Tuple[float, float],
    p4: Tuple[float, float]
) -> bool:
    """Check if two line segments intersect."""
    def ccw(A, B, C):
        return (C[1] - A[1]) * (B[0] - A[0]) > (B[1] - A[1]) * (C[0] - A[0])
    
    return (ccw(p1, p3, p4) != ccw(p2, p3, p4) and 
            ccw(p1, p2, p3) != ccw(p1, p2, p4))


def determine_edge_type(node1: Dict, node2: Dict) -> str:
    """Determine edge type based on connected node types."""
    types = {node1['type'], node2['type']}
    
    if 'door' in types:
        return 'door_connection'
    elif types == {'room'}:
        return 'room_to_room'
    elif 'path' in types:
        return 'corridor'
    else:
        return 'connection'


def remove_duplicate_edges(edges: List[Dict]) -> List[Dict]:
    """Remove duplicate edges (same from/to or to/from)."""
    seen = set()
    unique = []
    
    for edge in edges:
        key = tuple(sorted([edge['from'], edge['to']]))
        if key not in seen:
            seen.add(key)
            unique.append(edge)
    
    return unique
