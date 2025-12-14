/**
 * Floor Plan Scanner
 * 
 * Converts raw floor plan input into structured data:
 * - Rooms (as bounding boxes)
 * - Walkable paths (as line segments/polylines)
 * 
 * Requirements:
 * - Deterministic: Same input → Same output
 * - Reproducible: IDs based on content, not random
 * - Structured: Well-defined output schema
 * - Partial results acceptable: Confidence scores indicate quality
 */

const SCANNER_VERSION = '1.0.0';
const COORDINATE_PRECISION = 2; // Decimal places
const MIN_ROOM_AREA = 100; // Minimum area to consider as room (pixels²)
const MIN_PATH_LENGTH = 20; // Minimum length to consider as path (pixels)

/**
 * Main scanner entry point
 * @param {string|Object} input - Floor plan input (SVG string, JSON object, or file path)
 * @param {Object} options - Scanner options
 * @returns {Object} ScanResult
 */
function scanFloorPlan(input, options = {}) {
  const format = detectFormat(input);
  const timestamp = new Date().toISOString();
  
  let result;
  
  switch (format) {
    case 'svg':
      result = scanSVG(input, options);
      break;
    case 'json':
      result = scanJSON(input, options);
      break;
    case 'image':
      throw new Error('Image format scanning not yet implemented');
    default:
      throw new Error(`Unsupported format: ${format}`);
  }
  
  // Add metadata
  result.metadata = {
    source: options.source || 'unknown',
    timestamp,
    version: SCANNER_VERSION,
    bounds: result.bounds || calculateBounds(result.rooms, result.paths)
  };
  
  // Normalize and sort for determinism
  normalizeResult(result);
  sortResult(result);
  
  return result;
}

/**
 * Detect input format
 */
function detectFormat(input) {
  if (typeof input === 'string') {
    if (input.trim().startsWith('<svg') || input.trim().startsWith('<?xml')) {
      return 'svg';
    }
    // Could be file path - check extension
    if (input.endsWith('.svg')) return 'svg';
    if (input.endsWith('.json')) return 'json';
  }
  if (typeof input === 'object' && input !== null) {
    if (input.rooms || input.corridors || input.paths) {
      return 'json';
    }
  }
  return 'unknown';
}

/**
 * Scan SVG floor plan
 */
function scanSVG(svgString, options = {}) {
  const rooms = [];
  const paths = [];
  const warnings = [];
  const errors = [];
  
  try {
    // Parse SVG using simple regex-based parser (hackathon-friendly)
    // For production, consider using 'xmldom' or 'fast-xml-parser' package
    
    // Check if we have a DOM parser available (browser or xmldom)
    let doc, svg;
    
    if (typeof DOMParser !== 'undefined') {
      // Browser environment
      const parser = new DOMParser();
      doc = parser.parseFromString(svgString, 'image/svg+xml');
      const parseError = doc.querySelector('parsererror');
      if (parseError) {
        errors.push('SVG parsing failed: ' + parseError.textContent);
        return createEmptyResult(rooms, paths, warnings, errors);
      }
      svg = doc.querySelector('svg');
    } else if (typeof require !== 'undefined') {
      // Node.js environment - try to use xmldom if available
      try {
        const { DOMParser: XMLDOMParser } = require('@xmldom/xmldom');
        const parser = new XMLDOMParser();
        doc = parser.parseFromString(svgString, 'text/xml');
        if (doc.documentElement && doc.documentElement.nodeName === 'parsererror') {
          errors.push('SVG parsing failed: ' + doc.documentElement.textContent);
          return createEmptyResult(rooms, paths, warnings, errors);
        }
        svg = doc.documentElement;
      } catch (e) {
        // Fall back to regex-based parsing
        warnings.push('XML parser not available, using regex-based parsing (install @xmldom/xmldom for better results)');
        return scanSVGRegex(svgString, options);
      }
    } else {
      // Fall back to regex-based parsing
      return scanSVGRegex(svgString, options);
    }
    
    if (!svg) {
      errors.push('No SVG element found');
      return createEmptyResult(rooms, paths, warnings, errors);
    }
    
    // Extract rooms using regex or DOM methods
    const roomElements = getElementsBySelector(svg, 'rect[class*="room"], polygon[class*="room"], path[class*="room"]');
    roomElements.forEach((element, index) => {
      const room = extractRoomFromSVGElement(element, index);
      if (room) {
        rooms.push(room);
      }
    });
    
    // Extract paths/corridors
    const pathElements = getElementsBySelector(svg, 'path[class*="corridor"], line[class*="corridor"], polyline[class*="corridor"], path[class*="path"], line[class*="path"]');
    pathElements.forEach((element, index) => {
      const path = extractPathFromSVGElement(element, index);
      if (path) {
        paths.push(path);
      }
    });
    
    // Extract text labels and associate with rooms
    const textElements = getElementsBySelector(svg, 'text');
    associateLabelsWithRooms(textElements, rooms);
    
  } catch (error) {
    errors.push(`SVG scanning error: ${error.message}`);
  }
  
  return createEmptyResult(rooms, paths, warnings, errors);
}

