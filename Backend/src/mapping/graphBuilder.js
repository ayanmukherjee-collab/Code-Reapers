/**
 * Navigation Graph Builder
 * 
 * Converts scan results (rooms + paths) into a navigation graph for pathfinding.
 * 
 * The graph is the single source of truth for navigation.
 * 
 * Requirements:
 * - Nodes: intersections, corridor points, room connections
 * - Edges: walkable connections between nodes
 * - Room-to-node mappings: which node represents each room
 * - A* ready: usable by pathfinding algorithms
 * - Deterministic: same input → same output
 */

const GRAPH_BUILDER_VERSION = '1.0.0';
const COORDINATE_PRECISION = 2;
const NODE_MERGE_THRESHOLD = 5; // Merge nodes within 5 pixels
const ROOM_CORRIDOR_DISTANCE = 50; // Max distance for room-corridor connection
const MIN_EDGE_DISTANCE = 1; // Minimum edge distance

/**
 * Main graph builder entry point
 * @param {Object} scanResult - Output from scanFloorPlan
 * @param {Object} options - Builder options
 * @returns {Object} NavigationGraph
 */
function buildNavigationGraph(scanResult, options = {}) {
  const {
    mergeNearbyNodes = true,
    connectRoomsToCorridors = true,
    calculateDirections = true
  } = options;
  
  const nodes = [];
  const edges = [];
  const roomMappings = [];
  const warnings = [];
  const errors = [];
  
  try {
    // Step 1: Place room nodes
    const roomNodes = placeRoomNodes(scanResult.rooms);
    nodes.push(...roomNodes);
    
    // Step 2: Place corridor nodes
    const corridorNodes = placeCorridorNodes(scanResult.paths);
    nodes.push(...corridorNodes);
    
    // Step 3: Merge nearby nodes (if enabled)
    if (mergeNearbyNodes) {
      mergeNodes(nodes, NODE_MERGE_THRESHOLD);
    }
    
    // Step 4: Detect and mark intersections
    markIntersections(nodes);
    
    // Step 5: Create corridor edges
    const corridorEdges = createCorridorEdges(scanResult.paths, nodes, calculateDirections);
    edges.push(...corridorEdges);
    
    // Step 6: Create room-to-corridor edges
    if (connectRoomsToCorridors) {
      const roomEdges = createRoomToCorridorEdges(roomNodes, corridorNodes, nodes, calculateDirections);
      edges.push(...roomEdges);
    }
    
    // Step 7: Create intersection edges
    const intersectionEdges = createIntersectionEdges(nodes, calculateDirections);
    edges.push(...intersectionEdges);
    
    // Step 8: Generate room mappings
    roomNodes.forEach(roomNode => {
      if (roomNode.metadata && roomNode.metadata.roomId) {
        roomMappings.push({
          roomId: roomNode.metadata.roomId,
          nodeId: roomNode.id,
          position: roomNode.position
        });
      }
    });
    
    // Step 9: Normalize and sort
    normalizeGraph(nodes, edges);
    sortGraph(nodes, edges);
    
    // Step 10: Build connections array for each node
    buildNodeConnections(nodes, edges);
    
    // Step 11: Calculate bounds
    const bounds = calculateGraphBounds(nodes);
    
    // Step 12: Validate graph
    const validation = validateGraph(nodes, edges, roomMappings);
    warnings.push(...validation.warnings);
    errors.push(...validation.errors);
    
    return {
      metadata: {
        source: scanResult.metadata?.source || 'unknown',
        timestamp: new Date().toISOString(),
        version: GRAPH_BUILDER_VERSION,
        nodeCount: nodes.length,
        edgeCount: edges.length,
        roomCount: roomMappings.length
      },
      nodes,
      edges,
      roomMappings,
      bounds,
      warnings,
      errors
    };
    
  } catch (error) {
    errors.push(`Graph building error: ${error.message}`);
    return {
      metadata: {
        source: scanResult.metadata?.source || 'unknown',
        timestamp: new Date().toISOString(),
        version: GRAPH_BUILDER_VERSION,
        nodeCount: 0,
        edgeCount: 0,
        roomCount: 0
      },
      nodes: [],
      edges: [],
      roomMappings: [],
      bounds: { x: 0, y: 0, width: 0, height: 0 },
      warnings,
      errors
    };
  }
}

