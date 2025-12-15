# 🧭 Pathfinding

**Purpose:** Compute navigable paths between start and end points using the navigation graph  
**Algorithm:** A* (A-star) pathfinding  
**Input:** Start point, end point, navigation graph  
**Output:** Ordered list of nodes from start to end

---

## 🎯 Overview

Once start and end points are selected (mapped to graph nodes), we compute a **navigable path** using the navigation graph. This proves the graph is functional and can route users.

---

## 📊 Path Result Structure

```typescript
interface PathResult {
  success: boolean;              // Whether path was found
  path: string[];               // Ordered list of node IDs from start to end
  length?: number;              // Total path length (optional)
  stepCount?: number;           // Number of steps/nodes (optional)
  error?: string;               // Error message if path not found
  metadata?: {
    startNode: string;          // Start node ID
    endNode: string;            // End node ID
    algorithm: string;           // Algorithm used (e.g., "A*")
    computationTime?: number;   // Time taken (ms)
  };
}
```

### **Example Output**

```json
{
  "success": true,
  "path": [
    "NODE_exit_0_0",
    "NODE_corridor_50_0",
    "NODE_room_125_220_0"
  ],
  "length": 250.5,
  "stepCount": 3,
  "metadata": {
    "startNode": "NODE_exit_0_0",
    "endNode": "NODE_room_125_220_0",
    "algorithm": "A*"
  }
}
```

---

## 🔍 A* Algorithm

### **Algorithm Overview**

A* is a best-first search algorithm that finds the shortest path between two nodes:

1. **Start** with the start node
2. **Explore** neighbors using a priority queue (f-score = g-score + h-score)
3. **Track** the best path to each node
4. **Stop** when the end node is reached
5. **Reconstruct** the path from start to end

### **Heuristic Function**

For indoor navigation, we use **Euclidean distance** as the heuristic:

```javascript
function heuristic(node1, node2) {
  const dx = node2.position.x - node1.position.x;
  const dy = node2.position.y - node1.position.y;
  return Math.sqrt(dx * dx + dy * dy);
}
```

### **Algorithm Steps**

```javascript
function aStar(graph, startNodeId, endNodeId) {
  // 1. Initialize
  const openSet = new PriorityQueue();  // Nodes to explore
  const closedSet = new Set();          // Explored nodes
  const gScore = new Map();              // Cost from start
  const fScore = new Map();              // Estimated total cost
  const cameFrom = new Map();            // Path reconstruction
  
  // 2. Add start node
  openSet.add(startNodeId, 0);
  gScore.set(startNodeId, 0);
  fScore.set(startNodeId, heuristic(startNode, endNode));
  
  // 3. Main loop
  while (!openSet.isEmpty()) {
    const current = openSet.pop();  // Node with lowest f-score
    
    if (current === endNodeId) {
      // Path found! Reconstruct path
      return reconstructPath(cameFrom, current);
    }
    
    closedSet.add(current);
    
    // 4. Explore neighbors
    const neighbors = getNeighbors(graph, current);
    for (const neighbor of neighbors) {
      if (closedSet.has(neighbor.id)) continue;
      
      const tentativeGScore = gScore.get(current) + neighbor.distance;
      
      if (!gScore.has(neighbor.id) || tentativeGScore < gScore.get(neighbor.id)) {
        cameFrom.set(neighbor.id, current);
        gScore.set(neighbor.id, tentativeGScore);
        fScore.set(neighbor.id, tentativeGScore + heuristic(neighbor, endNode));
        
        if (!openSet.contains(neighbor.id)) {
          openSet.add(neighbor.id, fScore.get(neighbor.id));
        }
      }
    }
  }
  
  // 5. No path found
  return null;
}
```

---

## 🔧 Graph Structure Requirements

### **For A* to Work**

The graph must provide:

1. **Node positions** - For heuristic calculation
2. **Node connections** - For neighbor exploration
3. **Edge distances** - For cost calculation

### **Graph Interface**

```javascript
// Get node by ID
function getNode(graph, nodeId) {
  return graph.nodes.find(n => n.id === nodeId);
}

// Get neighbors of a node
function getNeighbors(graph, nodeId) {
  const node = getNode(graph, nodeId);
  if (!node) return [];
  
  // Get connected node IDs
  const connectedIds = node.connections || [];
  
  // Get edges from this node
  const edges = graph.edges.filter(e => 
    e.from === nodeId || (e.bidirectional && e.to === nodeId)
  );
  
  // Build neighbor list with distances
  return connectedIds.map(connectedId => {
    const edge = edges.find(e => 
      (e.from === nodeId && e.to === connectedId) ||
      (e.bidirectional && e.to === nodeId && e.from === connectedId)
    );
    
    const neighborNode = getNode(graph, connectedId);
    
    return {
      id: connectedId,
      position: neighborNode.position,
      distance: edge ? edge.distance : euclideanDistance(node.position, neighborNode.position)
    };
  });
}
```

---

## 📋 Path Computation Function

### **Main Function**