/**
 * Fallback: Scan SVG using regex (simplified, hackathon-friendly)
 */
function scanSVGRegex(svgString, options = {}) {
  const rooms = [];
  const paths = [];
  const warnings = [];
  const errors = [];
  
  warnings.push('Using regex-based SVG parsing (limited functionality)');
  
  try {
    // Extract rectangles with room class
    const roomRectRegex = /<rect[^>]*class="[^"]*room[^"]*"[^>]*>/gi;
    let match;
    let index = 0;
    
    while ((match = roomRectRegex.exec(svgString)) !== null) {
      const rectTag = match[0];
      const room = extractRoomFromRectTag(rectTag, index++);
      if (room) {
        rooms.push(room);
      }
    }
    
    // Extract paths/lines with corridor class
    const pathRegex = /<(path|line|polyline)[^>]*class="[^"]*(corridor|path)[^"]*"[^>]*>/gi;
    index = 0;
    
    while ((match = pathRegex.exec(svgString)) !== null) {
      const pathTag = match[0];
      const path = extractPathFromPathTag(pathTag, svgString, match.index, index++);
      if (path) {
        paths.push(path);
      }
    }
    
  } catch (error) {
    errors.push(`Regex SVG scanning error: ${error.message}`);
  }
  
  return createEmptyResult(rooms, paths, warnings, errors);
}

/**
 * Get elements by selector (works with DOM or regex fallback)
 */
function getElementsBySelector(parent, selector) {
  if (typeof parent.querySelectorAll === 'function') {
    return Array.from(parent.querySelectorAll(selector));
  }
  // Fallback: return empty array if no DOM API
  return [];
}

/**
 * Extract room from SVG element (DOM API)
 */
function extractRoomFromSVGElement(element, index) {
  const tagName = element.tagName ? element.tagName.toLowerCase() : '';
  const getAttr = (name) => {
    if (element.getAttribute) {
      return element.getAttribute(name);
    }
    return null;
  };
  
  return extractRoomFromElement(tagName, getAttr, index);
}

/**
 * Extract path from SVG element (DOM API)
 */
function extractPathFromSVGElement(element, index) {
  const tagName = element.tagName ? element.tagName.toLowerCase() : '';
  const getAttr = (name) => {
    if (element.getAttribute) {
      return element.getAttribute(name);
    }
    return null;
  };
  
  return extractPathFromElement(tagName, getAttr, index);
}

/**
 * Extract room from rect tag (regex fallback)
 */
function extractRoomFromRectTag(rectTag, index) {
  const getAttr = (name) => {
    const regex = new RegExp(`${name}="([^"]*)"`, 'i');
    const match = rectTag.match(regex);
    return match ? match[1] : null;
  };
  
  return extractRoomFromElement('rect', getAttr, index);
}

/**
 * Extract path from path/line tag (regex fallback)
 */
