# 📐 Floor Plan Input Assumptions for AR Navigation

**Document Version:** 1.0  
**Last Updated:** Hackathon Edition  
**Purpose:** Define clear, hackathon-friendly assumptions for floor plan parsing and AR visualization

---

## 🎯 Core Assumptions

### ✅ **What We Assume About Floor Plans**

#### 1. **Clean, Top-Down View**
- Floor plans are provided as **top-down orthographic projections**
- No perspective distortion or 3D angles
- North-up orientation (or consistent orientation per building)
- Scale is consistent within a single floor plan

#### 2. **Simple Room Boundaries**
- Rooms are represented as **rectangular or simple polygonal shapes**
- Room boundaries are clearly defined (walls, lines, or closed paths)
- No complex curved walls or irregular geometries
- Room labels/numbers are clearly visible and positioned

#### 3. **Clearly Separated Corridors**
- Corridors are **distinct pathways** connecting rooms
- Corridors have clear boundaries (walls on both sides)
- Corridor intersections are identifiable
- Main corridors vs. side corridors are distinguishable

#### 4. **One Floor at a Time**
- Each floor plan represents **a single floor level**
- Multi-floor navigation handled via stairs/elevators as special nodes
- Floor transitions are explicit landmarks (not inferred)
- Each floor has its own coordinate system

---

## 🛠️ Acceptable Approaches

### ✅ **Heuristics Are Welcome**

We use **rule-based heuristics** for parsing:

- **Room Detection:** Identify rectangular/polygonal regions with labels
- **Corridor Detection:** Identify long, narrow pathways between rooms
- **Node Placement:** Place navigation nodes at:
  - Room centers
  - Corridor midpoints
  - Intersection centers
  - Stair/elevator locations
- **Edge Generation:** Connect nodes based on:
  - Proximity (within threshold distance)
  - Shared boundaries (rooms adjacent to corridors)
  - Explicit connections (doors, openings)

### ✅ **Predefined Markers Are Acceptable**

Floor plans can include **explicit markers** for easier parsing:

- **Navigation Nodes:** Pre-placed markers (circles, dots) at key points
- **Landmark Labels:** Text labels for rooms, stairs, elevators, exits
- **Connection Indicators:** Lines or arrows showing allowed paths
- **Zone Markers:** Colored regions for different areas (e.g., "Wing A", "Section B")

**Marker Format Examples:**
- `NODE_001` - Navigation node identifier
- `ROOM_101` - Room identifier
- `STAIR_A` - Stairwell identifier
- `ELEV_1` - Elevator identifier
- `EXIT_MAIN` - Exit identifier

### ✅ **Simplified Parsing Rules**

We use **simple, deterministic rules** rather than complex ML/CV:

1. **SVG Parsing:**
   - Extract `<rect>`, `<polygon>`, `<path>` elements as room boundaries
   - Extract `<text>` elements as labels
   - Extract `<circle>` or `<ellipse>` as navigation nodes
   - Extract `<line>` or `<polyline>` as corridors/connections

2. **Image-Based Parsing (if needed):**
   - Use color-based region detection (e.g., rooms in one color, corridors in another)
   - Use template matching for common symbols (stairs, elevators, exits)
   - Use OCR for text labels (room numbers, names)

3. **JSON-Based Input (Preferred):**
   - Pre-processed floor plans as structured JSON
   - Explicit node/edge definitions
   - Pre-computed coordinates and connections

---

## ❌ What We Do NOT Attempt

### 🚫 **No Full Computer Vision**

- **No automatic feature detection** from raw images
- **No machine learning models** for room/corridor classification
- **No deep learning** for semantic segmentation
- **No automatic text recognition** from complex layouts (unless using simple OCR)

### 🚫 **No Automatic Perfection**

- **No automatic correction** of imperfect floor plans
- **No inference** of missing connections
- **No guessing** at ambiguous layouts
- **No complex geometric analysis** (e.g., finding optimal paths through undefined spaces)

---

## 📋 Floor Plan Input Formats

### **Format 1: SVG (Preferred for Parsing)**

```xml
<svg>
  <!-- Room as rectangle -->
  <rect x="100" y="200" width="50" height="40" class="room" id="ROOM_101"/>
  <text x="125" y="225">101</text>
  
  <!-- Corridor as path -->
  <path d="M 150 220 L 300 220" class="corridor" stroke-width="10"/>
  
  <!-- Navigation node -->
  <circle cx="225" cy="220" r="5" class="node" id="NODE_001"/>
</svg>
```

**Parsing Rules:**
- Elements with `class="room"` → Room boundaries
- Elements with `class="corridor"` → Corridor paths
- Elements with `class="node"` → Navigation nodes
- `<text>` elements → Labels (room numbers, names)

