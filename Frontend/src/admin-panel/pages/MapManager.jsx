import React, { useState, useRef, useEffect } from 'react';
import { Button, Input } from '../../components';
import { Upload, Cpu, Save, Loader, Layers, Move, Trash2, MousePointer2 } from 'lucide-react';
import { db, storage } from '../../config/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const MapManager = () => {
    const [imageFile, setImageFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [processing, setProcessing] = useState(false);

    // Data States
    const [floorName, setFloorName] = useState('');
    // Unified editable data structure
    const [editableData, setEditableData] = useState({
        rooms: [],
        walls: [],
        doors: [],
        graph: { nodes: [], edges: [] }
    });
    const [imageSize, setImageSize] = useState({ width: 0, height: 0 });

    // Interaction States
    const [selectedId, setSelectedId] = useState(null); // { type: 'room'|'wall'|'node', index: number }
    const [dragState, setDragState] = useState(null);
    const svgRef = useRef(null);

    // AI API URL
    const AI_API_URL = "http://localhost:5000";

    const handleImageSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);

            const img = new Image();
            img.onload = () => {
                setImageSize({ width: img.width, height: img.height });
                setEditableData({ rooms: [], walls: [], doors: [], graph: { nodes: [], edges: [] } });
                setSelectedId(null);
            };
            img.src = url;
        }
    };

    const processMap = async () => {
        if (!imageFile) return;

        setProcessing(true);
        const formData = new FormData();
        formData.append('image', imageFile);

        try {
            const response = await fetch(`${AI_API_URL}/detect-roboflow`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) throw new Error(`API Error: ${response.statusText}`);

            const data = await response.json();
            console.log("AI Result:", data);

            // Populate all data layers
            setEditableData({
                rooms: data.detections?.rooms || [],
                walls: data.detections?.walls || [],
                doors: data.detections?.doors || [],
                graph: data.navigationGraph || { nodes: [], edges: [] }
            });

        } catch (error) {
            console.error("Failed to process map:", error);
            alert("Failed to connect to AI Server. Is 'python AI/run.py' running?");
        } finally {
            setProcessing(false);
        }
    };

    // --- Interaction Logic ---

    const getSvgPoint = (clientX, clientY) => {
        if (!svgRef.current) return { x: 0, y: 0 };
        const CTM = svgRef.current.getScreenCTM();
        if (!CTM) return { x: 0, y: 0 };
        return {
            x: (clientX - CTM.e) / CTM.a,
            y: (clientY - CTM.f) / CTM.d
        };
    };

    const handleMouseDown = (e, type, index, handle = null) => {
        e.stopPropagation();
        e.preventDefault();

        setSelectedId({ type, index });

        const point = getSvgPoint(e.clientX, e.clientY);

        // Retrieve item based on type
        let item;
        if (type === 'node') {
            item = editableData.graph.nodes[index];
        } else {
            item = editableData[type + 's'][index];
        }

        setDragState({
            type,
            index,
            action: handle ? 'resize' : 'move',
            handle,
            startX: point.x,
            startY: point.y,
            originalItem: JSON.parse(JSON.stringify(item)) // Deep copy to prevent mutation
        });
    };

    const handleMouseMove = (e) => {
        if (!dragState) return;

        const point = getSvgPoint(e.clientX, e.clientY);
        const dx = point.x - dragState.startX;
        const dy = point.y - dragState.startY;

        setEditableData(prev => {
            const newData = { ...prev }; // Shallow copy of root

            if (dragState.type === 'node') {
                // Graph Nodes
                const nodes = [...prev.graph.nodes];
                nodes[dragState.index] = {
                    ...nodes[dragState.index],
                    x: dragState.originalItem.x + dx,
                    y: dragState.originalItem.y + dy
                };
                newData.graph = { ...prev.graph, nodes };

            } else {
                // Rooms, Walls, Doors
                const listName = dragState.type + 's';
                const list = [...prev[listName]];
                // Deep copy the specific item being modified to avoid nested mutation
                const item = JSON.parse(JSON.stringify(list[dragState.index]));

                if (dragState.type === 'room') {
                    if (dragState.action === 'move') {
                        const w = dragState.originalItem.position.end.x - dragState.originalItem.position.start.x;
                        const h = dragState.originalItem.position.end.y - dragState.originalItem.position.start.y;
                        item.position.start.x = dragState.originalItem.position.start.x + dx;
                        item.position.start.y = dragState.originalItem.position.start.y + dy;
                        item.position.end.x = item.position.start.x + w;
                        item.position.end.y = item.position.start.y + h;
                    } else if (dragState.action === 'resize') {
                        if (dragState.handle === 'tl') {
                            item.position.start.x = dragState.originalItem.position.start.x + dx;
                            item.position.start.y = dragState.originalItem.position.start.y + dy;
                        } else if (dragState.handle === 'br') {
                            item.position.end.x = dragState.originalItem.position.end.x + dx;
                            item.position.end.y = dragState.originalItem.position.end.y + dy;
                        }
                    }
                } else if (dragState.type === 'wall') {
                    if (dragState.action === 'move') {
                        item.position.start.x = dragState.originalItem.position.start.x + dx;
                        item.position.start.y = dragState.originalItem.position.start.y + dy;
                        item.position.end.x = dragState.originalItem.position.end.x + dx;
                        item.position.end.y = dragState.originalItem.position.end.y + dy;
                    } else if (dragState.action === 'resize') {
                        if (dragState.handle === 'start') {
                            item.position.start.x = dragState.originalItem.position.start.x + dx;
                            item.position.start.y = dragState.originalItem.position.start.y + dy;
                        } else {
                            item.position.end.x = dragState.originalItem.position.end.x + dx;
                            item.position.end.y = dragState.originalItem.position.end.y + dy;
                        }
                    }
                }

                list[dragState.index] = item;
                newData[listName] = list;
            }

            return newData;
        });
    };

    const handleMouseUp = () => {
        setDragState(null);
    };

    const handleDelete = () => {
        if (!selectedId) return;
        setEditableData(prev => {
            const newData = { ...prev };
            if (selectedId.type === 'node') {
                const nodes = [...prev.graph.nodes];
                nodes.splice(selectedId.index, 1);
                newData.graph = { ...prev.graph, nodes };
                // Also remove connected edges? For now let's keep it simple.
            } else {
                const list = [...prev[selectedId.type + 's']];
                list.splice(selectedId.index, 1);
                newData[selectedId.type + 's'] = list;
            }
            return newData;
        });
        setSelectedId(null);
    };

    const renderOverlay = () => {
        // Define layers for Z-ordering.
        // We render normal items first, then the selected item LAST so handles are on top.

        const renderWall = (wall, i, isSelected) => (
            <g key={`wall-${i}`}>
                {/* Hit Area */}
                <line
                    x1={wall.position.start.x} y1={wall.position.start.y}
                    x2={wall.position.end.x} y2={wall.position.end.y}
                    stroke="transparent" strokeWidth="15"
                    className="cursor-pointer"
                    onMouseDown={(e) => handleMouseDown(e, 'wall', i)}
                />
                {/* Visible Line */}
                <line
                    x1={wall.position.start.x} y1={wall.position.start.y}
                    x2={wall.position.end.x} y2={wall.position.end.y}
                    stroke={isSelected ? "#2563eb" : "#ef4444"}
                    strokeWidth={isSelected ? "4" : "3"}
                    className="pointer-events-none transition-colors"
                />
                {isSelected && (
                    <>
                        <circle
                            cx={wall.position.start.x} cy={wall.position.start.y} r="6" fill="white" stroke="#2563eb" strokeWidth="2"
                            className="cursor-move" onMouseDown={(e) => handleMouseDown(e, 'wall', i, 'start')}
                        />
                        <circle
                            cx={wall.position.end.x} cy={wall.position.end.y} r="6" fill="white" stroke="#2563eb" strokeWidth="2"
                            className="cursor-move" onMouseDown={(e) => handleMouseDown(e, 'wall', i, 'end')}
                        />
                    </>
                )}
            </g>
        );

        const renderRoom = (room, i, isSelected) => {
            const x = room.position.start.x;
            const y = room.position.start.y;
            const w = room.position.end.x - x;
            const h = room.position.end.y - y;
            return (
                <g key={`room-${i}`}>
                    <rect
                        x={x} y={y} width={w} height={h}
                        fill={isSelected ? "rgba(37, 99, 235, 0.1)" : "rgba(102, 126, 234, 0.2)"} // Lighter fill
                        stroke={isSelected ? "#2563eb" : "rgba(102, 126, 234, 1)"}
                        strokeWidth={isSelected ? 3 : 2}
                        className="cursor-move transition-colors"
                        onMouseDown={(e) => handleMouseDown(e, 'room', i)}
                    />
                    <text x={x + 5} y={y + 20} fill="white" fontSize="16" fontWeight="bold" style={{ textShadow: '0px 1px 3px black' }} className="pointer-events-none select-none">
                        {room.name || room.class}
                    </text>
                    {isSelected && (
                        <>
                            <rect
                                x={x - 6} y={y - 6} width="12" height="12"
                                fill="white" stroke="#2563eb" strokeWidth="2"
                                className="cursor-nw-resize"
                                onMouseDown={(e) => handleMouseDown(e, 'room', i, 'tl')}
                            />
                            <rect
                                x={x + w - 6} y={y + h - 6} width="12" height="12"
                                fill="white" stroke="#2563eb" strokeWidth="2"
                                className="cursor-se-resize"
                                onMouseDown={(e) => handleMouseDown(e, 'room', i, 'br')}
                            />
                        </>
                    )}
                </g>
            );
        };

        const renderNode = (node, i, isSelected) => (
            <g key={`node-${i}`}>
                <circle
                    cx={node.x} cy={node.y} r={isSelected ? 8 : 5}
                    fill={isSelected ? "#2563eb" : "#10b981"}
                    stroke="white" strokeWidth="2"
                    className="cursor-move hover:scale-150 transition-transform"
                    onMouseDown={(e) => handleMouseDown(e, 'node', i)}
                />
            </g>
        );

        // Render Graph Edges (Non-interactive mostly, just visualization)
        const renderedEdges = editableData.graph.edges?.map((edge, i) => {
            const n1 = editableData.graph.nodes[edge.source || edge.from];
            const n2 = editableData.graph.nodes[edge.target || edge.to];
            if (!n1 || !n2) return null;
            return (
                <line
                    key={`edge-${i}`}
                    x1={n1.x} y1={n1.y} x2={n2.x} y2={n2.y}
                    stroke="#10b981" strokeWidth="2" strokeDasharray="5,5"
                    className="pointer-events-none opacity-60"
                />
            );
        });

        // Layering: Rooms -> Doors -> Walls -> Edges -> Nodes
        // Selected item -> On Top
        return (
            <svg
                ref={svgRef}
                viewBox={`0 0 ${imageSize.width} ${imageSize.height}`}
                className="absolute inset-0 w-full h-full pointer-events-auto"
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onClick={() => setSelectedId(null)}
            >
                {/* 1. Rooms */}
                {editableData.rooms.map((r, i) => (selectedId?.type !== 'room' || selectedId?.index !== i) && renderRoom(r, i, false))}

                {/* 2. Walls */}
                {editableData.walls.map((w, i) => (selectedId?.type !== 'wall' || selectedId?.index !== i) && renderWall(w, i, false))}

                {/* 3. Graph Edges */}
                {renderedEdges}

                {/* 4. Graph Nodes */}
                {editableData.graph.nodes.map((n, i) => (selectedId?.type !== 'node' || selectedId?.index !== i) && renderNode(n, i, false))}

                {/* 5. Selected Item (Top Layer) */}
                {selectedId?.type === 'room' && renderRoom(editableData.rooms[selectedId.index], selectedId.index, true)}
                {selectedId?.type === 'wall' && renderWall(editableData.walls[selectedId.index], selectedId.index, true)}
                {selectedId?.type === 'node' && renderNode(editableData.graph.nodes[selectedId.index], selectedId.index, true)}

            </svg>
        );
    };


    const saveMap = async () => {
        if (!imageFile || !floorName) {
            alert("Please provide a name and upload an image.");
            return;
        }

        setProcessing(true);
        try {
            const storageRef = ref(storage, `floors/${Date.now()}_${imageFile.name}`);
            await uploadBytes(storageRef, imageFile);
            const downloadURL = await getDownloadURL(storageRef);

            const saveData = {
                detections: {
                    imageSize: imageSize,
                    rooms: editableData.rooms,
                    walls: editableData.walls,
                    doors: editableData.doors
                },
                navigationGraph: editableData.graph
            };

            await addDoc(collection(db, "floors"), {
                name: floorName,
                imageUrl: downloadURL,
                width: imageSize.width,
                height: imageSize.height,
                data: saveData.detections,
                graph: saveData.navigationGraph,
                createdAt: new Date()
            });

            alert("Floor plan saved successfully!");
            setFloorName('');
            setImageFile(null);
            setPreviewUrl(null);
            setEditableData({ rooms: [], walls: [], doors: [], graph: { nodes: [], edges: [] } });

        } catch (error) {
            console.error("Error saving map:", error);
            alert("Failed to save map.");
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold mb-8">Map Manager</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: Controls */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                        <h2 className="font-bold text-xl mb-4">1. Upload Floor Plan</h2>
                        <div className="relative border-2 border-dashed border-gray-200 rounded-2xl p-8 hover:bg-gray-50 transition-colors text-center cursor-pointer">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageSelect}
                                className="absolute inset-0 opacity-0 cursor-pointer"
                            />
                            <div className="flex flex-col items-center gap-2 text-gray-400">
                                <Upload size={32} />
                                <span className="font-bold">Click to Upload</span>
                                <span className="text-sm">JPG or PNG</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                        <h2 className="font-bold text-xl mb-4">2. Process & Edit</h2>
                        <Input
                            label="Floor Name"
                            placeholder="e.g. Ground Floor, Wing A"
                            value={floorName}
                            onChange={(e) => setFloorName(e.target.value)}
                            className="mb-4"
                        />

                        <Button
                            onClick={processMap}
                            fullWidth
                            disabled={!imageFile || processing}
                            className="mb-3 bg-indigo-600 hover:bg-indigo-700 text-white"
                            icon={processing ? <Loader className="animate-spin" /> : <Cpu />}
                        >
                            {processing ? 'Processing AI...' : 'Run AI Detection'}
                        </Button>

                        {/* Editor Controls */}
                        {selectedId && (
                            <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-100 animate-in fade-in">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="font-bold text-blue-900 capitalize">
                                        Selected: {selectedId.type}
                                    </span>
                                    <button
                                        onClick={handleDelete}
                                        className="p-2 bg-white text-red-500 rounded-lg hover:bg-red-50 border border-red-100 transition-colors"
                                        title="Delete Element"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                                <p className="text-xs text-blue-700">
                                    Drag to move. Drag handles to resize. Use Delete icon to remove.
                                </p>
                            </div>
                        )}

                        <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-100 text-sm">
                            <p className="font-bold flex items-center gap-2 mb-2"><Layers size={16} /> Statistics</p>
                            <div className="grid grid-cols-4 gap-2 text-center">
                                <div className="bg-white p-2 rounded-lg border border-gray-200">
                                    <div className="font-bold">{editableData.rooms.length}</div>
                                    <div className="text-[10px] text-gray-500">Rooms</div>
                                </div>
                                <div className="bg-white p-2 rounded-lg border border-gray-200">
                                    <div className="font-bold">{editableData.walls.length}</div>
                                    <div className="text-[10px] text-gray-500">Walls</div>
                                </div>
                                <div className="bg-white p-2 rounded-lg border border-gray-200">
                                    <div className="font-bold">{editableData.graph.nodes.length}</div>
                                    <div className="text-[10px] text-gray-500">Nodes</div>
                                </div>
                                <div className="bg-white p-2 rounded-lg border border-gray-200">
                                    <div className="font-bold">{editableData.doors.length}</div>
                                    <div className="text-[10px] text-gray-500">Doors</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                        <h2 className="font-bold text-xl mb-4">3. Save</h2>
                        <Button
                            onClick={saveMap}
                            fullWidth
                            disabled={!imageFile || !floorName || processing}
                            variant="primary"
                            icon={<Save />}
                        >
                            Save Map Data
                        </Button>
                    </div>
                </div>

                {/* Right: Interactive Preview */}
                <div className="lg:col-span-2 bg-gray-50 rounded-3xl border border-gray-200 overflow-hidden flex flex-col relative min-h-[600px]">
                    <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold border border-gray-200 shadow-sm flex items-center gap-2">
                        <MousePointer2 size={14} className="text-blue-600" />
                        Interactive Editor
                    </div>

                    <div className="flex-1 overflow-auto p-4 flex items-center justify-center relative touch-none select-none">
                        {previewUrl ? (
                            <div className="relative shadow-2xl transition-all duration-300 ease-out" style={{ maxWidth: '100%', maxHeight: '100%' }}>
                                <img
                                    src={previewUrl}
                                    alt="Floor Plan"
                                    className="block max-w-full h-auto pointer-events-none select-none"
                                    onLoad={(e) => setImageSize({ width: e.target.naturalWidth, height: e.target.naturalHeight })}
                                />
                                {renderOverlay()}
                            </div>
                        ) : (
                            <div className="text-gray-400 text-center">
                                <Layers size={48} className="mx-auto mb-4 opacity-20" />
                                <p>Upload an image to begin.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MapManager;