function extractPathFromPathTag(pathTag, fullSvg, tagIndex, index) {
  const tagName = pathTag.match(/<(\w+)/)?.[1] || 'path';
  const getAttr = (name) => {
    const regex = new RegExp(`${name}="([^"]*)"`, 'i');
    const match = pathTag.match(regex);
    return match ? match[1] : null;
  };
  
  // For path elements, we need the 'd' attribute which might be on multiple lines
  if (tagName === 'path' && !getAttr('d')) {
    // Try to find 'd' attribute that might span lines
    const afterTag = fullSvg.substring(tagIndex, tagIndex + 500);
    const dMatch = afterTag.match(/d\s*=\s*"([^"]*)"/i);
    if (dMatch) {
      const getAttrWithD = (name) => {
        if (name === 'd') return dMatch[1];
        return getAttr(name);
      };
      return extractPathFromElement(tagName, getAttrWithD, index);
    }
  }
  
  return extractPathFromElement(tagName, getAttr, index);
}

/**
 * Scan JSON floor plan
 */
function scanJSON(jsonData, options = {}) {
  const rooms = [];
  const paths = [];
  const warnings = [];
  const errors = [];
  
  try {
    // Extract rooms
    if (jsonData.rooms && Array.isArray(jsonData.rooms)) {
      jsonData.rooms.forEach((roomData, index) => {
        const room = extractRoomFromJSON(roomData, index);
        if (room) {
          rooms.push(room);
        }
      });
    }
    
    // Extract paths/corridors
    const pathArrays = ['corridors', 'paths', 'walkways'];
    for (const key of pathArrays) {
      if (jsonData[key] && Array.isArray(jsonData[key])) {
        jsonData[key].forEach((pathData, index) => {
          const path = extractPathFromJSON(pathData, key, index);
          if (path) {
            paths.push(path);
          }
        });
      }
    }
    
    if (rooms.length === 0 && paths.length === 0) {
      warnings.push('No rooms or paths found in JSON input');
    }
    
  } catch (error) {
    errors.push(`JSON scanning error: ${error.message}`);
  }
  
  return createEmptyResult(rooms, paths, warnings, errors);
}

/**
 * Extract room from element (unified for DOM and regex)
 */
function extractRoomFromElement(tagName, getAttr, index) {
  let bounds = null;
  let confidence = 0.7; // Default medium confidence
  
  if (tagName === 'rect') {
    const x = parseFloat(getAttr('x') || 0);
    const y = parseFloat(getAttr('y') || 0);
    const width = parseFloat(getAttr('width') || 0);
    const height = parseFloat(getAttr('height') || 0);
    
    bounds = normalizeBounds({ x, y, width, height });
    
    // Check if explicitly marked as room
    const className = getAttr('class') || '';
    if (className.includes('room')) {
      confidence = 0.9;
    }
    
  } else if (tagName === 'polygon' || tagName === 'path') {
    // For polygons/paths, calculate bounding box
    const points = getPointsFromElementData(tagName, getAttr);
    if (points.length > 0) {
      bounds = calculateBoundingBox(points);
      confidence = 0.6; // Lower confidence for non-rectangular shapes
    }
  }
  
  if (!bounds || bounds.width * bounds.height < MIN_ROOM_AREA) {
    return null; // Too small to be a room
  }
  
  const id = getAttr('id') || generateRoomID(bounds, index);
  const label = getAttr('data-label') || null;
  const type = determineRoomTypeFromAttrs(getAttr);
  
  return {
    id,
    bounds,
    label,
    type,
    confidence
  };
}

/**
 * Extract path from element (unified for DOM and regex)
 */
function extractPathFromElement(tagName, getAttr, index) {
  let segments = [];
  let confidence = 0.7;
  let width = null;
  
  if (tagName === 'line') {
    const x1 = parseFloat(getAttr('x1') || 0);
    const y1 = parseFloat(getAttr('y1') || 0);
    const x2 = parseFloat(getAttr('x2') || 0);
    const y2 = parseFloat(getAttr('y2') || 0);
    
    segments = [{
      start: normalizePoint({ x: x1, y: y1 }),
      end: normalizePoint({ x: x2, y: y2 })
    }];
    
    // Check stroke-width for corridor width
    const strokeWidth = parseFloat(getAttr('stroke-width') || 0);
    if (strokeWidth > 0) {
      width = strokeWidth;
    }
    
  } else if (tagName === 'path') {
    const d = getAttr('d') || '';
    segments = parsePathData(d);
    
  } else if (tagName === 'polyline') {
    const points = getAttr('points') || '';
    segments = parsePolylinePoints(points);
  }
  
  // Filter out segments that are too short
  segments = segments.filter(seg => {
    const length = Math.sqrt(
      Math.pow(seg.end.x - seg.start.x, 2) + 
      Math.pow(seg.end.y - seg.start.y, 2)
    );
    return length >= MIN_PATH_LENGTH;
  });
  
  if (segments.length === 0) {
    return null;
  }
  
  // Check if explicitly marked as corridor
  const className = getAttr('class') || '';
  if (className.includes('corridor')) {
    confidence = 0.9;
  }
  
  const id = getAttr('id') || generatePathID(segments, index);
  const type = determinePathTypeFromAttrs(getAttr);
  
  return {
    id,
    type,
    segments,
    width,
    confidence
  };
}

