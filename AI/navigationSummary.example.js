/**
 * Example usage of Navigation Summary Generator
 * 
 * Demonstrates how to generate clear, text-based summaries.
 */

const { generateNavigationSummary, generateCompactSummary } = require('./navigationSummary');

// Example 1: Full summary with path
function exampleFullSummary() {
  // Mock scan result
  const scanResult = {
    rooms: [
      { id: "ROOM_101", bounds: { x: 100, y: 200, width: 50, height: 40 }, type: "room", label: "101" },
      { id: "ROOM_102", bounds: { x: 200, y: 200, width: 50, height: 40 }, type: "room", label: "102" },
      { id: "ROOM_103", bounds: { x: 300, y: 200, width: 50, height: 40 }, type: "office", label: "Office 103" }
    ],
    paths: [
      {
        id: "PATH_001",
        type: "corridor",
        segments: [
          { start: { x: 150, y: 220 }, end: { x: 250, y: 220 } },
          { start: { x: 250, y: 220 }, end: { x: 350, y: 220 } }
        ]
      }
    ],
    metadata: {
      source: "example-floor.svg",
      timestamp: new Date().toISOString(),
      version: "1.0.0"
    }
  };
  
  // Mock navigation graph
  const navigationGraph = {
    nodes: [
      { id: "NODE_exit_0_0", type: "exit", position: { x: 0, y: 0 }, connections: ["NODE_corridor_50_0"] },
      { id: "NODE_corridor_50_0", type: "corridor", position: { x: 50, y: 0 }, connections: ["NODE_exit_0_0", "NODE_room_125_220_0"] },
      { id: "NODE_room_125_220_0", type: "room", position: { x: 125, y: 220 }, connections: ["NODE_corridor_50_0"] }
    ],
    edges: [
      { id: "E1", from: "NODE_exit_0_0", to: "NODE_corridor_50_0", distance: 50, bidirectional: true },
      { id: "E2", from: "NODE_corridor_50_0", to: "NODE_room_125_220_0", distance: 220.2, bidirectional: true }
    ],
    roomMappings: [
      { roomId: "ROOM_101", nodeId: "NODE_room_125_220_0", position: { x: 125, y: 220 } }
    ],
    bounds: { x: 0, y: 0, width: 500, height: 400 },
    metadata: {
      source: "example-floor.svg"
    }
  };
  
  // Mock navigation points
  const navigationPoints = {
    startPoints: {
      entrances: [
        { nodeId: "NODE_exit_0_0", type: "entrance", position: { x: 0, y: 0 }, label: "Main Entrance" }
      ],
      staircases: [],
      lifts: [],
      corridors: [
        { nodeId: "NODE_corridor_50_0", type: "corridor", position: { x: 50, y: 0 }, label: "Corridor NODE_corridor_50_0" }
      ],
      all: [
        { nodeId: "NODE_exit_0_0", type: "entrance", position: { x: 0, y: 0 }, label: "Main Entrance" },
        { nodeId: "NODE_corridor_50_0", type: "corridor", position: { x: 50, y: 0 }, label: "Corridor NODE_corridor_50_0" }
      ]
    },
    endPoints: {
      rooms: [
        { nodeId: "NODE_room_125_220_0", type: "room", position: { x: 125, y: 220 }, label: "101", metadata: { roomId: "ROOM_101" } }
      ],
      offices: [],
      facilities: [],
      all: [
        { nodeId: "NODE_room_125_220_0", type: "room", position: { x: 125, y: 220 }, label: "101", metadata: { roomId: "ROOM_101" } }
      ]
    },
    validation: {
      startPointsValid: true,
      endPointsValid: true,
      errors: []
    }
  };
  
  // Mock path result
  const pathResult = {
    success: true,
    path: ["NODE_exit_0_0", "NODE_corridor_50_0", "NODE_room_125_220_0"],
    length: 270.2,
    stepCount: 3,
    metadata: {
      startNode: "NODE_exit_0_0",
      endNode: "NODE_room_125_220_0",
      algorithm: "A*"
    }
  };
  
  // Generate summary
  const summary = generateNavigationSummary(
    scanResult,
    navigationGraph,
    navigationPoints,
    pathResult,
    {
      includeDetails: true,
      includePathDetails: true
    }
  );
  
  console.log('Full Summary:');
  console.log(summary.text);
  
  return summary;
}

