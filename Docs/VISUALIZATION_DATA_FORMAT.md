# 🎨 Navigation Visualization Data Format

**Purpose:** Define a visualization-friendly output format for navigation data  
**Scope:** Data only - rendering is handled separately  
**Coordinate Space:** All elements share the same coordinate system

---

## 🎯 Overview

The visualization data format provides a **rendering-agnostic** representation of:
- **Rooms** → Rendered as rectangles
- **Walkable paths** → Rendered as red lines
- **Node positions** → In shared coordinate space

This format is **pure data** - no rendering logic, just structured information for visualization.

---

## 📊 Data Structure

### **Top-Level Structure**

```typescript
interface VisualizationData {
  metadata: {
    source: string;        // Source identifier
    timestamp: string;      // ISO timestamp
    version: string;        // Format version
  };
  coordinateSpace: {
    bounds: BoundingBox;    // Overall bounds
    units: "pixels" | "meters" | "feet";
    scale?: number;         // Optional scale factor
  };
  rooms: RoomVisualization[];      // Rooms as rectangles
  paths: PathVisualization[];     // Paths as red lines
  nodes: NodeVisualization[];     // Node positions
  labels?: LabelVisualization[];  // Optional text labels
}
```

---

## 🏠 Room Visualization

### **Structure**

```typescript
interface RoomVisualization {
  id: string;              // Room identifier
  bounds: BoundingBox;     // Rectangle: x, y, width, height
  type?: string;           // "room", "office", "stair", "elevator", "exit"
  label?: string;         // Room number/name
  fillColor?: string;      // Fill color (optional)
  strokeColor?: string;    // Border color (optional)
  strokeWidth?: number;   // Border width (optional)
  opacity?: number;       // 0-1 (optional)
}
```

### **Rendering**

- **Shape:** Rectangle
- **Bounds:** `{ x, y, width, height }` in shared coordinate space
- **Default:** Light gray fill, black border

### **Example**

```json
{
  "id": "ROOM_101",
  "bounds": {
    "x": 100,
    "y": 200,
    "width": 50,
    "height": 40
  },
  "type": "room",
  "label": "101",
  "fillColor": "#E0E0E0",
  "strokeColor": "#000000",
  "strokeWidth": 1,
  "opacity": 1
}
```

---

## 🛤️ Path Visualization

### **Structure**

```typescript
interface PathVisualization {
  id: string;              // Path identifier
  type?: string;           // "corridor", "hallway", "walkway"
  segments: LineSegment[]; // Array of line segments
  color?: string;          // Line color (default: "#FF0000" - red)
  strokeWidth?: number;    // Line width (default: 2)
  opacity?: number;        // 0-1 (default: 1)
}
```

### **Rendering**

- **Shape:** Lines (polylines)
- **Color:** **Red** by default (`#FF0000`)
- **Segments:** Each segment is a line from `start` to `end` point
- **Default:** Red lines, 2px width

### **Example**

```json
{
  "id": "PATH_001",
  "type": "corridor",
  "segments": [
    {
      "start": { "x": 150, "y": 220 },
      "end": { "x": 300, "y": 220 }
    }
  ],
  "color": "#FF0000",
  "strokeWidth": 2,
  "opacity": 1
}
```

---

## 📍 Node Visualization

### **Structure**

```typescript
interface NodeVisualization {
  id: string;              // Node identifier
  position: Point;         // { x, y } in shared coordinate space
  type: string;           // "room", "corridor", "intersection", etc.
  radius?: number;        // Visual radius (default: 3)
  color?: string;         // Node color (optional)
  visible?: boolean;      // Whether to render (default: true)
  connections?: ConnectionVisualization[];  // Optional visual connections
}
```

### **Rendering**

- **Shape:** Circle/point
- **Position:** `{ x, y }` in shared coordinate space
- **Default:** Small circle, color by type
- **Optional:** Can show connections to other nodes

### **Example**

```json
{
  "id": "NODE_room_125_220_0",
  "position": { "x": 125, "y": 220 },
  "type": "room",
  "radius": 3,
  "color": "#0066CC",
  "visible": true
}
```

### **Node Type Colors (Suggested)**

- **Room nodes:** Blue (`#0066CC`)
- **Corridor nodes:** Green (`#00CC66`)
- **Intersection nodes:** Orange (`#FF9900`)
- **Stair nodes:** Purple (`#9900CC`)
- **Elevator nodes:** Red (`#CC0000`)
- **Exit nodes:** Yellow (`#FFCC00`)

---

## 🏷️ Label Visualization (Optional)

### **Structure**

```typescript
interface LabelVisualization {
  text: string;            // Label text
  position: Point;        // { x, y } position
  anchor?: "room" | "node";  // What it's attached to
  anchorId?: string;      // ID of room/node
  fontSize?: number;      // Font size
  color?: string;         // Text color
}
```

### **Rendering**

- **Text:** Room numbers, node labels, etc.
- **Position:** Absolute position in coordinate space
- **Anchor:** Can be attached to room or node

### **Example**

