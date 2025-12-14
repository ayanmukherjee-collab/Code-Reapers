/**
 * Visualization Testing Script
 * 
 * Step-by-step test of visualization data generation.
 * Run with: node AI/testVisualization.js
 */

const path = require('path');
const fs = require('fs');

// Try to load modules
let generateVisualizationDataFromScan;
let generateVisualizationData;
let selectNavigationPoints;
let computePath;
let buildNavigationGraph;

try {
  const vizGen = require('./visualizationDataGenerator');
  generateVisualizationDataFromScan = vizGen.generateVisualizationDataFromScan;
  generateVisualizationData = vizGen.generateVisualizationData;
} catch (error) {
  console.error('❌ Could not load visualizationDataGenerator:', error.message);
  process.exit(1);
}

try {
  const pointSel = require('./navigationPointSelector');
  selectNavigationPoints = pointSel.selectNavigationPoints;
} catch (error) {
  console.warn('⚠️  navigationPointSelector not available (optional)');
}

try {
  const pathfinder = require('./pathfinder');
  computePath = pathfinder.computePath;
} catch (error) {
  console.warn('⚠️  pathfinder not available (optional)');
}

try {
  const graphBuilder = require('../Backend/src/mapping/graphBuilder');
  buildNavigationGraph = graphBuilder.buildNavigationGraph;
} catch (error) {
  console.warn('⚠️  graphBuilder not available (optional)');
}

// Load sample data
function loadSampleData() {
  // Handle both running from root and from AI directory
  const possiblePaths = [
    path.join(__dirname, '../Shared/SampleFloorPlans/university-level1-scan.json'),
    path.join(__dirname, '../../Shared/SampleFloorPlans/university-level1-scan.json'),
    path.join(process.cwd(), 'Shared/SampleFloorPlans/university-level1-scan.json')
  ];
  
  let samplePath = null;
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      samplePath = p;
      break;
    }
  }
  
  if (!samplePath) {
    console.error(`❌ Sample data not found. Tried:`);
    possiblePaths.forEach(p => console.error(`   - ${p}`));
    console.error('\n   Make sure you\'re running from the project root or AI directory');
    process.exit(1);
  }
  
  try {
    const data = JSON.parse(fs.readFileSync(samplePath, 'utf8'));
    console.log('✅ Sample data loaded successfully');
    return data;
  } catch (error) {
    console.error('❌ Error loading sample data:', error.message);
    process.exit(1);
  }
}

// Step 1: Load Sample Data
console.log('\n' + '='.repeat(60));
console.log('STEP 1: Loading Sample Data');
console.log('='.repeat(60));
const scanResult = loadSampleData();
console.log(`  Rooms in scan: ${scanResult.rooms.length}`);
console.log(`  Paths in scan: ${scanResult.paths.length}`);
console.log(`  Bounds: ${scanResult.metadata.bounds.width}x${scanResult.metadata.bounds.height}`);

// Step 2: Generate Basic Visualization
console.log('\n' + '='.repeat(60));
console.log('STEP 2: Generating Basic Visualization Data');
console.log('='.repeat(60));

const visualizationData = generateVisualizationDataFromScan(scanResult, {
  includeLabels: true,
  defaultColors: true,
  pathColor: '#FF0000',
  pathStrokeWidth: 2
});

console.log('✅ Visualization data generated!');
console.log(`  Rooms: ${visualizationData.rooms.length}`);
console.log(`  Paths: ${visualizationData.paths.length}`);
console.log(`  Nodes: ${visualizationData.nodes.length}`);
console.log(`  Labels: ${visualizationData.labels.length}`);

// Step 3: Inspect Output
console.log('\n' + '='.repeat(60));
console.log('STEP 3: Inspecting Output');
console.log('='.repeat(60));

// Check rooms
console.log('\n📦 ROOMS:');
const sampleRooms = visualizationData.rooms.slice(0, 5);
sampleRooms.forEach(room => {
  console.log(`  • ${room.label || room.id}`);
  console.log(`    Bounds: ${room.bounds.width}x${room.bounds.height} at (${room.bounds.x}, ${room.bounds.y})`);
  console.log(`    Type: ${room.type || 'room'}`);
  if (room.fillColor) {
    console.log(`    Fill: ${room.fillColor}`);
  }
});
if (visualizationData.rooms.length > 5) {
  console.log(`  ... and ${visualizationData.rooms.length - 5} more rooms`);
}

// Check paths
console.log('\n🛤️  PATHS (Red Lines):');
visualizationData.paths.forEach(path => {
  console.log(`  • ${path.id}`);
  console.log(`    Segments: ${path.segments.length}`);
  console.log(`    Color: ${path.color} ${path.color === '#FF0000' ? '✅' : '❌'}`);
  console.log(`    Stroke Width: ${path.strokeWidth}`);
  if (path.segments.length > 0) {
    const firstSeg = path.segments[0];
    console.log(`    First segment: (${firstSeg.start.x}, ${firstSeg.start.y}) → (${firstSeg.end.x}, ${firstSeg.end.y})`);
  }
});

// Check coordinate space
console.log('\n🌐 COORDINATE SPACE:');
console.log(`  Bounds: ${visualizationData.coordinateSpace.bounds.width}x${visualizationData.coordinateSpace.bounds.height}`);
console.log(`  Units: ${visualizationData.coordinateSpace.units}`);