/**
 * Place nodes for each room
 */
function placeRoomNodes(rooms) {
  const nodes = [];
  
  rooms.forEach((room, index) => {
    // Calculate room center
    const center = {
      x: room.bounds.x + room.bounds.width / 2,
      y: room.bounds.y + room.bounds.height / 2
    };
    
    const nodeType = determineNodeTypeFromRoom(room.type);
    const nodeId = generateNodeID(center, nodeType, index);
    
    nodes.push({
      id: nodeId,
      type: nodeType,
      position: normalizePoint(center),
      connections: [], // Will be populated later
      metadata: {
        roomId: room.id,
        label: room.label
      }
    });
  });
  
  return nodes;
}

/**
 * Place nodes along corridors
 */
function placeCorridorNodes(paths) {
  const nodes = [];
  const nodeMap = new Map(); // To avoid duplicates
  
  paths.forEach((path, pathIndex) => {
    path.segments.forEach((segment, segIndex) => {
      // Create nodes at segment endpoints
      const startNode = createCorridorNode(segment.start, path.id, `start_${segIndex}`, nodeMap);
      const endNode = createCorridorNode(segment.end, path.id, `end_${segIndex}`, nodeMap);
      
      if (startNode) nodes.push(startNode);
      if (endNode) nodes.push(endNode);
    });
  });
  
  return Array.from(nodeMap.values());
}

/**
 * Create a corridor node (with deduplication)
 */
function createCorridorNode(position, pathId, suffix, nodeMap) {
  const normalized = normalizePoint(position);
  const nodeId = generateNodeID(normalized, 'corridor', `${pathId}_${suffix}`);
  
  // Check if node already exists at this position
  const existingNode = findNodeAtPosition(nodeMap, normalized, NODE_MERGE_THRESHOLD);
  if (existingNode) {
    return null; // Node already exists
  }
  
  const node = {
    id: nodeId,
    type: 'corridor',
    position: normalized,
    connections: [],
    metadata: {
      pathId: pathId
    }
  };
  
  nodeMap.set(nodeId, node);
  return node;
}

/**
 * Find node at or near position
 */
function findNodeAtPosition(nodeMap, position, threshold) {
  for (const node of nodeMap.values()) {
    const distance = euclideanDistance(node.position, position);
    if (distance <= threshold) {
      return node;
    }
  }
  return null;
}

/**
 * Merge nearby nodes
 */
function mergeNodes(nodes, threshold) {
  const merged = new Set();
  const toRemove = [];
  
  for (let i = 0; i < nodes.length; i++) {
    if (merged.has(i)) continue;
    
    const node1 = nodes[i];
    const cluster = [node1];
    
    // Find all nodes within threshold
    for (let j = i + 1; j < nodes.length; j++) {
      if (merged.has(j)) continue;
      
      const node2 = nodes[j];
      const distance = euclideanDistance(node1.position, node2.position);
      
      if (distance <= threshold) {
        cluster.push(node2);
        merged.add(j);
        toRemove.push(j);
      }
    }
    
    // If cluster found, merge to first node
    if (cluster.length > 1) {
      // Update first node position to average
      const avgX = cluster.reduce((sum, n) => sum + n.position.x, 0) / cluster.length;
      const avgY = cluster.reduce((sum, n) => sum + n.position.y, 0) / cluster.length;
      node1.position = normalizePoint({ x: avgX, y: avgY });
      
      // Merge metadata
      const allPathIds = new Set();
      cluster.forEach(n => {
        if (n.metadata?.pathId) allPathIds.add(n.metadata.pathId);
        if (n.metadata?.roomId) {
          node1.metadata = node1.metadata || {};
          node1.metadata.roomId = n.metadata.roomId;
        }
      });
      if (allPathIds.size > 0) {
        node1.metadata = node1.metadata || {};
        node1.metadata.pathIds = Array.from(allPathIds);
      }
      
      // Mark as intersection if multiple paths
      if (allPathIds.size > 1) {
        node1.type = 'intersection';
        node1.metadata.isIntersection = true;
      }
    }
  }
  
  // Remove merged nodes (in reverse order to maintain indices)
  toRemove.sort((a, b) => b - a);
  toRemove.forEach(index => nodes.splice(index, 1));
}

