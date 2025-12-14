# 🗺️ Navigation Graph Builder Design

**Purpose:** Convert scan results (rooms + paths) into a navigation graph for pathfinding  
**Output:** Graph with nodes, edges, and room-to-node mappings  
**Requirement:** Single source of truth for navigation, A* ready

---

## 🎯 Graph Builder Overview

The graph builder is the **second phase** after scanning. It converts geometric data into a navigable graph structure.

### **Scan Result → Graph Builder → Navigation Graph**

```
Scan Result (rooms + paths)
    ↓
[GRAPH BUILDER]
    ↓
Navigation Graph:
  - Nodes (intersections, corridor points, room connections)
  - Edges (walkable connections)
  - Room-to-node mappings
    ↓
[Next: Pathfinding (A*)]
```

---

## 📊 Graph Structure

### **Graph Schema**

```typescript
interface NavigationGraph {
  metadata: {
    source: string;           // Source scan result identifier
    timestamp: string;          // ISO timestamp
    version: string;           // Graph builder version
    nodeCount: number;         // Total nodes
    edgeCount: number;         // Total edges
    roomCount: number;         // Total rooms mapped
  };
  nodes: Node[];
  edges: Edge[];
  roomMappings: RoomMapping[];
  bounds: BoundingBox;         // Overall graph bounds
}

interface Node {
  id: string;                 // Unique node ID (deterministic)
  type: NodeType;             // Node type
  position: Point;            // x, y coordinates
  connections: string[];      // Array of connected node IDs
  metadata?: {                // Optional metadata
    roomId?: string;          // If node represents a room
    pathId?: string;          // If node is on a path
    isIntersection?: boolean; // If node is an intersection
  };
}

type NodeType = 
  | "room"              // Room center/entrance
  | "corridor"         // Point along a corridor
  | "intersection"     // Corridor intersection
  | "entrance"         // Room entrance point
  | "stair"            // Stairwell node
  | "elevator"          // Elevator node
  | "exit";             // Exit node

interface Edge {
  id: string;                 // Unique edge ID (deterministic)
  from: string;               // Source node ID
  to: string;                 // Target node ID
  distance: number;           // Euclidean distance
  direction?: string;         // Cardinal direction (north, south, east, west, etc.)
  bidirectional: boolean;     // Can traverse both ways
  metadata?: {
    pathId?: string;         // Original path ID
    type?: string;           // "corridor", "doorway", etc.
  };
}

interface RoomMapping {
  roomId: string;             // Room ID from scan
  nodeId: string;             // Corresponding node ID
  position: Point;            // Node position (usually room center or entrance)
}
```

---

## 🔧 Node Placement Strategy

### **1. Room Nodes**

Place one node per room:
- **Position:** Room center (or entrance if known)
- **Type:** `"room"` (or `"stair"`, `"elevator"`, `"exit"` based on room type)
- **Purpose:** Destination points for navigation

```javascript
// Room center calculation
roomNode = {
  position: {
    x: room.bounds.x + room.bounds.width / 2,
    y: room.bounds.y + room.bounds.height / 2
  },
  type: determineNodeType(room.type),
  metadata: { roomId: room.id }
}
```

### **2. Corridor Nodes**

Place nodes along corridors:
- **At endpoints:** Start and end of each path segment
- **At intersections:** Where multiple paths meet
- **At midpoints:** For long corridors (optional, for smoother navigation)

```javascript
// For each path segment
path.segments.forEach(segment => {
  // Endpoint nodes
  nodes.push(createNode(segment.start, "corridor"));
  nodes.push(createNode(segment.end, "corridor"));
  
  // Intersection detection (if segment connects to others)
  if (isIntersection(segment)) {
    nodes.push(createNode(intersectionPoint, "intersection"));
  }
});
```

### **3. Intersection Nodes**

Detect where corridors meet:
- **Multiple paths converge** → Intersection node
- **Corridor branches** → Intersection node
- **Type:** `"intersection"`

### **4. Room-to-Corridor Connection Nodes**

Connect rooms to corridors:
- **Find nearest corridor node** to each room
- **Create connection node** at room boundary (entrance point)
- **Type:** `"entrance"`

---

## 🔗 Edge Generation Strategy

### **1. Corridor Edges**

