/**
 * Pathfinder
 * 
 * Computes navigable paths between start and end points using A* algorithm.
 * 
 * This proves the navigation graph is functional.
 */

/**
 * Compute path from start to end point
 * @param {Object} graph - Navigation graph
 * @param {Object} startPoint - Start point (with nodeId)
 * @param {Object} endPoint - End point (with nodeId)
 * @returns {Object} PathResult
 */
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
  
  // If start and end are the same
  if (startNodeId === endNodeId) {
    return {
      success: true,
      path: [startNodeId],
      length: 0,
      stepCount: 1,
      metadata: {
        startNode: startNodeId,
        endNode: endNodeId,
        algorithm: "A*"
      }
    };
  }
  
  // Run A* algorithm
  const startTime = performance.now ? performance.now() : Date.now();
  const path = aStar(graph, startNodeId, endNodeId);
  const endTime = performance.now ? performance.now() : Date.now();
  
  if (!path || path.length === 0) {
    return {
      success: false,
      path: [],
      error: "No path found between start and end points",
      metadata: {
        startNode: startNodeId,
        endNode: endNodeId,
        algorithm: "A*"
      }
    };
  }
  
  // Calculate path length
  const length = calculatePathLength(graph, path);
  const stepCount = path.length;
  
  // Validate path
  const validation = validatePath(graph, path, startNodeId, endNodeId);
  if (!validation.valid) {
    return {
      success: false,
      path: [],
      error: `Path validation failed: ${validation.errors.join(', ')}`,
      metadata: {
        startNode: startNodeId,
        endNode: endNodeId,
        algorithm: "A*"
      }
    };
  }
  
  return {
    success: true,
    path: path,
    length: roundToPrecision(length),
    stepCount: stepCount,
    metadata: {
      startNode: startNodeId,
      endNode: endNodeId,
      algorithm: "A*",
      computationTime: roundToPrecision(endTime - startTime)
    }
  };
}

/**
 * A* pathfinding algorithm
 */
function aStar(graph, startNodeId, endNodeId) {
  const startNode = getNode(graph, startNodeId);
  const endNode = getNode(graph, endNodeId);
  
  if (!startNode || !endNode) {
    return null;
  }
  
  // Priority queue (min-heap by f-score)
  const openSet = new PriorityQueue();
  const closedSet = new Set();
  const gScore = new Map();  // Cost from start
  const fScore = new Map();  // Estimated total cost
  const cameFrom = new Map(); // Path reconstruction
  
  // Initialize start node
  openSet.add(startNodeId, 0);
  gScore.set(startNodeId, 0);
  fScore.set(startNodeId, heuristic(startNode, endNode));
  
  while (!openSet.isEmpty()) {
    const current = openSet.pop();
    
    // Check if we reached the end
    if (current === endNodeId) {
      return reconstructPath(cameFrom, current);
    }
    
    closedSet.add(current);
    
    // Explore neighbors
    const neighbors = getNeighbors(graph, current);
    
    for (const neighbor of neighbors) {
      if (closedSet.has(neighbor.id)) {
        continue;
      }
      
      const currentGScore = gScore.get(current) || Infinity;
      const tentativeGScore = currentGScore + neighbor.distance;
      
      if (!gScore.has(neighbor.id) || tentativeGScore < gScore.get(neighbor.id)) {
        // This path to neighbor is better
        cameFrom.set(neighbor.id, current);
        gScore.set(neighbor.id, tentativeGScore);
        
        const neighborNode = getNode(graph, neighbor.id);
        const hScore = heuristic(neighborNode, endNode);
        fScore.set(neighbor.id, tentativeGScore + hScore);
        
        if (!openSet.contains(neighbor.id)) {
          openSet.add(neighbor.id, fScore.get(neighbor.id));
        } else {
          // Update priority
          openSet.update(neighbor.id, fScore.get(neighbor.id));
        }
      }
    }
  }
  
  // No path found
  return null;
}