/**
 * Extract room from JSON data
 */
function extractRoomFromJSON(roomData, index) {
  let bounds = null;
  
  // Support multiple formats
  if (roomData.bounds) {
    bounds = normalizeBounds(roomData.bounds);
  } else if (roomData.x !== undefined && roomData.y !== undefined) {
    bounds = normalizeBounds({
      x: roomData.x,
      y: roomData.y,
      width: roomData.width || 0,
      height: roomData.height || 0
    });
  }
  
  if (!bounds || bounds.width * bounds.height < MIN_ROOM_AREA) {
    return null;
  }
  
  const id = roomData.id || generateRoomID(bounds, index);
  const label = roomData.label || roomData.name || null;
  const type = roomData.type || 'room';
  const confidence = roomData.confidence !== undefined ? roomData.confidence : 0.9;
  
  return {
    id,
    bounds,
    label,
    type,
    confidence
  };
}

/**
 * Extract path from JSON data
 */
function extractPathFromJSON(pathData, sourceKey, index) {
  let segments = [];
  
  if (pathData.segments && Array.isArray(pathData.segments)) {
    segments = pathData.segments.map(seg => ({
      start: normalizePoint(seg.start),
      end: normalizePoint(seg.end)
    }));
  } else if (pathData.points && Array.isArray(pathData.points)) {
    // Convert points array to segments
    for (let i = 0; i < pathData.points.length - 1; i++) {
      segments.push({
        start: normalizePoint(pathData.points[i]),
        end: normalizePoint(pathData.points[i + 1])
      });
    }
  } else if (pathData.start && pathData.end) {
    segments = [{
      start: normalizePoint(pathData.start),
      end: normalizePoint(pathData.end)
    }];
  }
  
  // Filter short segments
  segments = segments.filter(seg => {
    const length = Math.sqrt(
      Math.pow(seg.end.x - seg.start.x, 2) + 
      Math.pow(seg.end.y - seg.start.y, 2)
    );
    return length >= MIN_PATH_LENGTH;
  });
  
  if (segments.length === 0) {
    return null;
  }
  
  const id = pathData.id || generatePathID(segments, index);
  const type = pathData.type || (sourceKey === 'corridors' ? 'corridor' : 'walkway');
  const width = pathData.width || null;
  const confidence = pathData.confidence !== undefined ? pathData.confidence : 0.9;
  
  return {
    id,
    type,
    segments,
    width,
    confidence
  };
}

/**
 * Associate text labels with nearby rooms
 */
function associateLabelsWithRooms(textElements, rooms) {
  // Handle both DOM NodeList and array
  const texts = Array.isArray(textElements) ? textElements : Array.from(textElements || []);
  
  texts.forEach(textEl => {
    let x, y, label;
    
    if (typeof textEl.getAttribute === 'function') {
      // DOM element
      x = parseFloat(textEl.getAttribute('x') || 0);
      y = parseFloat(textEl.getAttribute('y') || 0);
      label = (textEl.textContent || textEl.text || '').trim();
    } else {
      // Regex-extracted data
      x = parseFloat(textEl.x || 0);
      y = parseFloat(textEl.y || 0);
      label = (textEl.text || '').trim();
    }
    
    if (!label) return;
    
    // Find nearest room
    let nearestRoom = null;
    let minDistance = Infinity;
    
    rooms.forEach(room => {
      const roomCenter = {
        x: room.bounds.x + room.bounds.width / 2,
        y: room.bounds.y + room.bounds.height / 2
      };
      
      const distance = Math.sqrt(
        Math.pow(x - roomCenter.x, 2) + 
        Math.pow(y - roomCenter.y, 2)
      );
      
      if (distance < minDistance && distance < 100) { // Within 100 pixels
        minDistance = distance;
        nearestRoom = room;
      }
    });
    
    if (nearestRoom && !nearestRoom.label) {
      nearestRoom.label = label;
      nearestRoom.confidence = Math.min(1.0, nearestRoom.confidence + 0.1);
    }
  });
}

