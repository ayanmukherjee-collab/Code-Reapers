"""
Floor Plan Detection API - mmdetection Version

FastAPI server using mmdetection for detecting walls and rooms in architectural floor plans.
Based on the reference implementation from floorplan-detection-main.

Usage:
    python run.py --model cascade_swin --port 5000
    
API Endpoints:
    GET  /           - Visualizer interface
    POST /run-inference - Analyze a floor plan image
    GET  /health     - Health check
"""

import os
import json
import argparse
import numpy as np
from typing import Dict, Any, List
import cv2
import logging
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse

# Get the directory where run.py is located
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CONFIG_DIR = os.path.join(BASE_DIR, "configs")
WEIGHTS_DIR = os.path.join(BASE_DIR, "weights")

# Try to import mmdetection
try:
    import torch
    from mmdet.apis import init_detector, inference_detector
    MMDET_AVAILABLE = True
except ImportError:
    MMDET_AVAILABLE = False
    print("⚠️ mmdetection not available. Install with: pip install mmdet mmcv mmengine torch")

# Fallback imports for OpenCV-based detection
if not MMDET_AVAILABLE:
    from utils.preprocessing import preprocess_floor_plan
    from utils.wall_detector import detect_walls as cv_detect_walls
    from utils.room_detector import detect_rooms as cv_detect_rooms
    from utils.door_detector import detect_doors as cv_detect_doors

app = FastAPI(
    title="Floor Plan Detection API",
    description="Detects walls, rooms, and doors in architectural floor plans using mmdetection",
    version="2.1.0"
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

MODEL_TYPES = {
    "cascade_swin": "cascade_swin.py",
    "faster_rcnn": "faster_rcnn.py",
    "retinanet": "retinanet.py",
}

global_model = None
global_device = None
using_mmdet = False


def determine_device():
    """Determine the best available device (CUDA or CPU)."""
    if not MMDET_AVAILABLE:
        return "cpu"
    
    import torch
    if torch.cuda.is_available():
        try:
            torch.cuda.init()
            return "cuda:0"
        except Exception as e:
            logger.warning(f"CUDA initialization failed: {str(e)}. Falling back to CPU.")
    return "cpu"


def load_model(model_type: str):
    """Load mmdetection model."""
    global global_device, using_mmdet
    
    if not MMDET_AVAILABLE:
        logger.warning("mmdetection not available, using OpenCV fallback")
        using_mmdet = False
        return None
    
    if model_type not in MODEL_TYPES:
        raise ValueError(f"Unsupported model type: {model_type}")
    
    config_file = os.path.join(CONFIG_DIR, MODEL_TYPES[model_type])
    checkpoint_file = os.path.join(WEIGHTS_DIR, f"{model_type}_latest.pth")
    
    if not os.path.exists(config_file):
        raise FileNotFoundError(f"Config file not found: {config_file}")
    
    if not os.path.exists(checkpoint_file):
        raise FileNotFoundError(
            f"Model weights not found: {checkpoint_file}\n"
            f"Please download from: https://drive.google.com/drive/folders/1MgW3Qo-8K4OrHi4ebvYd-81cTqQxwLgz"
        )
    
    try:
        global_device = determine_device()
        model = init_detector(config_file, checkpoint_file, device=global_device)
        logger.info(f"Model {model_type} loaded successfully on {global_device}")
        using_mmdet = True
        return model
    except Exception as e:
        logger.error(f"Failed to load model {model_type} on {global_device}: {str(e)}")
        if global_device == "cuda:0":
            logger.info("Attempting to load model on CPU")
            global_device = "cpu"
            model = init_detector(config_file, checkpoint_file, device=global_device)
            logger.info(f"Model {model_type} loaded successfully on CPU")
            using_mmdet = True
            return model
        else:
            raise


def process_mmdet_result(result) -> Dict[str, Any]:
    """Process mmdetection inference result into JSON format."""
    bboxes = result.pred_instances.bboxes.cpu().numpy()
    labels = result.pred_instances.labels.cpu().numpy()
    scores = result.pred_instances.scores.cpu().numpy()
    
    walls = []
    rooms = []
    
    for i, (bbox, label, score) in enumerate(zip(bboxes, labels, scores)):
        x1, y1, x2, y2 = bbox
        item = {
            "id": f"{'wall' if label == 0 else 'room'}_{i+1}",
            "position": {
                "start": {"x": float(x1), "y": float(y1)},
                "end": {"x": float(x2), "y": float(y2)}
            },
            "confidence": float(score)
        }
        
        if label == 0:
            walls.append(item)
        else:
            # Add room-specific fields
            item["name"] = f"Room {len(rooms) + 1}"
            item["center"] = {
                "x": float((x1 + x2) / 2),
                "y": float((y1 + y2) / 2)
            }
            item["area"] = float((x2 - x1) * (y2 - y1))
            rooms.append(item)
    
    return {
        "type": "floor_plan",
        "confidence": float(np.mean(scores)) if len(scores) > 0 else 0.0,
        "detectionResults": {
            "walls": walls,
            "rooms": rooms,
            "doors": []  # mmdetection doesn't detect doors, would need separate detection
        }
    }


def process_opencv_result(img, image_width, image_height) -> Dict[str, Any]:
    """Process image using OpenCV fallback detection."""
    preprocessed = preprocess_floor_plan(img)
    walls = cv_detect_walls(preprocessed['binary'], preprocessed['edges'])
    rooms = cv_detect_rooms(preprocessed['binary'], walls, image_width, image_height)
    doors = cv_detect_doors(preprocessed['gray'], walls)
    
    # Format walls
    formatted_walls = []
    for i, wall in enumerate(walls):
        formatted_walls.append({
            "id": f"wall_{i+1}",
            "position": {
                "start": {"x": float(wall['x1']), "y": float(wall['y1'])},
                "end": {"x": float(wall['x2']), "y": float(wall['y2'])}
            },
            "confidence": float(wall.get('confidence', 0.8))
        })
    
    # Format rooms
    formatted_rooms = []
    for i, room in enumerate(rooms):
        formatted_rooms.append({
            "id": f"room_{i+1}",
            "name": room.get('name', f'Room {i+1}'),
            "position": {
                "start": {"x": float(room['x']), "y": float(room['y'])},
                "end": {"x": float(room['x'] + room['width']), "y": float(room['y'] + room['height'])}
            },
            "center": {
                "x": float(room['x'] + room['width'] / 2),
                "y": float(room['y'] + room['height'] / 2)
            },
            "area": float(room['width'] * room['height']),
            "confidence": float(room.get('confidence', 0.75))
        })
    
    # Format doors
    formatted_doors = []
    for i, door in enumerate(doors):
        formatted_doors.append({
            "id": f"door_{i+1}",
            "hinge": {"x": float(door['hinge'][0]), "y": float(door['hinge'][1])},
            "swing_angle": float(door.get('swing_end', 90)),
            "radius": float(door.get('radius', 30)),
            "confidence": float(door.get('confidence', 0.7))
        })
    
    all_confidences = (
        [w.get('confidence', 0.8) for w in walls] +
        [r.get('confidence', 0.75) for r in rooms] +
        [d.get('confidence', 0.7) for d in doors]
    )
    
    return {
        "type": "floor_plan",
        "confidence": float(np.mean(all_confidences)) if all_confidences else 0.0,
        "detectionResults": {
            "walls": formatted_walls,
            "rooms": formatted_rooms,
            "doors": formatted_doors
        }
    }


@app.get("/", response_class=HTMLResponse)
async def root():
    """Serve the visualizer HTML at root."""
    visualizer_path = os.path.join(BASE_DIR, "visualizer.html")
    if os.path.exists(visualizer_path):
        with open(visualizer_path, "r", encoding="utf-8") as f:
            return HTMLResponse(content=f.read())
    
    return HTMLResponse(content=f"""
        <html>
            <head><title>Floor Plan Detection API</title></head>
            <body style="font-family: sans-serif; padding: 40px; background: #1a1a2e; color: #fff;">
                <h1>🏗️ Floor Plan Detection API</h1>
                <p>API is running. Using: <strong>{'mmdetection' if using_mmdet else 'OpenCV (fallback)'}</strong></p>
                <ul>
                    <li><code>GET /health</code> - Health check</li>
                    <li><code>POST /run-inference</code> - Run floor plan detection</li>
                </ul>
            </body>
        </html>
    """)


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "version": "2.1.0",
        "backend": "mmdetection" if using_mmdet else "opencv",
        "device": global_device or "cpu"
    }


