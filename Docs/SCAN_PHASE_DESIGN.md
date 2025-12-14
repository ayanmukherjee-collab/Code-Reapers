# 🔍 Floor Plan Scan Phase Design

**Purpose:** Convert raw floor plan input into structured, deterministic data  
**Output:** Rooms (bounding boxes) + Walkable paths (line segments/polylines)  
**Requirements:** Structured, Deterministic, Reproducible

---

## 🎯 Scan Phase Overview

The scan phase is the **first step** in processing floor plans. It extracts basic geometric elements without building the navigation graph.

### **Input → Scan → Output**

```
Raw Floor Plan (SVG/JSON/Image)
    ↓
[SCAN PHASE]
    ↓
Structured Data:
  - Rooms: [{bounds, label, id}]
  - Paths: [{segments, type, id}]
    ↓
[Next: Graph Building Phase]
```

---

## 📥 Input Formats

### **Format 1: SVG**
```xml
<svg width="500" height="400">
  <rect x="100" y="200" width="50" height="40" class="room" id="ROOM_101"/>
  <text x="125" y="225">101</text>
  <path d="M 150 220 L 300 220" class="corridor" stroke-width="10"/>
</svg>
```

### **Format 2: Structured JSON (Pre-processed)**
```json
{
  "rooms": [
    {"id": "ROOM_101", "x": 100, "y": 200, "width": 50, "height": 40, "label": "101"}
  ],
  "corridors": [
    {"id": "CORR_001", "points": [[150, 220], [300, 220]]}
  ]
}
```

### **Format 3: Image + Metadata**
- Image file (PNG/JPG)
- Metadata JSON with coordinates

---

## 📤 Output Schema

### **Scan Result Structure**

```typescript
interface ScanResult {
  metadata: {
    source: string;           // Input file/format identifier
    timestamp: string;        // ISO timestamp
    version: string;          // Scanner version
    bounds: {                 // Overall floor plan bounds
      x: number;
      y: number;
      width: number;
      height: number;
    };
  };
  rooms: Room[];
  paths: Path[];
  warnings: string[];         // Non-fatal issues
  errors: string[];           // Fatal issues (if any)
}

interface Room {
  id: string;                 // Unique identifier
  bounds: BoundingBox;         // Rectangle/bounding box
  label?: string;             // Room number/name (if found)
  type?: string;              // "room", "office", "stair", "elevator", etc.
  confidence: number;         // 0-1, how confident we are this is a room
}

interface BoundingBox {
  x: number;                  // Left edge
  y: number;                  // Top edge
  width: number;              // Width
  height: number;             // Height
}

interface Path {
  id: string;                 // Unique identifier
  type: "corridor" | "hallway" | "walkway" | "connection";
  segments: LineSegment[];    // Line segments or polyline points
  width?: number;             // Approximate width (if known)
  confidence: number;         // 0-1, confidence this is walkable
}

interface LineSegment {
  start: Point;
  end: Point;
}

interface Point {
  x: number;
  y: number;
}
```

---

## 🔧 Deterministic Processing Rules

### **1. Deterministic ID Generation**

IDs must be **reproducible** for the same input:

```javascript
// Good: Based on content hash or position
id = `ROOM_${hash(bounds)}`  // Hash of bounding box
id = `ROOM_${x}_${y}_${width}_${height}`  // Position-based

// Bad: Random or sequential
id = `ROOM_${Math.random()}`  // ❌ Not deterministic
id = `ROOM_${counter++}`      // ❌ Depends on order
```

**Strategy:**
- Use **content-based hashing** (e.g., hash of coordinates)
- Or use **position-based IDs** (e.g., `ROOM_100_200_50_40`)
- Sort elements before processing to ensure consistent order

### **2. Normalization**

Normalize coordinates to ensure reproducibility:

```javascript
// Round coordinates to fixed precision
x = Math.round(x * 100) / 100;  // 2 decimal places

// Normalize bounding boxes (ensure width/height > 0)
if (width < 0) { x += width; width = -width; }
if (height < 0) { y += height; height = -height; }
```

### **3. Sorting**

Sort extracted elements consistently:

```javascript
// Sort rooms by: y (top to bottom), then x (left to right)
rooms.sort((a, b) => {
  if (Math.abs(a.bounds.y - b.bounds.y) < 1) {
    return a.bounds.x - b.bounds.x;
  }
  return a.bounds.y - b.bounds.y;
});

// Sort paths by: start point (y, then x)
paths.sort((a, b) => {
  const aStart = a.segments[0].start;
  const bStart = b.segments[0].start;
  if (Math.abs(aStart.y - bStart.y) < 1) {
    return aStart.x - bStart.x;
  }
  return aStart.y - bStart.y;
});
```

### **4. Coordinate System**

- **Origin:** Top-left (0, 0)
- **Units:** Pixels (or meters if scale is known)
- **Precision:** 2 decimal places (normalized)

---

## 🔍 Extraction Rules

### **Room Extraction**

#### **From SVG:**
1. Find all `<rect>` elements with `class="room"` or similar
2. Extract: `x`, `y`, `width`, `height`
3. Find associated `<text>` element (within proximity)
4. Generate ID: `ROOM_${x}_${y}_${width}_${height}` (normalized)