/**
 * Generate deterministic room ID
 */
function generateRoomID(bounds, index) {
  // Use normalized bounds for deterministic ID
  const normalized = normalizeBounds(bounds);
  return `ROOM_${Math.round(normalized.x)}_${Math.round(normalized.y)}_${Math.round(normalized.width)}_${Math.round(normalized.height)}`;
}

/**
 * Generate deterministic path ID
 */
function generatePathID(segments, index) {
  // Hash first segment for deterministic ID
  const firstSeg = segments[0];
  const hash = simpleHash(`${firstSeg.start.x}_${firstSeg.start.y}_${firstSeg.end.x}_${firstSeg.end.y}`);
  return `PATH_${hash}`;
}

/**
 * Simple hash function for deterministic IDs
 */
function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16).substring(0, 8);
}

/**
 * Normalize bounds (ensure positive width/height)
 */
function normalizeBounds(bounds) {
  let { x, y, width, height } = bounds;
  
  // Handle negative width/height
  if (width < 0) {
    x += width;
    width = -width;
  }
  if (height < 0) {
    y += height;
    height = -height;
  }
  
  // Round to precision
  return {
    x: roundToPrecision(x),
    y: roundToPrecision(y),
    width: roundToPrecision(Math.max(0, width)),
    height: roundToPrecision(Math.max(0, height))
  };
}

/**
 * Normalize point coordinates
 */
function normalizePoint(point) {
  return {
    x: roundToPrecision(point.x),
    y: roundToPrecision(point.y)
  };
}

/**
 * Round to fixed precision
 */
function roundToPrecision(value) {
  const factor = Math.pow(10, COORDINATE_PRECISION);
  return Math.round(value * factor) / factor;
}

/**
 * Calculate bounding box from points
 */
function calculateBoundingBox(points) {
  if (points.length === 0) return null;
  
  let minX = points[0].x;
  let minY = points[0].y;
  let maxX = points[0].x;
  let maxY = points[0].y;
  
  points.forEach(p => {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  });
  
  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY
  };
}

/**
 * Get points from element data (unified)
 */
function getPointsFromElementData(tagName, getAttr) {
  const points = [];
  
  if (tagName === 'polygon') {
    const pointsAttr = getAttr('points') || '';
    const coords = pointsAttr.match(/[\d.]+/g) || [];
    for (let i = 0; i < coords.length; i += 2) {
      if (i + 1 < coords.length) {
        points.push({ x: parseFloat(coords[i]), y: parseFloat(coords[i + 1]) });
      }
    }
  }
  // For paths, would need to parse path commands (M, L, C, etc.)
  // Simplified for hackathon - assume simple paths
  
  return points;
}

/**
 * Parse SVG path data (simplified - handles M and L commands)
 */
function parsePathData(d) {
  const segments = [];
  const commands = d.match(/[ML][\d\s,.-]+/g) || [];
  
  let currentPoint = null;
  
  commands.forEach(cmd => {
    const type = cmd[0];
    const coords = cmd.substring(1).trim().split(/[\s,]+/).map(parseFloat);
    
    if (type === 'M' && coords.length >= 2) {
      currentPoint = { x: coords[0], y: coords[1] };
    } else if (type === 'L' && coords.length >= 2 && currentPoint) {
      const endPoint = { x: coords[0], y: coords[1] };
      segments.push({
        start: normalizePoint(currentPoint),
        end: normalizePoint(endPoint)
      });
      currentPoint = endPoint;
    }
  });
  
  return segments;
}

