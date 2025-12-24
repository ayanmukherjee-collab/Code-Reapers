"""
Pathfinding Module for Indoor Navigation

Implements A* and Dijkstra algorithms for finding paths between nodes
in the navigation graph.

Usage:
    from pathfinder import find_path, find_path_by_name
    
    path = find_path(graph, "room_1", "room_5")
    path = find_path_by_name(graph, "101", "Lab B")
"""

import heapq
from typing import List, Dict, Optional, Tuple
import math


def euclidean_distance(p1: Dict, p2: Dict) -> float:
    """Calculate Euclidean distance between two points."""
    return math.sqrt((p2["x"] - p1["x"])**2 + (p2["y"] - p1["y"])**2)


def build_adjacency_list(graph: Dict) -> Dict[str, List[Tuple[str, float]]]:
    """
    Build adjacency list from graph edges.
    
    Returns:
        Dict mapping node_id to list of (neighbor_id, distance) tuples
    """
    adj = {}
    
    # Initialize all nodes
    for node in graph.get("nodes", []):
        adj[node["id"]] = []
    
    # Add edges
    for edge in graph.get("edges", []):
        from_id = edge["from"]
        to_id = edge["to"]
        distance = edge.get("distance", 1.0)
        
        if from_id in adj:
            adj[from_id].append((to_id, distance))
        
        # Add reverse edge if bidirectional
        if edge.get("bidirectional", True) and to_id in adj:
            adj[to_id].append((from_id, distance))
    
    return adj


def get_node_by_id(graph: Dict, node_id: str) -> Optional[Dict]:
    """Get node by ID."""
    for node in graph.get("nodes", []):
        if node["id"] == node_id:
            return node
    return None


def search_nodes_by_name(graph: Dict, query: str) -> List[Dict]:
    """
    Search for nodes by name (case-insensitive, partial match).
    
    Args:
        graph: Navigation graph
        query: Search query string
        
    Returns:
        List of matching nodes, sorted by relevance
    """
    query_lower = query.lower().strip()
    matches = []
    
    for node in graph.get("nodes", []):
        if not node.get("searchable", True):
            continue
        
        name = node.get("name", "").lower()
        node_id = node.get("id", "").lower()
        
        # Exact match (highest priority)
        if name == query_lower or node_id == query_lower:
            matches.append((0, node))
        # Starts with match
        elif name.startswith(query_lower) or node_id.startswith(query_lower):
            matches.append((1, node))
        # Contains match
        elif query_lower in name or query_lower in node_id:
            matches.append((2, node))
    
    # Sort by priority
    matches.sort(key=lambda x: x[0])
    return [m[1] for m in matches]


def dijkstra(graph: Dict, start_id: str, end_id: str) -> Optional[Dict]:
    """
    Find shortest path using Dijkstra's algorithm.
    
    Args:
        graph: Navigation graph with nodes and edges
        start_id: Starting node ID
        end_id: Destination node ID
        
    Returns:
        Dict with path, distance, and node details, or None if no path
    """
    adj = build_adjacency_list(graph)
    
    if start_id not in adj or end_id not in adj:
        return None
    
    # Priority queue: (distance, node_id)
    pq = [(0, start_id)]
    distances = {start_id: 0}
    previous = {start_id: None}
    visited = set()
    
    while pq:
        current_dist, current_id = heapq.heappop(pq)
        
        if current_id in visited:
            continue
        
        visited.add(current_id)
        
        if current_id == end_id:
            # Reconstruct path
            path = []
            node = end_id
            while node is not None:
                path.append(node)
                node = previous[node]
            path.reverse()
            
            # Get node details
            path_nodes = [get_node_by_id(graph, nid) for nid in path]
            
            return {
                "found": True,
                "path": path,
                "pathNodes": path_nodes,
                "totalDistance": distances[end_id],
                "nodeCount": len(path)
            }
        
        for neighbor_id, edge_dist in adj[current_id]:
            if neighbor_id in visited:
                continue
            
            new_dist = current_dist + edge_dist
            
            if neighbor_id not in distances or new_dist < distances[neighbor_id]:
                distances[neighbor_id] = new_dist
                previous[neighbor_id] = current_id
                heapq.heappush(pq, (new_dist, neighbor_id))
    
    return {"found": False, "path": [], "reason": "No path exists"}