```json
{
  "text": "101",
  "position": { "x": 125, "y": 225 },
  "anchor": "room",
  "anchorId": "ROOM_101",
  "fontSize": 12,
  "color": "#000000"
}
```

---

## 🌐 Coordinate Space

### **Shared Coordinate System**

All elements (rooms, paths, nodes) use the **same coordinate space**:

- **Origin:** Top-left corner `(0, 0)`
- **Units:** Pixels (or meters/feet if scale is specified)
- **Bounds:** Overall bounds define the coordinate space extent

### **Coordinate Space Definition**

```typescript
interface CoordinateSpace {
  bounds: {
    x: number;      // Left edge
    y: number;      // Top edge
    width: number;  // Total width
    height: number; // Total height
  };
  units: "pixels" | "meters" | "feet";
  scale?: number;  // Optional: e.g., 1 pixel = 0.1 meters
}
```

### **Example**

```json
{
  "coordinateSpace": {
    "bounds": {
      "x": 0,
      "y": 0,
      "width": 500,
      "height": 400
    },
    "units": "pixels",
    "scale": 0.1
  }
}
```

---

## 📋 Complete Example

```json
{
  "metadata": {
    "source": "floor-plan-scan",
    "timestamp": "2024-01-15T10:30:00Z",
    "version": "1.0.0"
  },
  "coordinateSpace": {
    "bounds": {
      "x": 0,
      "y": 0,
      "width": 500,
      "height": 400
    },
    "units": "pixels"
  },
  "rooms": [
    {
      "id": "ROOM_101",
      "bounds": {
        "x": 100,
        "y": 200,
        "width": 50,
        "height": 40
      },
      "type": "room",
      "label": "101",
      "fillColor": "#E0E0E0",
      "strokeColor": "#000000",
      "strokeWidth": 1
    }
  ],
  "paths": [
    {
      "id": "PATH_001",
      "type": "corridor",
      "segments": [
        {
          "start": { "x": 150, "y": 220 },
          "end": { "x": 300, "y": 220 }
        }
      ],
      "color": "#FF0000",
      "strokeWidth": 2
    }
  ],
  "nodes": [
    {
      "id": "NODE_room_125_220_0",
      "position": { "x": 125, "y": 220 },
      "type": "room",
      "radius": 3,
      "color": "#0066CC"
    },
    {
      "id": "NODE_corridor_150_220_PATH_001_start_0",
      "position": { "x": 150, "y": 220 },
      "type": "corridor",
      "radius": 3,
      "color": "#00CC66"
    }
  ],
  "labels": [
    {
      "text": "101",
      "position": { "x": 125, "y": 225 },
      "anchor": "room",
      "anchorId": "ROOM_101",
      "fontSize": 12,
      "color": "#000000"
    }
  ]
}
```

---

## 🎨 Rendering Guidelines

### **Rendering Order (Suggested)**

1. **Rooms** (rectangles) - Bottom layer
2. **Paths** (red lines) - Middle layer
3. **Nodes** (circles/points) - Top layer
4. **Labels** (text) - Topmost layer

### **Default Styling**

If colors/styles are not specified:

- **Rooms:** Light gray fill (`#E0E0E0`), black border (`#000000`), 1px width
- **Paths:** Red lines (`#FF0000`), 2px width
- **Nodes:** Color by type (see suggestions above), 3px radius
- **Labels:** Black text (`#000000`), 12px font

### **Coordinate Transformation**

The renderer may need to:
- **Scale:** Apply zoom/scale factor
- **Translate:** Pan/offset the view
- **Transform:** Rotate or flip (if needed)

All transformations should preserve the **shared coordinate space**.

---

## 🔄 Data Sources

### **From Scan Result**

- **Rooms:** Direct from `scanResult.rooms`
- **Paths:** Direct from `scanResult.paths`
- **Coordinate Space:** From `scanResult.metadata.bounds`

### **From Navigation Graph**

- **Nodes:** From `graph.nodes` (positions)
- **Room Mappings:** Can link nodes to rooms
- **Coordinate Space:** From `graph.bounds`

### **Combined Format**

The visualization data can combine:
- Room data (from scan)
- Path data (from scan)
- Node data (from graph)
- All in shared coordinate space

---

## ✅ Validation

### **Required Fields**

- `metadata.source`
- `metadata.timestamp`
- `metadata.version`
- `coordinateSpace.bounds`
- `coordinateSpace.units`
- `rooms` (array)
- `paths` (array)
- `nodes` (array)

### **Coordinate Validation**

- All room bounds within coordinate space
- All path segments within coordinate space
- All node positions within coordinate space
- Consistent units across all elements

---

## 📝 Summary

**This format provides:**
- ✅ Rooms as rectangles (with optional styling)
- ✅ Walkable paths as red lines (default)
- ✅ Node positions in shared coordinate space
- ✅ Pure data (no rendering logic)
- ✅ Flexible styling (optional colors, sizes, opacity)
- ✅ Extensible (can add labels, connections, etc.)

**Rendering is handled separately** by the visualization layer! 🎨