// Example 2: Summary without path
function exampleSummaryWithoutPath() {
  const scanResult = {
    rooms: [
      { id: "ROOM_101", bounds: { x: 100, y: 200, width: 50, height: 40 }, type: "room", label: "101" }
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
    metadata: { source: "example" }
  };
  
  const navigationGraph = {
    nodes: [
      { id: "NODE_A", type: "room", position: { x: 100, y: 100 }, connections: [] }
    ],
    edges: [],
    roomMappings: [],
    bounds: { x: 0, y: 0, width: 500, height: 400 },
    metadata: { source: "example" }
  };
  
  const navigationPoints = {
    startPoints: {
      entrances: [],
      staircases: [],
      lifts: [],
      corridors: [],
      all: []
    },
    endPoints: {
      rooms: [],
      offices: [],
      facilities: [],
      all: []
    },
    validation: {
      startPointsValid: true,
      endPointsValid: true,
      errors: []
    }
  };
  
  const summary = generateNavigationSummary(
    scanResult,
    navigationGraph,
    navigationPoints,
    null  // No path
  );
  
  console.log('Summary Without Path:');
  console.log(summary.text);
  
  return summary;
}

// Example 3: Compact summary
function exampleCompactSummary() {
  const scanResult = {
    rooms: [
      { id: "ROOM_101", bounds: { x: 100, y: 200, width: 50, height: 40 }, type: "room", label: "101" },
      { id: "ROOM_102", bounds: { x: 200, y: 200, width: 50, height: 40 }, type: "room", label: "102" }
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
    metadata: { source: "example" }
  };
  
  const navigationGraph = {
    nodes: [
      { id: "NODE_A", type: "room", position: { x: 100, y: 100 }, connections: [] }
    ],
    edges: [],
    roomMappings: [],
    bounds: { x: 0, y: 0, width: 500, height: 400 },
    metadata: { source: "example" }
  };
  
  const navigationPoints = {
    startPoints: {
      entrances: [{ nodeId: "NODE_A", type: "entrance", position: { x: 0, y: 0 } }],
      staircases: [],
      lifts: [],
      corridors: [],
      all: [{ nodeId: "NODE_A", type: "entrance", position: { x: 0, y: 0 } }]
    },
    endPoints: {
      rooms: [{ nodeId: "NODE_A", type: "room", position: { x: 100, y: 100 }, label: "101" }],
      offices: [],
      facilities: [],
      all: [{ nodeId: "NODE_A", type: "room", position: { x: 100, y: 100 }, label: "101" }]
    },
    validation: {
      startPointsValid: true,
      endPointsValid: true,
      errors: []
    }
  };
  
  const pathResult = {
    success: true,
    path: ["NODE_A"],
    length: 0,
    stepCount: 1,
    metadata: {
      startNode: "NODE_A",
      endNode: "NODE_A",
      algorithm: "A*"
    }
  };
  
  const fullSummary = generateNavigationSummary(
    scanResult,
    navigationGraph,
    navigationPoints,
    pathResult
  );
  
  const compact = generateCompactSummary(fullSummary.summary);
  
  console.log('Compact Summary:');
  console.log(compact);
  
  return compact;
}

// Example 4: Summary with no path found
function exampleNoPathFound() {
  const scanResult = {
    rooms: [{ id: "ROOM_101", bounds: { x: 100, y: 200, width: 50, height: 40 }, type: "room", label: "101" }],
    paths: [],
    metadata: { source: "example" }
  };
  
  const navigationGraph = {
    nodes: [
      { id: "NODE_A", type: "exit", position: { x: 0, y: 0 }, connections: [] },
      { id: "NODE_B", type: "room", position: { x: 200, y: 200 }, connections: [] }
    ],
    edges: [],
    roomMappings: [],
    bounds: { x: 0, y: 0, width: 500, height: 400 },
    metadata: { source: "example" }
  };
  
  const navigationPoints = {
    startPoints: {
      entrances: [{ nodeId: "NODE_A", type: "entrance", position: { x: 0, y: 0 } }],
      staircases: [],
      lifts: [],
      corridors: [],
      all: [{ nodeId: "NODE_A", type: "entrance", position: { x: 0, y: 0 } }]
    },
    endPoints: {
      rooms: [{ nodeId: "NODE_B", type: "room", position: { x: 200, y: 200 }, label: "101" }],
      offices: [],
      facilities: [],
      all: [{ nodeId: "NODE_B", type: "room", position: { x: 200, y: 200 }, label: "101" }]
    },
    validation: {
      startPointsValid: true,
      endPointsValid: true,
      errors: []
    }
  };
  
  const pathResult = {
    success: false,
    path: [],
    error: "No path found between start and end points",
    metadata: {
      startNode: "NODE_A",
      endNode: "NODE_B",
      algorithm: "A*"
    }
  };
  
  const summary = generateNavigationSummary(
    scanResult,
    navigationGraph,
    navigationPoints,
    pathResult
  );
  
  console.log('Summary with No Path Found:');
  console.log(summary.text);
  
  return summary;
}

// Run examples
if (require.main === module) {
  console.log('=== Example 1: Full Summary ===\n');
  exampleFullSummary();
  
  console.log('\n=== Example 2: Summary Without Path ===\n');
  exampleSummaryWithoutPath();
  
  console.log('\n=== Example 3: Compact Summary ===\n');
  exampleCompactSummary();
  
  console.log('\n=== Example 4: No Path Found ===\n');
  exampleNoPathFound();
}

module.exports = {
  exampleFullSummary,
  exampleSummaryWithoutPath,
  exampleCompactSummary,
  exampleNoPathFound
};

