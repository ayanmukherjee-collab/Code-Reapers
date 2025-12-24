"""
Floor Plan Detection API - Roboflow Version

FastAPI server using Roboflow's InferenceHTTPClient for detecting 
floor plan elements using a custom trained model.

Usage:
    python run.py --port 5000
    
API Endpoints:
    GET  /           - Visualizer interface
    POST /run-inference - Analyze a floor plan image
    GET  /health     - Health check

Environment Variables:
    ROBOFLOW_API_KEY - Your Roboflow private API key
    ROBOFLOW_WORKSPACE - Workspace name (default: test-b5rtm)
    ROBOFLOW_WORKFLOW_ID - Workflow ID (default: classify-and-conditionally-detect)
"""

import os
import argparse
import base64
import numpy as np
from typing import Dict, Any, List, Optional
import cv2
import logging
from pydantic import BaseModel
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get the directory where run.py is located
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Try to import Roboflow inference SDK
try:
    from inference_sdk import InferenceHTTPClient
    ROBOFLOW_AVAILABLE = True
except ImportError:
    ROBOFLOW_AVAILABLE = False
    print("⚠️ inference-sdk not available. Install with: pip install inference-sdk")

# Roboflow configuration
ROBOFLOW_API_KEY = os.getenv("ROBOFLOW_API_KEY", "mXkh9oZq1P6F4LjrrsBD")
ROBOFLOW_WORKSPACE = os.getenv("ROBOFLOW_WORKSPACE", "test-b5rtm")

# Room detection workflow (detect-and-classify)
ROBOFLOW_ROOM_WORKFLOW_ID = os.getenv("ROBOFLOW_ROOM_WORKFLOW_ID", "detect-and-classify")

# Door detection model (floor_plan_multiple)
ROBOFLOW_DOOR_MODEL_ID = os.getenv("ROBOFLOW_DOOR_MODEL_ID", "floor_plan_multiple-hgrp2/1")

# Legacy workflow (kept for backward compatibility)
ROBOFLOW_WORKFLOW_ID = os.getenv("ROBOFLOW_WORKFLOW_ID", "detect-and-classify")
ROBOFLOW_API_URL = "https://serverless.roboflow.com"