#### **From JSON:**
1. Read `rooms` array
2. Validate bounds (x, y, width, height)
3. Use provided ID or generate from bounds

#### **Heuristics (if needed):**
- Large rectangles (> threshold area) → likely rooms
- Rectangles with text labels nearby → likely rooms
- Rectangles with specific classes/attributes → likely rooms

### **Path/Corridor Extraction**

#### **From SVG:**
1. Find all `<path>`, `<line>`, `<polyline>` with `class="corridor"` or similar
2. Extract path data:
   - `<line>` → `x1, y1, x2, y2`
   - `<path d="...">` → Parse path commands (M, L, etc.)
   - `<polyline>` → Extract points array
3. Convert to line segments:
   - Straight paths → single segment
   - Curved paths → approximate with line segments
4. Generate ID: `PATH_${hash(segments)}`

#### **From JSON:**
1. Read `corridors` or `paths` array
2. Validate points/segments
3. Use provided ID or generate from segments

#### **Heuristics (if needed):**
- Long, narrow rectangles → likely corridors
- Lines with thick stroke-width → likely walkable paths
- Paths connecting rooms → likely corridors

---

## 📊 Output Example

### **Input (SVG):**
```xml
<svg width="500" height="400">
  <rect x="100" y="200" width="50" height="40" class="room"/>
  <text x="125" y="225">101</text>
  <path d="M 150 220 L 300 220" class="corridor" stroke-width="10"/>
</svg>
```

### **Output (JSON):**
```json
{
  "metadata": {
    "source": "floor-plan.svg",
    "timestamp": "2024-01-15T10:30:00Z",
    "version": "1.0.0",
    "bounds": {
      "x": 0,
      "y": 0,
      "width": 500,
      "height": 400
    }
  },
  "rooms": [
    {
      "id": "ROOM_100_200_50_40",
      "bounds": {
        "x": 100,
        "y": 200,
        "width": 50,
        "height": 40
      },
      "label": "101",
      "type": "room",
      "confidence": 0.9
    }
  ],
  "paths": [
    {
      "id": "PATH_a1b2c3d4",
      "type": "corridor",
      "segments": [
        {
          "start": { "x": 150, "y": 220 },
          "end": { "x": 300, "y": 220 }
        }
      ],
      "width": 10,
      "confidence": 0.85
    }
  ],
  "warnings": [],
  "errors": []
}
```

---

## ✅ Deterministic Guarantees

### **Same Input → Same Output**

The scan phase guarantees:

1. **Same file content** → Same room IDs
2. **Same file content** → Same path IDs
3. **Same file content** → Same element order
4. **Same file content** → Same coordinates (normalized)

### **How We Ensure This:**

1. **Hash-based IDs:** Content determines ID
2. **Normalized coordinates:** Fixed precision, consistent rounding
3. **Sorted output:** Consistent element ordering
4. **No randomness:** No random numbers, no timestamps in IDs
5. **Deterministic parsing:** Same parsing rules, same results

---

## ⚠️ Partial/Approximate Results

### **Acceptable Approximations:**

1. **Room bounds:** If exact bounds unclear, use bounding box of detected shape
2. **Path segments:** Curved paths approximated as line segments
3. **Missing labels:** Room without label → `label: undefined`, still extracted
4. **Overlapping elements:** Extract both, mark with lower confidence

### **Confidence Scores:**

- `confidence: 1.0` → Perfect match (explicit marker/class)
- `confidence: 0.8-0.9` → High confidence (heuristic match)
- `confidence: 0.5-0.7` → Medium confidence (approximate)
- `confidence: < 0.5` → Low confidence (uncertain)

### **Warnings vs Errors:**

- **Warnings:** Non-fatal issues (missing labels, approximate bounds)
- **Errors:** Fatal issues (invalid input format, corrupted data)

---

## 🔄 Processing Flow

```
1. Load Input
   ↓
2. Detect Format (SVG/JSON/Image)
   ↓
3. Extract Rooms
   - Find rectangles/polygons
   - Extract bounds
   - Find labels
   - Generate IDs
   ↓
4. Extract Paths
   - Find lines/paths/polylines
   - Extract segments
   - Determine type
   - Generate IDs
   ↓
5. Normalize
   - Round coordinates
   - Sort elements
   - Validate bounds
   ↓
6. Generate Output
   - Create ScanResult
   - Calculate confidence scores
   - Collect warnings/errors
   ↓
7. Return Structured Data
```

---

## 📝 Implementation Notes

### **Versioning:**
- Scanner version in output metadata
- Allows future improvements while maintaining reproducibility
- Same version + same input = same output

### **Extensibility:**
- Easy to add new input formats
- Easy to add new extraction heuristics
- Confidence scores allow filtering

### **Testing:**
- Unit tests with known inputs → verify deterministic output
- Regression tests: same input should produce identical output
- Edge cases: empty input, malformed input, overlapping elements

---

## 🎯 Next Steps

After scan phase:
1. **Graph Building:** Convert rooms + paths → navigation graph
2. **Node Placement:** Place navigation nodes at key points
3. **Edge Generation:** Connect nodes based on rooms/paths
4. **Pathfinding:** A* algorithm on the graph

The scan phase provides the **foundation** for all subsequent processing! 🚀

