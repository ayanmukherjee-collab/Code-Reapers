/**
 * Visualization Data Generator
 * 
 * Converts navigation data (scan results + graph) into visualization-friendly format.
 * 
 * This is PURE DATA - no rendering logic.
 * Rendering is handled separately by the visualization layer.
 */

const VISUALIZATION_VERSION = '1.0.0';

/**
 * Generate visualization data from scan result and navigation graph
 * @param {Object} scanResult - Output from scanFloorPlan
 * @param {Object} navigationGraph - Output from buildNavigationGraph
 * @param {Object} options - Generation options
 * @returns {Object} VisualizationData
 */
function generateVisualizationData(scanResult, navigationGraph, options = {}) {
  const {
    includeNodes = true,
    includeLabels = true,
    defaultColors = true,
    nodeRadius = 3,
    pathColor = '#FF0000',
    pathStrokeWidth = 2
  } = options;
  
  // Extract coordinate space from scan result or graph
  const coordinateSpace = extractCoordinateSpace(scanResult, navigationGraph);
  
  // Generate room visualizations
  const rooms = generateRoomVisualizations(scanResult.rooms, defaultColors);
  
  // Generate path visualizations (red lines)
  const paths = generatePathVisualizations(scanResult.paths, pathColor, pathStrokeWidth);
  
  // Generate node visualizations (if graph provided)
  const nodes = includeNodes && navigationGraph
    ? generateNodeVisualizations(navigationGraph.nodes, nodeRadius, defaultColors)
    : [];
  
  // Generate labels (if enabled)
  const labels = includeLabels
    ? generateLabels(scanResult.rooms, navigationGraph?.nodes, navigationGraph?.roomMappings)
    : [];
  
  return {
    metadata: {
      source: scanResult.metadata?.source || navigationGraph?.metadata?.source || 'unknown',
      timestamp: new Date().toISOString(),
      version: VISUALIZATION_VERSION
    },
    coordinateSpace,
    rooms,
    paths,
    nodes,
    labels
  };
}

/**
 * Extract coordinate space from scan result or graph
 */
function extractCoordinateSpace(scanResult, navigationGraph) {
  let bounds = { x: 0, y: 0, width: 0, height: 0 };
  let units = 'pixels';
  
  if (scanResult?.metadata?.bounds) {
    bounds = scanResult.metadata.bounds;
  } else if (navigationGraph?.bounds) {
    bounds = navigationGraph.bounds;
  }
  
  // Try to determine units from metadata
  if (scanResult?.metadata?.units) {
    units = scanResult.metadata.units;
  }
  
  return {
    bounds,
    units
  };
}

/**
 * Generate room visualizations from scan result
 */
function generateRoomVisualizations(rooms, useDefaultColors = true) {
  return rooms.map(room => {
    const visualization = {
      id: room.id,
      bounds: {
        x: room.bounds.x,
        y: room.bounds.y,
        width: room.bounds.width,
        height: room.bounds.height
      }
    };
    
    // Add type if available
    if (room.type) {
      visualization.type = room.type;
    }
    
    // Add label if available
    if (room.label) {
      visualization.label = room.label;
    }
    
    // Add default colors if enabled
    if (useDefaultColors) {
      visualization.fillColor = getDefaultRoomFillColor(room.type);
      visualization.strokeColor = '#000000';
      visualization.strokeWidth = 1;
      visualization.opacity = 1;
    }
    
    return visualization;
  });
}

/**
 * Generate path visualizations (red lines by default)
 */
function generatePathVisualizations(paths, defaultColor = '#FF0000', strokeWidth = 2) {
  return paths.map(path => {
    return {
      id: path.id,
      type: path.type || 'corridor',
      segments: path.segments.map(seg => ({
        start: { x: seg.start.x, y: seg.start.y },
        end: { x: seg.end.x, y: seg.end.y }
      })),
      color: defaultColor,
      strokeWidth: strokeWidth,
      opacity: 1
    };
  });
}

/**
 * Generate node visualizations from navigation graph
 */
