/**
 * Floor Plan Scanner - AI Vision Module
 * 
 * Scans floor plan images using Google Gemini AI vision to detect architectural
 * structures and converts them into navigation graphs.
 * 
 * @module scanFloorPlan
 */

const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// =============================================================================
// CONFIGURATION
// =============================================================================

const CONFIG = {
    // Google Gemini API configuration
    gemini: {
        apiKey: process.env.GOOGLE_AI_API_KEY || '',
        model: 'gemini-2.0-flash', // Vision-capable model (free tier)
    },

    // Default paths
    paths: {
        inputFloorPlan: path.join(__dirname, '..', 'Shared', 'SampleFloorPlans', 'floor plan 1.png'),
        outputDir: path.join(__dirname, '..', 'Shared', 'BuildingPacks', 'dummy_university')
    },

    // Entity detection settings
    detection: {
        confidenceThreshold: 0.7,
        supportedTypes: ['room', 'hall', 'stairs', 'elevator', 'door']
    }
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Encodes an image file to base64 for API transmission
 * @param {string} imagePath - Path to the image file
 * @returns {string} Base64 encoded image data
 */
function encodeImageToBase64(imagePath) {
    const imageBuffer = fs.readFileSync(imagePath);
    return imageBuffer.toString('base64');
}

/**
 * Gets the MIME type from file extension
 * @param {string} filePath - Path to the file
 * @returns {string} MIME type string
 */
function getMimeType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.webp': 'image/webp',
        '.gif': 'image/gif'
    };
    return mimeTypes[ext] || 'image/png';
}

/**
 * Calculates the center point of a bounding box
 * @param {Object} bbox - Bounding box {x, y, width, height}
 * @returns {Object} Center point {x, y}
 */
function getBboxCenter(bbox) {
    return {
        x: Math.round(bbox.x + bbox.width / 2),
        y: Math.round(bbox.y + bbox.height / 2)
    };
}

/**
 * Calculates Euclidean distance between two points
 * @param {Object} p1 - First point {x, y}
 * @param {Object} p2 - Second point {x, y}
 * @returns {number} Distance in pixels
 */
function calculateDistance(p1, p2) {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}

/**
 * Ensures output directory exists
 * @param {string} dirPath - Directory path to create
 */
