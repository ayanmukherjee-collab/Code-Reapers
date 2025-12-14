/**
 * Example usage of the Navigation Graph Builder
 * 
 * This demonstrates how to convert scan results into navigation graphs
 * for pathfinding algorithms.
 */

const { scanFloorPlan } = require('./scanner');
const { buildNavigationGraph } = require('./graphBuilder');

// Example 1: Full pipeline (Scan → Graph)
function exampleFullPipeline() {
  const svgInput = `
    <svg width="500" height="400">
      <rect x="100" y="200" width="50" height="40" class="room" id="ROOM_101"/>
      <text x="125" y="225">101</text>
      <rect x="200" y="200" width="50" height="40" class="room" id="ROOM_102"/>
      <text x="225" y="225">102</text>
      <path d="M 150 220 L 250 220" class="corridor" stroke-width="10"/>
    </svg>
  `;
  
  // Step 1: Scan floor plan
  const scanResult = scanFloorPlan(svgInput, { source: 'example-floor.svg' });
  console.log('Scan Result:');
  console.log(`  Rooms: ${scanResult.rooms.length}`);
  console.log(`  Paths: ${scanResult.paths.length}`);
  
  // Step 2: Build navigation graph
  const graph = buildNavigationGraph(scanResult, {
    mergeNearbyNodes: true,
    connectRoomsToCorridors: true,
    calculateDirections: true
  });
  
  console.log('\nNavigation Graph:');
  console.log(`  Nodes: ${graph.nodes.length}`);
  console.log(`  Edges: ${graph.edges.length}`);
  console.log(`  Room Mappings: ${graph.roomMappings.length}`);
  
  // Display sample nodes
  console.log('\nSample Nodes:');
  graph.nodes.slice(0, 3).forEach(node => {
    console.log(`  ${node.id}: ${node.type} at (${node.position.x}, ${node.position.y})`);
  });
  
  // Display sample edges
  console.log('\nSample Edges:');
  graph.edges.slice(0, 3).forEach(edge => {
    console.log(`  ${edge.id}: ${edge.from} → ${edge.to} (${edge.distance.toFixed(2)} units, ${edge.direction || 'no direction'})`);
  });
  
  return graph;
}

// Example 2: Graph structure for A* pathfinding
function exampleAStarReady() {
  const scanResult = {
    rooms: [
      {
        id: "ROOM_101",
        bounds: { x: 100, y: 200, width: 50, height: 40 },
        type: "room"
      },
      {
        id: "ROOM_102",
        bounds: { x: 200, y: 200, width: 50, height: 40 },
        type: "room"
      }
    ],
    paths: [
      {
        id: "PATH_001",
        type: "corridor",
        segments: [
          { start: { x: 150, y: 220 }, end: { x: 250, y: 220 } }
        ]
      }
    ],
    metadata: {
      source: "example",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      bounds: { x: 0, y: 0, width: 500, height: 400 }
    }
  };
  
  const graph = buildNavigationGraph(scanResult);
  
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
  
  console.log('A* Ready Graph Structure:');
  console.log(`  Node Map: ${nodeMap.size} nodes`);
  console.log(`  Adjacency List: ${adjacencyList.size} entries`);
  
  // Example: Find path from ROOM_101 to ROOM_102
  const room101Mapping = graph.roomMappings.find(m => m.roomId === 'ROOM_101');
  const room102Mapping = graph.roomMappings.find(m => m.roomId === 'ROOM_102');
  
  if (room101Mapping && room102Mapping) {
    console.log(`\nPath from ROOM_101 (${room101Mapping.nodeId}) to ROOM_102 (${room102Mapping.nodeId})`);
    console.log('  Ready for A* algorithm!');
  }
  
  return { nodeMap, adjacencyList, graph };
}

// Example 3: Room-to-node mappings
function exampleRoomMappings() {
  const scanResult = {
    rooms: [
      { id: "ROOM_101", bounds: { x: 100, y: 200, width: 50, height: 40 }, type: "room" },
      { id: "ROOM_102", bounds: { x: 200, y: 200, width: 50, height: 40 }, type: "room" },
      { id: "STAIR_A", bounds: { x: 300, y: 200, width: 30, height: 30 }, type: "stair" }
    ],
    paths: [
      {
        id: "CORR_001",
        type: "corridor",
        segments: [
          { start: { x: 150, y: 220 }, end: { x: 250, y: 220 } },
          { start: { x: 250, y: 220 }, end: { x: 300, y: 220 } }
        ]
      }
    ],
    metadata: {
      source: "example",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      bounds: { x: 0, y: 0, width: 500, height: 400 }
    }
  };
  
  const graph = buildNavigationGraph(scanResult);
  
  console.log('Room-to-Node Mappings:');
  graph.roomMappings.forEach(mapping => {
    const node = graph.nodes.find(n => n.id === mapping.nodeId);
    console.log(`  ${mapping.roomId} → ${mapping.nodeId} (${node?.type || 'unknown'} node at ${mapping.position.x}, ${mapping.position.y})`);
  });
  
  return graph;
}

// Example 4: Verify determinism
function exampleDeterminism() {
  const scanResult = {
    rooms: [
      { id: "ROOM_101", bounds: { x: 100, y: 200, width: 50, height: 40 }, type: "room" }
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
    metadata: {
      source: "test",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      bounds: { x: 0, y: 0, width: 500, height: 400 }
    }
  };
  
  // Build graph twice
  const graph1 = buildNavigationGraph(scanResult);
  const graph2 = buildNavigationGraph(scanResult);
  
  // Compare node IDs
  const nodeIds1 = graph1.nodes.map(n => n.id).sort();
  const nodeIds2 = graph2.nodes.map(n => n.id).sort();
  
  // Compare edge IDs
  const edgeIds1 = graph1.edges.map(e => e.id).sort();
  const edgeIds2 = graph2.edges.map(e => e.id).sort();
  
  console.log('Determinism Test:');
  console.log(`  Node IDs match: ${JSON.stringify(nodeIds1) === JSON.stringify(nodeIds2)}`);
  console.log(`  Edge IDs match: ${JSON.stringify(edgeIds1) === JSON.stringify(edgeIds2)}`);
  console.log(`  Same number of nodes: ${graph1.nodes.length === graph2.nodes.length}`);
  console.log(`  Same number of edges: ${graph1.edges.length === graph2.edges.length}`);
  
  return { graph1, graph2, deterministic: JSON.stringify(nodeIds1) === JSON.stringify(nodeIds2) };
}

// Run examples
if (require.main === module) {
  console.log('=== Example 1: Full Pipeline ===');
  exampleFullPipeline();
  
  console.log('\n=== Example 2: A* Ready Structure ===');
  exampleAStarReady();
  
  console.log('\n=== Example 3: Room Mappings ===');
  exampleRoomMappings();
  
  console.log('\n=== Example 4: Determinism Test ===');
  exampleDeterminism();
}

module.exports = {
  exampleFullPipeline,
  exampleAStarReady,
  exampleRoomMappings,
  exampleDeterminism
};

