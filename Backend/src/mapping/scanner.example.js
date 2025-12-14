/**
 * Example usage of the Floor Plan Scanner
 * 
 * This demonstrates how to use the scanner to convert floor plans
 * into structured data for navigation graph building.
 */

const { scanFloorPlan } = require('./scanner');

// Example 1: Scan SVG floor plan
function exampleSVGScan() {
  const svgInput = `
    <svg width="500" height="400">
      <rect x="100" y="200" width="50" height="40" class="room" id="ROOM_101"/>
      <text x="125" y="225">101</text>
      <rect x="200" y="200" width="50" height="40" class="room" id="ROOM_102"/>
      <text x="225" y="225">102</text>
      <path d="M 150 220 L 250 220" class="corridor" stroke-width="10"/>
    </svg>
  `;
  
  const result = scanFloorPlan(svgInput, { source: 'example-floor.svg' });
  
  console.log('Scan Result:');
  console.log(JSON.stringify(result, null, 2));
  
  // Expected output:
  // - 2 rooms (ROOM_101, ROOM_102) with labels
  // - 1 path (corridor connecting them)
  // - Deterministic IDs based on bounds
}

// Example 2: Scan JSON floor plan
function exampleJSONScan() {
  const jsonInput = {
    rooms: [
      {
        id: "ROOM_101",
        x: 100,
        y: 200,
        width: 50,
        height: 40,
        label: "101"
      },
      {
        id: "ROOM_102",
        x: 200,
        y: 200,
        width: 50,
        height: 40,
        label: "102"
      }
    ],
    corridors: [
      {
        id: "CORR_001",
        points: [[150, 220], [250, 220]],
        width: 10
      }
    ]
  };
  
  const result = scanFloorPlan(jsonInput, { source: 'example-floor.json' });
  
  console.log('Scan Result:');
  console.log(JSON.stringify(result, null, 2));
}

// Example 3: Verify determinism
function exampleDeterminism() {
  const svgInput = `
    <svg width="500" height="400">
      <rect x="100" y="200" width="50" height="40" class="room"/>
      <rect x="200" y="200" width="50" height="40" class="room"/>
    </svg>
  `;
  
  // Run scan twice
  const result1 = scanFloorPlan(svgInput, { source: 'test.svg' });
  const result2 = scanFloorPlan(svgInput, { source: 'test.svg' });
  
  // Results should be identical (except timestamp)
  const ids1 = result1.rooms.map(r => r.id).sort();
  const ids2 = result2.rooms.map(r => r.id).sort();
  
  console.log('Determinism test:');
  console.log('First scan room IDs:', ids1);
  console.log('Second scan room IDs:', ids2);
  console.log('IDs match:', JSON.stringify(ids1) === JSON.stringify(ids2));
  
  // Expected: true (same input → same IDs)
}

// Example 4: Handle partial results
function examplePartialResults() {
  const svgInput = `
    <svg width="500" height="400">
      <!-- Room without explicit class - lower confidence -->
      <rect x="100" y="200" width="50" height="40"/>
      <!-- Very small rectangle - should be filtered out -->
      <rect x="200" y="200" width="5" height="5" class="room"/>
      <!-- Valid corridor -->
      <path d="M 150 220 L 300 220" class="corridor" stroke-width="10"/>
    </svg>
  `;
  
  const result = scanFloorPlan(svgInput, { source: 'partial-example.svg' });
  
  console.log('Partial Results:');
  console.log('Rooms found:', result.rooms.length);
  console.log('Paths found:', result.paths.length);
  console.log('Warnings:', result.warnings);
  console.log('Confidence scores:', result.rooms.map(r => r.confidence));
  
  // Expected:
  // - 1 room (small one filtered out)
  // - 1 path
  // - Warnings about low confidence or missing data
}

// Run examples
if (require.main === module) {
  console.log('=== Example 1: SVG Scan ===');
  exampleSVGScan();
  
  console.log('\n=== Example 2: JSON Scan ===');
  exampleJSONScan();
  
  console.log('\n=== Example 3: Determinism Test ===');
  exampleDeterminism();
  
  console.log('\n=== Example 4: Partial Results ===');
  examplePartialResults();
}

module.exports = {
  exampleSVGScan,
  exampleJSONScan,
  exampleDeterminism,
  examplePartialResults
};