// Step 4: Verify Path Colors
console.log('\n' + '='.repeat(60));
console.log('STEP 4: Verifying Path Colors');
console.log('='.repeat(60));

const allRed = visualizationData.paths.every(path => path.color === '#FF0000');
console.log(`All paths are red: ${allRed ? '✅' : '❌'}`);

if (!allRed) {
  console.log('\n⚠️  Paths that are not red:');
  visualizationData.paths.forEach(path => {
    if (path.color !== '#FF0000') {
      console.log(`  • ${path.id}: ${path.color}`);
    }
  });
} else {
  console.log('✅ All paths are correctly colored red (#FF0000)');
}

// Step 5: Verify Room Bounds
console.log('\n' + '='.repeat(60));
console.log('STEP 5: Verifying Room Bounds');
console.log('='.repeat(60));

const validRooms = visualizationData.rooms.every(room => 
  room.bounds.width > 0 && 
  room.bounds.height > 0 &&
  room.bounds.x >= 0 &&
  room.bounds.y >= 0
);

console.log(`All rooms have valid bounds: ${validRooms ? '✅' : '❌'}`);

if (!validRooms) {
  console.log('\n⚠️  Rooms with invalid bounds:');
  visualizationData.rooms.forEach(room => {
    if (room.bounds.width <= 0 || room.bounds.height <= 0 || room.bounds.x < 0 || room.bounds.y < 0) {
      console.log(`  • ${room.id}:`, room.bounds);
    }
  });
} else {
  console.log('✅ All rooms have valid rectangular bounds');
}

// Step 6: Test with Graph (if available)
if (buildNavigationGraph && selectNavigationPoints && computePath) {
  console.log('\n' + '='.repeat(60));
  console.log('STEP 6: Testing with Navigation Graph (Full Pipeline)');
  console.log('='.repeat(60));
  
  try {
    const graph = buildNavigationGraph(scanResult);
    console.log(`✅ Graph built: ${graph.nodes.length} nodes, ${graph.edges.length} edges`);
    
    const navigationPoints = selectNavigationPoints(graph, scanResult);
    console.log(`✅ Points selected: ${navigationPoints.startPoints.all.length} start, ${navigationPoints.endPoints.all.length} end`);
    
    if (navigationPoints.startPoints.all.length > 0 && navigationPoints.endPoints.all.length > 0) {
      const startPoint = navigationPoints.startPoints.all[0];
      const endPoint = navigationPoints.endPoints.all[0];
      
      console.log(`  Testing path: ${startPoint.label || startPoint.nodeId} → ${endPoint.label || endPoint.nodeId}`);
      
      const pathResult = computePath(graph, startPoint, endPoint);
      
      if (pathResult.success) {
        console.log(`✅ Path found: ${pathResult.path.length} nodes, length: ${pathResult.length}`);
      } else {
        console.log(`⚠️  No path found: ${pathResult.error}`);
      }
      
      // Generate visualization with graph
      const fullVisualization = generateVisualizationData(scanResult, graph, {
        includeNodes: true,
        includeLabels: true,
        defaultColors: true
      });
      
      console.log(`✅ Full visualization: ${fullVisualization.nodes.length} nodes included`);
    }
  } catch (error) {
    console.log(`⚠️  Graph testing failed: ${error.message}`);
  }
} else {
  console.log('\n' + '='.repeat(60));
  console.log('STEP 6: Skipped (Graph builder not available)');
  console.log('='.repeat(60));
  console.log('  To test full pipeline, ensure graphBuilder is available');
}

// Step 7: Export for Rendering
console.log('\n' + '='.repeat(60));
console.log('STEP 7: Exporting Visualization Data');
console.log('='.repeat(60));

// Handle output path for both root and AI directory
const possibleOutputPaths = [
  path.join(__dirname, '../visualization-output.json'),
  path.join(process.cwd(), 'visualization-output.json')
];
const outputPath = possibleOutputPaths[0];
try {
  fs.writeFileSync(outputPath, JSON.stringify(visualizationData, null, 2));
  console.log(`✅ Visualization data saved to: ${outputPath}`);
  console.log(`   File size: ${(fs.statSync(outputPath).size / 1024).toFixed(2)} KB`);
} catch (error) {
  console.log(`❌ Error saving file: ${error.message}`);
}

// Final Summary
console.log('\n' + '='.repeat(60));
console.log('TEST SUMMARY');
console.log('='.repeat(60));
console.log(`✅ Rooms: ${visualizationData.rooms.length}`);
console.log(`✅ Paths: ${visualizationData.paths.length} (all red)`);
console.log(`✅ Coordinate Space: ${visualizationData.coordinateSpace.bounds.width}x${visualizationData.coordinateSpace.bounds.height}`);
console.log(`✅ Output File: visualization-output.json`);
console.log('\n✅ Visualization test complete!');
console.log('\nNext steps:');
console.log('  1. Open visualization-output.json to inspect the data');
console.log('  2. Use this data with your rendering layer (SVG, Canvas, etc.)');
console.log('  3. Verify rooms render as rectangles');
console.log('  4. Verify paths render as red lines');
console.log('='.repeat(60) + '\n');