Connect nodes along corridors:
- **Sequential nodes** in same path → Connected
- **Bidirectional:** Yes (can walk both ways)
- **Distance:** Euclidean distance between nodes

```javascript
// For each path, connect sequential nodes
for (let i = 0; i < pathNodes.length - 1; i++) {
  createEdge(pathNodes[i], pathNodes[i + 1], {
    bidirectional: true,
    pathId: path.id
  });
}
```

### **2. Room-to-Corridor Edges**

Connect rooms to nearby corridors:
- **Find nearest corridor node** to room
- **Create edge** from room node to corridor node
- **Bidirectional:** Yes
- **Distance:** Distance from room center to corridor

```javascript
// For each room
const nearestCorridorNode = findNearestNode(roomNode, corridorNodes);
if (nearestCorridorNode && distance < threshold) {
  createEdge(roomNode, nearestCorridorNode, {
    bidirectional: true,
    type: "doorway"
  });
}
```

### **3. Intersection Edges**

Connect nodes at intersections:
- **All nodes at same intersection** → Fully connected
- **Bidirectional:** Yes
- **Distance:** Direct distance

### **4. Edge Direction Calculation**

Calculate cardinal direction for AR navigation:
- **North:** 0° (or -90° depending on coordinate system)
- **East:** 90°
- **South:** 180°
- **West:** 270°

```javascript
function calculateDirection(from, to) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const angle = Math.atan2(dy, dx) * 180 / Math.PI;
  
  // Convert to cardinal direction
  if (angle >= -45 && angle < 45) return "east";
  if (angle >= 45 && angle < 135) return "south";
  if (angle >= 135 || angle < -135) return "west";
  return "north";
}
```

---

## 🎯 Deterministic Guarantees

### **Same Scan Result → Same Graph**

1. **Node IDs:** Based on position (normalized)
2. **Edge IDs:** Based on from/to node IDs
3. **Node Order:** Sorted by position
4. **Edge Order:** Sorted by from node, then to node

### **Node ID Generation**

```javascript
function generateNodeID(position, type, index) {
  const normalized = normalizePoint(position);
  return `NODE_${type}_${Math.round(normalized.x)}_${Math.round(normalized.y)}`;
}
```

### **Edge ID Generation**

```javascript
function generateEdgeID(fromNodeId, toNodeId) {
  // Sort IDs for deterministic edge direction
  const [id1, id2] = [fromNodeId, toNodeId].sort();
  return `EDGE_${id1}_${id2}`;
}
```

---

## 🔍 Room-to-Node Mapping

### **Mapping Strategy**

1. **One room → One primary node:**
   - Room center node (or entrance node)
   - Used as destination for pathfinding

2. **Additional connection nodes:**
   - Room entrance nodes (if room connects to multiple corridors)
   - Stored in node metadata

### **Mapping Structure**

```javascript
roomMappings = [
  {
    roomId: "ROOM_101",
    nodeId: "NODE_room_125_220",  // Room center node
    position: { x: 125, y: 220 }
  }
]
```

---

## 🚀 A* Pathfinding Compatibility

### **Graph Requirements for A***

1. **Nodes:** Must have unique IDs and positions
2. **Edges:** Must have from/to nodes and distances
3. **Connections:** Must be bidirectional (or explicit direction)
4. **Heuristic:** Euclidean distance between nodes

### **A* Algorithm Interface**

```javascript
function aStar(graph, startNodeId, endNodeId) {
  // Uses:
  // - graph.nodes (for positions)
  // - graph.edges (for connections and distances)
  // - Euclidean distance as heuristic
}
```

### **Graph Structure for A***

```javascript
// A* needs:
const nodeMap = new Map();  // nodeId → Node
const adjacencyList = new Map();  // nodeId → [Edge]

graph.nodes.forEach(node => {
  nodeMap.set(node.id, node);
  adjacencyList.set(node.id, []);
});

graph.edges.forEach(edge => {
  adjacencyList.get(edge.from).push(edge);
  if (edge.bidirectional) {
    adjacencyList.get(edge.to).push({
      ...edge,
      from: edge.to,
      to: edge.from
    });
  }
});
```

---

## 📋 Processing Flow