app = FastAPI(
    title="Floor Plan Detection API",
    description="Detects floor plan elements using Roboflow custom trained model",
    version="3.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB

# Initialize Roboflow client
roboflow_client = None


def initialize_roboflow_client():
    """Initialize the Roboflow InferenceHTTPClient."""
    global roboflow_client
    
    if not ROBOFLOW_AVAILABLE:
        logger.warning("Roboflow SDK not available")
        return None
    
    if not ROBOFLOW_API_KEY:
        logger.warning("ROBOFLOW_API_KEY not set")
        return None
    
    try:
        roboflow_client = InferenceHTTPClient(
            api_url=ROBOFLOW_API_URL,
            api_key=ROBOFLOW_API_KEY
        )
        logger.info(f"✅ Roboflow client initialized successfully")
        logger.info(f"   Workspace: {ROBOFLOW_WORKSPACE}")
        logger.info(f"   Workflow: {ROBOFLOW_WORKFLOW_ID}")
        return roboflow_client
    except Exception as e:
        logger.error(f"Failed to initialize Roboflow client: {str(e)}")
        return None


def process_roboflow_result(result: Dict, image_width: int, image_height: int) -> Dict[str, Any]:
    """
    Process Roboflow workflow result into our standard JSON format.
    
    The result structure depends on your Roboflow workflow configuration.
    This function maps the Roboflow output to our expected format.
    """
    walls = []
    rooms = []
    doors = []
    
    # Extract predictions from result
    # The structure depends on your Roboflow workflow - adjust as needed
    predictions = []
    
    # Handle different result structures from Roboflow
    if isinstance(result, dict):
        if 'predictions' in result:
            predictions = result['predictions']
        elif 'output' in result:
            # Workflow output format
            output = result['output']
            if isinstance(output, list):
                for item in output:
                    if 'predictions' in item:
                        predictions.extend(item['predictions'])
            elif isinstance(output, dict) and 'predictions' in output:
                predictions = output['predictions']
        
        # Also check for direct detection results
        if 'detections' in result:
            predictions = result['detections']
    elif isinstance(result, list):
        predictions = result
    
    logger.info(f"Processing {len(predictions)} predictions from Roboflow")
    
    for i, pred in enumerate(predictions):
        # Get bounding box
        x = pred.get('x', 0)
        y = pred.get('y', 0)
        width = pred.get('width', 0)
        height = pred.get('height', 0)
        
        # Calculate corners (Roboflow returns center x,y)
        x1 = x - width / 2
        y1 = y - height / 2
        x2 = x + width / 2
        y2 = y + height / 2
        
        confidence = pred.get('confidence', 0.8)
        class_name = pred.get('class', '').lower()
        
        item = {
            "id": f"{class_name}_{i+1}",
            "position": {
                "start": {"x": float(x1), "y": float(y1)},
                "end": {"x": float(x2), "y": float(y2)}
            },
            "confidence": float(confidence),
            "class": class_name
        }
        
        # Categorize based on class name
        if 'wall' in class_name:
            walls.append(item)
        elif 'door' in class_name:
            doors.append({
                "id": f"door_{len(doors)+1}",
                "hinge": {"x": float(x), "y": float(y)},
                "swing_angle": 90,
                "radius": float(max(width, height) / 2),
                "confidence": float(confidence)
            })
        elif 'room' in class_name or 'space' in class_name:
            item["name"] = pred.get('class', f'Room {len(rooms)+1}')
            item["center"] = {"x": float(x), "y": float(y)}
            item["area"] = float(width * height)
            rooms.append(item)
        else:
            # Default: treat as a room/space if not wall or door
            item["name"] = pred.get('class', f'Area {len(rooms)+1}')
            item["center"] = {"x": float(x), "y": float(y)}
            item["area"] = float(width * height)
            rooms.append(item)
    
    all_confidences = (
        [w.get('confidence', 0.8) for w in walls] +
        [r.get('confidence', 0.8) for r in rooms] +
        [d.get('confidence', 0.8) for d in doors]
    )
    
    return {
        "type": "floor_plan",
        "confidence": float(np.mean(all_confidences)) if all_confidences else 0.0,
        "detectionResults": {
            "walls": walls,
            "rooms": rooms,
            "doors": doors
        },
        "rawResult": result  # Include raw result for debugging
    }


@app.get("/", response_class=HTMLResponse)
async def root():
    """Serve the visualizer HTML at root."""
    visualizer_path = os.path.join(BASE_DIR, "visualizer.html")
    if os.path.exists(visualizer_path):
        with open(visualizer_path, "r", encoding="utf-8") as f:
            return HTMLResponse(content=f.read())
    
    status = "✅ Connected" if roboflow_client else "❌ Not Connected"
    return HTMLResponse(content=f"""
        <html>
            <head><title>Floor Plan Detection API</title></head>
            <body style="font-family: sans-serif; padding: 40px; background: #1a1a2e; color: #fff;">
                <h1>🏗️ Floor Plan Detection API</h1>
                <p>API is running with <strong>Roboflow</strong> backend</p>
                <p>Roboflow Status: <strong>{status}</strong></p>
                <ul>
                    <li><code>GET /health</code> - Health check</li>
                    <li><code>POST /run-inference</code> - Run floor plan detection</li>
                </ul>
                <h3>Configuration:</h3>
                <ul>
                    <li>Workspace: <code>{ROBOFLOW_WORKSPACE}</code></li>
                    <li>Workflow: <code>{ROBOFLOW_WORKFLOW_ID}</code></li>
                </ul>
            </body>
        </html>
    """)


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "version": "3.0.0",
        "backend": "roboflow",
        "roboflow_connected": roboflow_client is not None,
        "workspace": ROBOFLOW_WORKSPACE,
        "workflow": ROBOFLOW_WORKFLOW_ID
    }


