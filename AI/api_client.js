/**
 * Floor Plan Detection API Client
 * 
 * Node.js client for calling the Python Floor Plan Detection API.
 * Use this module to integrate floor plan detection into your Node.js/Frontend applications.
 * 
 * @module api_client
 */

const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

// Default API configuration
const DEFAULT_CONFIG = {
    apiUrl: 'http://localhost:5000',
    timeout: 60000 // 60 seconds
};

/**
 * Floor Plan Detection API Client
 */
class FloorPlanDetector {
    /**
     * Create a new API client instance
     * @param {Object} config - Configuration options
     * @param {string} config.apiUrl - Base URL of the detection API
     * @param {number} config.timeout - Request timeout in milliseconds
     */
    constructor(config = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
    }

    /**
     * Check if the API server is healthy
     * @returns {Promise<Object>} Health status
     */
    async healthCheck() {
        const response = await fetch(`${this.config.apiUrl}/health`, {
            method: 'GET',
            signal: AbortSignal.timeout(5000)
        });

        if (!response.ok) {
            throw new Error(`Health check failed: ${response.status}`);
        }

        return response.json();
    }

    /**
     * Detect floor plan elements from an image file
     * @param {string} imagePath - Path to the floor plan image
     * @returns {Promise<Object>} Detection results
     */
    async detectFromFile(imagePath) {
        // Validate file exists
        if (!fs.existsSync(imagePath)) {
            throw new Error(`Image file not found: ${imagePath}`);
        }

        // Read file and create form data
        const imageBuffer = fs.readFileSync(imagePath);
        const filename = path.basename(imagePath);
        const mimeType = this._getMimeType(imagePath);

        // Create form data using fetch API
        const formData = new FormData();
        formData.append('image', imageBuffer, {
            filename: filename,
            contentType: mimeType
        });

        // Make API request
        const response = await fetch(`${this.config.apiUrl}/run-inference`, {
            method: 'POST',
            body: formData,
            headers: formData.getHeaders(),
            signal: AbortSignal.timeout(this.config.timeout)
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Detection failed: ${response.status} - ${error}`);
        }

        return response.json();
    }

    /**
     * Detect floor plan elements from a buffer
     * @param {Buffer} imageBuffer - Image data as buffer
     * @param {string} filename - Original filename (for MIME type detection)
     * @returns {Promise<Object>} Detection results
     */
    async detectFromBuffer(imageBuffer, filename = 'image.png') {
        const mimeType = this._getMimeType(filename);

        const formData = new FormData();
        formData.append('image', imageBuffer, {
            filename: filename,
            contentType: mimeType
        });

        const response = await fetch(`${this.config.apiUrl}/run-inference`, {
            method: 'POST',
            body: formData,
            headers: formData.getHeaders(),
            signal: AbortSignal.timeout(this.config.timeout)
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Detection failed: ${response.status} - ${error}`);
        }

        return response.json();
    }

    /**
     * Get MIME type from file extension
     * @param {string} filePath - File path
     * @returns {string} MIME type
     */
    _getMimeType(filePath) {
        const ext = path.extname(filePath).toLowerCase();
        const mimeTypes = {
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png'
        };
        return mimeTypes[ext] || 'image/png';
    }
}

/**
 * Run floor plan detection and build navigation graph
 * @param {string} imagePath - Path to floor plan image
 * @param {Object} options - Processing options
 * @returns {Promise<Object>} Combined detection and graph results
 */
async function processFloorPlan(imagePath, options = {}) {
    const {
        apiUrl = 'http://localhost:5000',
        floor = 1,
        outputPath = null
    } = options;

    console.log(`🔍 Processing floor plan: ${imagePath}`);

    // Create client and detect
    const detector = new FloorPlanDetector({ apiUrl });

    // Check API health
    try {
        const health = await detector.healthCheck();
        console.log(`✅ API is healthy: v${health.version}`);
    } catch (error) {
        throw new Error(`API not available at ${apiUrl}: ${error.message}`);
    }

    // Run detection
    console.log('🚀 Running detection...');
    const detection = await detector.detectFromFile(imagePath);

    console.log(`📊 Detected: ${detection.detectionResults.walls.length} walls, ` +
        `${detection.detectionResults.rooms.length} rooms, ` +
        `${detection.detectionResults.doors.length} doors`);

    // Build result with metadata
    const result = {
        source: path.basename(imagePath),
        floor: floor,
        timestamp: new Date().toISOString(),
        detection: detection
    };

    // Save output if path specified
    if (outputPath) {
        fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
        console.log(`💾 Saved results to: ${outputPath}`);
    }

    return result;
}

// Export for module usage
module.exports = {
    FloorPlanDetector,
    processFloorPlan
};

// CLI usage
if (require.main === module) {
    const args = process.argv.slice(2);

    if (args.length < 1) {
        console.log('Usage: node api_client.js <image_path> [output_path]');
        console.log('');
        console.log('Options:');
        console.log('  image_path   Path to floor plan image (required)');
        console.log('  output_path  Path to save JSON output (optional)');
        console.log('');
        console.log('Environment:');
        console.log('  API_URL      API server URL (default: http://localhost:5000)');
        process.exit(1);
    }

    const imagePath = args[0];
    const outputPath = args[1] || null;
    const apiUrl = process.env.API_URL || 'http://localhost:5000';

    processFloorPlan(imagePath, { apiUrl, outputPath })
        .then(result => {
            if (!outputPath) {
                console.log('\nResults:');
                console.log(JSON.stringify(result, null, 2));
            }
        })
        .catch(error => {
            console.error(`❌ Error: ${error.message}`);
            process.exit(1);
        });
}
