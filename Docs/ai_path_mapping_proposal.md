# 🤖 AI Path Mapping Proposal: "Automating the Compass"

## The Challenge
Manually drawing paths and nodes for every building floor plan is tedious and error-prone. We need an automated way to convert a floor plan image (PNG/JPG/SVG) into our graph-based JSON format.

## The Solution: Google Gemini API (Free Tier)
We recommend using **Google Gemini 1.5 Flash**.

### Why Gemini 1.5 Flash?
*   **Multimodal:** excellent at analyzing images (floor plans) and understanding spatial relationships.
*   **Long Context:** Can handle detailed prompts and large JSON schemas.
*   **Fast & Efficient:** Optimized for high-volume, low-latency tasks.
*   **Free Tier:** Generous free tier suitable for our hackathon/project needs.

---

## 🛠️ Implementation Strategy

### 1. The Prompt Strategy
We will use a "Structure extraction" prompt pattern. We provide the image and a strict JSON schema, asking the AI to "act as a cartographer."

**System Prompt:**
> "You are an expert indoor navigation cartographer. Your task is to analyze floor plan images and extract a navigation graph. You must identify:
> 1.  **Rooms:** Bounding boxes [x, y, w, h], type (classroom, office, toilet), and labels (text from image).
> 2.  **Corridors (Nodes):** Safe walking points centered in hallways and doors.
> 3.  **Paths (Edges):** Logical connections between nodes.
>
> Return ONLY valid JSON matching this schema: { ... }"

### 2. Sample Python Script
Here is a blueprint for a helper script to run this automation.

```python
import google.generativeai as genai
import PIL.Image
import json

# Configure API
genai.configure(api_key="YOUR_API_KEY")

def map_floor_plan(image_path):
    model = genai.GenerativeModel('gemini-1.5-flash')
    img = PIL.Image.open(image_path)
    
    prompt = """
    Analyze this floor plan. Identify all rooms and hallways.
    Generate a JSON output compatible with our 'Campus Compass' format.
    
    Structure:
    {
      "rooms": [{ "id": "...", "bounds": { "x": 0, "y": 0, "width": 0, "height": 0 }, "label": "..." }],
      "nodes": [{ "id": "...", "position": { "x": 0, "y": 0 }, "type": "corridor" }],
      "edges": [{ "from": "...", "to": "..." }]
    }
    
    Coordinate system: Top-left is (0,0). Use pixel coordinates relative to the image size.
    """
    
    response = model.generate_content([prompt, img])
    
    # Extract JSON from response (simple cleanup might be needed)
    return response.text

# Usage
# json_output = map_floor_plan("level1.png")
# print(json_output)
```

### 3. Integration Workflow
1.  **Upload:** Admin uploads a raw floor plan image.
2.  **Process:** Backend sends image to Gemini API.
3.  **Review:** Editor UI shows the AI-generated overlay (using our current visualization tool!).
4.  **Refine:** Human verifies and drags nodes if slightly off.
5.  **Save:** Final JSON saved to Firebase.

## 🚀 Next Steps
1.  Get a free API Key from [Google AI Studio](https://aistudio.google.com/).
2.  Create a `scripts/ai_mapper.py` prototype using the code above.
3.  Test with `Shared/SampleFloorPlans`.
