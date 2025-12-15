# 🎯 Navigation Point Selection

**Purpose:** Define how start and end points are selected from the navigation graph  
**Requirement:** Each point must map cleanly to a graph node  
**Scope:** Post-graph creation point selection logic

---

## 🎯 Overview

After the navigation graph is created, we need to identify **valid start and end points** for navigation. Each point must correspond to a **graph node** for pathfinding to work.

---

## 🚪 Start Points

### **Valid Start Point Types**

Start points can be selected from:

1. **Entrance** (`entrance` / `exit` type nodes)
2. **Staircase** (`stair` type nodes)
3. **Lift/Elevator** (`elevator` type nodes)
4. **Any Corridor Node** (`corridor` type nodes)

### **Selection Criteria**

```typescript
interface StartPoint {
  nodeId: string;           // Graph node ID
  type: StartPointType;     // Type of start point
  position: Point;          // Node position
  label?: string;          // Human-readable label
  metadata?: {
    roomId?: string;       // If associated with a room
    floorLevel?: number;   // Floor level (for stairs/elevators)
  };
}

type StartPointType = 
  | "entrance"      // Building/floor entrance
  | "staircase"       // Stairwell
  | "lift"            // Elevator
  | "corridor";       // Any corridor node
```

### **Selection Rules**

#### **1. Entrance Nodes**

```javascript
// Select nodes with type "exit" or "entrance"
function selectEntrancePoints(graph) {
  return graph.nodes
    .filter(node => 
      node.type === 'exit' || 
      node.type === 'entrance' ||
      (node.metadata?.roomId && 
       getRoomType(node.metadata.roomId) === 'exit')
    )
    .map(node => ({
      nodeId: node.id,
      type: 'entrance',
      position: node.position,
      label: `Entrance ${node.id}`,
      metadata: node.metadata
    }));
}
```

#### **2. Staircase Nodes**

```javascript
// Select nodes with type "stair"
function selectStaircasePoints(graph) {
  return graph.nodes
    .filter(node => node.type === 'stair')
    .map(node => ({
      nodeId: node.id,
      type: 'staircase',
      position: node.position,
      label: `Staircase ${node.id}`,
      metadata: {
        ...node.metadata,
        floorLevel: extractFloorLevel(node.id) // If available
      }
    }));
}
```

#### **3. Lift/Elevator Nodes**

```javascript
// Select nodes with type "elevator"
function selectLiftPoints(graph) {
  return graph.nodes
    .filter(node => node.type === 'elevator')
    .map(node => ({
      nodeId: node.id,
      type: 'lift',
      position: node.position,
      label: `Elevator ${node.id}`,
      metadata: node.metadata
    }));
}
```

#### **4. Corridor Nodes**

```javascript
// Select any corridor node
function selectCorridorPoints(graph) {
  return graph.nodes
    .filter(node => node.type === 'corridor')
    .map(node => ({
      nodeId: node.id,
      type: 'corridor',
      position: node.position,
      label: `Corridor ${node.id}`,
      metadata: node.metadata
    }));
}
```

### **Combined Start Point Selection**

```javascript
function getAllStartPoints(graph) {
  return {
    entrances: selectEntrancePoints(graph),
    staircases: selectStaircasePoints(graph),
    lifts: selectLiftPoints(graph),
    corridors: selectCorridorPoints(graph),
    all: [
      ...selectEntrancePoints(graph),
      ...selectStaircasePoints(graph),
      ...selectLiftPoints(graph),
      ...selectCorridorPoints(graph)
    ]
  };
}
```

---

## 🏠 End Points

### **Valid End Point Types**

End points can be selected from:

1. **Rooms** (`room` type nodes)
2. **Offices** (`office` type nodes - from room type)
3. **Facilities** (specific facility types like washrooms, labs, cafés, etc.)

### **Selection Criteria**

```typescript
interface EndPoint {
  nodeId: string;           // Graph node ID
  type: EndPointType;       // Type of end point
  position: Point;         // Node position
  label: string;           // Room number/name
  metadata: {
    roomId: string;        // Room ID from scan
    roomType?: string;      // Room type (room, office, facility)
    facilityType?: string; // Specific facility type (if applicable)
  };
}

type EndPointType = 
  | "room"         // General room
  | "office"       // Office space
  | "facility";    // Facility (washroom, lab, café, etc.)
```

### **Selection Rules**

#### **1. Room Nodes**

```javascript
// Select nodes with type "room" (general rooms)
function selectRoomPoints(graph) {
  return graph.nodes
    .filter(node => node.type === 'room')
    .map(node => {
      const roomMapping = graph.roomMappings.find(m => m.nodeId === node.id);
      return {
        nodeId: node.id,
        type: 'room',
        position: node.position,
        label: node.metadata?.label || `Room ${node.id}`,
        metadata: {
          roomId: node.metadata?.roomId || roomMapping?.roomId || '',
          roomType: 'room'
        }
      };
    });
}
```

#### **2. Office Nodes**

```javascript
// Select nodes associated with office-type rooms
function selectOfficePoints(graph, scanResult) {
  // Get room types from scan result
  const officeRooms = (scanResult?.rooms || [])
    .filter(room => room.type === 'office');
  
  const officeRoomIds = new Set(officeRooms.map(r => r.id));
  
  return graph.nodes
    .filter(node => {
      const roomId = node.metadata?.roomId;
      return roomId && officeRoomIds.has(roomId);
    })
    .map(node => {
      const room = officeRooms.find(r => r.id === node.metadata.roomId);
      return {
        nodeId: node.id,
        type: 'office',
        position: node.position,
        label: room?.label || `Office ${node.id}`,
        metadata: {
          roomId: node.metadata.roomId,
          roomType: 'office'
        }
      };
    });
}
```

