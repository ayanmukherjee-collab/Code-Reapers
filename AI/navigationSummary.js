/**
 * Navigation Summary Generator
 * 
 * Produces a clear, text-based summary of the navigation data processing pipeline.
 * Summary is understandable without any UI.
 */

/**
 * Generate navigation summary
 * @param {Object} scanResult - Scan result
 * @param {Object} navigationGraph - Navigation graph
 * @param {Object} navigationPoints - Navigation points (start and end)
 * @param {Object} pathResult - Path computation result (optional)
 * @param {Object} options - Summary options
 * @returns {Object} Summary object with text and structured data
 */
function generateNavigationSummary(scanResult, navigationGraph, navigationPoints, pathResult = null, options = {}) {
  const {
    includeDetails = true,
    includePathDetails = true,
    format = 'text' // 'text' or 'json'
  } = options;
  
  // Extract summary data
  const summary = {
    scan: {
      roomsDetected: scanResult?.rooms?.length || 0,
      pathSegments: calculatePathSegments(scanResult?.paths || []),
      pathsDetected: scanResult?.paths?.length || 0
    },
    graph: {
      totalNodes: navigationGraph?.nodes?.length || 0,
      totalEdges: navigationGraph?.edges?.length || 0,
      roomMappings: navigationGraph?.roomMappings?.length || 0
    },
    startPoints: {
      entrances: navigationPoints?.startPoints?.entrances?.length || 0,
      staircases: navigationPoints?.startPoints?.staircases?.length || 0,
      lifts: navigationPoints?.startPoints?.lifts?.length || 0,
      corridors: navigationPoints?.startPoints?.corridors?.length || 0,
      total: navigationPoints?.startPoints?.all?.length || 0,
      list: includeDetails ? (navigationPoints?.startPoints?.all || []) : []
    },
    endPoints: {
      rooms: navigationPoints?.endPoints?.rooms?.length || 0,
      offices: navigationPoints?.endPoints?.offices?.length || 0,
      facilities: navigationPoints?.endPoints?.facilities?.length || 0,
      total: navigationPoints?.endPoints?.all?.length || 0,
      list: includeDetails ? (navigationPoints?.endPoints?.all || []) : []
    },
    path: pathResult ? {
      found: pathResult.success,
      nodeCount: pathResult.path?.length || 0,
      length: pathResult.length,
      stepCount: pathResult.stepCount,
      path: pathResult.path || [],
      startNode: pathResult.metadata?.startNode,
      endNode: pathResult.metadata?.endNode,
      error: pathResult.error
    } : null,
    metadata: {
      timestamp: new Date().toISOString(),
      source: scanResult?.metadata?.source || navigationGraph?.metadata?.source || 'unknown'
    }
  };
  
  // Generate text summary
  const textSummary = format === 'text' 
    ? generateTextSummary(summary, includeDetails, includePathDetails)
    : null;
  
  return {
    summary,
    text: textSummary,
    format: format
  };
}

/**
 * Calculate total path segments
 */
function calculatePathSegments(paths) {
  if (!paths || paths.length === 0) return 0;
  return paths.reduce((total, path) => {
    return total + (path.segments?.length || 0);
  }, 0);
}

/**
 * Generate human-readable text summary
 */
