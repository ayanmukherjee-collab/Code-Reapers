import cv2
import numpy as np
from skimage.morphology import skeletonize
import networkx as nx
import json
import argparse
import sys
import os

def process_image(image_path):
    print(f"🖼️  Loading: {image_path}")
    img = cv2.imread(image_path)
    if img is None:
        raise ValueError("Could not load image")

    # Grayscale
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    
    # Thresholding
    # Assume floor is white (high intensity). STRICT threshold to catch dark walls.
    # Any pixel > 230 is "Walkable". Below is Wall/Noise.
    _, thresh = cv2.threshold(gray, 230, 255, cv2.THRESH_BINARY)
    
    # --- EXTERIOR REMOVAL ---
    # The background is white, so it's treated as "walkable". We must remove it.
    # Problem: Open doors (like Main Entrance) connect Exterior to Interior.
    # Solution: Temporarily "seal" the building by expanding walls (Eroding White).
    print("🚧  Masking exterior background...")
    
    # 1. Create a "Sealed" image where walls are thicker to close doors.
    # Walls are Black (0). To expand Black, we ERODE the White (255) area.
    # Kernel size needs to be larger than the widest external door (e.g., 20px).
    kernel_seal = np.ones((13,13), np.uint8) # Adjust size if needed
    sealed = cv2.erode(thresh, kernel_seal, iterations=2)
    
    # 2. Flood Fill from corners to identify the External White Component
    h, w = sealed.shape
    mask = np.zeros((h+2, w+2), np.uint8) # Mask must be 2px larger
    
    # Flood fill starting from (0,0) on the SEALED image.
    # We flood with a temporary value (e.g. 128) just to mark it.
    # Or just use the mask from floodFill.
    # We want to know which pixels are "Exterior".
    # Since 'sealed' is binary (0/255), we can flood fill the white (255) background to Gray (127).
    sealed_flood = sealed.copy()
    
    # Try all 4 corners in case (0,0) is isolated (unlikely for floor plan background)
    corners = [(0,0), (0, h-1), (w-1, 0), (w-1, h-1)]
    for cx, cy in corners:
        if sealed_flood[cy, cx] == 255:
            cv2.floodFill(sealed_flood, mask, (cx, cy), 127)
            
    # 3. Apply the properties of the "Exterior" found in 'sealed' to the 'thresh'
    # Wherever 'sealed_flood' is 127, that is Exterior. Set 'thresh' to 0 (Wall).
    # Note: mask from floodFill is 1=filled. But we reused it. 
    # Simpler to just use the `sealed_flood` values.
    thresh[sealed_flood == 127] = 0
    
    # Cleanup edge artifacts (sometimes 1px border remains)
    cv2.rectangle(thresh, (0,0), (w-1, h-1), 0, 2)

    
    # --- MORPHOLOGICAL CLEANUP ---
    
    # 1. REMOVE NOISE (Text/Furniture lines inside rooms)
    # We want to fill *small black holes* inside valid white areas.
    # Morphological CLOSE (Dilate -> Erode) fills dark holes.
    # We need a kernel large enough to kill text but not walls.
    # 5x5 or 7x7 is usually good for standard text.
    print("🧹  Cleaning noise (text/furniture)...")
    kernel_close = np.ones((7,7), np.uint8)
    binary_clean = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel_close)
    
    # 2. CONNECTIVITY (Open Doors)
    # Doors are often drawn as lines or have small gaps.
    # We Dilate the WALKABLE area (White). This shrinks the Walls (Black).
    # This helps "push" the white area through door jambs.
    print("🚪  Enhancing connectivity (opening doors)...")
    kernel_dilate = np.ones((3,3), np.uint8)
    # 2 iterations = ~2-4 pixels expansion. Enough for standard doors.
    binary_final = cv2.dilate(binary_clean, kernel_dilate, iterations=2)
    
    # Verify we haven't destroyed main walls. 
    # (Walls should remain if they are thick enough. Main walls usually are).
    
    # Skeletonize needs boolean
    binary_bool = binary_final > 0
    
    print("🦴  Skeletonizing...")
    skeleton = skeletonize(binary_bool)
    skeleton_img = (skeleton * 255).astype(np.uint8)
    
    # Build Graph
    print("🕸️  Building Graph...")
    graph = build_graph_from_skeleton(skeleton_img)
    
    # Get image dimensions
    return graph_to_json(graph, img.shape)