/**
 * Mark intersection nodes
 */
function markIntersections(nodes) {
  // Nodes with multiple pathIds are intersections
  nodes.forEach(node => {
    if (node.metadata?.pathIds && node.metadata.pathIds.length > 1) {
      node.type = 'intersection';
      node.metadata.isIntersection = true;
    }
  });
}

/**
 * Create edges along corridors
 */
function createCorridorEdges(paths, allNodes, calculateDirections) {
  const edges = [];
  const edgeMap = new Map(); // For deduplication
  
  paths.forEach(path => {
    path.segments.forEach(segment => {
      const startPos = normalizePoint(segment.start);
      const endPos = normalizePoint(segment.end);
      
      // Find nodes at segment endpoints
      const startNode = findNearestNode(allNodes, startPos, NODE_MERGE_THRESHOLD * 2);
      const endNode = findNearestNode(allNodes, endPos, NODE_MERGE_THRESHOLD * 2);
      
      if (startNode && endNode && startNode.id !== endNode.id) {
        const distance = euclideanDistance(startNode.position, endNode.position);
        
        if (distance >= MIN_EDGE_DISTANCE) {
          const edgeId = generateEdgeID(startNode.id, endNode.id);
          
          // Check if edge already exists
          if (!edgeMap.has(edgeId)) {
            const edge = {
              id: edgeId,
              from: startNode.id,
              to: endNode.id,
              distance: roundToPrecision(distance),
              bidirectional: true,
              metadata: {
                pathId: path.id,
                type: path.type
              }
            };
            
            if (calculateDirections) {
              edge.direction = calculateDirection(startNode.position, endNode.position);
            }
            
            edges.push(edge);
            edgeMap.set(edgeId, edge);
          }
        }
      }
    });
  });
  
  return edges;
}

/**
 * Create edges connecting rooms to corridors
 */
function createRoomToCorridorEdges(roomNodes, corridorNodes, allNodes, calculateDirections) {
  const edges = [];
  const edgeMap = new Map();
  
  roomNodes.forEach(roomNode => {
    // Find nearest corridor node
    let nearestCorridorNode = null;
    let minDistance = Infinity;
    
    corridorNodes.forEach(corridorNode => {
      const distance = euclideanDistance(roomNode.position, corridorNode.position);
      if (distance < minDistance && distance <= ROOM_CORRIDOR_DISTANCE) {
        minDistance = distance;
        nearestCorridorNode = corridorNode;
      }
    });
    
    if (nearestCorridorNode) {
      const distance = euclideanDistance(roomNode.position, nearestCorridorNode.position);
      
      if (distance >= MIN_EDGE_DISTANCE) {
        const edgeId = generateEdgeID(roomNode.id, nearestCorridorNode.id);
        
        if (!edgeMap.has(edgeId)) {
          const edge = {
            id: edgeId,
            from: roomNode.id,
            to: nearestCorridorNode.id,
            distance: roundToPrecision(distance),
            bidirectional: true,
            metadata: {
              type: 'doorway'
            }
          };
          
          if (calculateDirections) {
            edge.direction = calculateDirection(roomNode.position, nearestCorridorNode.position);
          }
          
          edges.push(edge);
          edgeMap.set(edgeId, edge);
        }
      }
    }
  });
  
  return edges;
}