```
1. Load Scan Result
   ↓
2. Place Room Nodes
   - One node per room (center or entrance)
   ↓
3. Place Corridor Nodes
   - Endpoints of path segments
   - Intersections
   - Optional midpoints
   ↓
4. Detect Intersections
   - Find nodes at same/similar positions
   - Mark as intersections
   ↓
5. Create Corridor Edges
   - Connect sequential nodes in paths
   ↓
6. Create Room-to-Corridor Edges
   - Connect rooms to nearest corridors
   ↓
7. Create Intersection Edges
   - Connect nodes at intersections
   ↓
8. Generate Room Mappings
   - Map each room to its node
   ↓
9. Normalize and Sort
   - Normalize coordinates
   - Sort nodes and edges
   ↓
10. Return Navigation Graph
```

---

## ⚙️ Configuration

### **Parameters**

```javascript
const CONFIG = {
  NODE_MERGE_THRESHOLD: 5,      // Merge nodes within 5 pixels
  ROOM_CORRIDOR_DISTANCE: 50,   // Max distance for room-corridor connection
  MIN_EDGE_DISTANCE: 1,          // Minimum edge distance
  CORRIDOR_MIDPOINT_INTERVAL: 100  // Place midpoints every 100px (optional)
};
```

### **Options**

```javascript
buildGraph(scanResult, {
  mergeNearbyNodes: true,        // Merge nodes within threshold
  addCorridorMidpoints: false,   // Add midpoints for long corridors
  connectRoomsToCorridors: true, // Auto-connect rooms to corridors
  calculateDirections: true      // Calculate edge directions
});
```

---

## ✅ Validation

### **Graph Validation Rules**

1. **All nodes have unique IDs**
2. **All edges reference valid nodes**
3. **All rooms have mappings**
4. **No isolated nodes** (unless intentional, e.g., unreachable rooms)
5. **Graph is connected** (or has connected components)
6. **All edges have valid distances** (> 0)

### **Validation Output**

```javascript
{
  valid: boolean,
  errors: string[],
  warnings: string[],
  stats: {
    isolatedNodes: number,
    disconnectedComponents: number,
    roomsWithoutMappings: number
  }
}
```

---

## 📝 Example

### **Input (Scan Result)**

```json
{
  "rooms": [
    {
      "id": "ROOM_101",
      "bounds": { "x": 100, "y": 200, "width": 50, "height": 40 }
    }
  ],
  "paths": [
    {
      "id": "PATH_001",
      "segments": [
        { "start": { "x": 150, "y": 220 }, "end": { "x": 300, "y": 220 } }
      ]
    }
  ]
}
```

### **Output (Navigation Graph)**

```json
{
  "nodes": [
    {
      "id": "NODE_room_125_220",
      "type": "room",
      "position": { "x": 125, "y": 220 },
      "connections": ["NODE_corridor_150_220"],
      "metadata": { "roomId": "ROOM_101" }
    },
    {
      "id": "NODE_corridor_150_220",
      "type": "corridor",
      "position": { "x": 150, "y": 220 },
      "connections": ["NODE_room_125_220", "NODE_corridor_300_220"]
    },
    {
      "id": "NODE_corridor_300_220",
      "type": "corridor",
      "position": { "x": 300, "y": 220 },
      "connections": ["NODE_corridor_150_220"]
    }
  ],
  "edges": [
    {
      "id": "EDGE_NODE_corridor_150_220_NODE_room_125_220",
      "from": "NODE_room_125_220",
      "to": "NODE_corridor_150_220",
      "distance": 25,
      "direction": "east",
      "bidirectional": true
    },
    {
      "id": "EDGE_NODE_corridor_150_220_NODE_corridor_300_220",
      "from": "NODE_corridor_150_220",
      "to": "NODE_corridor_300_220",
      "distance": 150,
      "direction": "east",
      "bidirectional": true
    }
  ],
  "roomMappings": [
    {
      "roomId": "ROOM_101",
      "nodeId": "NODE_room_125_220",
      "position": { "x": 125, "y": 220 }
    }
  ]
}
```

---

## 🎯 Next Steps

After graph building:
1. **Pathfinding** - A* algorithm on the graph
2. **AR Visualization** - Use graph for directional guidance
3. **Route Optimization** - Precompute common routes
4. **Graph Updates** - Handle dynamic changes (if needed)

---

**The graph is the single source of truth for navigation!** 🗺️

