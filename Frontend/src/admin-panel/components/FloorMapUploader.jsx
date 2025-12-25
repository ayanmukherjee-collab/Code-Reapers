import React, { useState, useRef, useEffect } from 'react';
import { Button, Input } from '../../components';
import { Upload, Cpu, Save, Loader, Layers, MousePointer2, GitCommit, Eraser, Type, PlusCircle, ZoomIn, ZoomOut, Move, Pencil, ArrowLeft, Image as ImageIcon, Map as MapIcon, RotateCcw } from 'lucide-react';
import { db, storage } from '../../config/firebase';
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const FloorMapUploader = ({ buildingId, floorNumber, onSaveComplete }) => {
    // === STATE ===
    const [activeTab, setActiveTab] = useState('upload'); // 'upload' | 'editor'

    // Upload State
    const [imageFile, setImageFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [processing, setProcessing] = useState(false);

    // Editor State
    const [nodes, setNodes] = useState([]);
    const [edges, setEdges] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [walls, setWalls] = useState([]);
    const [doors, setDoors] = useState([]);

    // Editor UI State
    const [editorMode, setEditorMode] = useState('select'); // select, pan, add, connect, delete, rename
    const [selectedElement, setSelectedElement] = useState(null);
    const [connectionStart, setConnectionStart] = useState(null);
    const [transform, setTransform] = useState({ x: 0, y: 0, k: 1 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 }); // World Coordinates

    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const AI_API_URL = "http://localhost:5000";

    // === HANDLERS: UPLOAD & PROCESS ===

    const handleImageSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
            // Reset Data
            setNodes([]);
            setEdges([]);
            setRooms([]);
            setWalls([]);
            setDoors([]);
            setTransform({ x: 0, y: 0, k: 1 });
        }
    };

    const processMap = async () => {
        if (!imageFile) return;
        setProcessing(true);
        const formData = new FormData();
        formData.append('image', imageFile);

        try {
            const response = await fetch(`${AI_API_URL}/detect-unified`, { method: 'POST', body: formData });
            if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
            const data = await response.json();

            // Parse Unified Data
            const r = data.detections.rooms || [];
            const d = data.detections.doors || [];
            const w = data.detections.walls || [];
            const t = data.detections.texts || [];

            const generatedNodes = [];

            // 1. Rooms
            r.forEach((room, i) => {
                generatedNodes.push({
                    id: room.id || `room_${i}`,
                    x: room.center.x,
                    y: room.center.y,
                    type: 'room',
                    name: room.name || `Room ${i + 1}`
                });
            });

            // 2. Doors
            d.forEach((door, i) => {
                generatedNodes.push({
                    id: door.id || `door_${i}`,
                    x: door.hinge.x,
                    y: door.hinge.y,
                    type: 'door',
                    name: 'Door'
                });
            });

            // 3. OCR Texts
            t.forEach((text, i) => {
                const isDuplicate = generatedNodes.some(n => Math.hypot(n.x - text.center.x, n.y - text.center.y) < 50);
                if (!isDuplicate) {
                    generatedNodes.push({
                        id: `text_node_${i}`,
                        x: text.center.x,
                        y: text.center.y,
                        type: 'label',
                        name: text.text
                    });
                } else {
                    const nearbyNode = generatedNodes.find(n => Math.hypot(n.x - text.center.x, n.y - text.center.y) < 50);
                    if (nearbyNode && nearbyNode.type === 'room') {
                        nearbyNode.name = text.text;
                    }
                }
            });

            setNodes(generatedNodes);
            setEdges([]);
            setRooms(r);
            setWalls(w);
            setDoors(d);

            // Auto switch to Editor
            setActiveTab('editor');

        } catch (error) {
            console.error(error);
            alert("AI Error. Check backend console.");
        } finally {
            setProcessing(false);
        }
    };

    // === HANDLERS: EDITOR ===

    // Initialize Canvas & Fit Image
    useEffect(() => {
        if (activeTab === 'editor' && containerRef.current && canvasRef.current) {
            const updateSize = () => {
                const { clientWidth, clientHeight } = containerRef.current;
                canvasRef.current.width = clientWidth;
                canvasRef.current.height = clientHeight;
                draw();
            };

            updateSize();
            const observer = new ResizeObserver(updateSize);
            observer.observe(containerRef.current);
            return () => observer.disconnect();
        }
    }, [activeTab, containerRef.current]);

    // Fit Image on Load
    useEffect(() => {
        if (activeTab === 'editor' && previewUrl && containerRef.current) {
            const img = new Image();
            img.onload = () => {
                const { clientWidth, clientHeight } = containerRef.current;
                const scaleX = clientWidth / img.width;
                const scaleY = clientHeight / img.height;
                const scale = Math.min(scaleX, scaleY) * 0.9;

                const x = (clientWidth - img.width * scale) / 2;
                const y = (clientHeight - img.height * scale) / 2;

                setTransform({ x, y, k: scale });
            };
            img.src = previewUrl;
        }
    }, [activeTab, previewUrl]);


    const draw = () => {
        const canvas = canvasRef.current;
        if (!canvas || !previewUrl) return;

        const ctx = canvas.getContext('2d');
        const img = new Image();
        img.src = previewUrl;

        // Clear Screen
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.save();
        ctx.translate(transform.x, transform.y);
        ctx.scale(transform.k, transform.k);

        // Image
        if (img.complete && img.naturalWidth > 0) ctx.drawImage(img, 0, 0);

        // Walls
        ctx.strokeStyle = '#ef4444'; // red-500
        ctx.lineWidth = 4;
        walls.forEach(w => {
            ctx.beginPath();
            ctx.moveTo(w.position.start.x, w.position.start.y);
            ctx.lineTo(w.position.end.x, w.position.end.y);
            ctx.stroke();
        });

        // Rooms (Subtle overlay)
        rooms.forEach(r => {
            const x = r.position.start.x;
            const y = r.position.start.y;
            const w = r.position.end.x - r.position.start.x;
            const h = r.position.end.y - r.position.start.y;

            // Highlight selection
            const isSelected = selectedElement?.id === r.id;
            ctx.fillStyle = isSelected ? 'rgba(99, 102, 241, 0.3)' : 'rgba(99, 102, 241, 0.05)'; // indigo-500
            ctx.strokeStyle = isSelected ? '#6366f1' : 'rgba(99, 102, 241, 0.3)';
            ctx.lineWidth = isSelected ? 3 : 1;

            ctx.fillRect(x, y, w, h);
            ctx.strokeRect(x, y, w, h);
        });

        // Edges
        ctx.strokeStyle = '#1f2937'; // gray-800
        ctx.lineWidth = 3;
        edges.forEach(e => {
            const start = nodes.find(n => n.id === e.source);
            const end = nodes.find(n => n.id === e.target);
            if (start && end) {
                ctx.beginPath();
                ctx.moveTo(start.x, start.y);
                ctx.lineTo(end.x, end.y);
                ctx.stroke();
            }
        });

        // == VISUAL GUIDE: Connection Rubber Band ==
        if (editorMode === 'connect' && connectionStart && mousePos) {
            const startNode = nodes.find(n => n.id === connectionStart);
            if (startNode) {
                ctx.beginPath();
                ctx.strokeStyle = '#22c55e'; // Green
                ctx.setLineDash([10, 5]);
                ctx.lineWidth = 2 / transform.k;
                ctx.moveTo(startNode.x, startNode.y);
                ctx.lineTo(mousePos.x, mousePos.y);
                ctx.stroke();
                ctx.setLineDash([]); // Reset
            }
        }

        // Nodes
        nodes.forEach(n => {
            const isSelected = selectedElement?.id === n.id;
            const isConnecting = connectionStart === n.id;

            ctx.beginPath();
            const radius = isSelected || isConnecting ? (10 / transform.k) : (7 / transform.k);
            ctx.arc(n.x, n.y, Math.max(radius, 4), 0, Math.PI * 2);

            if (isConnecting) {
                ctx.fillStyle = '#22c55e'; // green-500
                ctx.strokeStyle = '#fff';
            } else if (isSelected) {
                ctx.fillStyle = '#ef4444'; // red-500
                ctx.strokeStyle = '#fff';
            } else {
                // Color by type
                if (n.type === 'room') ctx.fillStyle = '#3b82f6'; // blue-500
                else if (n.type === 'door') ctx.fillStyle = '#a855f7'; // purple-500
                else ctx.fillStyle = '#111827'; // gray-900 (junction)

                ctx.strokeStyle = '#fff';
            }

            ctx.lineWidth = 2 / transform.k;
            ctx.fill();
            ctx.stroke();

            // Labels
            if (n.name && transform.k > 0.4) {
                ctx.font = `bold ${14 / transform.k}px Inter, sans-serif`;
                ctx.fillStyle = '#000';
                ctx.textAlign = 'center';
                // Background for text for readability
                const textWidth = ctx.measureText(n.name).width;
                const textHeight = 14 / transform.k;
                ctx.globalAlpha = 0.7;
                ctx.fillStyle = '#fff';
                ctx.fillRect(n.x - textWidth / 2 - 2, n.y - radius - textHeight - 2, textWidth + 4, textHeight + 4);
                ctx.globalAlpha = 1.0;

                ctx.fillStyle = '#000';
                ctx.fillText(n.name, n.x, n.y - radius - 5);
            }
        });

        ctx.restore();
    };

    // Draw Loop
    useEffect(() => {
        requestAnimationFrame(draw);
    }, [transform, nodes, edges, selectedElement, connectionStart, walls, rooms, previewUrl, mousePos]);

    // Canvas Events
    const getWorldCoords = (e) => {
        const rect = canvasRef.current.getBoundingClientRect();
        // Since canvas size = client size, no ratio needed if they match
        // But for safety:
        const ratioX = canvasRef.current.width / rect.width || 1;
        const ratioY = canvasRef.current.height / rect.height || 1;

        const canvasX = (e.clientX - rect.left) * ratioX;
        const canvasY = (e.clientY - rect.top) * ratioY;

        return {
            x: (canvasX - transform.x) / transform.k,
            y: (canvasY - transform.y) / transform.k
        };
    };

    const handleWheel = (e) => {
        if (!previewUrl) return;
        e.preventDefault();
        const zoomSensitivity = 0.001;
        const delta = -e.deltaY * zoomSensitivity;

        // Zoom towards mouse
        const rect = canvasRef.current.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // World coords before zoom (assuming canvas pixels = client pixels)
        const worldX = (mouseX - transform.x) / transform.k;
        const worldY = (mouseY - transform.y) / transform.k;

        const newScale = Math.min(Math.max(0.1, transform.k + delta), 8);

        // New transform to keep worldX/Y under mouseX/Y
        const newX = mouseX - worldX * newScale;
        const newY = mouseY - worldY * newScale;

        setTransform({ x: newX, y: newY, k: newScale });
    };

    const handleMouseDown = (e) => {
        if (e.button === 1 || editorMode === 'pan') {
            setIsDragging(true);
            setDragStart({ x: e.clientX, y: e.clientY });
        } else {
            handleCanvasClick(e);
        }
    };

    const handleMouseMove = (e) => {
        // Track World Mouse Position for Visual Guide
        const worldPos = getWorldCoords(e);
        setMousePos(worldPos);

        if (isDragging) {
            const dx = e.clientX - dragStart.x;
            const dy = e.clientY - dragStart.y;
            setTransform(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
            setDragStart({ x: e.clientX, y: e.clientY });
        }
    };

    const handleMouseUp = () => setIsDragging(false);

    // Helper: Find closest node within tolerance
    const findClosestNode = (x, y, tolerance) => {
        let closest = null;
        let minDist = tolerance;

        nodes.forEach(n => {
            const dist = Math.hypot(n.x - x, n.y - y);
            if (dist < minDist) {
                minDist = dist;
                closest = n;
            }
        });
        return closest;
    };

    const handleCanvasClick = (e) => {
        if (isDragging) return;
        if (!previewUrl) return;
        const { x, y } = getWorldCoords(e);
        const TOLERANCE = 20 / transform.k;

        // Better Hit Logic
        const hitNode = findClosestNode(x, y, TOLERANCE);
        const hitRoom = rooms.find(r => x >= r.position.start.x && x <= r.position.end.x && y >= r.position.start.y && y <= r.position.end.y);

        if (editorMode === 'select') {
            if (hitNode) setSelectedElement({ type: 'node', id: hitNode.id, data: hitNode });
            else if (hitRoom) setSelectedElement({ type: 'room', id: hitRoom.id, data: hitRoom });
            else setSelectedElement(null);
        }
        else if (editorMode === 'add') {
            if (!hitNode) {
                const newNode = { id: `node_${Date.now()}`, x, y, type: 'junction', name: '' };
                setNodes([...nodes, newNode]);
                setSelectedElement({ type: 'node', id: newNode.id, data: newNode });
            }
        }
        else if (editorMode === 'connect') {
            if (hitNode) {
                // Clicked a Node
                if (connectionStart === null) {
                    setConnectionStart(hitNode.id); // Start
                } else {
                    // Finish or Chain
                    if (connectionStart !== hitNode.id) {
                        const exists = edges.some(e => (e.source === connectionStart && e.target === hitNode.id) || (e.source === hitNode.id && e.target === connectionStart));
                        if (!exists) {
                            const newEdge = {
                                source: connectionStart,
                                target: hitNode.id,
                                weight: Math.hypot(nodes.find(n => n.id === connectionStart).x - hitNode.x, nodes.find(n => n.id === connectionStart).y - hitNode.y)
                            };
                            setEdges([...edges, newEdge]);
                        }
                        // Chain: New start is this node
                        setConnectionStart(hitNode.id);
                    }
                }
            } else {
                // Clicked Empty Space - Stop Connecting
                // Only stop if we were connecting.
                if (connectionStart !== null) setConnectionStart(null);
            }
        }
        else if (editorMode === 'delete') {
            if (hitNode) {
                setNodes(nodes.filter(n => n.id !== hitNode.id));
                setEdges(edges.filter(e => e.source !== hitNode.id && e.target !== hitNode.id));
                if (selectedElement?.id === hitNode.id) setSelectedElement(null);
            } else {
                // Try deleting edge? (Future improvement: Hit test edges)
            }
        }
    };

    const updateName = (val) => {
        if (!selectedElement) return;
        if (selectedElement.type === 'node') {
            setNodes(nodes.map(n => n.id === selectedElement.id ? { ...n, name: val } : n));
        } else if (selectedElement.type === 'room') {
            setRooms(rooms.map(r => r.id === selectedElement.id ? { ...r, name: val } : r));
        }
        setSelectedElement(prev => ({ ...prev, data: { ...prev.data, name: val } }));
    };

    // Save
    const saveMap = async () => {
        if (!imageFile || !nodes.length) { alert("Nothing to save."); return; }
        setProcessing(true);
        try {
            const storageRef = ref(storage, `floors/${Date.now()}_${imageFile.name}`);
            await uploadBytes(storageRef, imageFile);
            const downloadURL = await getDownloadURL(storageRef);

            const img = new Image();
            img.src = previewUrl;

            const floorData = {
                name: `Floor ${floorNumber}`,
                buildingId,
                floorNumber,
                imageUrl: downloadURL,
                width: img.width || 1000,
                height: img.height || 1000,
                data: { walls, rooms, doors },
                graph: { nodes, edges },
                createdAt: new Date()
            };

            await addDoc(collection(db, "floors"), floorData);
            if (onSaveComplete) onSaveComplete();
            alert("Map Saved Successfully!");
        } catch (e) {
            console.error(e);
            alert("Save Failed.");
        } finally {
            setProcessing(false);
        }
    };

    // === RENDER ===

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Header / Tabs */}
            <div className="border-b border-gray-200 bg-gray-50 p-1 flex gap-1">
                <button
                    onClick={() => setActiveTab('upload')}
                    className={`flex-1 py-2 px-4 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === 'upload' ? 'bg-white shadow text-black' : 'text-gray-500 hover:bg-gray-100'}`}
                >
                    <ImageIcon size={16} />
                    Upload & Preview
                </button>
                <button
                    onClick={() => setActiveTab('editor')}
                    disabled={!nodes.length}
                    className={`flex-1 py-2 px-4 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === 'editor' ? 'bg-white shadow text-black' : 'text-gray-500 hover:bg-gray-100'} ${!nodes.length ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    <MapIcon size={16} />
                    Graph Editor
                </button>
            </div>

            <div className="p-6 min-h-[500px]">

                {/* 1. UPLOAD TAB */}
                {activeTab === 'upload' && (
                    <div className="max-w-xl mx-auto space-y-8 py-10">
                        <div className="text-center space-y-2">
                            <h2 className="text-2xl font-bold tracking-tight">Upload Floor Plan</h2>
                            <p className="text-gray-500">Supported formats: JPG, PNG. Max size 10MB.</p>
                        </div>

                        <div className="border-2 border-dashed border-gray-300 rounded-2xl p-10 text-center cursor-pointer hover:bg-gray-50 hover:border-gray-400 transition-all relative group">
                            <input type="file" accept="image/*" onChange={handleImageSelect} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10" />
                            <div className="pointer-events-none group-hover:scale-105 transition-transform duration-200">
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                                    <Upload size={32} />
                                </div>
                                <span className="text-lg font-bold text-gray-700 block">Click to Browse</span>
                                <span className="text-sm text-gray-400">or drag and drop here</span>
                            </div>
                        </div>

                        {previewUrl && (
                            <div className="animate-in fade-in zoom-in duration-300">
                                <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm max-h-[300px] flex items-center justify-center bg-gray-100 mb-6">
                                    <img src={previewUrl} className="max-h-full object-contain" alt="Preview" />
                                </div>
                                <Button
                                    onClick={processMap}
                                    disabled={processing}
                                    fullWidth
                                    size="lg"
                                    className="h-12 text-lg"
                                    icon={processing ? <Loader className="animate-spin" /> : <Cpu />}
                                >
                                    {processing ? 'Analyzing Floor Plan...' : 'Detect Rooms & Paths'}
                                </Button>
                            </div>
                        )}
                    </div>
                )}

                {/* 2. EDITOR TAB */}
                {activeTab === 'editor' && (
                    <div className="flex flex-col h-[600px]">

                        {/* Toolbar */}
                        <div className="flex items-center justify-between mb-4 bg-white p-2 rounded-xl border border-gray-200 shadow-sm z-10">
                            <div className="flex items-center gap-2">
                                {[
                                    { id: 'select', icon: MousePointer2, label: 'Select' },
                                    { id: 'pan', icon: Move, label: 'Pan' },
                                    { type: 'separator' },
                                    { id: 'add', icon: PlusCircle, label: 'Add Node' },
                                    { id: 'connect', icon: GitCommit, label: 'Connect' },
                                    { id: 'delete', icon: Eraser, label: 'Erase' },
                                ].map((tool, i) => (
                                    tool.type === 'separator' ? <div key={i} className="w-px h-6 bg-gray-200 mx-1" /> :
                                        <button
                                            key={tool.id}
                                            onClick={() => setEditorMode(tool.id)}
                                            className={`p-2.5 rounded-lg flex items-center gap-2 text-sm font-semibold transition-all ${editorMode === tool.id ? 'bg-black text-white shadow-md transform scale-105' : 'text-gray-600 hover:bg-gray-100'}`}
                                        >
                                            <tool.icon size={18} />
                                            <span className="hidden xl:inline">{tool.label}</span>
                                        </button>
                                ))}
                            </div>

                            <div className="flex items-center gap-2">
                                <button onClick={() => setTransform({ x: 0, y: 0, k: 1 })} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg" title="Reset View"><RotateCcw size={18} /></button>
                                <div className="h-6 w-px bg-gray-200"></div>
                                <Button variant="primary" onClick={saveMap} icon={<Save size={18} />} className="px-6">Save Map</Button>
                            </div>
                        </div>

                        {/* Helper / Status Bar */}
                        {selectedElement && (
                            <div className="flex items-center gap-4 bg-blue-50 border border-blue-100 text-blue-800 px-4 py-2 rounded-lg mb-4 text-sm animate-in slide-in-from-top-2">
                                <span className="font-bold uppercase tracking-wider text-xs bg-blue-200 px-2 py-0.5 rounded text-blue-800">{selectedElement.type}</span>
                                <span className="text-gray-400">|</span>
                                <div className="flex items-center gap-2 flex-1">
                                    <Pencil size={14} className="opacity-50" />
                                    <input
                                        className="bg-transparent border-none focus:ring-0 p-0 text-sm font-semibold w-full placeholder-blue-300"
                                        placeholder="Enter Name..."
                                        value={selectedElement.data.name || ''}
                                        onChange={(e) => updateName(e.target.value)}
                                        autoFocus
                                    />
                                </div>
                            </div>
                        )}

                        {/* Canvas Area */}
                        <div className="flex-1 overflow-hidden relative rounded-xl border border-gray-200 bg-gray-50 touch-none cursor-default" ref={containerRef}>
                            <canvas
                                ref={canvasRef}
                                onMouseDown={handleMouseDown}
                                onMouseMove={handleMouseMove}
                                onMouseUp={handleMouseUp}
                                onMouseLeave={handleMouseUp}
                                onWheel={handleWheel}
                                className={`block ${editorMode === 'pan' ? 'cursor-grab active:cursor-grabbing' : 'cursor-crosshair'}`}
                            />

                            {/* Floating Zoom Controls for Convenience */}
                            <div className="absolute bottom-4 right-4 flex flex-col gap-1 bg-white shadow-lg border border-gray-100 rounded-lg p-1">
                                <button onClick={() => setTransform(t => ({ ...t, k: Math.min(t.k + 0.2, 5) }))} className="p-2 hover:bg-gray-50 rounded text-gray-600"><ZoomIn size={20} /></button>
                                <button onClick={() => setTransform(t => ({ ...t, k: Math.max(t.k - 0.2, 0.1) }))} className="p-2 hover:bg-gray-50 rounded text-gray-600"><ZoomOut size={20} /></button>
                            </div>
                        </div>

                        {/* Bottom Stats */}
                        <div className="mt-2 flex justify-between text-xs text-gray-400 px-2">
                            <span>Scroll to Zoom • Drag to Pan • Click to Select</span>
                            <div className="flex gap-3">
                                <span>{nodes.length} Nodes</span>
                                <span>{edges.length} Edges</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FloorMapUploader;