@app.post("/run-inference")
async def run_inference(image: UploadFile = File(...)):
    """Run floor plan detection on an uploaded image."""
    if image.content_type not in ["image/jpeg", "image/png"]:
        raise HTTPException(status_code=400, detail="Only JPEG and PNG images are supported.")
    
    try:
        contents = await image.read()
        if len(contents) > MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail="File size exceeds the maximum limit of 10 MB.")
        
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None:
            raise HTTPException(status_code=400, detail="Failed to decode image.")
        
        image_height, image_width = img.shape[:2]
        logger.info(f"Processing image: {image_width}x{image_height}")
        
        if using_mmdet and global_model is not None:
            # Use mmdetection
            img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
            result = inference_detector(global_model, img_rgb)
            processed_result = process_mmdet_result(result)
        else:
            # Use OpenCV fallback
            processed_result = process_opencv_result(img, image_width, image_height)
        
        processed_result["imageSize"] = {"width": image_width, "height": image_height}
        
        logger.info(f"Detection complete: {len(processed_result['detectionResults']['walls'])} walls, "
                   f"{len(processed_result['detectionResults']['rooms'])} rooms")
        
        return processed_result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error during inference: {str(e)}")
        raise HTTPException(status_code=500, detail=f"An error occurred during inference: {str(e)}")


def main():
    """Main entry point."""
    import uvicorn
    
    parser = argparse.ArgumentParser(description="Run Floor Plan Detection API")
    parser.add_argument("--model", type=str, choices=list(MODEL_TYPES.keys()), 
                       default="cascade_swin", help="Model type to use")
    parser.add_argument("--host", type=str, default="0.0.0.0", help="Host to run on")
    parser.add_argument("--port", type=int, default=5000, help="Port to run on")
    args = parser.parse_args()
    
    global global_model
    
    if MMDET_AVAILABLE:
        try:
            global_model = load_model(args.model)
            logger.info(f"Starting server with {args.model} model on device: {global_device}")
        except FileNotFoundError as e:
            logger.warning(f"Model not loaded: {str(e)}")
            logger.info("Running with OpenCV fallback detection")
        except Exception as e:
            logger.error(f"Failed to initialize model: {str(e)}")
            logger.info("Running with OpenCV fallback detection")
    else:
        logger.info("mmdetection not available, using OpenCV fallback")
    
    logger.info(f"Starting Floor Plan Detection API on {args.host}:{args.port}")
    uvicorn.run(app, host=args.host, port=args.port)


if __name__ == "__main__":
    main()
