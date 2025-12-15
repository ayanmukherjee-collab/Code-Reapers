/**
 * Example usage of Pathfinder
 * 
 * Demonstrates how to compute navigable paths between start and end points.
 */

const { computePath, validatePath } = require('./pathfinder');

// Example 1: Compute simple path
function exampleSimplePath() {
  const graph = {
    nodes: [
      {
        id: "NODE_exit_0_0",
        type: "exit",
        position: { x: 0, y: 0 },
        connections: ["NODE_corridor_50_0"]
      },
      {
        id: "NODE_corridor_50_0",
        type: "corridor",
        position: { x: 50, y: 0 },
        connections: ["NODE_exit_0_0", "NODE_room_125_220_0"]
      },
      {
        id: "NODE_room_125_220_0",
        type: "room",
        position: { x: 125, y: 220 },
        connections: ["NODE_corridor_50_0"]
      }
    ],
    edges: [
      {
        id: "EDGE_1",
        from: "NODE_exit_0_0",
        to: "NODE_corridor_50_0",
        distance: 50,
        bidirectional: true
      },
      {
        id: "EDGE_2",
        from: "NODE_corridor_50_0",
        to: "NODE_room_125_220_0",
        distance: 220.2,
        bidirectional: true
      }
    ],
    roomMappings: [],
    bounds: { x: 0, y: 0, width: 500, height: 400 }
  };
  
  const startPoint = {
    nodeId: "NODE_exit_0_0",
    type: "entrance",
    position: { x: 0, y: 0 },
    label: "Main Entrance"
  };
  
  const endPoint = {
    nodeId: "NODE_room_125_220_0",
    type: "room",
    position: { x: 125, y: 220 },
    label: "101",
    metadata: { roomId: "ROOM_101" }
  };
  
  const pathResult = computePath(graph, startPoint, endPoint);
  
  console.log('Simple Path Computation:');
  console.log(`  Success: ${pathResult.success}`);
  if (pathResult.success) {
    console.log(`  Path: ${pathResult.path.join(' → ')}`);
    console.log(`  Length: ${pathResult.length}`);
    console.log(`  Step Count: ${pathResult.stepCount}`);
    console.log(`  Algorithm: ${pathResult.metadata.algorithm}`);
  } else {
    console.log(`  Error: ${pathResult.error}`);
  }
  
  return pathResult;
}

// Example 2: Complex path with multiple nodes
function exampleComplexPath() {
  const graph = {
    nodes: [
      { id: "NODE_A", type: "exit", position: { x: 0, y: 0 }, connections: ["NODE_B"] },
      { id: "NODE_B", type: "corridor", position: { x: 50, y: 0 }, connections: ["NODE_A", "NODE_C", "NODE_D"] },
      { id: "NODE_C", type: "corridor", position: { x: 100, y: 0 }, connections: ["NODE_B", "NODE_E"] },
      { id: "NODE_D", type: "corridor", position: { x: 50, y: 50 }, connections: ["NODE_B", "NODE_E"] },
      { id: "NODE_E", type: "corridor", position: { x: 150, y: 50 }, connections: ["NODE_C", "NODE_D", "NODE_F"] },
      { id: "NODE_F", type: "room", position: { x: 200, y: 100 }, connections: ["NODE_E"] }
    ],
    edges: [
      { id: "E1", from: "NODE_A", to: "NODE_B", distance: 50, bidirectional: true },
      { id: "E2", from: "NODE_B", to: "NODE_C", distance: 50, bidirectional: true },
      { id: "E3", from: "NODE_B", to: "NODE_D", distance: 50, bidirectional: true },
      { id: "E4", from: "NODE_C", to: "NODE_E", distance: 70.7, bidirectional: true },
      { id: "E5", from: "NODE_D", to: "NODE_E", distance: 100, bidirectional: true },
      { id: "E6", from: "NODE_E", to: "NODE_F", distance: 70.7, bidirectional: true }
    ],
    roomMappings: [],
    bounds: { x: 0, y: 0, width: 500, height: 400 }
  };
  
  const startPoint = { nodeId: "NODE_A", type: "entrance", position: { x: 0, y: 0 } };
  const endPoint = { nodeId: "NODE_F", type: "room", position: { x: 200, y: 100 } };
  
  const pathResult = computePath(graph, startPoint, endPoint);
  
  console.log('Complex Path Computation:');
  console.log(`  Success: ${pathResult.success}`);
  if (pathResult.success) {
    console.log(`  Path: ${pathResult.path.join(' → ')}`);
    console.log(`  Length: ${pathResult.length}`);
    console.log(`  Steps: ${pathResult.stepCount}`);
  }
  
  return pathResult;
}