@app.post("/run-inference")
async def run_inference(image: UploadFile = File(...)):
    """Run floor plan detection on an uploaded image using Roboflow."""
    if image.content_type not in ["image/jpeg", "image/png"]:
        raise HTTPException(status_code=400, detail="Only JPEG and PNG images are supported.")
    
    if not roboflow_client:
        raise HTTPException(
            status_code=503, 
            detail="Roboflow client not initialized. Check ROBOFLOW_API_KEY."
        )
    
    try:
        contents = await image.read()
        if len(contents) > MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail="File size exceeds the maximum limit of 10 MB.")
        
        # Decode image to get dimensions
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None:
            raise HTTPException(status_code=400, detail="Failed to decode image.")
        
        image_height, image_width = img.shape[:2]
        logger.info(f"Processing image: {image_width}x{image_height}")
        
        # Encode image to base64 for Roboflow
        _, buffer = cv2.imencode('.jpg', img)
        img_base64 = base64.b64encode(buffer).decode('utf-8')
        
        # Run Roboflow workflow
        logger.info(f"Sending to Roboflow workflow: {ROBOFLOW_WORKFLOW_ID}")
        result = roboflow_client.run_workflow(
            workspace_name=ROBOFLOW_WORKSPACE,
            workflow_id=ROBOFLOW_WORKFLOW_ID,
            images={
                "image": img_base64
            },
            use_cache=True
        )
        
        logger.info(f"Roboflow response received")
        
        # Process the result
        processed_result = process_roboflow_result(result, image_width, image_height)
        processed_result["imageSize"] = {"width": image_width, "height": image_height}
        
        # Remove raw result from final output (uncomment below to include for debugging)
        # del processed_result["rawResult"]
        
        logger.info(f"Detection complete: {len(processed_result['detectionResults']['walls'])} walls, "
                   f"{len(processed_result['detectionResults']['rooms'])} rooms, "
                   f"{len(processed_result['detectionResults']['doors'])} doors")
        
        return processed_result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error during inference: {str(e)}")
        raise HTTPException(status_code=500, detail=f"An error occurred during inference: {str(e)}")


# ============================================================================
# ROBOFLOW WORKFLOW DETECTION ENDPOINT
# ============================================================================

class RoboflowDetectionParams(BaseModel):
    """Parameters for Roboflow detection."""
    confidence: Optional[float] = 40  # Confidence threshold (0-100)
    overlap: Optional[float] = 30     # Overlap/NMS threshold (0-100)


