import React, { useState, useRef, useEffect, useCallback } from 'react';

/**
 * FloorPlanNavigator Component - v3
 * 
 * Full floor plan detection, editing, and pathfinding interface.
 * Uses Roboflow detect-and-classify workflow for ML-based room detection.
 * 
 * Features:
 * - Roboflow ML detection with adjustable confidence/overlap thresholds
 * - Interactive editing (add/edit/delete rooms, doors, paths)
 * - A* pathfinding with turn-by-turn directions
 * - Opacity and label display controls
 */
const FloorPlanNavigator = () => {
    // Image states
    const [selectedImage, setSelectedImage] = useState(null);
    const [preview, setPreview] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // Detection states
    const [detections, setDetections] = useState(null);
    const [navigationGraph, setNavigationGraph] = useState(null);

    // Detection thresholds (from Roboflow)
    const [confidenceThreshold, setConfidenceThreshold] = useState(40);
    const [overlapThreshold, setOverlapThreshold] = useState(30);
    const [opacity, setOpacity] = useState(75);
    const [labelMode, setLabelMode] = useState('name');  // 'name', 'confidence', 'none'

    // Detection mode
    const [detectionMode, setDetectionMode] = useState('roboflow');  // 'roboflow' or 'opencv'

    // Pathfinding states
    const [startQuery, setStartQuery] = useState('');
    const [endQuery, setEndQuery] = useState('');
    const [pathResult, setPathResult] = useState(null);
    const [searchResults, setSearchResults] = useState({ start: [], end: [] });

    // Display settings
    const [showRooms, setShowRooms] = useState(true);
    const [showDoors, setShowDoors] = useState(true);
    const [showHallways, setShowHallways] = useState(true);
    const [showNodes, setShowNodes] = useState(false);
    const [showEdges, setShowEdges] = useState(false);
    const [showPath, setShowPath] = useState(true);

    // Editing mode
    const [editMode, setEditMode] = useState(null);
    const [selectedElement, setSelectedElement] = useState(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [drawStart, setDrawStart] = useState(null);

    const canvasRef = useRef(null);
    const imageRef = useRef(null);

    const API_URL = 'http://localhost:5001';

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            setSelectedImage(file);
            setPreview(URL.createObjectURL(file));
            setDetections(null);
            setNavigationGraph(null);
            setPathResult(null);
            setError(null);
        }
    };

    const handleDetection = async () => {
        if (!selectedImage) {
            setError('Please select an image first');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append('image', selectedImage);

            // Choose endpoint based on detection mode
            const endpoint = detectionMode === 'roboflow'
                ? `${API_URL}/detect-roboflow?confidence=${confidenceThreshold}&overlap=${overlapThreshold}`
                : `${API_URL}/detect-unified`;

            const response = await fetch(endpoint, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Detection failed: ${response.status}`);
            }

            const data = await response.json();
            console.log('Detection result:', data);

            setDetections(data.detections);
            setNavigationGraph(data.navigationGraph);

        } catch (err) {
            console.error('Detection error:', err);
            setError(`Detection failed: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    // Re-run detection when thresholds change (only for Roboflow mode)
    const handleRedetect = async () => {
        if (selectedImage && detectionMode === 'roboflow') {
            await handleDetection();
        }
    };

    const handlePathfind = async () => {
        if (!navigationGraph) {
            setError('Please run detection first');
            return;
        }
        if (!startQuery || !endQuery) {
            setError('Please enter start and end locations');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(`${API_URL}/pathfind`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    graph: navigationGraph,
                    start_query: startQuery,
                    end_query: endQuery,
                    algorithm: 'astar'
                })
            });

            if (!response.ok) throw new Error('Pathfinding failed');

            const result = await response.json();
            console.log('Path result:', result);
            setPathResult(result);

        } catch (err) {
            setError(`Pathfinding failed: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    // Rebuild graph after edits
    const rebuildGraph = async () => {
        if (!detections) return;

        setIsLoading(true);
        try {
            const response = await fetch(`${API_URL}/rebuild-graph`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ detections })
            });

            if (response.ok) {
                const data = await response.json();
                setNavigationGraph(data.navigationGraph);
                setPathResult(null);
            }
        } catch (err) {
            console.error('Rebuild error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const searchNodes = async (query, type) => {
        if (!navigationGraph || query.length < 1) {
            setSearchResults(prev => ({ ...prev, [type]: [] }));
            return;
        }

        try {
            const response = await fetch(`${API_URL}/search-nodes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ graph: navigationGraph, query })
            });

            if (response.ok) {
                const data = await response.json();
                setSearchResults(prev => ({ ...prev, [type]: data.results }));
            }
        } catch (err) {
            console.error('Search error:', err);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => searchNodes(startQuery, 'start'), 300);
        return () => clearTimeout(timer);
    }, [startQuery, navigationGraph]);

    useEffect(() => {
        const timer = setTimeout(() => searchNodes(endQuery, 'end'), 300);
        return () => clearTimeout(timer);
    }, [endQuery, navigationGraph]);

    useEffect(() => {
        if (preview && canvasRef.current) {
            drawCanvas();
        }
    }, [preview, detections, pathResult, showRooms, showDoors, showHallways, showNodes, showEdges, showPath, opacity, labelMode, selectedElement, navigationGraph]);

    const drawCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const img = imageRef.current;

        if (!img || !img.complete) return;

        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        ctx.drawImage(img, 0, 0);

        if (!detections) return;

        const opacityValue = opacity / 100;

        // Draw rooms
        if (showRooms && detections.rooms) {
            detections.rooms.forEach(room => {
                const x = room.position.start.x;
                const y = room.position.start.y;
                const w = room.position.end.x - x;
                const h = room.position.end.y - y;

                const isSelected = selectedElement?.id === room.id;
                const conf = room.confidence || 0;

                // Color based on confidence
                const hue = conf * 120; // 0=red, 1=green
                ctx.fillStyle = isSelected
                    ? `rgba(255, 200, 0, ${0.4 * opacityValue})`
                    : `hsla(${hue}, 70%, 50%, ${0.3 * opacityValue})`;
                ctx.strokeStyle = isSelected
                    ? `rgba(255, 200, 0, ${opacityValue})`
                    : `hsla(${hue}, 70%, 50%, ${opacityValue})`;
                ctx.lineWidth = isSelected ? 3 : 2;
                ctx.fillRect(x, y, w, h);
                ctx.strokeRect(x, y, w, h);

                // Labels
                if (labelMode !== 'none') {
                    ctx.fillStyle = `rgba(255, 255, 255, ${opacityValue})`;
                    ctx.font = 'bold 11px Arial';
                    const label = labelMode === 'confidence'
                        ? `${(conf * 100).toFixed(0)}%`
                        : (room.name || room.id);
                    ctx.fillText(label, x + 4, y + 14);
                }
            });
        }

        // Draw doors
        if (showDoors && detections.doors) {
            detections.doors.forEach(door => {
                const isSelected = selectedElement?.id === door.id;
                ctx.fillStyle = isSelected
                    ? 'rgba(255, 100, 100, 0.9)'
                    : `rgba(254, 202, 87, ${opacityValue})`;
                ctx.beginPath();
                ctx.arc(door.hinge.x, door.hinge.y, isSelected ? 10 : 6, 0, Math.PI * 2);
                ctx.fill();

                // Door confidence label
                if (labelMode === 'confidence' && door.confidence) {
                    ctx.fillStyle = 'white';
                    ctx.font = '9px Arial';
                    ctx.fillText(`${(door.confidence * 100).toFixed(0)}%`, door.hinge.x - 10, door.hinge.y - 10);
                }
            });
        }

        // Draw hallways
        if (showHallways && detections.hallways) {
            ctx.strokeStyle = `rgba(46, 213, 115, ${opacityValue})`;
            ctx.lineWidth = 3;
            detections.hallways.forEach(hall => {
                if (hall.polyline && hall.polyline.length >= 2) {
                    ctx.beginPath();
                    ctx.moveTo(hall.polyline[0].x, hall.polyline[0].y);
                    for (let i = 1; i < hall.polyline.length; i++) {
                        ctx.lineTo(hall.polyline[i].x, hall.polyline[i].y);
                    }
                    ctx.stroke();
                }
            });
        }

        // Draw edges
        if (showEdges && navigationGraph) {
            ctx.strokeStyle = 'rgba(150, 150, 150, 0.3)';
            ctx.lineWidth = 1;

            const nodeMap = {};
            navigationGraph.nodes.forEach(n => nodeMap[n.id] = n);

            navigationGraph.edges.forEach(edge => {
                const from = nodeMap[edge.from];
                const to = nodeMap[edge.to];
                if (from && to) {
                    ctx.beginPath();
                    ctx.moveTo(from.position.x, from.position.y);
                    ctx.lineTo(to.position.x, to.position.y);
                    ctx.stroke();
                }
            });
        }

        // Draw nodes
        if (showNodes && navigationGraph) {
            navigationGraph.nodes.forEach(node => {
                let color = 'rgba(150, 150, 150, 0.5)';
                let radius = 3;
                if (node.type === 'room') { color = 'rgba(102, 126, 234, 0.8)'; radius = 4; }
                if (node.type === 'door') { color = 'rgba(254, 202, 87, 0.8)'; radius = 5; }
                if (node.type === 'stair') { color = 'rgba(255, 107, 107, 0.8)'; radius = 6; }

                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.arc(node.position.x, node.position.y, radius, 0, Math.PI * 2);
                ctx.fill();
            });
        }

        // Draw path
        if (showPath && pathResult && pathResult.found && pathResult.pathNodes) {
            const nodes = pathResult.pathNodes;

            ctx.strokeStyle = 'rgba(255, 0, 100, 0.9)';
            ctx.lineWidth = 4;
            ctx.setLineDash([10, 5]);
            ctx.beginPath();
            ctx.moveTo(nodes[0].position.x, nodes[0].position.y);
            for (let i = 1; i < nodes.length; i++) {
                ctx.lineTo(nodes[i].position.x, nodes[i].position.y);
            }
            ctx.stroke();
            ctx.setLineDash([]);

            // Start marker
            ctx.fillStyle = '#22c55e';
            ctx.beginPath();
            ctx.arc(nodes[0].position.x, nodes[0].position.y, 14, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = 'white';
            ctx.font = 'bold 12px Arial';
            ctx.fillText('S', nodes[0].position.x - 5, nodes[0].position.y + 4);

            // End marker
            const endNode = nodes[nodes.length - 1];
            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            ctx.arc(endNode.position.x, endNode.position.y, 14, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = 'white';
            ctx.fillText('E', endNode.position.x - 5, endNode.position.y + 4);
        }
    }, [detections, navigationGraph, pathResult, showRooms, showDoors, showHallways, showNodes, showEdges, showPath, opacity, labelMode, selectedElement]);

    // Canvas click handler
    const handleCanvasClick = (e) => {
        if (!detections || !editMode) return;

        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;

        if (editMode === 'select') {
            const clickedRoom = detections.rooms?.find(room => {
                const rx = room.position.start.x;
                const ry = room.position.start.y;
                const rw = room.position.end.x - rx;
                const rh = room.position.end.y - ry;
                return x >= rx && x <= rx + rw && y >= ry && y <= ry + rh;
            });

            const clickedDoor = detections.doors?.find(door => {
                const dist = Math.sqrt((door.hinge.x - x) ** 2 + (door.hinge.y - y) ** 2);
                return dist < 15;
            });

            setSelectedElement(clickedRoom || clickedDoor || null);
        } else if (editMode === 'addDoor') {
            const newDoor = {
                id: `door_new_${Date.now()}`,
                hinge: { x, y },
                width: 30,
                swing_angle: 90,
                type: 'door'
            };
            setDetections(prev => ({
                ...prev,
                doors: [...(prev.doors || []), newDoor]
            }));
        } else if (editMode === 'addRoom' && !isDrawing) {
            setIsDrawing(true);
            setDrawStart({ x, y });
        }
    };

    const handleCanvasMouseUp = (e) => {
        if (editMode === 'addRoom' && isDrawing && drawStart) {
            const canvas = canvasRef.current;
            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            const x = (e.clientX - rect.left) * scaleX;
            const y = (e.clientY - rect.top) * scaleY;

            const newRoom = {
                id: `room_new_${Date.now()}`,
                name: `New Room`,
                position: {
                    start: { x: Math.min(drawStart.x, x), y: Math.min(drawStart.y, y) },
                    end: { x: Math.max(drawStart.x, x), y: Math.max(drawStart.y, y) }
                },
                center: { x: (drawStart.x + x) / 2, y: (drawStart.y + y) / 2 },
                area: Math.abs((x - drawStart.x) * (y - drawStart.y)),
                confidence: 1.0,
                type: 'room'
            };

            setDetections(prev => ({
                ...prev,
                rooms: [...(prev.rooms || []), newRoom]
            }));

            setIsDrawing(false);
            setDrawStart(null);
        }
    };

    const deleteSelected = () => {
        if (!selectedElement || !detections) return;

        if (selectedElement.type === 'room' || selectedElement.position) {
            setDetections(prev => ({
                ...prev,
                rooms: prev.rooms.filter(r => r.id !== selectedElement.id)
            }));
        } else if (selectedElement.type === 'door' || selectedElement.hinge) {
            setDetections(prev => ({
                ...prev,
                doors: prev.doors.filter(d => d.id !== selectedElement.id)
            }));
        }
        setSelectedElement(null);
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white p-4">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold text-center mb-6 bg-gradient-to-r from-purple-500 to-blue-500 bg-clip-text text-transparent">
                    🏗️ Floor Plan Navigator
                </h1>

                {/* Upload & Detection Mode */}
                <div className="bg-gray-800 rounded-xl p-4 mb-6">
                    <div className="flex flex-col md:flex-row gap-4 items-center">
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="flex-1 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-purple-600 file:text-white cursor-pointer bg-gray-700 rounded-lg p-2"
                        />

                        <select
                            value={detectionMode}
                            onChange={(e) => setDetectionMode(e.target.value)}
                            className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm"
                        >
                            <option value="roboflow">🤖 Roboflow ML</option>
                            <option value="opencv">📐 OpenCV</option>
                        </select>

                        <button
                            onClick={handleDetection}
                            disabled={isLoading || !selectedImage}
                            className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg font-medium disabled:opacity-50"
                        >
                            {isLoading ? '🔄 Processing...' : '🔍 Detect'}
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-900/50 border border-red-500 text-red-300 p-3 rounded-lg mb-4">
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Main Canvas */}
                    <div className="lg:col-span-3">
                        <div className="bg-gray-800 rounded-xl p-4 relative">
                            {preview ? (
                                <>
                                    <img
                                        ref={imageRef}
                                        src={preview}
                                        alt="Floor Plan"
                                        className="hidden"
                                        onLoad={drawCanvas}
                                    />
                                    <canvas
                                        ref={canvasRef}
                                        className="max-w-full h-auto rounded-lg mx-auto block cursor-crosshair"
                                        onClick={handleCanvasClick}
                                        onMouseUp={handleCanvasMouseUp}
                                    />
                                </>
                            ) : (
                                <div className="h-64 flex items-center justify-center text-gray-500">
                                    Upload a floor plan image to begin
                                </div>
                            )}

                            {isLoading && (
                                <div className="absolute inset-0 bg-black/70 flex items-center justify-center rounded-xl">
                                    <div className="text-center">
                                        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                                        <p>Processing with {detectionMode === 'roboflow' ? 'Roboflow ML' : 'OpenCV'}...</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Stats */}
                        {detections && (
                            <div className="grid grid-cols-5 gap-3 mt-4">
                                <div className="bg-gray-800 rounded-lg p-3 text-center">
                                    <div className="text-2xl font-bold text-purple-400">{detections.rooms?.length || 0}</div>
                                    <div className="text-xs text-gray-400">Rooms</div>
                                </div>
                                <div className="bg-gray-800 rounded-lg p-3 text-center">
                                    <div className="text-2xl font-bold text-yellow-400">{detections.doors?.length || 0}</div>
                                    <div className="text-xs text-gray-400">Doors</div>
                                </div>
                                <div className="bg-gray-800 rounded-lg p-3 text-center">
                                    <div className="text-2xl font-bold text-green-400">{detections.hallways?.length || 0}</div>
                                    <div className="text-xs text-gray-400">Hallways</div>
                                </div>
                                <div className="bg-gray-800 rounded-lg p-3 text-center">
                                    <div className="text-2xl font-bold text-blue-400">{navigationGraph?.nodes?.length || 0}</div>
                                    <div className="text-xs text-gray-400">Nodes</div>
                                </div>
                                <div className="bg-gray-800 rounded-lg p-3 text-center">
                                    <div className="text-2xl font-bold text-pink-400">{navigationGraph?.edges?.length || 0}</div>
                                    <div className="text-xs text-gray-400">Edges</div>
                                </div>
                            </div>
                        )}

                        {/* Directions */}
                        {pathResult?.found && pathResult.directions && (
                            <div className="bg-gray-800 rounded-xl p-4 mt-4">
                                <h3 className="text-lg font-semibold mb-3 text-green-400">📍 Directions</h3>
                                <div className="space-y-2 max-h-48 overflow-auto">
                                    {pathResult.directions.map((dir, i) => (
                                        <div key={i} className="flex items-start gap-2 text-sm">
                                            <span className="text-purple-400 font-bold">{i + 1}.</span>
                                            <span>{dir}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Controls Panel */}
                    <div className="space-y-4">
                        {/* Pathfinding */}
                        <div className="bg-gray-800 rounded-xl p-4">
                            <h3 className="text-lg font-semibold mb-3 text-purple-400">🧭 Find Path</h3>

                            <div className="space-y-3">
                                <div className="relative">
                                    <label className="text-sm text-gray-400">From:</label>
                                    <input
                                        type="text"
                                        value={startQuery}
                                        onChange={(e) => setStartQuery(e.target.value)}
                                        placeholder="Room name..."
                                        className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2 mt-1"
                                    />
                                    {searchResults.start.length > 0 && startQuery && (
                                        <div className="absolute z-10 w-full bg-gray-700 border border-gray-600 rounded-lg mt-1 max-h-32 overflow-auto">
                                            {searchResults.start.map(item => (
                                                <div
                                                    key={item.id}
                                                    className="p-2 hover:bg-gray-600 cursor-pointer text-sm"
                                                    onClick={() => { setStartQuery(item.name); setSearchResults(prev => ({ ...prev, start: [] })); }}
                                                >
                                                    {item.name}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="relative">
                                    <label className="text-sm text-gray-400">To:</label>
                                    <input
                                        type="text"
                                        value={endQuery}
                                        onChange={(e) => setEndQuery(e.target.value)}
                                        placeholder="Destination..."
                                        className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2 mt-1"
                                    />
                                    {searchResults.end.length > 0 && endQuery && (
                                        <div className="absolute z-10 w-full bg-gray-700 border border-gray-600 rounded-lg mt-1 max-h-32 overflow-auto">
                                            {searchResults.end.map(item => (
                                                <div
                                                    key={item.id}
                                                    className="p-2 hover:bg-gray-600 cursor-pointer text-sm"
                                                    onClick={() => { setEndQuery(item.name); setSearchResults(prev => ({ ...prev, end: [] })); }}
                                                >
                                                    {item.name}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <button
                                    onClick={handlePathfind}
                                    disabled={isLoading || !navigationGraph}
                                    className="w-full py-2 bg-gradient-to-r from-green-600 to-teal-600 rounded-lg font-medium disabled:opacity-50"
                                >
                                    🚀 Find Route
                                </button>
                            </div>

                            {pathResult && !pathResult.found && (
                                <div className="mt-3 p-2 bg-yellow-900/30 border border-yellow-600 rounded text-yellow-300 text-sm">
                                    {pathResult.reason || 'No path found'}
                                </div>
                            )}
                        </div>

                        {/* Detection Thresholds */}
                        <div className="bg-gray-800 rounded-xl p-4">
                            <h3 className="text-lg font-semibold mb-3 text-purple-400">🎚️ Thresholds</h3>

                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-gray-400">Confidence:</span>
                                        <span className="text-purple-400">{confidenceThreshold}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={confidenceThreshold}
                                        onChange={(e) => setConfidenceThreshold(parseInt(e.target.value))}
                                        className="w-full h-2 bg-gray-700 rounded-lg accent-purple-500"
                                    />
                                </div>

                                <div>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-gray-400">Overlap (NMS):</span>
                                        <span className="text-purple-400">{overlapThreshold}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={overlapThreshold}
                                        onChange={(e) => setOverlapThreshold(parseInt(e.target.value))}
                                        className="w-full h-2 bg-gray-700 rounded-lg accent-purple-500"
                                    />
                                </div>

                                <div>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-gray-400">Opacity:</span>
                                        <span className="text-purple-400">{opacity}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={opacity}
                                        onChange={(e) => setOpacity(parseInt(e.target.value))}
                                        className="w-full h-2 bg-gray-700 rounded-lg accent-purple-500"
                                    />
                                </div>

                                <div>
                                    <label className="text-sm text-gray-400">Label Mode:</label>
                                    <select
                                        value={labelMode}
                                        onChange={(e) => setLabelMode(e.target.value)}
                                        className="w-full mt-1 bg-gray-700 border border-gray-600 rounded-lg p-2 text-sm"
                                    >
                                        <option value="name">Room Name</option>
                                        <option value="confidence">Confidence %</option>
                                        <option value="none">No Labels</option>
                                    </select>
                                </div>

                                {detectionMode === 'roboflow' && selectedImage && (
                                    <button
                                        onClick={handleRedetect}
                                        disabled={isLoading}
                                        className="w-full py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm disabled:opacity-50"
                                    >
                                        🔄 Re-detect with New Thresholds
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Edit Mode */}
                        <div className="bg-gray-800 rounded-xl p-4">
                            <h3 className="text-lg font-semibold mb-3 text-purple-400">✏️ Edit</h3>

                            <div className="grid grid-cols-2 gap-2 mb-3">
                                <button
                                    onClick={() => setEditMode(editMode === 'select' ? null : 'select')}
                                    className={`py-2 px-3 rounded-lg text-sm ${editMode === 'select' ? 'bg-purple-600' : 'bg-gray-700'}`}
                                >
                                    Select
                                </button>
                                <button
                                    onClick={() => setEditMode(editMode === 'addRoom' ? null : 'addRoom')}
                                    className={`py-2 px-3 rounded-lg text-sm ${editMode === 'addRoom' ? 'bg-purple-600' : 'bg-gray-700'}`}
                                >
                                    + Room
                                </button>
                                <button
                                    onClick={() => setEditMode(editMode === 'addDoor' ? null : 'addDoor')}
                                    className={`py-2 px-3 rounded-lg text-sm ${editMode === 'addDoor' ? 'bg-yellow-600' : 'bg-gray-700'}`}
                                >
                                    + Door
                                </button>
                                <button
                                    onClick={deleteSelected}
                                    disabled={!selectedElement}
                                    className="py-2 px-3 rounded-lg text-sm bg-red-600 disabled:opacity-50"
                                >
                                    Delete
                                </button>
                            </div>

                            {selectedElement && (
                                <div className="p-2 bg-gray-700 rounded text-sm mb-3">
                                    Selected: {selectedElement.name || selectedElement.id}
                                </div>
                            )}

                            <button
                                onClick={rebuildGraph}
                                disabled={!detections || isLoading}
                                className="w-full py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm disabled:opacity-50"
                            >
                                🔄 Rebuild Graph
                            </button>
                        </div>

                        {/* Display */}
                        <div className="bg-gray-800 rounded-xl p-4">
                            <h3 className="text-lg font-semibold mb-3 text-purple-400">👁️ Display</h3>

                            <div className="space-y-2 text-sm">
                                {[
                                    { state: showRooms, setter: setShowRooms, label: 'Rooms' },
                                    { state: showDoors, setter: setShowDoors, label: 'Doors' },
                                    { state: showHallways, setter: setShowHallways, label: 'Hallways' },
                                    { state: showNodes, setter: setShowNodes, label: 'Nodes' },
                                    { state: showEdges, setter: setShowEdges, label: 'Edges' },
                                    { state: showPath, setter: setShowPath, label: 'Path' },
                                ].map(({ state, setter, label }) => (
                                    <label key={label} className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={state}
                                            onChange={(e) => setter(e.target.checked)}
                                            className="w-4 h-4 accent-purple-500"
                                        />
                                        <span>{label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FloorPlanNavigator;