// Example 3: No path found
function exampleNoPath() {
  const graph = {
    nodes: [
      { id: "NODE_A", type: "exit", position: { x: 0, y: 0 }, connections: ["NODE_B"] },
      { id: "NODE_B", type: "corridor", position: { x: 50, y: 0 }, connections: ["NODE_A"] },
      { id: "NODE_C", type: "room", position: { x: 200, y: 200 }, connections: [] } // Isolated
    ],
    edges: [
      { id: "E1", from: "NODE_A", to: "NODE_B", distance: 50, bidirectional: true }
    ],
    roomMappings: [],
    bounds: { x: 0, y: 0, width: 500, height: 400 }
  };
  
  const startPoint = { nodeId: "NODE_A", type: "entrance", position: { x: 0, y: 0 } };
  const endPoint = { nodeId: "NODE_C", type: "room", position: { x: 200, y: 200 } };
  
  const pathResult = computePath(graph, startPoint, endPoint);
  
  console.log('No Path Found Example:');
  console.log(`  Success: ${pathResult.success}`);
  console.log(`  Error: ${pathResult.error}`);
  
  return pathResult;
}

// Example 4: Same start and end
function exampleSamePoint() {
  const graph = {
    nodes: [
      { id: "NODE_A", type: "room", position: { x: 100, y: 100 }, connections: [] }
    ],
    edges: [],
    roomMappings: [],
    bounds: { x: 0, y: 0, width: 500, height: 400 }
  };
  
  const startPoint = { nodeId: "NODE_A", type: "room", position: { x: 100, y: 100 } };
  const endPoint = { nodeId: "NODE_A", type: "room", position: { x: 100, y: 100 } };
  
  const pathResult = computePath(graph, startPoint, endPoint);
  
  console.log('Same Start and End Point:');
  console.log(`  Success: ${pathResult.success}`);
  console.log(`  Path: ${pathResult.path.join(' → ')}`);
  console.log(`  Length: ${pathResult.length}`);
  console.log(`  Steps: ${pathResult.stepCount}`);
  
  return pathResult;
}

// Example 5: Validate path
function exampleValidatePath() {
  const graph = {
    nodes: [
      { id: "NODE_A", type: "exit", position: { x: 0, y: 0 }, connections: ["NODE_B"] },
      { id: "NODE_B", type: "corridor", position: { x: 50, y: 0 }, connections: ["NODE_A", "NODE_C"] },
      { id: "NODE_C", type: "room", position: { x: 100, y: 0 }, connections: ["NODE_B"] }
    ],
    edges: [
      { id: "E1", from: "NODE_A", to: "NODE_B", distance: 50, bidirectional: true },
      { id: "E2", from: "NODE_B", to: "NODE_C", distance: 50, bidirectional: true }
    ],
    roomMappings: [],
    bounds: { x: 0, y: 0, width: 500, height: 400 }
  };
  
  // Valid path
  const validPath = ["NODE_A", "NODE_B", "NODE_C"];
  const validation1 = validatePath(graph, validPath, "NODE_A", "NODE_C");
  console.log('Valid Path Validation:');
  console.log(`  Valid: ${validation1.valid}`);
  if (!validation1.valid) {
    console.log(`  Errors: ${validation1.errors.join(', ')}`);
  }
  
  // Invalid path (not connected)
  const invalidPath = ["NODE_A", "NODE_C"]; // Missing NODE_B
  const validation2 = validatePath(graph, invalidPath, "NODE_A", "NODE_C");
  console.log('\nInvalid Path Validation:');
  console.log(`  Valid: ${validation2.valid}`);
  if (!validation2.valid) {
    console.log(`  Errors: ${validation2.errors.join(', ')}`);
  }
  
  return { validation1, validation2 };
}

// Run examples
if (require.main === module) {
  console.log('=== Example 1: Simple Path ===');
  exampleSimplePath();
  
  console.log('\n=== Example 2: Complex Path ===');
  exampleComplexPath();
  
  console.log('\n=== Example 3: No Path Found ===');
  exampleNoPath();
  
  console.log('\n=== Example 4: Same Start and End ===');
  exampleSamePoint();
  
  console.log('\n=== Example 5: Path Validation ===');
  exampleValidatePath();
}

module.exports = {
  exampleSimplePath,
  exampleComplexPath,
  exampleNoPath,
  exampleSamePoint,
  exampleValidatePath
};