@app.post("/detect-roboflow")
async def detect_roboflow(
    image: UploadFile = File(...),
    confidence: float = 40,
    overlap: float = 30
):
    """
    Detect floor plan elements using Roboflow's detect-and-classify workflow.
    
    Uses the ML model for room detection with adjustable thresholds.
    
    Args:
        image: Floor plan image
        confidence: Confidence threshold (0-100), default 40
        overlap: Overlap/NMS threshold (0-100), default 30
        
    Returns:
        Detections and navigation graph
    """
    if not roboflow_client:
        raise HTTPException(status_code=500, detail="Roboflow client not available")
    
    try:
        # Validate and read image
        if not image.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        contents = await image.read()
        if len(contents) > MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail="File size exceeds limit")
        
        # Decode image dimensions
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None:
            raise HTTPException(status_code=400, detail="Could not decode image")
        
        image_height, image_width = img.shape[:2]
        
        # Encode to base64
        img_base64 = base64.b64encode(contents).decode('utf-8')
        
        logger.info(f"Sending to Roboflow direct detection API")
        logger.info(f"Model: {ROBOFLOW_DOOR_MODEL_ID}")
        logger.info(f"Thresholds - Confidence: {confidence}%, Overlap: {overlap}%")
        
        # Use direct detection API instead of workflow (workflow has incompatible model)
        import requests
        
        detect_url = f"https://detect.roboflow.com/{ROBOFLOW_DOOR_MODEL_ID}"
        params = {
            "api_key": ROBOFLOW_API_KEY,
            "confidence": confidence / 100.0,
            "overlap": overlap / 100.0
        }
        
        response = requests.post(
            detect_url,
            params=params,
            data=img_base64,
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        
        if response.status_code != 200:
            logger.error(f"Roboflow API error: {response.status_code} - {response.text}")
            raise HTTPException(status_code=response.status_code, detail=f"Roboflow API error: {response.text}")
        
        result = response.json()
        logger.info(f"Roboflow response received")
        
        # Process predictions with confidence threshold
        rooms = []
        doors = []
        walls = []
        
        predictions = []
        
        # Extract predictions from Roboflow response
        if isinstance(result, list) and len(result) > 0:
            for item in result:
                if isinstance(item, dict):
                    if 'predictions' in item:
                        predictions.extend(item.get('predictions', []))
                    elif 'output' in item:
                        output = item['output']
                        if isinstance(output, dict) and 'predictions' in output:
                            predictions.extend(output['predictions'])
        elif isinstance(result, dict):
            if 'predictions' in result:
                predictions = result['predictions']
        
        logger.info(f"Processing {len(predictions)} predictions")
        
        conf_threshold = confidence / 100.0
        overlap_threshold = overlap / 100.0
        
        for i, pred in enumerate(predictions):
            pred_conf = pred.get('confidence', 0)
            
            # Apply confidence threshold
            if pred_conf < conf_threshold:
                continue
            
            x = pred.get('x', 0)
            y = pred.get('y', 0)
            width = pred.get('width', 0)
            height = pred.get('height', 0)
            
            x1 = x - width / 2
            y1 = y - height / 2
            x2 = x + width / 2
            y2 = y + height / 2
            
            class_name = pred.get('class', '').lower()
            
            item_data = {
                "id": f"{class_name}_{i+1}",
                "name": pred.get('class', f'Room {i+1}'),
                "position": {
                    "start": {"x": float(x1), "y": float(y1)},
                    "end": {"x": float(x2), "y": float(y2)}
                },
                "center": {"x": float(x), "y": float(y)},
                "area": float(width * height),
                "confidence": float(pred_conf),
                "class": class_name,
                "type": "room" if 'room' in class_name or 'space' in class_name else class_name
            }
            
            # Categorize by class name
            if 'door' in class_name:
                doors.append({
                    "id": f"door_{len(doors)+1}",
                    "hinge": {"x": float(x), "y": float(y)},
                    "width": float(max(width, height)),
                    "swing_angle": 90,
                    "confidence": float(pred_conf),
                    "type": "door"
                })
            elif 'wall' in class_name:
                walls.append({
                    "id": f"wall_{len(walls)+1}",
                    "position": {
                        "start": {"x": float(x1), "y": float(y1)},
                        "end": {"x": float(x2), "y": float(y2)}
                    },
                    "confidence": float(pred_conf),
                    "type": "wall"
                })
            else:
                # Treat as room/space
                rooms.append(item_data)
        
        # Apply NMS (Non-Maximum Suppression) to remove overlaps
        rooms = apply_nms(rooms, overlap_threshold)
        
        detections = {
            "rooms": rooms,
            "doors": doors,
            "walls": walls,
            "hallways": [],
            "stairs": [],
            "texts": [],
            "imageSize": {"width": image_width, "height": image_height}
        }
        
        # Build navigation graph
        if UNIFIED_DETECTOR_AVAILABLE:
            detector = FloorPlanDetector()
            graph = detector.build_navigation_graph(detections)
        else:
            graph = {"nodes": [], "edges": [], "metadata": {}}
        
        logger.info(f"Roboflow detection complete: {len(rooms)} rooms, {len(doors)} doors")
        
        return {
            "success": True,
            "detections": detections,
            "navigationGraph": graph,
            "thresholds": {
                "confidence": confidence,
                "overlap": overlap
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Roboflow detection error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


def apply_nms(items: List[Dict], threshold: float) -> List[Dict]:
    """Apply Non-Maximum Suppression to filter overlapping detections."""
    if not items:
        return items
    
    # Sort by confidence descending
    sorted_items = sorted(items, key=lambda x: x.get('confidence', 0), reverse=True)
    
    kept = []
    for item in sorted_items:
        overlap_found = False
        for kept_item in kept:
            iou = calculate_iou(item, kept_item)
            if iou > threshold:
                overlap_found = True
                break
        if not overlap_found:
            kept.append(item)
    
    return kept


def calculate_iou(box1: Dict, box2: Dict) -> float:
    """Calculate Intersection over Union for two boxes."""
    x1_1 = box1["position"]["start"]["x"]
    y1_1 = box1["position"]["start"]["y"]
    x2_1 = box1["position"]["end"]["x"]
    y2_1 = box1["position"]["end"]["y"]
    
    x1_2 = box2["position"]["start"]["x"]
    y1_2 = box2["position"]["start"]["y"]
    x2_2 = box2["position"]["end"]["x"]
    y2_2 = box2["position"]["end"]["y"]
    
    x_left = max(x1_1, x1_2)
    y_top = max(y1_1, y1_2)
    x_right = min(x2_1, x2_2)
    y_bottom = min(y2_1, y2_2)
    
    if x_right < x_left or y_bottom < y_top:
        return 0.0
    
    intersection = (x_right - x_left) * (y_bottom - y_top)
    area1 = (x2_1 - x1_1) * (y2_1 - y1_1)
    area2 = (x2_2 - x1_2) * (y2_2 - y1_2)
    union = area1 + area2 - intersection
    
    return intersection / union if union > 0 else 0.0


# ============================================================================
# UNIFIED DETECTION + PATHFINDING ENDPOINTS
# ============================================================================

# Import unified detector and pathfinder
try:
    from unified_detector import FloorPlanDetector
    from pathfinder import find_path, find_path_by_name, get_directions, search_nodes_by_name
    UNIFIED_DETECTOR_AVAILABLE = True
except ImportError as e:
    UNIFIED_DETECTOR_AVAILABLE = False
    logger.warning(f"Unified detector not available: {e}")


@app.post("/detect-unified")
async def detect_unified(image: UploadFile = File(...)):
    """
    Run unified detection pipeline (OpenCV + OCR).
    
    Returns walls, rooms with names, doors, hallways, stairs, and navigation graph.
    This provides better room detection than Roboflow alone.
    """
    if not UNIFIED_DETECTOR_AVAILABLE:
        raise HTTPException(status_code=500, detail="Unified detector not available")
    
    try:
        # Validate and read image
        if not image.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        contents = await image.read()
        if len(contents) > MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail="File size exceeds limit")
        
        # Decode image
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            raise HTTPException(status_code=400, detail="Could not decode image")
        
        logger.info(f"Processing image: {image.filename} ({img.shape[1]}x{img.shape[0]})")
        
        # Run unified detection
        detector = FloorPlanDetector()
        detections = detector.detect_all(img)
        
        # Build navigation graph
        graph = detector.build_navigation_graph(detections)
        
        logger.info(f"Unified detection complete: {len(detections['rooms'])} rooms, "
                   f"{len(graph['nodes'])} nodes, {len(graph['edges'])} edges")
        
        return {
            "success": True,
            "detections": detections,
            "navigationGraph": graph
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unified detection error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/find-path")
async def api_find_path(start_id: str, end_id: str, algorithm: str = "astar"):
    """
    Find path between two nodes by ID.
    
    Requires a previous call to /detect-unified to build the graph.
    """
    # This is a simplified version - in production you'd store the graph in session/DB
    raise HTTPException(status_code=501, detail="Use /pathfind-by-name with the graph from /detect-unified")


from pydantic import BaseModel
from typing import Optional

class PathfindRequest(BaseModel):
    graph: Dict[str, Any]  # Navigation graph from detect-unified
    start_query: str       # Search query for start location
    end_query: str         # Search query for destination
    algorithm: Optional[str] = "astar"  # "astar" or "dijkstra"


@app.post("/pathfind")
async def api_pathfind(request: PathfindRequest):
    """
    Find path between two locations by name search.
    
    Args:
        graph: Navigation graph from /detect-unified response
        start_query: Room name/number to start from (e.g. "101", "Lab")
        end_query: Room name/number to go to
        algorithm: "astar" (default) or "dijkstra"
    
    Returns:
        Path with node list, total distance, and turn-by-turn directions
    """
    if not UNIFIED_DETECTOR_AVAILABLE:
        raise HTTPException(status_code=500, detail="Pathfinder not available")
    
    try:
        result = find_path_by_name(
            request.graph, 
            request.start_query, 
            request.end_query,
            request.algorithm
        )
        
        if result.get("found"):
            result["directions"] = get_directions(result)
        
        return result
        
    except Exception as e:
        logger.error(f"Pathfinding error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


class SearchRequest(BaseModel):
    graph: Dict[str, Any]
    query: str


@app.post("/search-nodes")
async def api_search_nodes(request: SearchRequest):
    """
    Search for nodes by name.
    
    Returns list of matching rooms/locations for autocomplete.
    """
    if not UNIFIED_DETECTOR_AVAILABLE:
        raise HTTPException(status_code=500, detail="Search not available")
    
    try:
        matches = search_nodes_by_name(request.graph, request.query)
        return {
            "query": request.query,
            "results": [
                {"id": m["id"], "name": m.get("name", m["id"]), "type": m.get("type")}
                for m in matches[:20]  # Limit to 20 results
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class EditableGraphRequest(BaseModel):
    """Request model for rebuilding graph from edited detections."""
    detections: Dict[str, Any]  # Modified detections (rooms, doors, hallways, walls)


@app.post("/rebuild-graph")
async def rebuild_graph(request: EditableGraphRequest):
    """
    Rebuild navigation graph from user-edited detection data.
    
    Users can:
    - Add/edit/delete rooms
    - Add/edit/delete doors
    - Add/edit/delete hallways
    - Modify connections
    
    The backend rebuilds the graph from the modified detections.
    """
    if not UNIFIED_DETECTOR_AVAILABLE:
        raise HTTPException(status_code=500, detail="Detector not available")
    
    try:
        detector = FloorPlanDetector()
        
        # Build graph from user-provided detections
        graph = detector.build_navigation_graph(request.detections)
        
        logger.info(f"Rebuilt graph: {graph['metadata']['nodeCount']} nodes, "
                   f"{graph['metadata']['edgeCount']} edges")
        
        return {
            "success": True,
            "navigationGraph": graph
        }
        
    except Exception as e:
        logger.error(f"Graph rebuild error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


def main():
    """Main entry point."""
    import uvicorn
    
    parser = argparse.ArgumentParser(description="Run Floor Plan Detection API with Roboflow")
    parser.add_argument("--host", type=str, default="0.0.0.0", help="Host to run on")
    parser.add_argument("--port", type=int, default=5000, help="Port to run on")
    args = parser.parse_args()
    
    # Initialize Roboflow client
    initialize_roboflow_client()
    
    if roboflow_client:
        logger.info(f"🚀 Starting Floor Plan Detection API with Roboflow backend")
    else:
        logger.warning("⚠️ Roboflow client not available - API will return errors")
    
    logger.info(f"Starting server on {args.host}:{args.port}")
    uvicorn.run(app, host=args.host, port=args.port)


if __name__ == "__main__":
    main()
