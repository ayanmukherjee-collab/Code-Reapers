import React, { useState, useRef, useEffect } from 'react';

/**
 * RoboflowInference Component
 * 
 * Direct API integration with Roboflow's workflow for floor plan detection.
 * Includes threshold controls for Confidence, Overlap, and Opacity.
 */
const RoboflowInference = ({ onResultsReceived }) => {
    const [selectedImage, setSelectedImage] = useState(null);
    const [preview, setPreview] = useState(null);
    const [results, setResults] = useState(null);
    const [annotatedImage, setAnnotatedImage] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // Threshold states
    const [confidenceThreshold, setConfidenceThreshold] = useState(50);
    const [overlapThreshold, setOverlapThreshold] = useState(50);
    const [opacity, setOpacity] = useState(75);
    const [labelMode, setLabelMode] = useState('confidence');

    const canvasRef = useRef(null);
    const imageRef = useRef(null);

    // Roboflow API configuration - Using DIRECT Detection API (not workflow)
    const ROBOFLOW_API_KEY = "mXkh9oZq1P6F4LjrrsBD";
    const ROBOFLOW_MODEL_ID = "floor_plan_multiple-hgrp2";  // Your detection model
    const ROBOFLOW_MODEL_VERSION = "1";

    // Direct Detection API endpoint
    const ROBOFLOW_DETECT_URL = `https://detect.roboflow.com/${ROBOFLOW_MODEL_ID}/${ROBOFLOW_MODEL_VERSION}`;

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            setSelectedImage(file);
            setPreview(URL.createObjectURL(file));
            setResults(null);
            setAnnotatedImage(null);
            setError(null);
        }
    };

    const convertToBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                // Remove the data:image/xxx;base64, prefix
                const base64 = reader.result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = error => reject(error);
        });
    };

    const handleUpload = async () => {
        if (!selectedImage) {
            setError('Please select an image first');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // Convert image to base64
            const base64Image = await convertToBase64(selectedImage);

            // Direct Detection API format:
            // POST https://detect.roboflow.com/{model_id}/{version}?api_key=YOUR_KEY
            // Body: base64 encoded image (raw, not JSON)
            const detectUrl = `${ROBOFLOW_DETECT_URL}?api_key=${ROBOFLOW_API_KEY}`;

            console.log('Calling Roboflow Detection API:', detectUrl);

            const response = await fetch(detectUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: base64Image  // Send base64 directly, not as JSON
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Roboflow API Error:', response.status, errorText);
                throw new Error(`API request failed: ${response.status} - ${errorText || response.statusText}`);
            }

            const data = await response.json();
            console.log('Roboflow Response:', data);

            setResults(data);

            // Check for annotated/output image
            if (data.image) {
                setAnnotatedImage(data.image);
            }

            // Callback to parent component if provided
            if (onResultsReceived) {
                onResultsReceived(data);
            }

        } catch (err) {
            console.error('Inference error:', err);
            setError(`AI inference failed: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    // Draw detections on canvas when results change
    useEffect(() => {
        if (results && preview && canvasRef.current) {
            drawDetections();
        }
    }, [results, confidenceThreshold, overlapThreshold, opacity, labelMode, preview]);

    const drawDetections = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const img = imageRef.current;

        if (!img || !img.complete) return;

        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;

        // Draw the original image
        ctx.drawImage(img, 0, 0);

        // Extract predictions from results
        let predictions = [];

        if (results.outputs) {
            // Workflow output format
            const outputs = results.outputs;
            if (Array.isArray(outputs)) {
                outputs.forEach(output => {
                    if (output.predictions) {
                        predictions = predictions.concat(output.predictions);
                    }
                });
            } else if (outputs.predictions) {
                predictions = outputs.predictions;
            }
        } else if (results.predictions) {
            predictions = results.predictions;
        } else if (results.detection_predictions) {
            predictions = results.detection_predictions;
        }

        // Apply confidence filter
        const minConfidence = confidenceThreshold / 100;
        let filteredPredictions = predictions.filter(p => (p.confidence || 1) >= minConfidence);

        // Apply NMS (overlap filtering)
        filteredPredictions = applyNMS(filteredPredictions, overlapThreshold / 100);

        const opacityValue = opacity / 100;

        // Draw each prediction
        filteredPredictions.forEach((pred, idx) => {
            const x = pred.x - (pred.width || 0) / 2;
            const y = pred.y - (pred.height || 0) / 2;
            const w = pred.width || 50;
            const h = pred.height || 50;
            const className = (pred.class || 'unknown').toLowerCase();
            const confidence = pred.confidence || 0;

            // Color based on class
            let color = 'rgba(102, 126, 234, '; // Default blue for rooms
            if (className.includes('wall')) {
                color = 'rgba(255, 107, 107, '; // Red for walls
            } else if (className.includes('door')) {
                color = 'rgba(254, 202, 87, '; // Yellow for doors
            } else if (className.includes('stair')) {
                color = 'rgba(46, 213, 115, '; // Green for stairs
            }

            // Draw filled rectangle
            ctx.fillStyle = color + (0.3 * opacityValue) + ')';
            ctx.fillRect(x, y, w, h);

            // Draw border
            ctx.strokeStyle = color + opacityValue + ')';
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, w, h);

            // Draw label
            let label = '';
            switch (labelMode) {
                case 'confidence':
                    label = Math.round(confidence * 100) + '%';
                    break;
                case 'name':
                    label = pred.class || 'Unknown';
                    break;
                case 'id':
                    label = `${className}_${idx + 1}`;
                    break;
                case 'none':
                default:
                    label = '';
            }

            if (label) {
                ctx.fillStyle = `rgba(255, 255, 255, ${opacityValue})`;
                ctx.font = 'bold 12px Arial';
                ctx.fillText(label, x + 4, y + 16);
            }
        });
    };

    const applyNMS = (items, threshold) => {
        if (items.length === 0) return items;

        const sorted = [...items].sort((a, b) => (b.confidence || 1) - (a.confidence || 1));
        const kept = [];

        for (const item of sorted) {
            let shouldKeep = true;

            for (const keptItem of kept) {
                const iou = calculateIoU(item, keptItem);
                if (iou > threshold) {
                    shouldKeep = false;
                    break;
                }
            }

            if (shouldKeep) {
                kept.push(item);
            }
        }

        return kept;
    };

    const calculateIoU = (item1, item2) => {
        const x1_1 = item1.x - (item1.width || 0) / 2;
        const y1_1 = item1.y - (item1.height || 0) / 2;
        const x2_1 = item1.x + (item1.width || 0) / 2;
        const y2_1 = item1.y + (item1.height || 0) / 2;

        const x1_2 = item2.x - (item2.width || 0) / 2;
        const y1_2 = item2.y - (item2.height || 0) / 2;
        const x2_2 = item2.x + (item2.width || 0) / 2;
        const y2_2 = item2.y + (item2.height || 0) / 2;

        const x1 = Math.max(x1_1, x1_2);
        const y1 = Math.max(y1_1, y1_2);
        const x2 = Math.min(x2_1, x2_2);
        const y2 = Math.min(y2_1, y2_2);

        if (x2 < x1 || y2 < y1) return 0;

        const intersection = (x2 - x1) * (y2 - y1);
        const area1 = (item1.width || 0) * (item1.height || 0);
        const area2 = (item2.width || 0) * (item2.height || 0);
        const union = area1 + area2 - intersection;

        return union > 0 ? intersection / union : 0;
    };

    return (
        <div className="p-4 bg-gray-900 min-h-screen text-white">
            <div className="max-w-6xl mx-auto">
                <h2 className="text-2xl font-bold mb-6 text-center bg-gradient-to-r from-purple-500 to-blue-500 bg-clip-text text-transparent">
                    🏗️ Floor Plan AI Detection
                </h2>

                {/* Upload Section */}
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="flex-1">
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="block w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-purple-600 file:text-white hover:file:bg-purple-700 cursor-pointer bg-gray-800 rounded-lg p-2"
                        />
                    </div>
                    <button
                        onClick={handleUpload}
                        disabled={isLoading || !selectedImage}
                        className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:from-purple-700 hover:to-blue-700 transition-all"
                    >
                        {isLoading ? '🔄 Processing...' : '🔍 Run Detection'}
                    </button>
                </div>

                {error && (
                    <div className="bg-red-900/50 border border-red-500 text-red-300 p-3 rounded-lg mb-4">
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Main Canvas Area */}
                    <div className="lg:col-span-3">
                        <div className="bg-gray-800 rounded-xl p-4 relative">
                            {preview ? (
                                <>
                                    <img
                                        ref={imageRef}
                                        src={preview}
                                        alt="Preview"
                                        className="hidden"
                                        onLoad={() => results && drawDetections()}
                                    />
                                    <canvas
                                        ref={canvasRef}
                                        className="max-w-full h-auto rounded-lg mx-auto block"
                                    />
                                    {!results && (
                                        <img
                                            src={preview}
                                            alt="Preview"
                                            className="max-w-full h-auto rounded-lg mx-auto"
                                        />
                                    )}
                                </>
                            ) : (
                                <div className="h-64 flex items-center justify-center text-gray-500">
                                    <p>Upload an image to begin detection</p>
                                </div>
                            )}

                            {isLoading && (
                                <div className="absolute inset-0 bg-black/70 flex items-center justify-center rounded-xl">
                                    <div className="text-center">
                                        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                                        <p>Analyzing floor plan...</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Stats */}
                        {results && (
                            <div className="grid grid-cols-4 gap-4 mt-4">
                                <div className="bg-gray-800 rounded-lg p-3 text-center">
                                    <div className="text-2xl font-bold text-purple-400">
                                        {countPredictions(results, 'room')}
                                    </div>
                                    <div className="text-xs text-gray-400">Rooms</div>
                                </div>
                                <div className="bg-gray-800 rounded-lg p-3 text-center">
                                    <div className="text-2xl font-bold text-red-400">
                                        {countPredictions(results, 'wall')}
                                    </div>
                                    <div className="text-xs text-gray-400">Walls</div>
                                </div>
                                <div className="bg-gray-800 rounded-lg p-3 text-center">
                                    <div className="text-2xl font-bold text-yellow-400">
                                        {countPredictions(results, 'door')}
                                    </div>
                                    <div className="text-xs text-gray-400">Doors</div>
                                </div>
                                <div className="bg-gray-800 rounded-lg p-3 text-center">
                                    <div className="text-2xl font-bold text-green-400">
                                        {countPredictions(results, 'stair')}
                                    </div>
                                    <div className="text-xs text-gray-400">Stairs</div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Threshold Controls Panel */}
                    <div className="bg-gray-800 rounded-xl p-4">
                        <h3 className="text-lg font-semibold mb-4 text-purple-400">⚙️ Detection Settings</h3>

                        {/* Confidence Threshold */}
                        <div className="mb-4">
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-gray-400">Confidence Threshold:</span>
                                <span className="text-purple-400 font-medium">{confidenceThreshold}%</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={confidenceThreshold}
                                onChange={(e) => setConfidenceThreshold(parseInt(e.target.value))}
                                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                            />
                        </div>

                        {/* Overlap Threshold */}
                        <div className="mb-4">
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-gray-400">Overlap Threshold:</span>
                                <span className="text-purple-400 font-medium">{overlapThreshold}</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={overlapThreshold}
                                onChange={(e) => setOverlapThreshold(parseInt(e.target.value))}
                                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                            />
                        </div>

                        {/* Opacity */}
                        <div className="mb-4">
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-gray-400">Opacity:</span>
                                <span className="text-purple-400 font-medium">{opacity}%</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={opacity}
                                onChange={(e) => setOpacity(parseInt(e.target.value))}
                                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                            />
                        </div>

                        {/* Label Mode */}
                        <div className="mb-4">
                            <label className="block text-sm text-gray-400 mb-1">Label Display Mode:</label>
                            <select
                                value={labelMode}
                                onChange={(e) => setLabelMode(e.target.value)}
                                className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2 text-white"
                            >
                                <option value="confidence">Draw Confidence</option>
                                <option value="name">Draw Name/Class</option>
                                <option value="id">Draw ID</option>
                                <option value="none">No Labels</option>
                            </select>
                        </div>

                        <button
                            onClick={() => {
                                setConfidenceThreshold(50);
                                setOverlapThreshold(50);
                                setOpacity(75);
                                setLabelMode('confidence');
                            }}
                            className="w-full py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition-colors"
                        >
                            ↺ Reset to Default
                        </button>

                        {/* Legend */}
                        <div className="mt-6 pt-4 border-t border-gray-700">
                            <h4 className="text-sm font-medium mb-2 text-gray-400">Legend:</h4>
                            <div className="space-y-2 text-sm">
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 rounded bg-blue-500/50 border border-blue-500"></div>
                                    <span>Rooms</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 rounded bg-red-500/50 border border-red-500"></div>
                                    <span>Walls</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 rounded bg-yellow-500/50 border border-yellow-500"></div>
                                    <span>Doors</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 rounded bg-green-500/50 border border-green-500"></div>
                                    <span>Stairs</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* JSON Output */}
                {results && (
                    <div className="mt-6">
                        <h3 className="text-lg font-semibold mb-2">Raw API Response:</h3>
                        <div className="bg-gray-800 rounded-xl p-4 max-h-64 overflow-auto">
                            <pre className="text-xs text-gray-400 font-mono">
                                {JSON.stringify(results, null, 2)}
                            </pre>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// Helper function to count predictions by class
function countPredictions(results, className) {
    let predictions = [];

    if (results.outputs) {
        const outputs = results.outputs;
        if (Array.isArray(outputs)) {
            outputs.forEach(output => {
                if (output.predictions) {
                    predictions = predictions.concat(output.predictions);
                }
            });
        } else if (outputs.predictions) {
            predictions = outputs.predictions;
        }
    } else if (results.predictions) {
        predictions = results.predictions;
    } else if (results.detection_predictions) {
        predictions = results.detection_predictions;
    }

    return predictions.filter(p =>
        (p.class || '').toLowerCase().includes(className.toLowerCase())
    ).length;
}

export default RoboflowInference;