function generateTextSummary(summary, includeDetails, includePathDetails) {
  const lines = [];
  
  // Header
  lines.push('='.repeat(60));
  lines.push('NAVIGATION DATA SUMMARY');
  lines.push('='.repeat(60));
  lines.push('');
  
  // Scan Results
  lines.push('SCAN RESULTS:');
  lines.push(`  Rooms Detected: ${summary.scan.roomsDetected}`);
  lines.push(`  Path Segments: ${summary.scan.pathSegments}`);
  lines.push(`  Paths Detected: ${summary.scan.pathsDetected}`);
  lines.push('');
  
  // Graph Statistics
  lines.push('NAVIGATION GRAPH:');
  lines.push(`  Total Nodes: ${summary.graph.totalNodes}`);
  lines.push(`  Total Edges: ${summary.graph.totalEdges}`);
  lines.push(`  Room Mappings: ${summary.graph.roomMappings}`);
  lines.push('');
  
  // Start Points
  lines.push('AVAILABLE START POINTS:');
  lines.push(`  Entrances: ${summary.startPoints.entrances}`);
  lines.push(`  Staircases: ${summary.startPoints.staircases}`);
  lines.push(`  Lifts: ${summary.startPoints.lifts}`);
  lines.push(`  Corridors: ${summary.startPoints.corridors}`);
  lines.push(`  Total: ${summary.startPoints.total}`);
  
  if (includeDetails && summary.startPoints.list.length > 0) {
    lines.push('');
    lines.push('  Start Point Details:');
    summary.startPoints.list.slice(0, 10).forEach((point, index) => {
      lines.push(`    ${index + 1}. ${point.label || point.nodeId} (${point.type})`);
    });
    if (summary.startPoints.list.length > 10) {
      lines.push(`    ... and ${summary.startPoints.list.length - 10} more`);
    }
  }
  lines.push('');
  
  // End Points
  lines.push('AVAILABLE END POINTS:');
  lines.push(`  Rooms: ${summary.endPoints.rooms}`);
  lines.push(`  Offices: ${summary.endPoints.offices}`);
  lines.push(`  Facilities: ${summary.endPoints.facilities}`);
  lines.push(`  Total: ${summary.endPoints.total}`);
  
  if (includeDetails && summary.endPoints.list.length > 0) {
    lines.push('');
    lines.push('  End Point Details:');
    summary.endPoints.list.slice(0, 10).forEach((point, index) => {
      lines.push(`    ${index + 1}. ${point.label || point.nodeId} (${point.type})`);
    });
    if (summary.endPoints.list.length > 10) {
      lines.push(`    ... and ${summary.endPoints.list.length - 10} more`);
    }
  }
  lines.push('');
  
  // Navigation Path
  if (summary.path) {
    lines.push('COMPUTED NAVIGATION PATH:');
    if (summary.path.found) {
      lines.push(`  Status: Path Found`);
      lines.push(`  Start Node: ${summary.path.startNode}`);
      lines.push(`  End Node: ${summary.path.endNode}`);
      lines.push(`  Path Length: ${summary.path.length !== undefined ? summary.path.length.toFixed(2) : 'N/A'}`);
      lines.push(`  Step Count: ${summary.path.stepCount || summary.path.nodeCount}`);
      lines.push(`  Node Count: ${summary.path.nodeCount}`);
      
      if (includePathDetails && summary.path.path.length > 0) {
        lines.push('');
        lines.push('  Path Nodes:');
        summary.path.path.forEach((nodeId, index) => {
          const marker = index === 0 ? 'START' : index === summary.path.path.length - 1 ? 'END' : `${index}`;
          lines.push(`    ${marker.padStart(5)}: ${nodeId}`);
        });
      }
    } else {
      lines.push(`  Status: No Path Found`);
      lines.push(`  Error: ${summary.path.error || 'Unknown error'}`);
      if (summary.path.startNode && summary.path.endNode) {
        lines.push(`  Start Node: ${summary.path.startNode}`);
        lines.push(`  End Node: ${summary.path.endNode}`);
      }
    }
    lines.push('');
  } else {
    lines.push('COMPUTED NAVIGATION PATH:');
    lines.push('  Status: Not Computed');
    lines.push('');
  }
  
  // Metadata
  lines.push('METADATA:');
  lines.push(`  Source: ${summary.metadata.source}`);
  lines.push(`  Timestamp: ${summary.metadata.timestamp}`);
  lines.push('');
  
  // Footer
  lines.push('='.repeat(60));
  
  return lines.join('\n');
}

/**
 * Generate compact summary (one-liner style)
 */
function generateCompactSummary(summary) {
  const parts = [];
  
  parts.push(`${summary.scan.roomsDetected} rooms`);
  parts.push(`${summary.scan.pathSegments} path segments`);
  parts.push(`${summary.startPoints.total} start points`);
  parts.push(`${summary.endPoints.total} end points`);
  
  if (summary.path) {
    if (summary.path.found) {
      parts.push(`Path: ${summary.path.nodeCount} nodes, ${summary.path.length?.toFixed(1) || 'N/A'} units`);
    } else {
      parts.push('No path found');
    }
  }
  
  return parts.join(' | ');
}

/**
 * Generate JSON summary (structured data)
 */
function generateJSONSummary(summary) {
  return JSON.stringify(summary, null, 2);
}

// Export for Node.js / CommonJS
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    generateNavigationSummary,
    generateCompactSummary,
    generateJSONSummary,
    generateTextSummary
  };
}

// Export for ES6 modules
if (typeof window !== 'undefined') {
  window.NavigationSummary = {
    generateNavigationSummary,
    generateCompactSummary,
    generateJSONSummary,
    generateTextSummary
  };
}

