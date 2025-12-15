# 🧪 Testing Visualization - Step by Step Guide

This guide walks you through testing the visualization system step by step.

---

## 📋 Prerequisites

1. **Node.js installed** (for running JavaScript)
2. **Sample floor plan data** (`Shared/SampleFloorPlans/university-level1-scan.json`)
3. **All AI modules** in place:
   - `AI/visualizationDataGenerator.js`
   - `AI/navigationPointSelector.js`
   - `AI/pathfinder.js`
   - `AI/navigationSummary.js`

---

## 🚀 Step-by-Step Testing

### **Step 1: Load Sample Data**

First, load the sample floor plan scan result:

```javascript
const scanResult = require('../Shared/SampleFloorPlans/university-level1-scan.json');
```

Or if using ES6 modules:

```javascript
import scanResult from '../Shared/SampleFloorPlans/university-level1-scan.json';
```

### **Step 2: Generate Visualization Data (Basic)**

Generate visualization data from the scan result:

```javascript
const { generateVisualizationDataFromScan } = require('./AI/visualizationDataGenerator');

const visualizationData = generateVisualizationDataFromScan(scanResult, {
  includeLabels: true,
  defaultColors: true,
  pathColor: '#FF0000',  // Red paths
  pathStrokeWidth: 2
});

console.log('Visualization Data Generated!');
console.log(`Rooms: ${visualizationData.rooms.length}`);
console.log(`Paths: ${visualizationData.paths.length}`);
```

### **Step 3: Inspect the Output**

Check what was generated:

```javascript
// Check rooms
console.log('\n=== ROOMS ===');
visualizationData.rooms.forEach(room => {
  console.log(`${room.label || room.id}: ${room.bounds.width}x${room.bounds.height} at (${room.bounds.x}, ${room.bounds.y})`);
});

// Check paths (should be red)
console.log('\n=== PATHS (Red Lines) ===');
visualizationData.paths.forEach(path => {
  console.log(`${path.id}: ${path.segments.length} segments, color: ${path.color}`);
  path.segments.forEach((seg, i) => {
    console.log(`  Segment ${i + 1}: (${seg.start.x}, ${seg.start.y}) → (${seg.end.x}, ${seg.end.y})`);
  });
});

// Check coordinate space
console.log('\n=== COORDINATE SPACE ===');
console.log(`Bounds: ${visualizationData.coordinateSpace.bounds.width}x${visualizationData.coordinateSpace.bounds.height}`);
console.log(`Units: ${visualizationData.coordinateSpace.units}`);
```

### **Step 4: Verify Path Colors**

Ensure all paths are red:

```javascript
const allRed = visualizationData.paths.every(path => path.color === '#FF0000');
console.log(`All paths are red: ${allRed ? '✅' : '❌'}`);

if (!allRed) {
  visualizationData.paths.forEach(path => {
    if (path.color !== '#FF0000') {
      console.log(`⚠️  Path ${path.id} is not red: ${path.color}`);
    }
  });
}
```

### **Step 5: Verify Room Rectangles**

Check that all rooms have valid bounds:

```javascript
const validRooms = visualizationData.rooms.every(room => 
  room.bounds.width > 0 && 
  room.bounds.height > 0 &&
  room.bounds.x >= 0 &&
  room.bounds.y >= 0
);

console.log(`All rooms have valid bounds: ${validRooms ? '✅' : '❌'}`);
```

### **Step 6: Test with Navigation Graph (Full Pipeline)**

If you have a navigation graph, test the full pipeline:

```javascript
const { buildNavigationGraph } = require('./Backend/src/mapping/graphBuilder'); // If available
const { selectNavigationPoints } = require('./AI/navigationPointSelector');
const { computePath } = require('./AI/pathfinder');
const { generateVisualizationData } = require('./AI/visualizationDataGenerator');

// 1. Build graph (if graph builder is available)
const graph = buildNavigationGraph(scanResult);

// 2. Select points
const navigationPoints = selectNavigationPoints(graph, scanResult);

// 3. Compute path
const startPoint = navigationPoints.startPoints.entrances[0];
const endPoint = navigationPoints.endPoints.rooms[0];
const pathResult = computePath(graph, startPoint, endPoint);

// 4. Generate visualization with graph
const visualizationData = generateVisualizationData(scanResult, graph, {
  includeNodes: true,
  includeLabels: true,
  defaultColors: true
});

console.log(`Nodes in visualization: ${visualizationData.nodes.length}`);
```

### **Step 7: Export for Rendering**

Export the visualization data for rendering:

```javascript
// Save as JSON
const fs = require('fs');
fs.writeFileSync(
  'visualization-output.json',
  JSON.stringify(visualizationData, null, 2)
);
console.log('✅ Visualization data saved to visualization-output.json');
```

### **Step 8: Visual Inspection (Manual)**

Open `visualization-output.json` and verify:

1. **Rooms** - Check that each room has:
   - `bounds` with x, y, width, height
   - `label` (if available)
   - `fillColor` and `strokeColor` (if defaultColors enabled)

2. **Paths** - Check that each path has:
   - `segments` array with start/end points
   - `color: "#FF0000"` (red)
   - `strokeWidth` (default: 2)

3. **Coordinate Space** - Check:
   - `bounds` matches scan result bounds
   - `units` is set (usually "pixels")

---

## 🧪 Quick Test Script

Run the complete test:

```bash
node AI/testVisualization.js
```

This will:
1. Load sample data
2. Generate visualization
3. Verify output
4. Print summary

---

## ✅ Expected Results

After running the test, you should see:

```
✅ Visualization Data Generated!
✅ Rooms: 20
✅ Paths: 6
✅ All paths are red: ✅
✅ All rooms have valid bounds: ✅
✅ Coordinate space: 1000x800 pixels
```

---

## 🐛 Troubleshooting

### **"Cannot find module"**

Make sure you're running from the project root:
```bash
cd /path/to/Code-Reapers
node AI/testVisualization.js
```

### **"No rooms found"**

Check that the scan result file exists:
```javascript
const scanResult = require('../Shared/SampleFloorPlans/university-level1-scan.json');
console.log('Rooms in scan:', scanResult.rooms.length);
```

### **"Paths not red"**

Verify path color is set:
```javascript
const visualizationData = generateVisualizationDataFromScan(scanResult, {
  pathColor: '#FF0000'  // Explicitly set red
});
```

---

## 📊 Next Steps

After testing visualization data generation:

1. **Render the data** using your rendering layer (SVG, Canvas, WebGL, etc.)
2. **Verify rendering** matches the data structure
3. **Test with different floor plans**
4. **Test edge cases** (empty data, single room, etc.)

---

**Ready to test! Follow the steps above.** 🚀

