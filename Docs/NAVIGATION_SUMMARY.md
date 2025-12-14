# 📊 Navigation Summary

**Purpose:** Produce a clear, text-based summary of the navigation data processing pipeline  
**Requirement:** Understandable without any UI  
**Format:** Human-readable text summary

---

## 🎯 Overview

After scan and navigation data are complete, generate a **clear summary** that includes:

- Number of rooms detected
- Number of path segments
- Available start points
- Selected end point
- Computed navigation path

This summary is **text-based** and **understandable without any UI**.

---

## 📋 Summary Contents

### **1. Scan Results**

- **Rooms Detected:** Total number of rooms found in scan
- **Path Segments:** Total number of path segments (sum of all segments in all paths)
- **Paths Detected:** Number of distinct paths found

### **2. Navigation Graph**

- **Total Nodes:** Number of nodes in the graph
- **Total Edges:** Number of edges in the graph
- **Room Mappings:** Number of room-to-node mappings

### **3. Available Start Points**

- **Entrances:** Number of entrance points
- **Staircases:** Number of staircase points
- **Lifts:** Number of elevator/lift points
- **Corridors:** Number of corridor points
- **Total:** Total number of start points
- **Details:** List of start points (optional)

### **4. Available End Points**

- **Rooms:** Number of room end points
- **Offices:** Number of office end points
- **Facilities:** Number of facility end points
- **Total:** Total number of end points
- **Details:** List of end points (optional)

### **5. Computed Navigation Path**

- **Status:** Path found or not found
- **Start Node:** Starting node ID
- **End Node:** Ending node ID
- **Path Length:** Total distance
- **Step Count:** Number of steps/nodes
- **Path Nodes:** Ordered list of node IDs (optional)

---

## 📝 Summary Format

### **Text Summary Example**

```
============================================================
NAVIGATION DATA SUMMARY
============================================================

SCAN RESULTS:
  Rooms Detected: 15
  Path Segments: 8
  Paths Detected: 3

NAVIGATION GRAPH:
  Total Nodes: 23
  Total Edges: 28
  Room Mappings: 15

AVAILABLE START POINTS:
  Entrances: 2
  Staircases: 1
  Lifts: 1
  Corridors: 8
  Total: 12

  Start Point Details:
    1. Main Entrance (entrance)
    2. Side Entrance (entrance)
    3. Staircase A (staircase)
    4. Elevator 1 (lift)
    5. Corridor NODE_corridor_50_0 (corridor)
    ... and 7 more

AVAILABLE END POINTS:
  Rooms: 10
  Offices: 3
  Facilities: 2
  Total: 15

  End Point Details:
    1. 101 (room)
    2. 102 (room)
    3. Office 201 (office)
    4. Washroom (facility)
    ... and 11 more

COMPUTED NAVIGATION PATH:
  Status: Path Found
  Start Node: NODE_exit_0_0
  End Node: NODE_room_125_220_0
  Path Length: 350.25
  Step Count: 4
  Node Count: 4

  Path Nodes:
   START: NODE_exit_0_0
       1: NODE_corridor_50_0
       2: NODE_corridor_150_0
      END: NODE_room_125_220_0

METADATA:
  Source: floor-plan.svg
  Timestamp: 2024-01-15T10:30:00.000Z

============================================================
```

### **Compact Summary Example**

```
15 rooms | 8 path segments | 12 start points | 15 end points | Path: 4 nodes, 350.3 units
```

---

## 🔧 Usage

### **Basic Usage**

```javascript
const { generateNavigationSummary } = require('./navigationSummary');

// After processing pipeline
const summary = generateNavigationSummary(
  scanResult,
  navigationGraph,
  navigationPoints,
  pathResult
);

// Print text summary
console.log(summary.text);
```

### **With Options**

```javascript
const summary = generateNavigationSummary(
  scanResult,
  navigationGraph,
  navigationPoints,
  pathResult,
  {
    includeDetails: true,      // Include point lists
    includePathDetails: true,  // Include path node list
    format: 'text'             // 'text' or 'json'
  }
);
```

### **Without Path**

```javascript
// Generate summary before path computation
const summary = generateNavigationSummary(
  scanResult,
  navigationGraph,
  navigationPoints,
  null  // No path result yet
);
```

---

## 📊 Summary Structure

### **Structured Data**

```typescript
interface NavigationSummary {
  scan: {
    roomsDetected: number;
    pathSegments: number;
    pathsDetected: number;
  };
  graph: {
    totalNodes: number;
    totalEdges: number;
    roomMappings: number;
  };
  startPoints: {
    entrances: number;
    staircases: number;
    lifts: number;
    corridors: number;
    total: number;
    list?: StartPoint[];  // Optional details
  };
  endPoints: {
    rooms: number;
    offices: number;
    facilities: number;
    total: number;
    list?: EndPoint[];  // Optional details
  };
  path: {
    found: boolean;
    nodeCount: number;
    length?: number;
    stepCount?: number;
    path: string[];
    startNode?: string;
    endNode?: string;
    error?: string;
  } | null;
  metadata: {
    timestamp: string;
    source: string;
  };
}
```

---

## ✅ Summary Features

### **Clear and Readable**

- ✅ **Section headers** for easy scanning
- ✅ **Indented structure** for hierarchy
- ✅ **Number formatting** for readability
- ✅ **Status indicators** (Path Found/Not Found)

### **Comprehensive**

- ✅ **All key metrics** included
- ✅ **Optional details** for deeper inspection
- ✅ **Path visualization** (node list)
- ✅ **Metadata** for traceability

### **No UI Required**

- ✅ **Plain text** format
- ✅ **Console-friendly** output
- ✅ **Loggable** to files
- ✅ **Shareable** via text

---

## 📝 Example Outputs

### **Successful Path**

```
COMPUTED NAVIGATION PATH:
  Status: Path Found
  Start Node: NODE_exit_0_0
  End Node: NODE_room_125_220_0
  Path Length: 350.25
  Step Count: 4
  Node Count: 4

  Path Nodes:
   START: NODE_exit_0_0
       1: NODE_corridor_50_0
       2: NODE_corridor_150_0
      END: NODE_room_125_220_0
```

### **No Path Found**

```
COMPUTED NAVIGATION PATH:
  Status: No Path Found
  Error: No path found between start and end points
  Start Node: NODE_exit_0_0
  End Node: NODE_room_125_220_0
```

### **Path Not Computed**

```
COMPUTED NAVIGATION PATH:
  Status: Not Computed
```

---

## 🎯 Use Cases

### **1. Debugging**

Check if scan/graph/pathfinding worked correctly:

```javascript
const summary = generateNavigationSummary(...);
console.log(summary.text);
// Quickly see if rooms were detected, graph was built, path was found
```

### **2. Logging**

Save summary to log file:

```javascript
const summary = generateNavigationSummary(...);
fs.writeFileSync('navigation-summary.txt', summary.text);
```

### **3. Reporting**

Include in reports or documentation:

```javascript
const summary = generateNavigationSummary(...);
report.addSection('Navigation Summary', summary.text);
```

### **4. Testing**

Verify pipeline output:

```javascript
const summary = generateNavigationSummary(...);
assert(summary.summary.scan.roomsDetected > 0, 'Should detect rooms');
assert(summary.summary.path.found, 'Should find path');
```

---

## ✅ Summary

**The summary provides:**
- ✅ Clear overview of scan results
- ✅ Graph statistics
- ✅ Available navigation points
- ✅ Computed path details
- ✅ Human-readable text format
- ✅ No UI required

**Perfect for debugging, logging, and reporting!** 📊