/**
 * Create edges at intersections
 */
function createIntersectionEdges(nodes, calculateDirections) {
  const edges = [];
  const edgeMap = new Map();
  
  // Find intersection nodes
  const intersectionNodes = nodes.filter(n => n.type === 'intersection' || n.metadata?.isIntersection);
  
  // For each intersection, connect to nearby nodes
  intersectionNodes.forEach(intersectionNode => {
    nodes.forEach(node => {
      if (node.id === intersectionNode.id) return;
      
      const distance = euclideanDistance(intersectionNode.position, node.position);
      
      // Connect if within reasonable distance (corridor width)
      if (distance <= ROOM_CORRIDOR_DISTANCE && distance >= MIN_EDGE_DISTANCE) {
        const edgeId = generateEdgeID(intersectionNode.id, node.id);
        
        if (!edgeMap.has(edgeId)) {
          const edge = {
            id: edgeId,
            from: intersectionNode.id,
            to: node.id,
            distance: roundToPrecision(distance),
            bidirectional: true,
            metadata: {
              type: 'intersection'
            }
          };
          
          if (calculateDirections) {
            edge.direction = calculateDirection(intersectionNode.position, node.position);
          }
          
          edges.push(edge);
          edgeMap.set(edgeId, edge);
        }
      }
    });
  });
  
  return edges;
}

/**
 * Build connections array for each node
 */
function buildNodeConnections(nodes, edges) {
  // Reset connections
  nodes.forEach(node => {
    node.connections = [];
  });
  
  // Build connections from edges
  edges.forEach(edge => {
    const fromNode = nodes.find(n => n.id === edge.from);
    const toNode = nodes.find(n => n.id === edge.to);
    
    if (fromNode && !fromNode.connections.includes(edge.to)) {
      fromNode.connections.push(edge.to);
    }
    
    if (edge.bidirectional && toNode && !toNode.connections.includes(edge.from)) {
      toNode.connections.push(edge.from);
    }
  });
}

/**
 * Calculate cardinal direction from one point to another
 */
function calculateDirection(from, to) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const angle = Math.atan2(dy, dx) * 180 / Math.PI;
  
  // Normalize angle to 0-360
  const normalizedAngle = (angle + 360) % 360;
  
  // Convert to cardinal direction
  if (normalizedAngle >= 315 || normalizedAngle < 45) return 'east';
  if (normalizedAngle >= 45 && normalizedAngle < 135) return 'south';
  if (normalizedAngle >= 135 && normalizedAngle < 225) return 'west';
  return 'north';
}

/**
 * Determine node type from room type
 */
function determineNodeTypeFromRoom(roomType) {
  switch (roomType) {
    case 'stair': return 'stair';
    case 'elevator': return 'elevator';
    case 'exit': return 'exit';
    default: return 'room';
  }
}

/**
 * Generate deterministic node ID
 */
function generateNodeID(position, type, suffix) {
  const normalized = normalizePoint(position);
  return `NODE_${type}_${Math.round(normalized.x)}_${Math.round(normalized.y)}_${suffix}`.replace(/[^a-zA-Z0-9_]/g, '_');
}

/**
 * Generate deterministic edge ID
 */
function generateEdgeID(fromNodeId, toNodeId) {
  // Sort IDs for deterministic edge direction
  const [id1, id2] = [fromNodeId, toNodeId].sort();
  return `EDGE_${id1}_${id2}`.replace(/[^a-zA-Z0-9_]/g, '_');
}

/**
 * Find nearest node to a position
 */
