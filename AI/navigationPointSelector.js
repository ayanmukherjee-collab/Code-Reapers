/**
 * Navigation Point Selector
 * 
 * Selects valid start and end points from the navigation graph.
 * 
 * Each point must map cleanly to a graph node for pathfinding.
 */

/**
 * Select all navigation points (start and end)
 * @param {Object} graph - Navigation graph
 * @param {Object} scanResult - Scan result (optional, for room type info)
 * @returns {Object} Navigation points with validation
 */
function selectNavigationPoints(graph, scanResult = null) {
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
      errors: [...startValidation.errors, ...endValidation.errors],
      warnings: [...startValidation.warnings, ...endValidation.warnings]
    }
  };
}

/**
 * Select entrance points (exit/entrance type nodes)
 */
function selectEntrancePoints(graph) {
  return graph.nodes
    .filter(node => 
      node.type === 'exit' || 
      node.type === 'entrance' ||
      (node.metadata?.roomId && isExitRoom(node.metadata.roomId, graph))
    )
    .map(node => ({
      nodeId: node.id,
      type: 'entrance',
      position: { x: node.position.x, y: node.position.y },
      label: node.metadata?.label || `Entrance ${node.id}`,
      metadata: {
        ...node.metadata,
        floorLevel: extractFloorLevel(node.id)
      }
    }));
}

/**
 * Select staircase points (stair type nodes)
 */
function selectStaircasePoints(graph) {
  return graph.nodes
    .filter(node => node.type === 'stair')
    .map(node => ({
      nodeId: node.id,
      type: 'staircase',
      position: { x: node.position.x, y: node.position.y },
      label: node.metadata?.label || `Staircase ${node.id}`,
      metadata: {
        ...node.metadata,
        floorLevel: extractFloorLevel(node.id)
      }
    }));
}

/**
 * Select lift/elevator points (elevator type nodes)
 */
function selectLiftPoints(graph) {
  return graph.nodes
    .filter(node => node.type === 'elevator')
    .map(node => ({
      nodeId: node.id,
      type: 'lift',
      position: { x: node.position.x, y: node.position.y },
      label: node.metadata?.label || `Elevator ${node.id}`,
      metadata: {
        ...node.metadata,
        floorLevel: extractFloorLevel(node.id)
      }
    }));
}

/**
 * Select corridor points (any corridor node)
 */
function selectCorridorPoints(graph) {
  return graph.nodes
    .filter(node => node.type === 'corridor')
    .map(node => ({
      nodeId: node.id,
      type: 'corridor',
      position: { x: node.position.x, y: node.position.y },
      label: `Corridor ${node.id}`,
      metadata: node.metadata
    }));
}

/**
 * Select room points (room type nodes)
 */
function selectRoomPoints(graph) {
  return graph.nodes
    .filter(node => node.type === 'room')
    .map(node => {
      const roomMapping = graph.roomMappings?.find(m => m.nodeId === node.id);
      return {
        nodeId: node.id,
        type: 'room',
        position: { x: node.position.x, y: node.position.y },
        label: node.metadata?.label || `Room ${node.id}`,
        metadata: {
          roomId: node.metadata?.roomId || roomMapping?.roomId || '',
          roomType: 'room'
        }
      };
    });
}

/**
 * Select office points (office-type rooms)
 */
function selectOfficePoints(graph, scanResult) {
  if (!scanResult || !scanResult.rooms) {
    return [];
  }
  
  // Get office-type rooms from scan result
  const officeRooms = scanResult.rooms.filter(room => 
    room.type === 'office' || 
    (room.label && /office|office/i.test(room.label))
  );
  
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
        position: { x: node.position.x, y: node.position.y },
        label: room?.label || `Office ${node.id}`,
        metadata: {
          roomId: node.metadata.roomId,
          roomType: 'office'
        }
      };
    });
}

/**
 * Select facility points (washrooms, labs, cafés, etc.)
 */
