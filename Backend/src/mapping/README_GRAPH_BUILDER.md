# 🗺️ Navigation Graph Builder

The **graph builder** converts scan results (rooms + paths) into a navigation graph for pathfinding algorithms like A*.

**The graph is the single source of truth for navigation.**

## 📋 What It Does

Converts:
- **Scan Results** (rooms + paths) → **Navigation Graph**

Output contains:
- ✅ **Nodes** - Intersections, corridor points, room connections
- ✅ **Edges** - Walkable connections between nodes
- ✅ **Room-to-node mappings** - Which node represents each room
- ✅ **A* ready** - Usable by pathfinding algorithms

## 🚀 Quick Start

```javascript
const { scanFloorPlan } = require('./scanner');
const { buildNavigationGraph } = require('./graphBuilder');

// Step 1: Scan floor plan
const scanResult = scanFloorPlan(svgInput, { source: 'floor-plan.svg' });

// Step 2: Build navigation graph
const graph = buildNavigationGraph(scanResult, {
  mergeNearbyNodes: true,
  connectRoomsToCorridors: true,
  calculateDirections: true
});

// Graph is ready for A* pathfinding!
console.log(`Nodes: ${graph.nodes.length}`);
console.log(`Edges: ${graph.edges.length}`);
console.log(`Room mappings: ${graph.roomMappings.length}`);
```

## 📥 Input: Scan Result

The graph builder expects output from `scanFloorPlan()`:

```javascript
{
  rooms: [
    {
      id: "ROOM_101",
      bounds: { x: 100, y: 200, width: 50, height: 40 },
      type: "room",
      label: "101"
    }
  ],
  paths: [
    {
      id: "PATH_001",
      type: "corridor",
      segments: [
        { start: { x: 150, y: 220 }, end: { x: 300, y: 220 } }
      ]
    }
  ],
  metadata: { ... }
}
```

## 📤 Output: Navigation Graph

```typescript
{
  metadata: {
    source: string;
    timestamp: string;
    version: string;
    nodeCount: number;
    edgeCount: number;
    roomCount: number;
  };
  nodes: [
    {
      id: "NODE_room_125_220_0";
      type: "room" | "corridor" | "intersection" | "stair" | "elevator" | "exit";
      position: { x: number; y: number; };
      connections: string[];  // Array of connected node IDs
      metadata?: {
        roomId?: string;
        pathId?: string;
        isIntersection?: boolean;
      };
    }
  ];
  edges: [
    {
      id: "EDGE_NODE1_NODE2";
      from: string;  // Source node ID
      to: string;    // Target node ID
      distance: number;  // Euclidean distance
      direction?: "north" | "south" | "east" | "west" | ...;
      bidirectional: boolean;
      metadata?: {
        pathId?: string;
        type?: "corridor" | "doorway" | "intersection";
      };
    }
  ];
  roomMappings: [
    {
      roomId: string;  // Room ID from scan
      nodeId: string;  // Corresponding node ID
      position: { x: number; y: number; };
    }
  ];
  bounds: { x: number; y: number; width: number; height: number; };
  warnings: string[];
  errors: string[];
}
```

## 🎯 Node Types

- **`room`** - Room center/entrance node
- **`corridor`** - Point along a corridor
- **`intersection`** - Corridor intersection
- **`stair`** - Stairwell node
- **`elevator`** - Elevator node
- **`exit`** - Exit node

## 🔧 Options

```javascript
buildNavigationGraph(scanResult, {
  mergeNearbyNodes: true,        // Merge nodes within threshold (default: true)
  connectRoomsToCorridors: true, // Auto-connect rooms to corridors (default: true)
  calculateDirections: true       // Calculate edge directions for AR (default: true)
});
```

## 🗺️ How It Works

### **1. Node Placement**

- **Room Nodes:** One node per room at room center
- **Corridor Nodes:** Nodes at path segment endpoints
- **Intersection Nodes:** Nodes where multiple paths meet
- **Merging:** Nearby nodes (within threshold) are merged

### **2. Edge Generation**

- **Corridor Edges:** Connect sequential nodes along paths
- **Room-to-Corridor Edges:** Connect rooms to nearest corridors
- **Intersection Edges:** Connect nodes at intersections
- **Bidirectional:** All edges are bidirectional by default

