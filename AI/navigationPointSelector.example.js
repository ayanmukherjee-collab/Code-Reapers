/**
 * Example usage of Navigation Point Selector
 * 
 * Demonstrates how to select start and end points from navigation graphs.
 */

const { 
  selectNavigationPoints,
  getAllStartPoints,
  getAllEndPoints,
  findPoint,
  validatePointMapping
} = require('./navigationPointSelector');

// Example 1: Select all navigation points
function exampleSelectAllPoints() {
  // Mock navigation graph
  const graph = {
    nodes: [
      {
        id: "NODE_exit_0_0",
        type: "exit",
        position: { x: 0, y: 0 },
        connections: ["NODE_corridor_50_0"],
        metadata: { label: "Main Entrance" }
      },
      {
        id: "NODE_stair_100_0",
        type: "stair",
        position: { x: 100, y: 0 },
        connections: ["NODE_corridor_50_0"],
        metadata: { label: "Staircase A" }
      },
      {
        id: "NODE_elevator_200_0",
        type: "elevator",
        position: { x: 200, y: 0 },
        connections: ["NODE_corridor_50_0"],
        metadata: { label: "Elevator 1" }
      },
      {
        id: "NODE_corridor_50_0",
        type: "corridor",
        position: { x: 50, y: 0 },
        connections: ["NODE_exit_0_0", "NODE_stair_100_0", "NODE_elevator_200_0", "NODE_room_125_220_0"]
      },
      {
        id: "NODE_room_125_220_0",
        type: "room",
        position: { x: 125, y: 220 },
        connections: ["NODE_corridor_50_0"],
        metadata: { roomId: "ROOM_101", label: "101" }
      },
      {
        id: "NODE_room_225_220_0",
        type: "room",
        position: { x: 225, y: 220 },
        connections: ["NODE_corridor_50_0"],
        metadata: { roomId: "ROOM_102", label: "102" }
      }
    ],
    edges: [],
    roomMappings: [
      { roomId: "ROOM_101", nodeId: "NODE_room_125_220_0", position: { x: 125, y: 220 } },
      { roomId: "ROOM_102", nodeId: "NODE_room_225_220_0", position: { x: 225, y: 220 } }
    ],
    bounds: { x: 0, y: 0, width: 500, height: 400 }
  };
  
  // Mock scan result (for office/facility detection)
  const scanResult = {
    rooms: [
      { id: "ROOM_101", bounds: { x: 100, y: 200, width: 50, height: 40 }, type: "room", label: "101" },
      { id: "ROOM_102", bounds: { x: 200, y: 200, width: 50, height: 40 }, type: "office", label: "Office 102" },
      { id: "ROOM_WASHROOM", bounds: { x: 300, y: 200, width: 30, height: 30 }, type: "washroom", label: "Washroom" }
    ],
    paths: [],
    metadata: {}
  };
  
  const navigationPoints = selectNavigationPoints(graph, scanResult);
  
  console.log('Navigation Points:');
  console.log(`  Start Points:`);
  console.log(`    Entrances: ${navigationPoints.startPoints.entrances.length}`);
  console.log(`    Staircases: ${navigationPoints.startPoints.staircases.length}`);
  console.log(`    Lifts: ${navigationPoints.startPoints.lifts.length}`);
  console.log(`    Corridors: ${navigationPoints.startPoints.corridors.length}`);
  console.log(`    Total: ${navigationPoints.startPoints.all.length}`);
  
  console.log(`  End Points:`);
  console.log(`    Rooms: ${navigationPoints.endPoints.rooms.length}`);
  console.log(`    Offices: ${navigationPoints.endPoints.offices.length}`);
  console.log(`    Facilities: ${navigationPoints.endPoints.facilities.length}`);
  console.log(`    Total: ${navigationPoints.endPoints.all.length}`);
  
  console.log(`  Validation:`);
  console.log(`    Start Points Valid: ${navigationPoints.validation.startPointsValid}`);
  console.log(`    End Points Valid: ${navigationPoints.validation.endPointsValid}`);
  if (navigationPoints.validation.errors.length > 0) {
    console.log(`    Errors: ${navigationPoints.validation.errors.join(', ')}`);
  }
  if (navigationPoints.validation.warnings.length > 0) {
    console.log(`    Warnings: ${navigationPoints.validation.warnings.join(', ')}`);
  }
  
  return navigationPoints;
}

