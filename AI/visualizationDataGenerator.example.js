/**
 * Example usage of Visualization Data Generator
 * 
 * Demonstrates how to generate visualization-friendly data
 * from scan results and navigation graphs.
 */

const { generateVisualizationData, generateVisualizationDataFromScan } = require('./visualizationDataGenerator');

// Example 1: Generate visualization data from scan result
function exampleFromScan() {
  const scanResult = {
    rooms: [
      {
        id: "ROOM_101",
        bounds: { x: 100, y: 200, width: 50, height: 40 },
        type: "room",
        label: "101"
      },
      {
        id: "ROOM_102",
        bounds: { x: 200, y: 200, width: 50, height: 40 },
        type: "room",
        label: "102"
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
      source: "example-floor.svg",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      bounds: { x: 0, y: 0, width: 500, height: 400 }
    }
  };
  
  const visualizationData = generateVisualizationDataFromScan(scanResult, {
    includeLabels: true,
    defaultColors: true,
    pathColor: '#FF0000',
    pathStrokeWidth: 2
  });
  
  console.log('Visualization Data from Scan:');
  console.log(`  Rooms: ${visualizationData.rooms.length}`);
  console.log(`  Paths: ${visualizationData.paths.length}`);
  console.log(`  Nodes: ${visualizationData.nodes.length}`);
  console.log(`  Labels: ${visualizationData.labels.length}`);
  
  // Show sample room
  console.log('\nSample Room:');
  console.log(JSON.stringify(visualizationData.rooms[0], null, 2));
  
  // Show sample path (should be red)
  console.log('\nSample Path (red line):');
  console.log(JSON.stringify(visualizationData.paths[0], null, 2));
  
  return visualizationData;
}

// Example 2: Generate visualization data with graph
function exampleWithGraph() {
  const scanResult = {
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
    metadata: {
      source: "example-floor.svg",
      bounds: { x: 0, y: 0, width: 500, height: 400 }
    }
  };
  
  const navigationGraph = {
    nodes: [
      {
        id: "NODE_room_125_220_0",
        type: "room",
        position: { x: 125, y: 220 },
        connections: ["NODE_corridor_150_220_PATH_001_start_0"]
      },
      {
        id: "NODE_corridor_150_220_PATH_001_start_0",
        type: "corridor",
        position: { x: 150, y: 220 },
        connections: ["NODE_room_125_220_0", "NODE_corridor_300_220_PATH_001_end_0"]
      },
      {
        id: "NODE_corridor_300_220_PATH_001_end_0",
        type: "corridor",
        position: { x: 300, y: 220 },
        connections: ["NODE_corridor_150_220_PATH_001_start_0"]
      }
    ],
    edges: [],
    roomMappings: [
      {
        roomId: "ROOM_101",
        nodeId: "NODE_room_125_220_0",
        position: { x: 125, y: 220 }
      }
    ],
    bounds: { x: 0, y: 0, width: 500, height: 400 },
    metadata: {
      source: "example-floor.svg"
    }
  };
  
  const visualizationData = generateVisualizationData(scanResult, navigationGraph, {
    includeNodes: true,
    includeLabels: true,
    defaultColors: true,
    nodeRadius: 3
  });
  
  console.log('Visualization Data with Graph:');
  console.log(`  Rooms: ${visualizationData.rooms.length}`);
  console.log(`  Paths: ${visualizationData.paths.length} (red lines)`);
  console.log(`  Nodes: ${visualizationData.nodes.length}`);
  console.log(`  Labels: ${visualizationData.labels.length}`);
  
  // Show coordinate space
  console.log('\nCoordinate Space:');
  console.log(JSON.stringify(visualizationData.coordinateSpace, null, 2));
  
  // Show sample node
  console.log('\nSample Node:');
  console.log(JSON.stringify(visualizationData.nodes[0], null, 2));
  
  return visualizationData;
}

// Example 3: Custom styling
function exampleCustomStyling() {
  const scanResult = {
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
    metadata: {
      source: "example",
      bounds: { x: 0, y: 0, width: 500, height: 400 }
    }
  };
  
  const visualizationData = generateVisualizationDataFromScan(scanResult, {
    defaultColors: false,  // Don't add default colors
    pathColor: '#FF0000',  // Red paths
    pathStrokeWidth: 3     // Thicker lines
  });
  
  // Manually add custom colors
  visualizationData.rooms[0].fillColor = '#CCE5FF';
  visualizationData.rooms[0].strokeColor = '#0066CC';
  visualizationData.rooms[0].strokeWidth = 2;
  
  console.log('Custom Styled Visualization:');
  console.log(JSON.stringify(visualizationData.rooms[0], null, 2));
  console.log(JSON.stringify(visualizationData.paths[0], null, 2));
  
  return visualizationData;
}

// Example 4: Verify red paths
function exampleRedPaths() {
  const scanResult = {
    rooms: [],
    paths: [
      {
        id: "PATH_001",
        type: "corridor",
        segments: [
          { start: { x: 0, y: 0 }, end: { x: 100, y: 0 } }
        ]
      }
    ],
    metadata: {
      source: "test",
      bounds: { x: 0, y: 0, width: 500, height: 400 }
    }
  };
  
  const visualizationData = generateVisualizationDataFromScan(scanResult);
  
  console.log('Path Color Verification:');
  visualizationData.paths.forEach(path => {
    console.log(`  ${path.id}: color = ${path.color} (should be #FF0000 - red)`);
    console.log(`    strokeWidth = ${path.strokeWidth}`);
  });
  
  return visualizationData;
}

// Run examples
if (require.main === module) {
  console.log('=== Example 1: From Scan Only ===');
  exampleFromScan();
  
  console.log('\n=== Example 2: With Graph ===');
  exampleWithGraph();
  
  console.log('\n=== Example 3: Custom Styling ===');
  exampleCustomStyling();
  
  console.log('\n=== Example 4: Red Paths Verification ===');
  exampleRedPaths();
}

module.exports = {
  exampleFromScan,
  exampleWithGraph,
  exampleCustomStyling,
  exampleRedPaths
};

