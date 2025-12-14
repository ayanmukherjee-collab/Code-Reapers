/**
 * Test Visualization and Generate HTML Renderer
 * 
 * This script:
 * 1. Tests visualization data generation
 * 2. Exports JSON data
 * 3. Copies HTML renderer to output location
 * 
 * Run with: node AI/testAndRender.js
 */

const path = require('path');
const fs = require('fs');

// Try to load modules
let generateVisualizationDataFromScan;

try {
  const vizGen = require('./visualizationDataGenerator');
  generateVisualizationDataFromScan = vizGen.generateVisualizationDataFromScan;
} catch (error) {
  console.error('❌ Could not load visualizationDataGenerator:', error.message);
  process.exit(1);
}

// Load sample data
function loadSampleData() {
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
    process.exit(1);
  }
  
  try {
    const data = JSON.parse(fs.readFileSync(samplePath, 'utf8'));
    console.log('✅ Sample data loaded');
    return data;
  } catch (error) {
    console.error('❌ Error loading sample data:', error.message);
    process.exit(1);
  }
}

// Main function
function main() {
  console.log('\n' + '='.repeat(60));
  console.log('VISUALIZATION TEST & RENDER SETUP');
  console.log('='.repeat(60) + '\n');

  // Step 1: Load data
  console.log('Step 1: Loading sample floor plan...');
  const scanResult = loadSampleData();
  console.log(`   ✅ Loaded ${scanResult.rooms.length} rooms, ${scanResult.paths.length} paths\n`);

  // Step 2: Generate visualization
  console.log('Step 2: Generating visualization data...');
  const visualizationData = generateVisualizationDataFromScan(scanResult, {
    includeLabels: true,
    defaultColors: true,
    pathColor: '#FF0000',
    pathStrokeWidth: 2
  });
  console.log(`   ✅ Generated: ${visualizationData.rooms.length} rooms, ${visualizationData.paths.length} paths\n`);

  // Step 3: Verify
  console.log('Step 3: Verifying data...');
  const allRed = visualizationData.paths.every(path => path.color === '#FF0000');
  const validRooms = visualizationData.rooms.every(room => 
    room.bounds.width > 0 && room.bounds.height > 0
  );
  
  console.log(`   ${allRed ? '✅' : '❌'} All paths are red`);
  console.log(`   ${validRooms ? '✅' : '❌'} All rooms have valid bounds\n`);

  // Step 4: Export JSON
  console.log('Step 4: Exporting data...');
  const outputDir = path.join(__dirname, '..');
  const jsonPath = path.join(outputDir, 'visualization-output.json');
  const htmlPath = path.join(outputDir, 'renderVisualization.html');
  
  try {
    fs.writeFileSync(jsonPath, JSON.stringify(visualizationData, null, 2));
    console.log(`   ✅ Saved: ${jsonPath}`);
  } catch (error) {
    console.error(`   ❌ Error saving JSON: ${error.message}`);
    process.exit(1);
  }

  // Step 5: Copy HTML renderer
  console.log('\nStep 5: Setting up HTML renderer...');
  const htmlSource = path.join(__dirname, 'renderVisualization.html');
  
  if (fs.existsSync(htmlSource)) {
    try {
      const htmlContent = fs.readFileSync(htmlSource, 'utf8');
      fs.writeFileSync(htmlPath, htmlContent);
      console.log(`   ✅ Saved: ${htmlPath}`);
    } catch (error) {
      console.error(`   ❌ Error copying HTML: ${error.message}`);
    }
  } else {
    console.log(`   ⚠️  HTML renderer not found at ${htmlSource}`);
  }

  // Final instructions
  console.log('\n' + '='.repeat(60));
  console.log('✅ SETUP COMPLETE!');
  console.log('='.repeat(60));
  console.log('\nTo view the visualization:');
  console.log('  1. Open renderVisualization.html in your web browser');
  console.log('  2. Or start a local server:');
  console.log('     python -m http.server 8000');
  console.log('     Then open: http://localhost:8000/renderVisualization.html');
  console.log('\nFiles created:');
  console.log(`  - ${jsonPath}`);
  console.log(`  - ${htmlPath}`);
  console.log('='.repeat(60) + '\n');
}

// Run
main();