```javascript
function computePath(graph, startPoint, endPoint) {
  // Validate inputs
  if (!startPoint || !endPoint) {
    return {
      success: false,
      path: [],
      error: "Start or end point missing"
    };
  }
  
  const startNodeId = startPoint.nodeId;
  const endNodeId = endPoint.nodeId;
  
  // Verify nodes exist in graph
  const startNode = getNode(graph, startNodeId);
  const endNode = getNode(graph, endNodeId);
  
  if (!startNode || !endNode) {
    return {
      success: false,
      path: [],
      error: `Node not found: ${!startNode ? startNodeId : endNodeId}`
    };
  }
  
  // Run A* algorithm
  const path = aStar(graph, startNodeId, endNodeId);
  
  if (!path) {
    return {
      success: false,
      path: [],
      error: "No path found between start and end points"
    };
  }
  
  // Calculate path length
  const length = calculatePathLength(graph, path);
  const stepCount = path.length;
  
  return {
    success: true,
    path: path,
    length: length,
    stepCount: stepCount,
    metadata: {
      startNode: startNodeId,
      endNode: endNodeId,
      algorithm: "A*"
    }
  };
}
```

### **Path Length Calculation**

```javascript
function calculatePathLength(graph, path) {
  let totalLength = 0;
  
  for (let i = 0; i < path.length - 1; i++) {
    const fromNodeId = path[i];
    const toNodeId = path[i + 1];
    
    // Find edge between nodes
    const edge = graph.edges.find(e =>
      (e.from === fromNodeId && e.to === toNodeId) ||
      (e.bidirectional && e.to === fromNodeId && e.from === toNodeId)
    );
    
    if (edge) {
      totalLength += edge.distance;
    } else {
      // Fallback: calculate Euclidean distance
      const fromNode = getNode(graph, fromNodeId);
      const toNode = getNode(graph, toNodeId);
      if (fromNode && toNode) {
        totalLength += euclideanDistance(fromNode.position, toNode.position);
      }
    }
  }
  
  return totalLength;
}
```

---

## ✅ Validation

### **Path Validation**

1. **Path exists** - At least 2 nodes (start and end)
2. **Path is connected** - Each node connects to the next
3. **Path starts correctly** - First node is start node
4. **Path ends correctly** - Last node is end node
5. **All nodes exist** - All node IDs are valid

### **Validation Function**

```javascript
function validatePath(graph, path, startNodeId, endNodeId) {
  const errors = [];
  
  if (path.length < 2) {
    errors.push("Path must contain at least 2 nodes");
  }
  
  if (path[0] !== startNodeId) {
    errors.push(`Path must start with ${startNodeId}`);
  }
  
  if (path[path.length - 1] !== endNodeId) {
    errors.push(`Path must end with ${endNodeId}`);
  }
  
  // Check all nodes exist
  const nodeIds = new Set(graph.nodes.map(n => n.id));
  path.forEach((nodeId, index) => {
    if (!nodeIds.has(nodeId)) {
      errors.push(`Path contains invalid node at index ${index}: ${nodeId}`);
    }
  });
  
  // Check path is connected
  for (let i = 0; i < path.length - 1; i++) {
    const fromNodeId = path[i];
    const toNodeId = path[i + 1];
    
    const fromNode = getNode(graph, fromNodeId);
    if (!fromNode.connections.includes(toNodeId)) {
      errors.push(`Path not connected: ${fromNodeId} → ${toNodeId}`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}
```

---

## 🎯 Usage Example

```javascript
// 1. Get navigation points
const navigationPoints = selectNavigationPoints(graph, scanResult);

// 2. Select start and end points
const startPoint = navigationPoints.startPoints.entrances[0];
const endPoint = navigationPoints.endPoints.rooms.find(r => r.label === '101');

// 3. Compute path
const pathResult = computePath(graph, startPoint, endPoint);

if (pathResult.success) {
  console.log(`Path found: ${pathResult.path.length} nodes`);
  console.log(`Total length: ${pathResult.length}`);
  console.log(`Path: ${pathResult.path.join(' → ')}`);
} else {
  console.error(`Path not found: ${pathResult.error}`);
}
```

---

## 📊 Path Result Examples

### **Successful Path**

```json
{
  "success": true,
  "path": [
    "NODE_exit_0_0",
    "NODE_corridor_50_0",
    "NODE_corridor_150_0",
    "NODE_room_125_220_0"
  ],
  "length": 350.25,
  "stepCount": 4,
  "metadata": {
    "startNode": "NODE_exit_0_0",
    "endNode": "NODE_room_125_220_0",
    "algorithm": "A*"
  }
}
```

### **No Path Found**

```json
{
  "success": false,
  "path": [],
  "error": "No path found between start and end points",
  "metadata": {
    "startNode": "NODE_exit_0_0",
    "endNode": "NODE_room_125_220_0",
    "algorithm": "A*"
  }
}
```

---

## ✅ Summary

**Path Computation:**
- ✅ Takes start and end points (mapped to graph nodes)
- ✅ Uses A* algorithm to find shortest path
- ✅ Returns ordered list of nodes from start to end
- ✅ Includes total path length and step count
- ✅ Validates path correctness

**This proves the graph is functional!** 🧭