function ensureDirectoryExists(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

// =============================================================================
// AI VISION API INTEGRATION (Google Gemini)
// =============================================================================

/**
 * Calls Google Gemini Vision API to analyze floor plan
 * @param {string} base64Image - Base64 encoded image
 * @param {string} mimeType - Image MIME type
 * @returns {Promise<Object>} Detected entities
 */
async function callGeminiVision(base64Image, mimeType) {
    const prompt = `Analyze this floor plan image and identify all architectural elements. 
  
For each element found, provide:
- A unique ID
- A label/name (e.g., "Conference Room A", "Main Corridor", "Stairwell 1")
- Bounding box coordinates (x, y, width, height in pixels, where origin is top-left)

Categorize elements into:
1. rooms - enclosed spaces (offices, classrooms, labs, restrooms, etc.)
2. halls - corridors and hallways
3. stairs - staircases and stairwells
4. elevators - elevator shafts
5. doors - entry/exit points, doorways

Return the result as valid JSON with this exact structure:
{
  "rooms": [{ "id": "room_1", "label": "Room Name", "bbox": { "x": 0, "y": 0, "width": 100, "height": 100 } }],
  "halls": [{ "id": "hall_1", "label": "Hall Name", "bbox": { "x": 0, "y": 0, "width": 100, "height": 50 } }],
  "stairs": [{ "id": "stairs_1", "bbox": { "x": 0, "y": 0, "width": 30, "height": 30 } }],
  "elevators": [{ "id": "elevator_1", "bbox": { "x": 0, "y": 0, "width": 20, "height": 20 } }],
  "doors": [{ "id": "door_1", "bbox": { "x": 0, "y": 0, "width": 10, "height": 5 } }]
}

Only return the JSON, no additional text.`;

    // Check if API key is available
    if (!CONFIG.gemini.apiKey) {
        console.warn('⚠️  No Gemini API key found. Using placeholder detection.');
        return generatePlaceholderEntities();
    }

    try {
        // Initialize Gemini client
        const genAI = new GoogleGenerativeAI(CONFIG.gemini.apiKey);
        const model = genAI.getGenerativeModel({ model: CONFIG.gemini.model });

        // Prepare image for Gemini
        const imagePart = {
            inlineData: {
                data: base64Image,
                mimeType: mimeType
            }
        };

        // Generate content with vision
        const result = await model.generateContent([prompt, imagePart]);
        const response = await result.response;
        const content = response.text();

        // Parse JSON from response (handle markdown code blocks)
        const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || [null, content];
        return JSON.parse(jsonMatch[1] || content);

    } catch (error) {
        console.error('❌ Gemini Vision API failed:', error.message);
        console.warn('⚠️  Falling back to placeholder detection.');
        return generatePlaceholderEntities();
    }
}

/**
 * Generates placeholder entities for testing without API
 * @returns {Object} Sample detected entities
 */
function generatePlaceholderEntities() {
    return {
        rooms: [
            { id: 'room_1', label: 'Lecture Hall A', bbox: { x: 50, y: 50, width: 200, height: 150 } },
            { id: 'room_2', label: 'Classroom 101', bbox: { x: 300, y: 50, width: 120, height: 100 } },
            { id: 'room_3', label: 'Classroom 102', bbox: { x: 450, y: 50, width: 120, height: 100 } },
            { id: 'room_4', label: 'Laboratory', bbox: { x: 50, y: 250, width: 180, height: 120 } },
            { id: 'room_5', label: 'Office', bbox: { x: 300, y: 200, width: 100, height: 80 } },
            { id: 'room_6', label: 'Restroom', bbox: { x: 450, y: 200, width: 80, height: 60 } }
        ],
        halls: [
            { id: 'hall_1', label: 'Main Corridor', bbox: { x: 260, y: 100, width: 30, height: 300 } },
            { id: 'hall_2', label: 'North Wing Hall', bbox: { x: 100, y: 200, width: 150, height: 30 } }
        ],
        stairs: [
            { id: 'stairs_1', bbox: { x: 550, y: 350, width: 40, height: 40 } },
            { id: 'stairs_2', bbox: { x: 50, y: 400, width: 40, height: 40 } }
        ],
        elevators: [
            { id: 'elevator_1', bbox: { x: 270, y: 380, width: 25, height: 25 } }
        ],
        doors: [
            { id: 'door_1', bbox: { x: 248, y: 100, width: 12, height: 5 } },
            { id: 'door_2', bbox: { x: 248, y: 150, width: 12, height: 5 } },
            { id: 'door_3', bbox: { x: 420, y: 100, width: 12, height: 5 } },
            { id: 'door_4', bbox: { x: 248, y: 250, width: 12, height: 5 } },
            { id: 'door_5', bbox: { x: 248, y: 320, width: 12, height: 5 } }
        ]
    };
}

// =============================================================================
// CORE DETECTION FUNCTION
// =============================================================================

/**
 * Detects architectural structures in a floor plan image
 * @param {string} imagePath - Path to the floor plan image
 * @returns {Promise<Object>} Detected entities organized by type
 */
async function detectStructures(imagePath) {
    const resolvedPath = path.resolve(imagePath);

    // Validate image exists
    if (!fs.existsSync(resolvedPath)) {
        throw new Error(`Image not found: ${resolvedPath}`);
    }

    console.log(`🔍 Scanning floor plan: ${resolvedPath}`);

    // Encode image for API
    const base64Image = encodeImageToBase64(resolvedPath);
    const mimeType = getMimeType(resolvedPath);

    console.log('📡 Sending to AI vision model...');

    // Call AI vision API
    const entities = await callGeminiVision(base64Image, mimeType);

    // Validate and normalize entity structure
    const normalized = {
        rooms: entities.rooms || [],
        halls: entities.halls || [],
        stairs: entities.stairs || [],
        elevators: entities.elevators || [],
        doors: entities.doors || []
    };

    const totalCount = Object.values(normalized).reduce((sum, arr) => sum + arr.length, 0);
    console.log(`✅ Detected ${totalCount} entities:`);
    console.log(`   - Rooms: ${normalized.rooms.length}`);
    console.log(`   - Halls: ${normalized.halls.length}`);
    console.log(`   - Stairs: ${normalized.stairs.length}`);
    console.log(`   - Elevators: ${normalized.elevators.length}`);
    console.log(`   - Doors: ${normalized.doors.length}`);

    return normalized;
}

// =============================================================================
// GRAPH BUILDING FUNCTION
// =============================================================================

/**
 * Converts detected entities into a navigation graph
 * @param {Object} entities - Detected entities from detectStructures
 * @param {Object} options - Graph building options
 * @param {number} options.floor - Floor number (default: 1)
 * @param {number} options.connectionThreshold - Max distance for automatic connections (default: 100)
 * @returns {Object} Navigation graph with nodes and edges
 */
function buildGraph(entities, options = {}) {
    const { floor = 1, connectionThreshold = 100 } = options;

    console.log('🔗 Building navigation graph...');

    const nodes = [];
    const edges = [];
    const nodeMap = new Map(); // For quick lookup during edge creation

    // Helper to create node from entity
    const createNode = (entity, type) => {
        const center = getBboxCenter(entity.bbox);
        const node = {
            id: entity.id,
            type: type,
            x: center.x,
            y: center.y,
            floor: floor,
            metadata: {
                label: entity.label || null,
                bbox: entity.bbox,
                area: entity.bbox.width * entity.bbox.height
            }
        };
        nodes.push(node);
        nodeMap.set(entity.id, node);
        return node;
    };

    // Create nodes for all entity types
    entities.rooms.forEach(room => createNode(room, 'room'));
    entities.halls.forEach(hall => createNode(hall, 'hall'));
    entities.stairs.forEach(stair => createNode(stair, 'stairs'));
    entities.elevators.forEach(elevator => createNode(elevator, 'elevator'));
    entities.doors.forEach(door => createNode(door, 'door'));

    // Build edges based on proximity and logical connections
    // Strategy: Connect doors to nearby rooms/halls, connect halls to each other

    const doorNodes = nodes.filter(n => n.type === 'door');
    const hallNodes = nodes.filter(n => n.type === 'hall');
    const roomNodes = nodes.filter(n => n.type === 'room');
    const stairsNodes = nodes.filter(n => n.type === 'stairs');
    const elevatorNodes = nodes.filter(n => n.type === 'elevator');

    // Connect doors to nearest rooms and halls
    doorNodes.forEach(door => {
        // Find nearest room
        let nearestRoom = null;
        let nearestRoomDist = Infinity;

        roomNodes.forEach(room => {
            const dist = calculateDistance(door, room);
            if (dist < nearestRoomDist && dist < connectionThreshold * 2) {
                nearestRoomDist = dist;
                nearestRoom = room;
            }
        });

        if (nearestRoom) {
            edges.push({
                from: door.id,
                to: nearestRoom.id,
                distance: Math.round(nearestRoomDist)
            });
        }

        // Find nearest hall
        let nearestHall = null;
        let nearestHallDist = Infinity;

        hallNodes.forEach(hall => {
            const dist = calculateDistance(door, hall);
            if (dist < nearestHallDist && dist < connectionThreshold * 2) {
                nearestHallDist = dist;
                nearestHall = hall;
            }
        });

        if (nearestHall) {
            edges.push({
                from: door.id,
                to: nearestHall.id,
                distance: Math.round(nearestHallDist)
            });
        }
    });

    // Connect halls to each other if close enough
    for (let i = 0; i < hallNodes.length; i++) {
        for (let j = i + 1; j < hallNodes.length; j++) {
            const dist = calculateDistance(hallNodes[i], hallNodes[j]);
            if (dist < connectionThreshold * 3) {
                edges.push({
                    from: hallNodes[i].id,
                    to: hallNodes[j].id,
                    distance: Math.round(dist)
                });
            }
        }
    }

    // Connect stairs and elevators to nearest halls
    [...stairsNodes, ...elevatorNodes].forEach(verticalTransport => {
        let nearestHall = null;
        let nearestDist = Infinity;

        hallNodes.forEach(hall => {
            const dist = calculateDistance(verticalTransport, hall);
            if (dist < nearestDist) {
                nearestDist = dist;
                nearestHall = hall;
            }
        });

        if (nearestHall) {
            edges.push({
                from: verticalTransport.id,
                to: nearestHall.id,
                distance: Math.round(nearestDist)
            });
        }
    });

    // Remove duplicate edges
    const uniqueEdges = [];
    const edgeSet = new Set();

    edges.forEach(edge => {
        const key1 = `${edge.from}-${edge.to}`;
        const key2 = `${edge.to}-${edge.from}`;

        if (!edgeSet.has(key1) && !edgeSet.has(key2)) {
            edgeSet.add(key1);
            uniqueEdges.push(edge);
        }
    });

    const graph = {
        nodes: nodes,
        edges: uniqueEdges
    };

    console.log(`✅ Graph built with ${nodes.length} nodes and ${uniqueEdges.length} edges`);

    return graph;
}

// =============================================================================
// OUTPUT SAVING FUNCTION
// =============================================================================

/**
 * Saves the navigation graph and entities to a JSON file
 * @param {Object} graph - Navigation graph from buildGraph
 * @param {string} outputPath - Path to save the output JSON
 * @param {Object} metadata - Additional metadata to include
 * @returns {string} Path to the saved file
 */
function saveOutput(graph, outputPath, metadata = {}) {
    const resolvedPath = path.resolve(outputPath);
    const outputDir = path.dirname(resolvedPath);

    // Ensure output directory exists
    ensureDirectoryExists(outputDir);

    // Build output object
    const output = {
        version: '1.0.0',
        generatedAt: new Date().toISOString(),
        source: metadata.source || 'unknown',
        floor: metadata.floor || 1,
        graph: graph,
        statistics: {
            totalNodes: graph.nodes.length,
            totalEdges: graph.edges.length,
            nodesByType: graph.nodes.reduce((acc, node) => {
                acc[node.type] = (acc[node.type] || 0) + 1;
                return acc;
            }, {})
        },
        ...metadata
    };

    // Write JSON file
    fs.writeFileSync(resolvedPath, JSON.stringify(output, null, 2), 'utf-8');

    console.log(`💾 Output saved to: ${resolvedPath}`);

    return resolvedPath;
}

// =============================================================================
// MAIN PIPELINE FUNCTION
// =============================================================================

/**
 * Runs the complete floor plan scanning pipeline
 * @param {Object} options - Pipeline options
 * @param {string} options.inputPath - Input floor plan image path
 * @param {string} options.outputPath - Output JSON file path
 * @param {number} options.floor - Floor number
 * @returns {Promise<Object>} Pipeline result with graph and file path
 */
async function runPipeline(options = {}) {
    const {
        inputPath = CONFIG.paths.inputFloorPlan,
        outputPath = path.join(CONFIG.paths.outputDir, 'floor1-scan.json'),
        floor = 1
    } = options;

    console.log('═══════════════════════════════════════════════════════════');
    console.log('  🏢 Floor Plan Scanner - Starting Pipeline');
    console.log('═══════════════════════════════════════════════════════════\n');

    try {
        // Step 1: Detect structures
        const entities = await detectStructures(inputPath);

        // Step 2: Build navigation graph
        const graph = buildGraph(entities, { floor });

        // Step 3: Save output
        const savedPath = saveOutput(graph, outputPath, {
            source: path.basename(inputPath),
            floor: floor,
            entities: entities
        });

        console.log('\n═══════════════════════════════════════════════════════════');
        console.log('  ✅ Pipeline Complete!');
        console.log('═══════════════════════════════════════════════════════════\n');

        return {
            success: true,
            entities,
            graph,
            outputPath: savedPath
        };

    } catch (error) {
        console.error('\n❌ Pipeline failed:', error.message);
        throw error;
    }
}

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = {
    // Core functions
    detectStructures,
    buildGraph,
    saveOutput,

    // Full pipeline
    runPipeline,

    // Utilities
    encodeImageToBase64,
    calculateDistance,
    getBboxCenter,

    // Configuration
    CONFIG
};

// =============================================================================
// CLI EXECUTION
// =============================================================================

if (require.main === module) {
    // Run pipeline when executed directly
    runPipeline()
        .then(result => {
            console.log('📊 Summary:');
            console.log(`   - Nodes: ${result.graph.nodes.length}`);
            console.log(`   - Edges: ${result.graph.edges.length}`);
            console.log(`   - Output: ${result.outputPath}`);
            process.exit(0);
        })
        .catch(error => {
            console.error('Fatal error:', error);
            process.exit(1);
        });
}