/**
 * Parse polyline points
 */
function parsePolylinePoints(pointsStr) {
  const segments = [];
  const coords = pointsStr.match(/[\d.]+/g) || [];
  const points = [];
  
  for (let i = 0; i < coords.length; i += 2) {
    if (i + 1 < coords.length) {
      points.push({ x: parseFloat(coords[i]), y: parseFloat(coords[i + 1]) });
    }
  }
  
  for (let i = 0; i < points.length - 1; i++) {
    segments.push({
      start: normalizePoint(points[i]),
      end: normalizePoint(points[i + 1])
    });
  }
  
  return segments;
}

/**
 * Determine room type from attributes
 */
function determineRoomTypeFromAttrs(getAttr) {
  const className = getAttr('class') || '';
  const id = getAttr('id') || '';
  
  if (className.includes('stair') || id.includes('stair')) return 'stair';
  if (className.includes('elevator') || id.includes('elevator')) return 'elevator';
  if (className.includes('exit') || id.includes('exit')) return 'exit';
  if (className.includes('office')) return 'office';
  return 'room';
}

/**
 * Determine path type from attributes
 */
function determinePathTypeFromAttrs(getAttr) {
  const className = getAttr('class') || '';
  
  if (className.includes('corridor')) return 'corridor';
  if (className.includes('hallway')) return 'hallway';
  if (className.includes('walkway')) return 'walkway';
  return 'connection';
}

/**
 * Calculate overall bounds from rooms and paths
 */
function calculateBounds(rooms, paths) {
  let minX = Infinity, minY = Infinity;
  let maxX = -Infinity, maxY = -Infinity;
  
  // From rooms
  rooms.forEach(room => {
    minX = Math.min(minX, room.bounds.x);
    minY = Math.min(minY, room.bounds.y);
    maxX = Math.max(maxX, room.bounds.x + room.bounds.width);
    maxY = Math.max(maxY, room.bounds.y + room.bounds.height);
  });
  
  // From paths
  paths.forEach(path => {
    path.segments.forEach(seg => {
      minX = Math.min(minX, seg.start.x, seg.end.x);
      minY = Math.min(minY, seg.start.y, seg.end.y);
      maxX = Math.max(maxX, seg.start.x, seg.end.x);
      maxY = Math.max(maxY, seg.start.y, seg.end.y);
    });
  });
  
  if (minX === Infinity) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }
  
  return {
    x: roundToPrecision(minX),
    y: roundToPrecision(minY),
    width: roundToPrecision(maxX - minX),
    height: roundToPrecision(maxY - minY)
  };
}

/**
 * Normalize result for determinism
 */
function normalizeResult(result) {
  // Normalize all coordinates
  result.rooms.forEach(room => {
    room.bounds = normalizeBounds(room.bounds);
  });
  
  result.paths.forEach(path => {
    path.segments = path.segments.map(seg => ({
      start: normalizePoint(seg.start),
      end: normalizePoint(seg.end)
    }));
  });
}

/**
 * Sort result for deterministic output order
 */
function sortResult(result) {
  // Sort rooms: by y (top to bottom), then x (left to right)
  result.rooms.sort((a, b) => {
    const yDiff = a.bounds.y - b.bounds.y;
    if (Math.abs(yDiff) < 1) {
      return a.bounds.x - b.bounds.x;
    }
    return yDiff;
  });
  
  // Sort paths: by first segment start point
  result.paths.sort((a, b) => {
    const aStart = a.segments[0].start;
    const bStart = b.segments[0].start;
    const yDiff = aStart.y - bStart.y;
    if (Math.abs(yDiff) < 1) {
      return aStart.x - bStart.x;
    }
    return yDiff;
  });
}

/**
 * Create empty result structure
 */
function createEmptyResult(rooms, paths, warnings, errors) {
  return {
    rooms,
    paths,
    warnings,
    errors
  };
}

// Export for Node.js / CommonJS
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    scanFloorPlan,
    SCANNER_VERSION
  };
}

// Export for ES6 modules
if (typeof window !== 'undefined') {
  window.FloorPlanScanner = {
    scanFloorPlan,
    SCANNER_VERSION
  };
}

