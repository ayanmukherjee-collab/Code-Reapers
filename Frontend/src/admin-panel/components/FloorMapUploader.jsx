import React, { useState, useRef, useEffect } from 'react';
import { Button } from '../../components';
import { Upload, Cpu, Save, Loader, Layers, MousePointer2, GitCommit, Eraser, Move, PlusCircle, RotateCcw, ZoomIn, ZoomOut, Pencil } from 'lucide-react';
import { db, storage } from '../../config/firebase';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const FloorMapUploader = ({ buildingId, floorNumber, onSaveComplete }) => {
    // === STATE ===
    const [activeTab, setActiveTab] = useState('upload'); // 'upload' | 'editor'

    // Upload State
    const [imageFile, setImageFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [processing, setProcessing] = useState(false);
    const [isLoadingMap, setIsLoadingMap] = useState(true); // New: Prevent render while loading
    const [imageSize, setImageSize] = useState({ width: 1000, height: 1000 });

    // Editor Data State
    const [nodes, setNodes] = useState([]);
    const [edges, setEdges] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [walls, setWalls] = useState([]);
    const [doors, setDoors] = useState([]);

    // Editor UI State
    const [editorMode, setEditorMode] = useState('select'); // select, pan, add, connect, delete
    const [selectedElement, setSelectedElement] = useState(null); // { type, id, data }
    const [connectionStart, setConnectionStart] = useState(null); // Node ID

    // Transform (Pan/Zoom)
    const [transform, setTransform] = useState({ x: 0, y: 0, k: 1 });
    const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    // Item Dragging/Resizing State
    const [itemDrag, setItemDrag] = useState(null); // { type, index, action: 'move'|'resize', handle, startX, startY, originalData }

    const svgRef = useRef(null);
    const containerRef = useRef(null);
    const AI_API_URL = "http://localhost:5000";

    // === LOAD EXISTING MAP ===
    useEffect(() => {
        const loadMap = async () => {
            if (!buildingId || !floorNumber) {
                setIsLoadingMap(false);
                return;
            }
            setIsLoadingMap(true);
            try {
                // Query without orderBy to avoid needing composite index
                const q = query(
                    collection(db, "floors"),
                    where("buildingId", "==", buildingId),
                    where("floorNumber", "==", floorNumber)
                );
                const snap = await getDocs(q);
                if (!snap.empty) {
                    // Get most recent if multiple (manual sort since we removed orderBy)
                    const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                    docs.sort((a, b) => {
                        const aTime = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
                        const bTime = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
                        return bTime - aTime;
                    });
                    const savedMap = docs[0];

                    console.log("Loaded Map from DB:", savedMap); // DEBUG

                    // Restore data state FIRST
                    if (savedMap.data) {
                        setWalls(savedMap.data.walls || []);
                        setRooms(savedMap.data.rooms || []);
                        setDoors(savedMap.data.doors || []);
                    }
                    if (savedMap.graph) {
                        setNodes(savedMap.graph.nodes || []);
                        setEdges(savedMap.graph.edges || []);
                    }

                    // ** KEY FIX: Pre-load image before setting URL **
                    if (savedMap.imageUrl) {
                        const img = new Image();
                        img.onload = () => {
                            console.log("Image Loaded:", img.naturalWidth, img.naturalHeight);
                            // Use actual image dimensions (more reliable)
                            setImageSize({
                                width: img.naturalWidth || savedMap.width || 1000,
                                height: img.naturalHeight || savedMap.height || 1000
                            });
                            setPreviewUrl(savedMap.imageUrl);
                            setActiveTab('editor');
                            setIsLoadingMap(false);
                        };
                        img.onerror = () => {
                            console.error("Failed to load image:", savedMap.imageUrl);
                            setIsLoadingMap(false);
                        };
                        img.src = savedMap.imageUrl;
                    } else {
                        setIsLoadingMap(false);
                    }
                } else {
                    console.log("No saved map found for this floor.");
                    setIsLoadingMap(false);
                }
            } catch (e) {
                console.error("Error loading map:", e);
                setIsLoadingMap(false);
            }
        };
        loadMap();
    }, [buildingId, floorNumber]);

    // === HANDLERS: UPLOAD & PROCESS ===

    const handleImageSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);

            const img = new Image();
            img.onload = () => {
                setImageSize({ width: img.naturalWidth, height: img.naturalHeight });
                // Reset Data
                setNodes([]); setEdges([]); setRooms([]); setWalls([]); setDoors([]);
                // Fit view
                if (containerRef.current) {
                    const { clientWidth, clientHeight } = containerRef.current;
                    const scale = Math.min(clientWidth / img.naturalWidth, clientHeight / img.naturalHeight) * 0.9;
                    setTransform({ x: (clientWidth - img.naturalWidth * scale) / 2, y: (clientHeight - img.naturalHeight * scale) / 2, k: scale });
                }
            };
            img.src = url;
            setActiveTab('upload');
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

            console.log("AI Response:", data); // Debug log

            // Handle the response safely
            const detections = data.detections || {};
            const processedRooms = (detections.rooms || []).map((room, i) => ({
                ...room,
                id: room.id || `room_${i}_${Date.now()}`
            }));
            const w = detections.walls || [];
            const d = detections.doors || [];

            // Generate nodes from rooms
            const generatedNodes = processedRooms.map((room, i) => ({
                id: room.id,
                x: room.center?.x || (room.position.start.x + room.position.end.x) / 2,
                y: room.center?.y || (room.position.start.y + room.position.end.y) / 2,
                type: 'room',
                name: room.name || `Room ${i + 1}`
            }));

            // If no rooms detected, add a placeholder node so editor can be accessed
            if (generatedNodes.length === 0) {
                generatedNodes.push({
                    id: `node_center_${Date.now()}`,
                    x: imageSize.width / 2,
                    y: imageSize.height / 2,
                    type: 'junction',
                    name: 'Center'
                });
                console.log("No rooms detected - added placeholder node for editing");
            }

            setRooms(processedRooms);
            setWalls(w);
            setDoors(d);
            setNodes(generatedNodes);
            setEdges([]);

            // Switch to editor and trigger fit view
            setActiveTab('editor');
            setTimeout(fitView, 150); // Delay to ensure DOM is ready

        } catch (error) {
            console.error("Process Map Error:", error);
            alert("AI Error: " + error.message + ". Check console for details.");
        } finally {
            setProcessing(false);
        }
    };

    // === VIEW CONTROL ===
    const fitView = () => {
        if (!containerRef.current || !imageSize.width || !imageSize.height) return;

        const { clientWidth, clientHeight } = containerRef.current;
        if (clientWidth === 0 || clientHeight === 0) return;

        const w = imageSize.width;
        const h = imageSize.height;

        // Add some padding (5%)
        const padding = 40;
        const availW = clientWidth - padding * 2;
        const availH = clientHeight - padding * 2;

        const scaleX = availW / w;
        const scaleY = availH / h;
        const scale = Math.min(scaleX, scaleY); // fit fully

        const x = (clientWidth - w * scale) / 2;
        const y = (clientHeight - h * scale) / 2;

        setTransform({ x, y, k: scale });
    };

    // Initialize Canvas & Fit Image
    useEffect(() => {
        if (activeTab === 'editor') {
            // Initial fit
            setTimeout(fitView, 100); // Small delay to ensure layout

            const observer = new ResizeObserver(() => {
                fitView();
            });

            if (containerRef.current) {
                observer.observe(containerRef.current);
            }

            return () => observer.disconnect();
        }
    }, [activeTab, imageSize]);

    // === SVG UTILS ===

    const getSvgPoint = (clientX, clientY) => {
        // We need point relative to the SVG content (accounting for transform)
        // Screen -> SVG Element -> De-transform
        if (!svgRef.current) return { x: 0, y: 0 };
        const rect = svgRef.current.getBoundingClientRect();
        const svgX = clientX - rect.left;
        const svgY = clientY - rect.top;

        // Apply inverse transform
        return {
            x: (svgX - transform.x) / transform.k,
            y: (svgY - transform.y) / transform.k
        };
    };

    // === INTERACTION HANDLERS ===

    const handleMouseDown = (e) => {
        if (editorMode === 'pan' || e.button === 1) {
            setIsDraggingCanvas(true);
            setDragStart({ x: e.clientX, y: e.clientY });
            e.preventDefault();
        }
    };

    const handleMouseMove = (e) => {
        // 1. Pan Canvas
        if (isDraggingCanvas) {
            const dx = e.clientX - dragStart.x;
            const dy = e.clientY - dragStart.y;
            setTransform(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
            setDragStart({ x: e.clientX, y: e.clientY });
            return;
        }

        // 2. Drag/Resize Item
        if (itemDrag) {
            const pt = getSvgPoint(e.clientX, e.clientY);
            const dx = pt.x - itemDrag.startX;
            const dy = pt.y - itemDrag.startY;

            if (itemDrag.type === 'node') {
                setNodes(nodes.map(n => n.id === itemDrag.id ? { ...n, x: itemDrag.originalData.x + dx, y: itemDrag.originalData.y + dy } : n));
            } else if (itemDrag.type === 'room') {
                const r = { ...itemDrag.originalData }; // copy
                if (itemDrag.action === 'move') {
                    const w = r.position.end.x - r.position.start.x;
                    const h = r.position.end.y - r.position.start.y;
                    r.position.start.x += dx;
                    r.position.start.y += dy;
                    r.position.end.x = r.position.start.x + w;
                    r.position.end.y = r.position.start.y + h;
                } else if (itemDrag.action === 'resize') {
                    if (itemDrag.handle === 'tl') { r.position.start.x += dx; r.position.start.y += dy; }
                    if (itemDrag.handle === 'br') { r.position.end.x += dx; r.position.end.y += dy; }
                }
                setRooms(rooms.map(room => room.id === itemDrag.id ? r : room));
            } else if (itemDrag.type === 'wall') {
                const w = { ...itemDrag.originalData };
                if (itemDrag.action === 'move') {
                    w.position.start.x += dx; w.position.start.y += dy;
                    w.position.end.x += dx; w.position.end.y += dy;
                } else if (itemDrag.action === 'resize') {
                    if (itemDrag.handle === 'start') { w.position.start.x += dx; w.position.start.y += dy; }
                    if (itemDrag.handle === 'end') { w.position.end.x += dx; w.position.end.y += dy; }
                }
                setWalls(walls.map(wall => wall === itemDrag.originalRef ? w : wall)); // Wall might not have ID, use ref or index? Maps usually preserve order.
                // Using index in map
                setWalls(prev => {
                    const next = [...prev];
                    next[itemDrag.index] = w;
                    return next;
                });
            }
        }
    };

    const handleMouseUp = () => {
        setIsDraggingCanvas(false);
        setItemDrag(null);
    };

    const handleWheel = (e) => {
        e.preventDefault();
        const zoomSensitivity = 0.001;
        const delta = -e.deltaY * zoomSensitivity;
        const newScale = Math.min(Math.max(0.01, transform.k + delta), 8);

        // Zoom towards center for simplicity or mouse logic
        // Keeping it simple: zoom center of view
        // Ideally zoom towards mouse, but need complex calculation
        setTransform(prev => ({ ...prev, k: newScale }));
    };

    // === ELEMENT INTERACTION ===

    const onElementDown = (e, type, data, index, handle = null) => {
        if (editorMode === 'pan') return;
        e.stopPropagation();

        if (editorMode === 'delete') {
            if (type === 'node') {
                setNodes(nodes.filter(n => n.id !== data.id));
                setEdges(edges.filter(ed => ed.source !== data.id && ed.target !== data.id));
            } else if (type === 'room') {
                setRooms(rooms.filter(r => r.id !== data.id));
            } else if (type === 'wall') {
                setWalls(walls.filter((_, i) => i !== index));
            } else if (type === 'edge') {
                // edges usually passed as data
                setEdges(edges.filter(ed => ed !== data));
            }
            setSelectedElement(null);
            return;
        }

        if (editorMode === 'connect' && type === 'node') {
            if (!connectionStart) {
                setConnectionStart(data.id);
            } else {
                if (connectionStart !== data.id) {
                    const newEdge = { source: connectionStart, target: data.id, weight: 1 };
                    setEdges([...edges, newEdge]);
                    setConnectionStart(data.id); // Chain
                }
            }
            return;
        }

        if (editorMode === 'select' || editorMode === 'add') { // Allow moving in add mode too? usually no.
            // Select
            setSelectedElement({ type, id: data.id || index, data });

            // Start Drag
            const pt = getSvgPoint(e.clientX, e.clientY);
            setItemDrag({
                type,
                id: data.id,
                index, // for walls
                action: handle ? 'resize' : 'move',
                handle,
                startX: pt.x,
                startY: pt.y,
                originalData: JSON.parse(JSON.stringify(data)),
                originalRef: data // for array matching if needed
            });
        }
    };

    const onBgClick = (e) => {
        const pt = getSvgPoint(e.clientX, e.clientY);
        if (editorMode === 'add') {
            const newNode = {
                id: `node_${Date.now()}`,
                x: pt.x,
                y: pt.y,
                type: 'junction',
                name: ''
            };
            setNodes([...nodes, newNode]);
            setEditorMode('select'); // Switch back to select after adding? or keep adding.
            setSelectedElement({ type: 'node', id: newNode.id, data: newNode });
        } else {
            setSelectedElement(null);
            setConnectionStart(null);
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
        // Allow saving if we have EITHER imageFile (new upload) OR previewUrl (loaded from DB)
        if (!previewUrl || !nodes.length) { alert("Nothing to save. Upload and analyze a map first."); return; }
        setProcessing(true);
        try {
            let downloadURL = previewUrl; // Default to existing URL

            // If new file was uploaded, upload it
            if (imageFile) {
                const storageRef = ref(storage, `floors/${Date.now()}_${imageFile.name}`);
                await uploadBytes(storageRef, imageFile);
                downloadURL = await getDownloadURL(storageRef);
            }

            const floorData = {
                name: `Floor ${floorNumber}`,
                buildingId,
                floorNumber,
                imageUrl: downloadURL,
                width: imageSize.width,
                height: imageSize.height,
                data: { walls, rooms, doors },
                graph: { nodes, edges },
                createdAt: new Date()
            };

            await addDoc(collection(db, "floors"), floorData);
            if (onSaveComplete) onSaveComplete(floorData.name);
            alert("Map Saved Successfully!");
        } catch (e) {
            console.error(e);
            alert("Save Failed.");
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Tab Nav */}
            <div className="border-b border-gray-200 bg-gray-50 p-1 flex gap-1">
                <button onClick={() => setActiveTab('upload')} className={`flex-1 py-2 px-4 text-sm font-bold rounded-lg ${activeTab === 'upload' ? 'bg-white shadow text-black' : 'text-gray-500'}`}>Upload</button>
                <button onClick={() => setActiveTab('editor')} disabled={!previewUrl || nodes.length === 0} className={`flex-1 py-2 px-4 text-sm font-bold rounded-lg ${activeTab === 'editor' ? 'bg-white shadow text-black' : 'text-gray-500'} disabled:opacity-50`}>Editor</button>
            </div>

            <div className="min-h-[600px] flex flex-col">
                {isLoadingMap && (
                    <div className="flex-1 flex items-center justify-center">
                        <Loader className="animate-spin text-gray-400" size={48} />
                    </div>
                )}

                {!isLoadingMap && activeTab === 'upload' && (
                    <div className="flex-1 flex flex-col items-center justify-center p-10 space-y-6">
                        <div className="border-2 border-dashed border-gray-300 rounded-2xl p-10 text-center hover:bg-gray-50 cursor-pointer relative">
                            <input type="file" accept="image/*" onChange={handleImageSelect} className="absolute inset-0 opacity-0 cursor-pointer" />
                            <Upload className="mx-auto text-gray-400 mb-4" size={48} />
                            <p className="font-bold text-lg">Upload Floor Plan</p>
                        </div>
                        {previewUrl && (
                            <div className="w-full max-w-md">
                                <img src={previewUrl} className="w-full h-auto rounded-lg border border-gray-200 mb-4" />
                                <Button onClick={processMap} disabled={processing} fullWidth icon={processing ? <Loader className="animate-spin" /> : <Cpu />}>
                                    {processing ? 'Processing...' : 'Run Analysis'}
                                </Button>
                            </div>
                        )}
                    </div>
                )}

                {!isLoadingMap && activeTab === 'editor' && (
                    <div className="flex-1 flex flex-col relative">
                        {/* Toolbar */}
                        <div className="absolute top-4 left-4 right-4 z-10 bg-white p-2 rounded-xl shadow-lg border border-gray-200 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                {[
                                    { id: 'select', icon: MousePointer2 },
                                    { id: 'pan', icon: Move },
                                    { id: 'add', icon: PlusCircle },
                                    { id: 'connect', icon: GitCommit },
                                    { id: 'delete', icon: Eraser },
                                ].map(t => (
                                    <button
                                        key={t.id}
                                        onClick={() => setEditorMode(t.id)}
                                        className={`p-2 rounded-lg ${editorMode === t.id ? 'bg-black text-white' : 'hover:bg-gray-100 text-gray-600'}`}
                                        title={t.id}
                                    >
                                        <t.icon size={20} />
                                    </button>
                                ))}
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={fitView} className="p-2 hover:bg-gray-100 rounded" title="Fit to View">
                                    <RotateCcw size={20} />
                                </button>
                                <Button onClick={saveMap} size="sm" variant="primary" icon={<Save size={16} />}>Save</Button>
                            </div>
                        </div>

                        {/* Name Editor */}
                        {selectedElement && (editorMode === 'select') && (
                            <div className="absolute top-20 left-4 z-10 bg-white p-2 rounded-lg shadow border border-gray-200 flex items-center gap-2">
                                <span className="text-xs font-bold uppercase bg-gray-100 px-2 py-1 rounded">{selectedElement.type}</span>
                                <input
                                    value={selectedElement.data.name || ''}
                                    onChange={(e) => updateName(e.target.value)}
                                    className="text-sm font-bold outline-none bg-transparent"
                                    placeholder="Name..."
                                />
                            </div>
                        )}

                        {/* SVG Canvas */}
                        <div
                            ref={containerRef}
                            className={`flex-1 bg-gray-100 overflow-hidden relative cursor-${editorMode === 'pan' ? 'grab' : 'default'}`}
                            onMouseDown={handleMouseDown}
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleMouseUp}
                            onWheel={handleWheel}
                        >
                            <svg
                                ref={svgRef}
                                className="w-full h-full pointer-events-auto block"
                                style={{ height: '100%', position: 'absolute', top: 0, left: 0 }}
                                onMouseDown={(e) => { if (editorMode !== 'pan') onBgClick(e); }}
                            >
                                <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.k})`}>
                                    {/* Image */}
                                    {previewUrl && (
                                        <image href={previewUrl} x="0" y="0" width={imageSize.width} height={imageSize.height} />
                                    )}

                                    {/* 1. Rooms */}
                                    {rooms.map((r, i) => {
                                        const x = r.position.start.x; const y = r.position.start.y;
                                        const w = r.position.end.x - x; const h = r.position.end.y - y;
                                        const isSel = selectedElement?.id === r.id;
                                        return (
                                            <g key={r.id || i} onMouseDown={(e) => onElementDown(e, 'room', r)}>
                                                <rect
                                                    x={x} y={y} width={w} height={h}
                                                    fill={isSel ? "rgba(59, 130, 246, 0.2)" : "rgba(59, 130, 246, 0.1)"}
                                                    stroke={isSel ? "#2563eb" : "#3b82f6"} strokeWidth={isSel ? 3 : 2}
                                                />
                                                <text x={x + 2} y={y + 14} fontSize="12" fill="white" fontWeight="bold" style={{ textShadow: '0 1px 2px black' }} pointerEvents="none">{r.name}</text>
                                                {isSel && (
                                                    <>
                                                        <rect x={x - 5} y={y - 5} width="10" height="10" fill="white" stroke="#2563eb" className="cursor-nw-resize" onMouseDown={(e) => onElementDown(e, 'room', r, i, 'tl')} />
                                                        <rect x={x + w - 5} y={y + h - 5} width="10" height="10" fill="white" stroke="#2563eb" className="cursor-se-resize" onMouseDown={(e) => onElementDown(e, 'room', r, i, 'br')} />
                                                    </>
                                                )}
                                            </g>
                                        );
                                    })}

                                    {/* 2. Walls */}
                                    {walls.map((w, i) => {
                                        const isSel = selectedElement?.type === 'wall' && selectedElement?.id === i; // Walls might not have ID
                                        return (
                                            <g key={i}>
                                                <line
                                                    x1={w.position.start.x} y1={w.position.start.y} x2={w.position.end.x} y2={w.position.end.y}
                                                    stroke="transparent" strokeWidth="15" className="cursor-pointer"
                                                    onMouseDown={(e) => onElementDown(e, 'wall', w, i)}
                                                />
                                                <line
                                                    x1={w.position.start.x} y1={w.position.start.y} x2={w.position.end.x} y2={w.position.end.y}
                                                    stroke={isSel ? "#2563eb" : "#ef4444"} strokeWidth={3} pointerEvents="none"
                                                />
                                                {isSel && (
                                                    <>
                                                        <circle cx={w.position.start.x} cy={w.position.start.y} r="5" fill="white" stroke="#2563eb" className="cursor-move" onMouseDown={(e) => onElementDown(e, 'wall', w, i, 'start')} />
                                                        <circle cx={w.position.end.x} cy={w.position.end.y} r="5" fill="white" stroke="#2563eb" className="cursor-move" onMouseDown={(e) => onElementDown(e, 'wall', w, i, 'end')} />
                                                    </>
                                                )}
                                            </g>
                                        );
                                    })}

                                    {/* 3. Edges */}
                                    {edges.map((edge, i) => {
                                        const s = nodes.find(n => n.id === edge.source);
                                        const t = nodes.find(n => n.id === edge.target);
                                        if (!s || !t) return null;
                                        return <line key={i} x1={s.x} y1={s.y} x2={t.x} y2={t.y} stroke="#10b981" strokeWidth="2" onMouseDown={(e) => onElementDown(e, 'edge', edge, i)} className="cursor-pointer hover:stroke-red-500" />;
                                    })}

                                    {/* Connection Line */}
                                    {editorMode === 'connect' && connectionStart && nodes.find(n => n.id === connectionStart) && (
                                        <line
                                            x1={nodes.find(n => n.id === connectionStart).x}
                                            y1={nodes.find(n => n.id === connectionStart).y}
                                            x2={(getSvgPoint(dragStart.x || 0, dragStart.y || 0).x)}
                                            y2={(getSvgPoint(dragStart.x || 0, dragStart.y || 0).y)} // This is static, need mouse tracking in SVG coords
                                            // Actually simpler: we can't easily track mouse in SVG coords inside render without state.
                                            // For now, skip visual line or add mousePos state.
                                            stroke="#22c55e" strokeDasharray="5,5"
                                        />
                                    )}

                                    {/* 4. Nodes */}
                                    {nodes.map((n, i) => {
                                        const isSel = selectedElement?.id === n.id;
                                        const isConn = connectionStart === n.id;
                                        return (
                                            <g key={n.id} onMouseDown={(e) => onElementDown(e, 'node', n)} className="cursor-pointer hover:opacity-80">
                                                <circle
                                                    cx={n.x} cy={n.y} r={isSel ? 8 : 6}
                                                    fill={isConn ? "#22c55e" : (n.type === 'room' ? "#3b82f6" : "#111827")}
                                                    stroke="white" strokeWidth="2"
                                                />
                                                {transform.k > 0.5 && n.name && (
                                                    <text x={n.x} y={n.y - 10} fontSize="10" textAnchor="middle" fill="black" fontWeight="bold" paintOrder="stroke" stroke="white" strokeWidth="2">{n.name}</text>
                                                )}
                                            </g>
                                        );
                                    })}

                                </g>
                            </svg>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FloorMapUploader;