### **3. Room Mappings**

- Each room gets a mapping to its corresponding node
- Used to find destination nodes for pathfinding

## 🚀 A* Pathfinding Compatibility

The graph is ready for A* algorithm:

```javascript
// Build adjacency list for A*
const nodeMap = new Map();
const adjacencyList = new Map();

graph.nodes.forEach(node => {
  nodeMap.set(node.id, node);
  adjacencyList.set(node.id, []);
});

graph.edges.forEach(edge => {
  // Forward edge
  adjacencyList.get(edge.from).push({
    to: edge.to,
    distance: edge.distance
  });
  
  // Backward edge (if bidirectional)
  if (edge.bidirectional) {
    adjacencyList.get(edge.to).push({
      to: edge.from,
      distance: edge.distance
    });
  }
});

// Now ready for A* algorithm!
function aStar(startNodeId, endNodeId) {
  // Uses nodeMap for positions (heuristic)
  // Uses adjacencyList for neighbors (graph traversal)
}
```

## 🎯 Deterministic Guarantees

### **Same Scan Result → Same Graph**

1. **Same node IDs** - Based on position and type
2. **Same edge IDs** - Based on from/to node IDs
3. **Same node order** - Sorted by position
4. **Same edge order** - Sorted by from node, then to node

### **Example**

```javascript
const graph1 = buildNavigationGraph(scanResult);
const graph2 = buildNavigationGraph(scanResult);

// graph1.nodes[0].id === graph2.nodes[0].id  // ✅ Always true
// graph1.edges[0].id === graph2.edges[0].id  // ✅ Always true
```

## 📝 Examples

See `graphBuilder.example.js` for complete examples:
- Full pipeline (scan → graph)
- A* ready structure
- Room-to-node mappings
- Determinism verification

## ⚙️ Configuration Constants

```javascript
const NODE_MERGE_THRESHOLD = 5;      // Merge nodes within 5 pixels
const ROOM_CORRIDOR_DISTANCE = 50;   // Max distance for room-corridor connection
const MIN_EDGE_DISTANCE = 1;          // Minimum edge distance
const COORDINATE_PRECISION = 2;      // Decimal places
```

## ✅ Validation

The graph builder validates:
- ✅ All nodes have unique IDs
- ✅ All edges reference valid nodes
- ✅ All rooms have mappings
- ⚠️ Isolated nodes (warnings)
- ⚠️ Disconnected components (warnings)

## 🔄 Processing Flow

```
1. Place Room Nodes
   ↓
2. Place Corridor Nodes
   ↓
3. Merge Nearby Nodes (optional)
   ↓
4. Mark Intersections
   ↓
5. Create Corridor Edges
   ↓
6. Create Room-to-Corridor Edges
   ↓
7. Create Intersection Edges
   ↓
8. Generate Room Mappings
   ↓
9. Normalize and Sort
   ↓
10. Build Node Connections
   ↓
11. Validate Graph
   ↓
12. Return Navigation Graph
```

## 🎯 Next Steps

After graph building:
1. **Pathfinding** - Run A* algorithm on the graph
2. **AR Visualization** - Use edge directions for arrow guidance
3. **Route Optimization** - Precompute common routes
4. **Graph Updates** - Handle dynamic changes (if needed)

## 📚 Related Documentation

- `Docs/GRAPH_BUILDER_DESIGN.md` - Detailed design document
- `Docs/SCAN_PHASE_DESIGN.md` - Scan phase documentation
- `Shared/schemas/navigationGraph.schema.json` - JSON schema
- `Backend/src/mapping/scanner.js` - Scanner implementation

## 🐛 Troubleshooting

### "No nodes created"

- Check scan result has rooms or paths
- Verify coordinates are valid numbers
- Check minimum thresholds

### "No edges created"

- Verify paths have valid segments
- Check node placement succeeded
- Verify room-corridor distance threshold

### "Isolated nodes"

- Normal for unreachable rooms
- Check if rooms should connect to corridors
- Verify room-corridor distance threshold

### "Non-deterministic output"

- Ensure same scan result input
- Check coordinate normalization
- Verify sorting is applied

---

**The graph is the single source of truth for navigation!** 🗺️