def build_graph_from_skeleton(skel):
    # Find points
    y_idxs, x_idxs = np.where(skel > 0)
    points = list(zip(x_idxs, y_idxs))
    
    # 1. Build Dense Graph
    G = nx.Graph()
    for p in points:
        G.add_node(p)
        
    for x, y in points:
        neighbors = [
            (x+1, y), (x-1, y), (x, y+1), (x, y-1),
            (x+1, y+1), (x-1, y-1), (x+1, y-1), (x-1, y+1)
        ]
        for nx_coord, ny_coord in neighbors:
            if 0 <= ny_coord < skel.shape[0] and 0 <= nx_coord < skel.shape[1]:
                if skel[ny_coord, nx_coord] > 0:
                     dist = np.sqrt((x-nx_coord)**2 + (y-ny_coord)**2)
                     G.add_edge((x,y), (nx_coord, ny_coord), weight=dist)

    # 2. PRUNING (Remove short dead-ends)
    # "Spider webs" often adhere to edges of rooms or noisy artifacts.
    # They are usually short branches ending in a degree-1 node.
    print("✂️  Pruning short branches...")
    
    # Iteratively remove degree-1 nodes if their branch length is small
    # But networkx doesn't store "branch length" easily without simplifying.
    
    # Let's simplify FIRST, then prune the simple graph?
    # Or prune the pixel graph? Pruning pixel graph is safer for topology.
    
    # Simple Pixel Pruning:
    # Remove nodes with degree 1. Repeat N times.
    # This shrinks ALL lines from endpoints.
    # If a valid path ends at a wall, it shrinks back. Ideally we don't want that.
    # But for "clean" navigation, stopping 10px from the wall is fine.
    # This effectively kills small spurs completely.
    
    prune_iterations = 15 # Prune ~15 pixels from every tip.
    
    for _ in range(prune_iterations):
        deg = dict(G.degree())
        leaf_nodes = [n for n, d in deg.items() if d == 1]
        G.remove_nodes_from(leaf_nodes)
        
    # Re-verify connectivity? Pruning leaves topology mostly intact, just shortens tips.
    
    # 3. SIMPLIFICATION (Critical Nodes)
    deg = dict(G.degree())
    critical = [n for n, d in deg.items() if d != 2]
    
    output_edges = []
    output_nodes = critical
    
    # DFS from each critical node to find neighbors
    # This reconstructs the graph with only critical nodes + geometry
    
    # Return edges with "geometry" (list of points)?
    # For JSON size, we simplify geometry using Ramer-Douglas-Peucker (RDP) or just subsampling.
    
    processed = set()
    
    for start in critical:
        for nbr in G.neighbors(start):
            path = [start, nbr]
            curr = nbr
            prev = start
            
            # Follow path until next critical node
            while deg[curr] == 2:
                # Get neighbors
                succs = list(G.neighbors(curr))
                next_n = succs[0] if succs[0] != prev else succs[1]
                prev = curr
                curr = next_n
                path.append(curr)
                
            end = curr
            
            # Encode edge
            # Undirected check
            edge_key = tuple(sorted((start, end)))
            # We need to handle multi-edges? Usually simple floorplan graphs don't have parallel edges 
            # unless loops. But `tuple(sorted)` merges them. 
            # We want to keep ALL paths. So use path midpoint hash or something? 
            # For this context, standard undirected set is fine.
            # But wait, start and end can be same (loop).
            
            # Let's just output it.
            # Simplify path coordinates (take start, end, and every 10th mid point)
            
            # Simplify:
            simple_path = [path[0]]
            for i in range(1, len(path)-1, 10): # Keep every 10th pixel
                 simple_path.append(path[i])
            simple_path.append(path[-1])
            
            path_key = tuple(simple_path)
            if path_key not in processed:
                output_edges.append({
                    "from": start,
                    "to": end,
                    "path": simple_path 
                })
                processed.add(path_key)
                # Also add reversed key if we want to avoid duplicates? 
                processed.add(tuple(simple_path[::-1]))

    return {"nodes": output_nodes, "edges": output_edges}