function findNearestNode(nodes, position, maxDistance = Infinity) {
  let nearest = null;
  let minDistance = Infinity;
  
  nodes.forEach(node => {
    const distance = euclideanDistance(node.position, position);
    if (distance < minDistance && distance <= maxDistance) {
      minDistance = distance;
      nearest = node;
    }
  });
  
  return nearest;
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
 * Normalize point coordinates
 */
function normalizePoint(point) {
  return {
    x: roundToPrecision(point.x),
    y: roundToPrecision(point.y)
  };
}

/**
 * Round to fixed precision
 */
function roundToPrecision(value) {
  const factor = Math.pow(10, COORDINATE_PRECISION);
  return Math.round(value * factor) / factor;
}

/**
 * Normalize graph (coordinates)
 */
function normalizeGraph(nodes, edges) {
  nodes.forEach(node => {
    node.position = normalizePoint(node.position);
  });
  
  edges.forEach(edge => {
    edge.distance = roundToPrecision(edge.distance);
  });
}

/**
 * Sort graph for deterministic output
 */
function sortGraph(nodes, edges) {
  // Sort nodes by position (y, then x)
  nodes.sort((a, b) => {
    const yDiff = a.position.y - b.position.y;
    if (Math.abs(yDiff) < 1) {
      return a.position.x - b.position.x;
    }
    return yDiff;
  });
  
  // Sort edges by from node, then to node
  edges.sort((a, b) => {
    if (a.from !== b.from) {
      return a.from.localeCompare(b.from);
    }
    return a.to.localeCompare(b.to);
  });
}

/**
 * Calculate graph bounds
 */
function calculateGraphBounds(nodes) {
  if (nodes.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }
  
  let minX = Infinity, minY = Infinity;
  let maxX = -Infinity, maxY = -Infinity;
  
  nodes.forEach(node => {
    minX = Math.min(minX, node.position.x);
    minY = Math.min(minY, node.position.y);
    maxX = Math.max(maxX, node.position.x);
    maxY = Math.max(maxY, node.position.y);
  });
  
  return {
    x: roundToPrecision(minX),
    y: roundToPrecision(minY),
    width: roundToPrecision(maxX - minX),
    height: roundToPrecision(maxY - minY)
  };
}

/**
 * Validate graph
 */
function validateGraph(nodes, edges, roomMappings) {
  const warnings = [];
  const errors = [];
  
  // Check for duplicate node IDs
  const nodeIds = new Set();
  nodes.forEach(node => {
    if (nodeIds.has(node.id)) {
      errors.push(`Duplicate node ID: ${node.id}`);
    }
    nodeIds.add(node.id);
  });
  
  // Check for duplicate edge IDs
  const edgeIds = new Set();
  edges.forEach(edge => {
    if (edgeIds.has(edge.id)) {
      errors.push(`Duplicate edge ID: ${edge.id}`);
    }
    edgeIds.add(edge.id);
  });
  
  // Check edges reference valid nodes
  const validNodeIds = new Set(nodes.map(n => n.id));
  edges.forEach(edge => {
    if (!validNodeIds.has(edge.from)) {
      errors.push(`Edge references invalid from node: ${edge.from}`);
    }
    if (!validNodeIds.has(edge.to)) {
      errors.push(`Edge references invalid to node: ${edge.to}`);
    }
  });
  
  // Check room mappings reference valid nodes
  roomMappings.forEach(mapping => {
    if (!validNodeIds.has(mapping.nodeId)) {
      errors.push(`Room mapping references invalid node: ${mapping.nodeId}`);
    }
  });
  
  // Check for isolated nodes
  const isolatedNodes = nodes.filter(node => node.connections.length === 0);
  if (isolatedNodes.length > 0) {
    warnings.push(`${isolatedNodes.length} isolated node(s) found (no connections)`);
  }
  
  // Check for rooms without mappings
  const mappedRoomIds = new Set(roomMappings.map(m => m.roomId));
  // This would require access to original rooms, so we'll skip for now
  
  return { warnings, errors };
}

// Export for Node.js / CommonJS
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    buildNavigationGraph,
    GRAPH_BUILDER_VERSION
  };
}

// Export for ES6 modules
if (typeof window !== 'undefined') {
  window.NavigationGraphBuilder = {
    buildNavigationGraph,
    GRAPH_BUILDER_VERSION
  };
}