// Example 2: Select start points only
function exampleStartPoints() {
  const graph = {
    nodes: [
      { id: "NODE_exit_0_0", type: "exit", position: { x: 0, y: 0 }, connections: [] },
      { id: "NODE_stair_100_0", type: "stair", position: { x: 100, y: 0 }, connections: [] },
      { id: "NODE_elevator_200_0", type: "elevator", position: { x: 200, y: 0 }, connections: [] },
      { id: "NODE_corridor_50_0", type: "corridor", position: { x: 50, y: 0 }, connections: [] }
    ],
    edges: [],
    roomMappings: [],
    bounds: { x: 0, y: 0, width: 500, height: 400 }
  };
  
  const startPoints = getAllStartPoints(graph);
  
  console.log('Start Points:');
  console.log(`  Entrances: ${startPoints.entrances.length}`);
  startPoints.entrances.forEach(point => {
    console.log(`    - ${point.label} (${point.nodeId})`);
  });
  
  console.log(`  Staircases: ${startPoints.staircases.length}`);
  startPoints.staircases.forEach(point => {
    console.log(`    - ${point.label} (${point.nodeId})`);
  });
  
  console.log(`  Lifts: ${startPoints.lifts.length}`);
  startPoints.lifts.forEach(point => {
    console.log(`    - ${point.label} (${point.nodeId})`);
  });
  
  console.log(`  Corridors: ${startPoints.corridors.length}`);
  startPoints.corridors.forEach(point => {
    console.log(`    - ${point.label} (${point.nodeId})`);
  });
  
  return startPoints;
}

// Example 3: Select end points only
function exampleEndPoints() {
  const graph = {
    nodes: [
      {
        id: "NODE_room_125_220_0",
        type: "room",
        position: { x: 125, y: 220 },
        connections: [],
        metadata: { roomId: "ROOM_101", label: "101" }
      },
      {
        id: "NODE_room_225_220_0",
        type: "room",
        position: { x: 225, y: 220 },
        connections: [],
        metadata: { roomId: "ROOM_102", label: "102" }
      }
    ],
    edges: [],
    roomMappings: [
      { roomId: "ROOM_101", nodeId: "NODE_room_125_220_0", position: { x: 125, y: 220 } },
      { roomId: "ROOM_102", nodeId: "NODE_room_225_220_0", position: { x: 225, y: 220 } }
    ],
    bounds: { x: 0, y: 0, width: 500, height: 400 }
  };
  
  const scanResult = {
    rooms: [
      { id: "ROOM_101", bounds: { x: 100, y: 200, width: 50, height: 40 }, type: "room", label: "101" },
      { id: "ROOM_102", bounds: { x: 200, y: 200, width: 50, height: 40 }, type: "office", label: "Office 102" },
      { id: "ROOM_WASHROOM", bounds: { x: 300, y: 200, width: 30, height: 30 }, type: "washroom", label: "Washroom" }
    ],
    paths: [],
    metadata: {}
  };
  
  const endPoints = getAllEndPoints(graph, scanResult);
  
  console.log('End Points:');
  console.log(`  Rooms: ${endPoints.rooms.length}`);
  endPoints.rooms.forEach(point => {
    console.log(`    - ${point.label} (${point.nodeId})`);
  });
  
  console.log(`  Offices: ${endPoints.offices.length}`);
  endPoints.offices.forEach(point => {
    console.log(`    - ${point.label} (${point.nodeId})`);
  });
  
  console.log(`  Facilities: ${endPoints.facilities.length}`);
  endPoints.facilities.forEach(point => {
    console.log(`    - ${point.label} (${point.nodeId}) - ${point.metadata.facilityType}`);
  });
  
  return endPoints;
}