def graph_to_json(graph_data, img_shape):
    features = {
        "metadata": { "source": "CV_GENERATED", "units": "pixels" },
        "coordinateSpace": { "bounds": { "x": 0, "y": 0, "width": img_shape[1], "height": img_shape[0] } },
        "rooms": [], # Room detection is harder, skipping for MVP/Skeleton
        "nodes": [],
        "edges": [],
        "paths": []
    }
    
    node_to_id = {}
    
    # Add Nodes
    for i, (x, y) in enumerate(graph_data["nodes"]):
        node_id = f"node_{i}"
        node_to_id[(x,y)] = node_id
        features["nodes"].append({
            "id": node_id,
            "position": {"x": int(x), "y": int(y)},
            "type": "junction" # or corridor
        })
        
        # Add a "corridor" room-like node for visualizing? No, keep clean.

    # Add Edges/Paths
    path_idx = 0
    for edge in graph_data["edges"]:
        # Edge structure from simplified: {"from": (x,y), "to": (x,y), "path": [(x,y), ...]}
        # But we simplified output to be just segments in the previous loop?
        # Wait, my previous replacement for `simplify_graph` returned a complex "path" object 
        # in the loop `output_edges.append({ "from": start, "to": end, "path": simple_path })`
        
        # We need to output SEGMENTS for the visualizer.
        # So we iterate the simplified path points.
        
        full_path = edge["path"]
        
        # Each segment in the simplified path is an edge in the JSON
        for i in range(len(full_path)-1):
            p1 = full_path[i]
            p2 = full_path[i+1]
            
            # Ensure nodes exist for these points (we only added critical nodes before)
            # So we must add ALL points in the simplified path as nodes in JSON
            
            # ID helpers
            id1 = node_to_id.get(p1)
            if not id1:
                id1 = f"node_p_{p1[0]}_{p1[1]}"
                node_to_id[p1] = id1
                features["nodes"].append({
                    "id": id1,
                    "position": {"x": int(p1[0]), "y": int(p1[1])},
                    "type": "path_point"
                })
                
            id2 = node_to_id.get(p2)
            if not id2:
                id2 = f"node_p_{p2[0]}_{p2[1]}"
                node_to_id[p2] = id2
                features["nodes"].append({
                    "id": id2,
                    "position": {"x": int(p2[0]), "y": int(p2[1])},
                    "type": "path_point"
                })
            
            # Add Edge
            features["edges"].append({
                "from": id1,
                "to": id2
            })
            
            # Add Path Segment (Visual)
            features["paths"].append({
                "id": f"path_{path_idx}_{i}",
                "color": "#FF0000",
                "strokeWidth": 2,
                "segments": [{
                    "start": {"x": int(p1[0]), "y": int(p1[1])},
                    "end": {"x": int(p2[0]), "y": int(p2[1])}
                }]
            })
            
        path_idx += 1
            
    return features


def main():
    parser = argparse.ArgumentParser(description="Computer Vision Path Mapper")
    parser.add_argument("image", help="Path to floor plan image")
    parser.add_argument("--out", "-o", default="visualization-output.json", help="Output JSON file")
    args = parser.parse_args()
    
    try:
        data = process_image(args.image)
        with open(args.out, 'w') as f:
            json.dump(data, f, indent=2)
        print(f"✅ CV Auto-Mapping Complete! Saved to {args.out}")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