def astar(graph: Dict, start_id: str, end_id: str) -> Optional[Dict]:
    """
    Find shortest path using A* algorithm with Euclidean heuristic.
    
    Args:
        graph: Navigation graph with nodes and edges
        start_id: Starting node ID
        end_id: Destination node ID
        
    Returns:
        Dict with path, distance, and node details, or None if no path
    """
    adj = build_adjacency_list(graph)
    
    if start_id not in adj or end_id not in adj:
        return None
    
    start_node = get_node_by_id(graph, start_id)
    end_node = get_node_by_id(graph, end_id)
    
    if not start_node or not end_node:
        return None
    
    def heuristic(node_id: str) -> float:
        """Euclidean distance to goal as heuristic."""
        node = get_node_by_id(graph, node_id)
        if not node:
            return float('inf')
        return euclidean_distance(node["position"], end_node["position"])
    
    # Priority queue: (f_score, g_score, node_id)
    pq = [(heuristic(start_id), 0, start_id)]
    g_scores = {start_id: 0}
    previous = {start_id: None}
    visited = set()
    
    while pq:
        _, current_g, current_id = heapq.heappop(pq)
        
        if current_id in visited:
            continue
        
        visited.add(current_id)
        
        if current_id == end_id:
            # Reconstruct path
            path = []
            node = end_id
            while node is not None:
                path.append(node)
                node = previous[node]
            path.reverse()
            
            # Get node details
            path_nodes = [get_node_by_id(graph, nid) for nid in path]
            
            return {
                "found": True,
                "algorithm": "A*",
                "path": path,
                "pathNodes": path_nodes,
                "totalDistance": g_scores[end_id],
                "nodeCount": len(path),
                "nodesExplored": len(visited)
            }
        
        for neighbor_id, edge_dist in adj[current_id]:
            if neighbor_id in visited:
                continue
            
            tentative_g = current_g + edge_dist
            
            if neighbor_id not in g_scores or tentative_g < g_scores[neighbor_id]:
                g_scores[neighbor_id] = tentative_g
                previous[neighbor_id] = current_id
                f_score = tentative_g + heuristic(neighbor_id)
                heapq.heappush(pq, (f_score, tentative_g, neighbor_id))
    
    return {"found": False, "path": [], "reason": "No path exists"}


def find_path(graph: Dict, start_id: str, end_id: str, 
              algorithm: str = "astar") -> Dict:
    """
    Find path between two nodes by ID.
    
    Args:
        graph: Navigation graph
        start_id: Starting node ID
        end_id: Destination node ID
        algorithm: "astar" or "dijkstra"
        
    Returns:
        Path result dict
    """
    if algorithm == "dijkstra":
        return dijkstra(graph, start_id, end_id)
    else:
        return astar(graph, start_id, end_id)