// Example 4: Find specific point
function exampleFindPoint() {
  const graph = {
    nodes: [
      {
        id: "NODE_room_125_220_0",
        type: "room",
        position: { x: 125, y: 220 },
        connections: [],
        metadata: { roomId: "ROOM_101", label: "101" }
      }
    ],
    edges: [],
    roomMappings: [
      { roomId: "ROOM_101", nodeId: "NODE_room_125_220_0", position: { x: 125, y: 220 } }
    ],
    bounds: { x: 0, y: 0, width: 500, height: 400 }
  };
  
  const scanResult = {
    rooms: [
      { id: "ROOM_101", bounds: { x: 100, y: 200, width: 50, height: 40 }, type: "room", label: "101" }
    ],
    paths: [],
    metadata: {}
  };
  
  const navigationPoints = selectNavigationPoints(graph, scanResult);
  
  // Find by nodeId
  const point1 = findPoint(navigationPoints.endPoints.all, "NODE_room_125_220_0");
  console.log('Find by nodeId:');
  console.log(`  Found: ${point1 ? point1.label : 'Not found'}`);
  
  // Find by label
  const point2 = findPoint(navigationPoints.endPoints.all, "101");
  console.log('Find by label:');
  console.log(`  Found: ${point2 ? point2.label : 'Not found'}`);
  
  // Find by roomId
  const point3 = findPoint(navigationPoints.endPoints.all, "ROOM_101");
  console.log('Find by roomId:');
  console.log(`  Found: ${point3 ? point3.label : 'Not found'}`);
  
  return { point1, point2, point3 };
}

// Example 5: Verify node mapping
function exampleVerifyMapping() {
  const graph = {
    nodes: [
      { id: "NODE_valid", type: "room", position: { x: 100, y: 100 }, connections: [] },
      { id: "NODE_isolated", type: "room", position: { x: 200, y: 200 }, connections: [] }
    ],
    edges: [],
    roomMappings: [],
    bounds: { x: 0, y: 0, width: 500, height: 400 }
  };
  
  const points = [
    { nodeId: "NODE_valid", label: "Valid Point", position: { x: 100, y: 100 } },
    { nodeId: "NODE_invalid", label: "Invalid Point", position: { x: 300, y: 300 } },
    { nodeId: "NODE_isolated", label: "Isolated Point", position: { x: 200, y: 200 } }
  ];
  
  const validation = validatePointMapping(points, graph);
  
  console.log('Point Mapping Validation:');
  console.log(`  Valid: ${validation.valid}`);
  console.log(`  Errors: ${validation.errors.length}`);
  validation.errors.forEach(error => {
    console.log(`    - ${error}`);
  });
  console.log(`  Warnings: ${validation.warnings.length}`);
  validation.warnings.forEach(warning => {
    console.log(`    - ${warning}`);
  });
  
  return validation;
}

// Run examples
if (require.main === module) {
  console.log('=== Example 1: Select All Points ===');
  exampleSelectAllPoints();
  
  console.log('\n=== Example 2: Start Points Only ===');
  exampleStartPoints();
  
  console.log('\n=== Example 3: End Points Only ===');
  exampleEndPoints();
  
  console.log('\n=== Example 4: Find Specific Point ===');
  exampleFindPoint();
  
  console.log('\n=== Example 5: Verify Node Mapping ===');
  exampleVerifyMapping();
}

module.exports = {
  exampleSelectAllPoints,
  exampleStartPoints,
  exampleEndPoints,
  exampleFindPoint,
  exampleVerifyMapping
};