function selectFacilityPoints(graph, scanResult) {
  if (!scanResult || !scanResult.rooms) {
    return [];
  }
  
  // Define facility types
  const facilityTypes = ['washroom', 'restroom', 'lab', 'laboratory', 'cafe', 'cafeteria', 'library', 'gym', 'gymnasium'];
  
  const facilityRooms = scanResult.rooms.filter(room => {
    const roomType = (room.type || '').toLowerCase();
    const roomLabel = (room.label || '').toLowerCase();
    
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
        position: { x: node.position.x, y: node.position.y },
        label: room?.label || `Facility ${node.id}`,
        metadata: {
          roomId: node.metadata.roomId,
          roomType: 'facility',
          facilityType: facilityType
        }
      };
    });
}

/**
 * Determine facility type from room data
 */
function determineFacilityType(room) {
  if (!room) return 'facility';
  
  const label = (room.label || '').toLowerCase();
  const type = (room.type || '').toLowerCase();
  
  if (label.includes('washroom') || label.includes('restroom') || type.includes('washroom')) {
    return 'washroom';
  }
  if (label.includes('lab') || label.includes('laboratory') || type.includes('lab')) {
    return 'lab';
  }
  if (label.includes('cafe') || label.includes('cafeteria') || type.includes('cafe')) {
    return 'cafe';
  }
  if (label.includes('library') || type.includes('library')) {
    return 'library';
  }
  if (label.includes('gym') || label.includes('gymnasium') || type.includes('gym')) {
    return 'gym';
  }
  
  return 'facility';
}

/**
 * Check if a room is an exit/entrance room
 */
function isExitRoom(roomId, graph) {
  const roomMapping = graph.roomMappings?.find(m => m.roomId === roomId);
  if (!roomMapping) return false;
  
  const node = graph.nodes.find(n => n.id === roomMapping.nodeId);
  return node?.type === 'exit' || node?.type === 'entrance';
}

/**
 * Extract floor level from node ID or metadata (if available)
 */
function extractFloorLevel(nodeId) {
  // Try to extract floor level from node ID pattern
  const match = nodeId.match(/floor[_-]?(\d+)|level[_-]?(\d+)|f[_-]?(\d+)/i);
  if (match) {
    return parseInt(match[1] || match[2] || match[3], 10);
  }
  return null;
}

/**
 * Validate that all points map to valid graph nodes
 */
function validatePointMapping(points, graph) {
  const nodeIds = new Set(graph.nodes.map(n => n.id));
  const errors = [];
  const warnings = [];
  
  points.forEach((point, index) => {
    if (!point.nodeId) {
      errors.push(`Point ${index} missing nodeId`);
      return;
    }
    
    if (!nodeIds.has(point.nodeId)) {
      errors.push(`Point ${index} (${point.label || point.nodeId}) references invalid node: ${point.nodeId}`);
    }
    
    // Check if node has connections (warn if isolated)
    const node = graph.nodes.find(n => n.id === point.nodeId);
    if (node && (!node.connections || node.connections.length === 0)) {
      warnings.push(`Point ${index} (${point.label || point.nodeId}) maps to isolated node with no connections`);
    }
  });
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Find a point by label or nodeId
 */
function findPoint(points, identifier) {
  return points.find(p => 
    p.nodeId === identifier || 
    p.label === identifier ||
    p.metadata?.roomId === identifier
  );
}

/**
 * Get all start points (convenience function)
 */
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

/**
 * Get all end points (convenience function)
 */
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

// Export for Node.js / CommonJS
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    selectNavigationPoints,
    selectEntrancePoints,
    selectStaircasePoints,
    selectLiftPoints,
    selectCorridorPoints,
    selectRoomPoints,
    selectOfficePoints,
    selectFacilityPoints,
    getAllStartPoints,
    getAllEndPoints,
    validatePointMapping,
    findPoint
  };
}

// Export for ES6 modules
if (typeof window !== 'undefined') {
  window.NavigationPointSelector = {
    selectNavigationPoints,
    selectEntrancePoints,
    selectStaircasePoints,
    selectLiftPoints,
    selectCorridorPoints,
    selectRoomPoints,
    selectOfficePoints,
    selectFacilityPoints,
    getAllStartPoints,
    getAllEndPoints,
    validatePointMapping,
    findPoint
  };
}