def find_path_by_name(graph: Dict, start_query: str, end_query: str,
                      algorithm: str = "astar") -> Dict:
    """
    Find path between two nodes by name search.
    
    Args:
        graph: Navigation graph
        start_query: Search query for starting location
        end_query: Search query for destination
        algorithm: "astar" or "dijkstra"
        
    Returns:
        Path result dict with search results
    """
    # Search for nodes
    start_matches = search_nodes_by_name(graph, start_query)
    end_matches = search_nodes_by_name(graph, end_query)
    
    if not start_matches:
        return {
            "found": False,
            "reason": f"No node found matching '{start_query}'",
            "searchResults": {"start": [], "end": [m["name"] for m in end_matches[:5]]}
        }
    
    if not end_matches:
        return {
            "found": False,
            "reason": f"No node found matching '{end_query}'",
            "searchResults": {"start": [m["name"] for m in start_matches[:5]], "end": []}
        }
    
    # Use best matches
    start_node = start_matches[0]
    end_node = end_matches[0]
    
    # Find path
    result = find_path(graph, start_node["id"], end_node["id"], algorithm)
    
    # Add search info
    result["startNode"] = start_node
    result["endNode"] = end_node
    result["searchResults"] = {
        "start": [m["name"] for m in start_matches[:5]],
        "end": [m["name"] for m in end_matches[:5]]
    }
    
    return result


def get_directions(path_result: Dict) -> List[str]:
    """
    Generate human-readable directions from a path result.
    
    Args:
        path_result: Result from find_path or find_path_by_name
        
    Returns:
        List of direction strings
    """
    if not path_result.get("found"):
        return ["No path found."]
    
    path_nodes = path_result.get("pathNodes", [])
    
    if len(path_nodes) < 2:
        return ["You are already at your destination."]
    
    directions = []
    directions.append(f"Starting from: {path_nodes[0].get('name', path_nodes[0]['id'])}")
    
    prev_node = path_nodes[0]
    for i, node in enumerate(path_nodes[1:], 1):
        node_type = node.get("type", "unknown")
        node_name = node.get("name", node["id"])
        
        # Calculate direction
        dx = node["position"]["x"] - prev_node["position"]["x"]
        dy = node["position"]["y"] - prev_node["position"]["y"]
        
        if abs(dx) > abs(dy):
            direction = "right" if dx > 0 else "left"
        else:
            direction = "down" if dy > 0 else "up"
        
        if node_type == "door":
            directions.append(f"Go through the door")
        elif node_type == "stair":
            directions.append(f"Take the stairs at {node_name}")
        elif node_type == "hallway":
            directions.append(f"Continue {direction} along the hallway")
        elif node_type == "room":
            if i == len(path_nodes) - 1:
                directions.append(f"Arrive at: {node_name}")
            else:
                directions.append(f"Pass by {node_name}")
        else:
            directions.append(f"Continue {direction}")
        
        prev_node = node
    
    return directions


if __name__ == "__main__":
    # Example usage
    example_graph = {
        "nodes": [
            {"id": "room_101", "name": "Room 101", "type": "room", 
             "position": {"x": 100, "y": 100}, "searchable": True},
            {"id": "door_1", "name": "Door 1", "type": "door",
             "position": {"x": 150, "y": 100}, "searchable": False},
            {"id": "hallway_1", "name": "Main Hallway", "type": "hallway",
             "position": {"x": 200, "y": 100}, "searchable": True},
            {"id": "door_2", "name": "Door 2", "type": "door",
             "position": {"x": 250, "y": 100}, "searchable": False},
            {"id": "room_102", "name": "Lab B", "type": "room",
             "position": {"x": 300, "y": 100}, "searchable": True},
        ],
        "edges": [
            {"from": "room_101", "to": "door_1", "distance": 50},
            {"from": "door_1", "to": "hallway_1", "distance": 50},
            {"from": "hallway_1", "to": "door_2", "distance": 50},
            {"from": "door_2", "to": "room_102", "distance": 50},
        ]
    }
    
    # Test pathfinding
    print("=== Pathfinding Test ===\n")
    
    # By ID
    result = find_path(example_graph, "room_101", "room_102")
    print(f"Path by ID: {result['path']}")
    print(f"Distance: {result['totalDistance']}")
    
    # By name
    result = find_path_by_name(example_graph, "101", "Lab B")
    print(f"\nPath by name '101' → 'Lab B': {result['path']}")
    
    # Get directions
    directions = get_directions(result)
    print("\nDirections:")
    for d in directions:
        print(f"  → {d}")