#### **3. Facility Nodes**

```javascript
// Select nodes associated with facilities
function selectFacilityPoints(graph, scanResult) {
  // Define facility types
  const facilityTypes = ['washroom', 'lab', 'cafe', 'library', 'gym', 'cafeteria'];
  
  const facilityRooms = (scanResult?.rooms || [])
    .filter(room => {
      // Check if room type or label indicates facility
      const roomType = room.type?.toLowerCase() || '';
      const roomLabel = room.label?.toLowerCase() || '';
      
      return facilityTypes.some(facility => 
        roomType.includes(facility) || 
        roomLabel.includes(facility)
      );
    });
  
  const facilityRoomIds = new Set(facilityRooms.map(r => r.id));
  
  return graph.nodes
    .filter(node => {
      const roomId = node.metadata?.roomId;
      return roomId && facilityRoomIds.has(roomId);
    })
    .map(node => {
      const room = facilityRooms.find(r => r.id === node.metadata.roomId);
      const facilityType = determineFacilityType(room);
      
      return {
        nodeId: node.id,
        type: 'facility',
        position: node.position,
        label: room?.label || `Facility ${node.id}`,
        metadata: {
          roomId: node.metadata.roomId,
          roomType: 'facility',
          facilityType: facilityType
        }
      };
    });
}

function determineFacilityType(room) {
  const label = (room.label || '').toLowerCase();
  const type = (room.type || '').toLowerCase();
  
  if (label.includes('washroom') || label.includes('restroom') || type.includes('washroom')) {
    return 'washroom';
  }
  if (label.includes('lab') || type.includes('lab')) {
    return 'lab';
  }
  if (label.includes('cafe') || label.includes('cafeteria') || type.includes('cafe')) {
    return 'cafe';
  }
  if (label.includes('library') || type.includes('library')) {
    return 'library';
  }
  // Add more facility types as needed
  return 'facility';
}
```

### **Combined End Point Selection**

```javascript
function getAllEndPoints(graph, scanResult) {
  return {
    rooms: selectRoomPoints(graph),
    offices: selectOfficePoints(graph, scanResult),
    facilities: selectFacilityPoints(graph, scanResult),
    all: [
      ...selectRoomPoints(graph),
      ...selectOfficePoints(graph, scanResult),
      ...selectFacilityPoints(graph, scanResult)
    ]
  };
}
```

---

## 🔗 Node Mapping Guarantee

### **Requirement: Clean Node Mapping**

Every start and end point **must map to a graph node**. This is guaranteed by:

1. **Direct Node Selection:** Points are selected directly from `graph.nodes`
2. **Node ID Reference:** Each point has a `nodeId` that references a valid node
3. **Validation:** Verify all point nodeIds exist in the graph

### **Validation Function**

```javascript
function validatePointMapping(points, graph) {
  const nodeIds = new Set(graph.nodes.map(n => n.id));
  const errors = [];
  
  points.forEach((point, index) => {
    if (!nodeIds.has(point.nodeId)) {
      errors.push(`Point ${index} references invalid node: ${point.nodeId}`);
    }
  });
  
  return {
    valid: errors.length === 0,
    errors
  };
}
```

---

## 📋 Point Selection API

### **Complete Selection Function**

```javascript
function selectNavigationPoints(graph, scanResult) {
  // Select start points
  const startPoints = {
    entrances: selectEntrancePoints(graph),
    staircases: selectStaircasePoints(graph),
    lifts: selectLiftPoints(graph),
    corridors: selectCorridorPoints(graph),
    all: []
  };
  startPoints.all = [
    ...startPoints.entrances,
    ...startPoints.staircases,
    ...startPoints.lifts,
    ...startPoints.corridors
  ];
  
  // Select end points
  const endPoints = {
    rooms: selectRoomPoints(graph),
    offices: selectOfficePoints(graph, scanResult),
    facilities: selectFacilityPoints(graph, scanResult),
    all: []
  };
  endPoints.all = [
    ...endPoints.rooms,
    ...endPoints.offices,
    ...endPoints.facilities
  ];
  
  // Validate mappings
  const startValidation = validatePointMapping(startPoints.all, graph);
  const endValidation = validatePointMapping(endPoints.all, graph);
  
  return {
    startPoints,
    endPoints,
    validation: {
      startPointsValid: startValidation.valid,
      endPointsValid: endValidation.valid,
      errors: [...startValidation.errors, ...endValidation.errors]
    }
  };
}
```

---

## 🎯 Usage Example

```javascript
// After graph creation
const graph = buildNavigationGraph(scanResult);
const scanResult = scanFloorPlan(svgInput);

// Select navigation points
const navigationPoints = selectNavigationPoints(graph, scanResult);

// Use for pathfinding
const startPoint = navigationPoints.startPoints.entrances[0];
const endPoint = navigationPoints.endPoints.rooms.find(r => r.label === '101');

// Verify points map to nodes
if (startPoint && endPoint) {
  const path = aStarPathfinding(
    graph, 
    startPoint.nodeId,  // ✅ Maps to graph node
    endPoint.nodeId     // ✅ Maps to graph node
  );
}
```

---

## ✅ Summary

**Start Points:**
- ✅ Entrance nodes (exit/entrance type)
- ✅ Staircase nodes (stair type)
- ✅ Lift nodes (elevator type)
- ✅ Corridor nodes (corridor type)

**End Points:**
- ✅ Room nodes (room type)
- ✅ Office nodes (office room type)
- ✅ Facility nodes (washroom, lab, café, etc.)

**Guarantee:**
- ✅ Every point maps to a graph node via `nodeId`
- ✅ Validation ensures all nodeIds are valid
- ✅ Clean mapping for pathfinding algorithms

---

**All navigation points map cleanly to graph nodes!** 🎯

