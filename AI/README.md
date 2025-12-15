# 🤖 Campus Compass AI & Visualization

This directory contains the logic for:
- Pathfinding (A* algorithm)
- Navigation point selection
- Visualization generation

## 📊 Floor Plan Visualization

The `renderVisualization.html` tool allows you to visually debug the generated navigation graphs and room scans.

### ⚠️ Troubleshooting: "It doesn't work!" / Blank Screen

If you open `renderVisualization.html` directly in your browser and see an error or a blank chart, it is likely due to **CORS (Cross-Origin Resource Sharing)** security policies in modern browsers. Browsers block local HTML files from reading local JSON files (`file://` protocol restrictions).

**How to Fix:**

#### Option 1: Use the "Select File" Button (Easiest)
1. Open `renderVisualization.html` in your browser.
2. If the data doesn't load, you should see a green/red message box.
3. Click the **"📁 Select visualization-output.json"** button.
4. Browse to and select your generated `.json` file.

#### Option 2: Run a Local Server
Run a simple HTTP server in this directory:

**Python:**
```bash
python -m http.server 8000
# Then open http://localhost:8000/renderVisualization.html
```

**Node.js:**
```bash
npx http-server .
```

#### Option 3: VS Code "Live Server"
If you use VS Code, install the "Live Server" extension and right-click `renderVisualization.html` -> "Open with Live Server".

---

## 🗺️ AI Path Mapping

We are exploring using AI to automatically generate navigation graphs from raw floor plan images.

### 🚀 Auto-Mapper Tool (`ai_mapper.py`)
This script uses Google Gemini (via OpenRouter) to analyze a floor plan image and generate the JSON graph automatically.

**Setup:**
1. Install Python dependencies:
   ```bash
   pip install requests
   ```
2. Set your API Key:
   - Copy `.env.example` to `.env` and add your key, OR
   - Pass it via command line.

**Usage:**
```bash
# Basic usage (saves to visualization-output.json)
python ai_mapper.py path/to/floorplan.jpg

# Specify output file
python ai_mapper.py input.png --out my-graph.json

# Pass API key directly
python ai_mapper.py input.png --key "sk-or-..."
```

**Output:**
The script generates a JSON file compatible with `renderVisualization.html`. Open the visualizer to inspect the result!

📄 **[Read the full AI Path Mapping Proposal](../docs/ai_path_mapping_proposal.md)** for details on the prompt strategy.