/**
 * Reconstruct path from cameFrom map
 */
function reconstructPath(cameFrom, current) {
  const path = [current];
  
  while (cameFrom.has(current)) {
    current = cameFrom.get(current);
    path.unshift(current);
  }
  
  return path;
}

/**
 * Get node by ID
 */
function getNode(graph, nodeId) {
  return graph.nodes.find(n => n.id === nodeId);
}

/**
 * Get neighbors of a node with distances
 */
function getNeighbors(graph, nodeId) {
  const node = getNode(graph, nodeId);
  if (!node) return [];
  
  // Get connected node IDs
  const connectedIds = node.connections || [];
  
  // Get edges from/to this node
  const edges = graph.edges.filter(e => 
    e.from === nodeId || (e.bidirectional && e.to === nodeId)
  );
  
  // Build neighbor list with distances
  return connectedIds.map(connectedId => {
    // Find edge
    const edge = edges.find(e => 
      (e.from === nodeId && e.to === connectedId) ||
      (e.bidirectional && e.to === nodeId && e.from === connectedId)
    );
    
    const neighborNode = getNode(graph, connectedId);
    if (!neighborNode) return null;
    
    // Use edge distance if available, otherwise calculate Euclidean
    const distance = edge 
      ? edge.distance 
      : euclideanDistance(node.position, neighborNode.position);
    
    return {
      id: connectedId,
      position: neighborNode.position,
      distance: distance
    };
  }).filter(n => n !== null);
}

/**
 * Heuristic function (Euclidean distance)
 */
function heuristic(node1, node2) {
  const dx = node2.position.x - node1.position.x;
  const dy = node2.position.y - node1.position.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculate Euclidean distance between two points
 */
function euclideanDistance(p1, p2) {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculate total path length
 */
function calculatePathLength(graph, path) {
  if (path.length < 2) {
    return 0;
  }
  
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

/**
 * Validate path
 */
function validatePath(graph, path, startNodeId, endNodeId) {
  const errors = [];
  
  if (path.length < 1) {
    errors.push("Path must contain at least 1 node");
    return { valid: false, errors };
  }
  
  if (path[0] !== startNodeId) {
    errors.push(`Path must start with ${startNodeId}, got ${path[0]}`);
  }
  
  if (path[path.length - 1] !== endNodeId) {
    errors.push(`Path must end with ${endNodeId}, got ${path[path.length - 1]}`);
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
    if (!fromNode) {
      errors.push(`Node not found: ${fromNodeId}`);
      continue;
    }
    
    if (!fromNode.connections || !fromNode.connections.includes(toNodeId)) {
      errors.push(`Path not connected: ${fromNodeId} → ${toNodeId}`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Round to precision
 */
function roundToPrecision(value) {
  const factor = Math.pow(10, 2);
  return Math.round(value * factor) / factor;
}

/**
 * Simple Priority Queue implementation
 */
class PriorityQueue {
  constructor() {
    this.items = [];
  }
  
  add(item, priority) {
    this.items.push({ item, priority });
    this.items.sort((a, b) => a.priority - b.priority);
  }
  
  pop() {
    return this.items.shift()?.item;
  }
  
  isEmpty() {
    return this.items.length === 0;
  }
  
  contains(item) {
    return this.items.some(i => i.item === item);
  }
  
  update(item, newPriority) {
    const index = this.items.findIndex(i => i.item === item);
    if (index !== -1) {
      this.items[index].priority = newPriority;
      this.items.sort((a, b) => a.priority - b.priority);
    }
  }
}

// Export for Node.js / CommonJS
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    computePath,
    aStar,
    validatePath,
    calculatePathLength
  };
}

// Export for ES6 modules
if (typeof window !== 'undefined') {
  window.Pathfinder = {
    computePath,
    aStar,
    validatePath,
    calculatePathLength
  };
}