function generateNodeVisualizations(graphNodes, defaultRadius = 3, useDefaultColors = true) {
  return graphNodes.map(node => {
    const visualization = {
      id: node.id,
      position: {
        x: node.position.x,
        y: node.position.y
      },
      type: node.type,
      visible: true
    };
    
    // Add radius
    if (defaultRadius) {
      visualization.radius = defaultRadius;
    }
    
    // Add default color by type if enabled
    if (useDefaultColors) {
      visualization.color = getDefaultNodeColor(node.type);
    }
    
    return visualization;
  });
}

/**
 * Generate labels for rooms and nodes
 */
function generateLabels(rooms, graphNodes, roomMappings) {
  const labels = [];
  
  // Generate labels for rooms
  if (rooms) {
    rooms.forEach(room => {
      if (room.label) {
        // Position label at room center
        const centerX = room.bounds.x + room.bounds.width / 2;
        const centerY = room.bounds.y + room.bounds.height / 2;
        
        labels.push({
          text: room.label,
          position: { x: centerX, y: centerY },
          anchor: 'room',
          anchorId: room.id,
          fontSize: 12,
          color: '#000000'
        });
      }
    });
  }
  
  // Generate labels for nodes (if they have room associations)
  if (graphNodes && roomMappings) {
    const roomIdToNodeId = new Map();
    roomMappings.forEach(mapping => {
      roomIdToNodeId.set(mapping.roomId, mapping.nodeId);
    });
    
    graphNodes.forEach(node => {
      if (node.metadata?.roomId && node.metadata?.label) {
        labels.push({
          text: node.metadata.label,
          position: { x: node.position.x, y: node.position.y },
          anchor: 'node',
          anchorId: node.id,
          fontSize: 10,
          color: '#000000'
        });
      }
    });
  }
  
  return labels;
}

/**
 * Get default fill color for room type
 */
function getDefaultRoomFillColor(roomType) {
  switch (roomType) {
    case 'stair':
      return '#FFE0E0';  // Light red
    case 'elevator':
      return '#E0E0FF';  // Light blue
    case 'exit':
      return '#FFFFE0';  // Light yellow
    case 'office':
      return '#E0FFE0';  // Light green
    default:
      return '#E0E0E0';  // Light gray
  }
}

/**
 * Get default color for node type
 */
function getDefaultNodeColor(nodeType) {
  switch (nodeType) {
    case 'room':
      return '#0066CC';      // Blue
    case 'corridor':
      return '#00CC66';      // Green
    case 'intersection':
      return '#FF9900';      // Orange
    case 'stair':
      return '#9900CC';      // Purple
    case 'elevator':
      return '#CC0000';      // Red
    case 'exit':
      return '#FFCC00';      // Yellow
    default:
      return '#666666';      // Gray
  }
}

/**
 * Generate visualization data from scan result only (no graph)
 */
function generateVisualizationDataFromScan(scanResult, options = {}) {
  return generateVisualizationData(scanResult, null, {
    includeNodes: false,
    ...options
  });
}

/**
 * Generate visualization data from navigation graph only (no scan)
 */
function generateVisualizationDataFromGraph(navigationGraph, options = {}) {
  // Create minimal scan result structure
  const mockScanResult = {
    rooms: [],
    paths: [],
    metadata: {
      source: navigationGraph.metadata?.source || 'graph-only',
      bounds: navigationGraph.bounds
    }
  };
  
  return generateVisualizationData(mockScanResult, navigationGraph, {
    includeLabels: false,
    ...options
  });
}

// Export for Node.js / CommonJS
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    generateVisualizationData,
    generateVisualizationDataFromScan,
    generateVisualizationDataFromGraph,
    VISUALIZATION_VERSION
  };
}

// Export for ES6 modules
if (typeof window !== 'undefined') {
  window.VisualizationDataGenerator = {
    generateVisualizationData,
    generateVisualizationDataFromScan,
    generateVisualizationDataFromGraph,
    VISUALIZATION_VERSION
  };
}

