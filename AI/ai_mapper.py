import os
import sys
import json
import base64
import requests
import argparse

from PIL import Image
import io

# Configuration
DEFAULT_MODEL = "gemini-2.0-flash"
GOOGLE_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={key}"

def encode_image(image_path, max_size=1024):
    """Encodes an image file to base64 string, resizing if necessary."""
    with Image.open(image_path) as img:
        # Resize if dimension exceeds max_size
        if max(img.size) > max_size:
            ratio = max_size / max(img.size)
            new_size = (int(img.width * ratio), int(img.height * ratio))
            img = img.resize(new_size, Image.Resampling.LANCZOS)
        
        # Convert to RGB if necessary (e.g. RGBA to JPEG)
        if img.mode == 'RGBA':
            img = img.convert('RGB')
            
        # Save to buffer
        buffer = io.BytesIO()
        img.save(buffer, format="JPEG", quality=85)
        return base64.b64encode(buffer.getvalue()).decode('utf-8')

def map_floor_plan(image_path, api_key, model=DEFAULT_MODEL):
    """
    Sends the floor plan image to the Google AI Studio API and returns the JSON navigation graph.
    """
    if not os.path.exists(image_path):
        raise FileNotFoundError(f"Image file not found: {image_path}")

    base64_image = encode_image(image_path)
    mime_type = "image/jpeg" # We always convert to JPEG in encode_image

    # schema for the expected JSON output
    system_prompt = """
    You are an expert indoor navigation cartographer. Your task is to analyze floor plan images and extract a navigation graph.
    You must identify:
    1. Rooms: Bounding boxes [x, y, w, h] (in pixels), type (choose from: classroom, office, toilet, stairs, lift, other), and labels (text from image).
    2. Nodes: Navigation points. Place 'corridor' nodes in hallways and intersections. Place 'room' nodes inside rooms (usually center).
    3. Edges: Walkable paths between nodes. Connect room nodes to the nearest corridor node. Connect corridor nodes to form a network.

    The image coordinate system starts at top-left (0,0).
    Return ONLY valid JSON matching the following schema structure. Do not include markdown formatting.
    
    {
      "metadata": { "source": "AI_GENERATED", "units": "pixels" },
      "coordinateSpace": { "bounds": { "x": 0, "y": 0, "width": 1000, "height": 1000 } },
      "rooms": [
        { "id": "room_1", "bounds": { "x": 10, "y": 10, "width": 100, "height": 100 }, "type": "classroom", "label": "101" }
      ],
      "nodes": [
        { "id": "node_1", "position": { "x": 60, "y": 60 }, "type": "room" },
        { "id": "node_2", "position": { "x": 60, "y": 120 }, "type": "corridor" }
      ],
      "edges": [
        { "from": "node_1", "to": "node_2" }
      ]
    }
    """

    url = GOOGLE_API_URL.format(model=model, key=api_key)
    
    headers = {
        "Content-Type": "application/json"
    }

    payload = {
        "contents": [{
            "parts": [
                {"text": system_prompt},
                {
                    "inline_data": {
                        "mime_type": mime_type,
                        "data": base64_image
                    }
                }
            ]
        }],
        "generationConfig": {
            "response_mime_type": "application/json"
        }
    }

    print(f"🚀 Sending request to Google AI Studio ({model})...")
    try:
        response = requests.post(url, headers=headers, json=payload)
        response.raise_for_status()
        result = response.json()
        
        # Parse Google API response structure
        if 'candidates' in result and len(result['candidates']) > 0:
            content = result['candidates'][0]['content']['parts'][0]['text']
            # Cleanup
            content = content.replace("```json", "").replace("```", "").strip()
            return json.loads(content)
        else:
            raise Exception(f"Empty or error response: {result}")

    except requests.exceptions.RequestException as e:
        print(f"❌ API Request failed: {e}")
        if response is not None:
             print(f"Response: {response.text}")
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"❌ Failed to parse JSON response: {e}")
        print(f"Raw content: {content}")
        sys.exit(1)