### **Format 2: Structured JSON (Preferred for Runtime)**

```json
{
  "floorId": "block-a-floor-1",
  "level": 1,
  "bounds": { "width": 500, "height": 400 },
  "nodes": [
    {
      "id": "NODE_001",
      "type": "corridor",
      "x": 225,
      "y": 220,
      "connections": ["NODE_002", "NODE_003"]
    },
    {
      "id": "NODE_002",
      "type": "room",
      "x": 125,
      "y": 220,
      "roomId": "ROOM_101",
      "connections": ["NODE_001"]
    }
  ],
  "landmarks": [
    {
      "id": "ROOM_101",
      "type": "room",
      "label": "101",
      "nodeId": "NODE_002",
      "bounds": { "x": 100, "y": 200, "width": 50, "height": 40 }
    }
  ],
  "edges": [
    {
      "from": "NODE_001",
      "to": "NODE_002",
      "distance": 100,
      "direction": "west"
    }
  ]
}
```

**This format is preferred** because:
- No parsing needed at runtime
- Explicit connections and distances
- Ready for pathfinding algorithm
- Easy to validate and debug

### **Format 3: Image with Metadata**

If using image-based floor plans:

- **Image file:** PNG/JPG with floor plan drawing
- **Metadata file:** JSON with node coordinates, room boundaries, labels
- **Coordinate system:** Pixel coordinates relative to image origin (top-left)

```json
{
  "floorPlanImage": "block-a-floor-1.png",
  "imageSize": { "width": 1920, "height": 1080 },
  "scale": "1 pixel = 0.1 meters",
  "nodes": [
    { "id": "NODE_001", "x": 450, "y": 440, "pixelCoords": true }
  ]
}
```

---

## 🧭 AR Navigation Implications

### **How These Assumptions Enable AR:**

1. **Precomputed Paths:**
   - Pathfinding runs on the graph structure (nodes/edges)
   - AR only needs to display the path visually
   - No real-time path computation needed

2. **Directional Guidance:**
   - Each edge has a `direction` property (north, south, east, west, etc.)
   - AR arrows point in the direction of the next edge
   - Device compass provides user orientation
   - Simple angle calculation: `arrowAngle = edgeDirection - userHeading`

3. **No Precise Positioning:**
   - AR doesn't need to know exact user location
   - User manually confirms arrival at waypoints
   - Or uses simple proximity detection (not precise GPS)

4. **One Floor at a Time:**
   - AR view shows current floor only
   - Floor transitions handled via explicit prompts
   - "Go to stairs" → "Change floor" → "Continue on floor 2"

---

## 🔧 Parser Implementation Guidelines

### **Step 1: Extract Basic Elements**
```javascript
// Pseudo-code
function parseFloorPlan(input) {
  const rooms = extractRooms(input);      // Rectangles/polygons with labels
  const corridors = extractCorridors(input); // Paths or lines
  const nodes = extractNodes(input);      // Circles or explicit markers
  const labels = extractLabels(input);    // Text elements
}
```

### **Step 2: Build Graph Structure**
```javascript
function buildGraph(rooms, corridors, nodes) {
  // Place nodes at:
  // - Room centers
  // - Corridor midpoints
  // - Intersections
  // - Stairs/elevators
  
  // Create edges between:
  // - Adjacent nodes (within threshold)
  // - Room nodes to corridor nodes (if room connects to corridor)
  // - Explicit connections (if markers indicate)
}
```

### **Step 3: Validate and Export**
```javascript
function validateGraph(graph) {
  // Check: All rooms have at least one connection
  // Check: No isolated nodes (unless intentional)
  // Check: All edges have valid distances
  // Check: Floor transitions (stairs) connect to other floors
}

function exportBuildingPack(graph) {
  // Export as JSON building pack
  // Ready for pathfinding and AR visualization
}
```

---

## 📝 Summary

**We assume:**
- ✅ Clean, top-down floor plans
- ✅ Simple room boundaries (rectangles/polygons)
- ✅ Clearly separated corridors
- ✅ One floor at a time

**We use:**
- ✅ Heuristics for node/edge generation
- ✅ Predefined markers for easier parsing
- ✅ Simplified parsing rules (SVG/JSON/image+metadata)

**We do NOT:**
- ❌ Full computer vision
- ❌ Automatic perfection
- ❌ Complex geometric inference

**Result:**
- Fast, hackathon-friendly parsing
- Reliable graph generation
- AR-ready navigation paths
- Easy to debug and validate

---

**For AR Implementation:** These assumptions ensure that the AR system receives a clean, precomputed navigation graph. The AR layer only needs to:
1. Receive the path from pathfinding
2. Display arrows based on edge directions
3. Use device compass for user orientation
4. Update arrows as user progresses through waypoints

No complex positioning or real-time computation needed! 🎯