def generate_mock_data():
    """Generates mock data for testing/verification when API fails."""
    print("⚠️  Generating MOCK data for verification...")
    return {
      "metadata": { "source": "MOCK_DATA", "units": "pixels" },
      "coordinateSpace": { "bounds": { "x": 0, "y": 0, "width": 1000, "height": 600 } },
      "rooms": [
        { "id": "room_lh1", "bounds": { "x": 50, "y": 50, "width": 100, "height": 100 }, "type": "classroom", "label": "Lecture Hall 1" },
        { "id": "room_lh4", "bounds": { "x": 160, "y": 50, "width": 100, "height": 100 }, "type": "classroom", "label": "Lecture Hall 4" },
        { "id": "room_admin", "bounds": { "x": 500, "y": 300, "width": 150, "height": 100 }, "type": "office", "label": "Admin Office" }
      ],
      "nodes": [
        { "id": "node_lh1", "position": { "x": 100, "y": 100 }, "type": "room" },
        { "id": "node_c1", "position": { "x": 100, "y": 200 }, "type": "corridor" },
        { "id": "node_c2", "position": { "x": 575, "y": 200 }, "type": "corridor" },
        { "id": "node_admin", "position": { "x": 575, "y": 350 }, "type": "room" }
      ],
      "edges": [
        { "from": "node_lh1", "to": "node_c1" },
        { "from": "node_c1", "to": "node_c2" },
        { "from": "node_c2", "to": "node_admin" }
      ]
    }

def main():
    parser = argparse.ArgumentParser(description="AI Floor Plan Mapper")
    parser.add_argument("image", help="Path to the floor plan image (JPG/PNG)")
    parser.add_argument("--out", "-o", help="Output JSON file path", default="visualization-output.json")
    parser.add_argument("--key", "-k", help="OpenRouter API Key (overrides env var)")
    parser.add_argument("--mock", "-m", help="Force mock data generation", action="store_true")
    args = parser.parse_args()

    # Get API Key
    api_key = args.key or os.environ.get("OPENROUTER_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    if not api_key:
        api_key = "AIzaSyALiRIWmF5OE2A_i_Aep7jadOjB3_lLTN8"
        print("⚠️  Using hardcoded API key (from session context).")
    
    print(f"📄 Processing: {args.image}")
    
    try:
        if args.mock:
            data = generate_mock_data()
        else:
            data = map_floor_plan(args.image, api_key)
        
        # Post-processing to enforce user-requested styling
        # User request: "paths to be traced in a red line and rooms to be highlighted in green 60% opacacity"
        
        # 1. Enforce Room Styling
        if "rooms" in data:
            print("⚙️  Applying room styling (Green, 60% opacity)...")
            for room in data["rooms"]:
                room["fillColor"] = "#00FF00"  # Green
                room["opacity"] = 0.6          # 60% Opacity
                room["strokeColor"] = "#000000"
                room["strokeWidth"] = 1

        # 2. Enforce Path Styling
        # Ensure paths exist (convert edges if needed)
        if "paths" not in data and "edges" in data and "nodes" in data:
            print("⚙️  Converting edges to paths for visualization...")
            data["paths"] = []
            node_map = {n["id"]: n["position"] for n in data["nodes"]}
            
            for i, edge in enumerate(data["edges"]):
                start_pos = node_map.get(edge["from"])
                end_pos = node_map.get(edge["to"])
                if start_pos and end_pos:
                    data["paths"].append({
                        "id": f"path_{i}",
                        "color": "#FF0000",       # Red
                        "strokeWidth": 2,
                        "segments": [{"start": start_pos, "end": end_pos}]
                    })
        elif "paths" in data:
             print("⚙️  Applying path styling (Red)...")
             for path in data["paths"]:
                 path["color"] = "#FF0000"
                 path["strokeWidth"] = 2

        # Save output
        with open(args.out, "w") as f:
            json.dump(data, f, indent=2)
        
        print(f"✅ Success! Map saved to: {args.out}")
        print(f"   Open 'renderVisualization.html' to view it.")

    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
