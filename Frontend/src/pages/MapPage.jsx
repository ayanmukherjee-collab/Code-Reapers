import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button, Input } from '../components';
import { Search, Compass, ScanLine, Navigation, MapPin, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { db } from '../config/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { findPath } from '../utils/pathfinder';
import { complexGraph } from '../data/complexGraph';

const MapPage = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [floors, setFloors] = useState([]);
    const [selectedFloorId, setSelectedFloorId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [navigationActive, setNavigationActive] = useState(false);
    const [startNode, setStartNode] = useState(null); // ID of start room
    const [endNode, setEndNode] = useState(null);     // ID of end room
    const [path, setPath] = useState(null);

    // View State
    const [transform, setTransform] = useState({ x: 0, y: 0, k: 1 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    // Touch state for mobile
    const [lastTouchDistance, setLastTouchDistance] = useState(null);
    const [lastTouchCenter, setLastTouchCenter] = useState(null);

    const svgRef = useRef(null);
    const containerRef = useRef(null);

    // ===== DEMO DATA (Complex Maze for Hackathon) =====
    const DEMO_FLOOR = {
        id: 'demo_floor_maze',
        name: 'Complex Layout - Ground Floor',
        buildingId: 'demo_building',
        floorNumber: 1,
        // Using a dark/neutral bg or just relying on walls
        imageUrl: 'https://images.unsplash.com/photo-1626178793926-22b28830c17a?w=1600&auto=format',
        width: 1600,
        height: 900,
        data: {
            rooms: complexGraph.rooms,
            walls: complexGraph.walls,
            doors: complexGraph.doors
        },
        graph: complexGraph.graph
    };

    // Fetch Floors on Mount
    useEffect(() => {
        const fetchFloors = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, "floors"));
                const floorsData = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                floorsData.sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));

                // If no floors from DB, use demo data
                if (floorsData.length === 0) {
                    console.log("No floors in DB, using demo data");
                    setFloors([DEMO_FLOOR]);
                    setSelectedFloorId(DEMO_FLOOR.id);
                } else {
                    setFloors(floorsData);
                    setSelectedFloorId(floorsData[0].id);
                }
            } catch (error) {
                console.error("Error fetching floors, using demo:", error);
                // Fallback to demo on error
                setFloors([DEMO_FLOOR]);
                setSelectedFloorId(DEMO_FLOOR.id);
            } finally {
                setLoading(false);
            }
        };
        fetchFloors();
    }, []);

    const currentFloor = floors.find(f => f.id === selectedFloorId);

    // Reset View on Floor Change
    useEffect(() => {
        if (currentFloor && containerRef.current) {
            // Fit to screen logic
            // We want to fit the image into the container
            const { clientWidth, clientHeight } = containerRef.current;
            const imgW = currentFloor.width || 2000;
            const imgH = currentFloor.height || 2000;

            // Calculate scale
            const scale = Math.min(clientWidth / imgW, clientHeight / imgH) * 0.9;

            // Center
            const x = (clientWidth - imgW * scale) / 2;
            const y = (clientHeight - imgH * scale) / 2;

            setTransform({ x, y, k: scale || 0.1 });
        }
    }, [currentFloor?.id]); // Only when ID changes

    // Handle destination from URL (when coming from Faculty/other pages)
    useEffect(() => {
        const destinationId = searchParams.get('destination');
        if (destinationId && currentFloor) {
            // Find the room in current floor data
            const destRoom = currentFloor.data?.rooms?.find(r => r.id === destinationId);
            if (destRoom) {
                // Set as destination - user still needs to click a starting point
                setEndNode(destinationId);
                setNavigationActive(true);
                // Clear the URL params after reading
                setSearchParams({});
            }
        }
    }, [currentFloor, searchParams]);

    // Pathfinding Effect
    useEffect(() => {
        if (navigationActive && currentFloor && startNode && endNode) {
            const calculatedPath = findPath(currentFloor.graph, startNode, endNode);
            setPath(calculatedPath);
        } else {
            setPath(null);
        }
    }, [navigationActive, startNode, endNode, currentFloor]);


    // Interaction Handlers
    const handleWheel = (e) => {
        e.preventDefault();
        const zoomSensitivity = 0.001;
        const delta = -e.deltaY * zoomSensitivity;
        const newScale = Math.min(Math.max(0.01, transform.k + delta), 8);
        setTransform(prev => ({ ...prev, k: newScale }));
    };

    const handleMouseDown = (e) => {
        setIsDragging(true);
        setDragStart({ x: e.clientX, y: e.clientY });
    };

    const handleMouseMove = (e) => {
        if (isDragging) {
            const dx = e.clientX - dragStart.x;
            const dy = e.clientY - dragStart.y;
            setTransform(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
            setDragStart({ x: e.clientX, y: e.clientY });
        }
    };

    const handleMouseUp = () => setIsDragging(false);

    // Touch event handlers for mobile
    const getTouchDistance = (touches) => {
        if (touches.length < 2) return null;
        const dx = touches[0].clientX - touches[1].clientX;
        const dy = touches[0].clientY - touches[1].clientY;
        return Math.sqrt(dx * dx + dy * dy);
    };

    const getTouchCenter = (touches) => {
        if (touches.length < 2) return { x: touches[0].clientX, y: touches[0].clientY };
        return {
            x: (touches[0].clientX + touches[1].clientX) / 2,
            y: (touches[0].clientY + touches[1].clientY) / 2
        };
    };

    const handleTouchStart = (e) => {
        if (e.touches.length === 1) {
            // Single touch - pan
            setIsDragging(true);
            setDragStart({ x: e.touches[0].clientX - transform.x, y: e.touches[0].clientY - transform.y });
        } else if (e.touches.length === 2) {
            // Two fingers - pinch zoom
            e.preventDefault();
            setLastTouchDistance(getTouchDistance(e.touches));
            setLastTouchCenter(getTouchCenter(e.touches));
        }
    };

    const handleTouchMove = (e) => {
        if (e.touches.length === 1 && isDragging) {
            // Single touch pan
            const newX = e.touches[0].clientX - dragStart.x;
            const newY = e.touches[0].clientY - dragStart.y;
            setTransform(t => ({ ...t, x: newX, y: newY }));
        } else if (e.touches.length === 2 && lastTouchDistance) {
            // Pinch to zoom
            e.preventDefault();
            const newDist = getTouchDistance(e.touches);
            const scale = newDist / lastTouchDistance;
            const newCenter = getTouchCenter(e.touches);

            setTransform(t => {
                const newK = Math.min(Math.max(t.k * scale, 0.1), 5);
                // Zoom towards center of pinch
                const dx = (newCenter.x - t.x) * (1 - scale);
                const dy = (newCenter.y - t.y) * (1 - scale);
                return {
                    x: t.x + dx + (newCenter.x - lastTouchCenter.x),
                    y: t.y + dy + (newCenter.y - lastTouchCenter.y),
                    k: newK
                };
            });

            setLastTouchDistance(newDist);
            setLastTouchCenter(newCenter);
        }
    };

    const handleTouchEnd = () => {
        setIsDragging(false);
        setLastTouchDistance(null);
        setLastTouchCenter(null);
    };

    const handleRoomClick = (room) => {
        if (!room) return;

        // Navigation logic:
        // Case 1: Destination set from URL (endNode set, no startNode) -> Click sets Start
        // Case 2: Nothing selected -> Click sets Start
        // Case 3: Start selected, no End -> Click sets End
        // Case 4: Both selected -> Reset and start fresh

        if (endNode && !startNode) {
            // Coming from faculty page with destination preset - click sets start
            if (room.id === endNode) return; // Can't start from destination
            setStartNode(room.id);
        } else if (!startNode) {
            setStartNode(room.id);
        } else if (!endNode) {
            if (room.id === startNode) return; // Can't go to same room
            setEndNode(room.id);
            setNavigationActive(true);
        } else {
            // Reset
            setStartNode(room.id);
            setEndNode(null);
            setNavigationActive(false);
            setPath(null);
        }
    };

    if (loading) return <div className="h-screen flex items-center justify-center font-bold text-gray-500">Loading Campus Maps...</div>;
    if (floors.length === 0) return <div className="h-screen flex items-center justify-center text-gray-500">No maps found. Please ask Admin to upload one.</div>;

    return (
        <div className="h-screen bg-[#FAFAFA] relative overflow-hidden flex flex-col">

            {/* Top Bar */}
            <div className="absolute top-4 left-4 right-4 z-20 pointer-events-none">
                <div className="bg-white rounded-full shadow-lg p-3 flex items-center gap-3 pointer-events-auto max-w-md mx-auto border border-gray-100">
                    <Search className="text-gray-400" />
                    <input
                        className="flex-1 bg-transparent outline-none text-sm font-medium"
                        placeholder="Search rooms, labs, offices..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {navigationActive && (
                        <button
                            onClick={() => {
                                setNavigationActive(false);
                                setStartNode(null);
                                setEndNode(null);
                                setPath(null);
                            }}
                            className="bg-red-50 text-red-500 font-bold px-3 py-1 rounded-full text-xs"
                        >
                            Exit
                        </button>
                    )}
                </div>
            </div>

            {/* Map Container */}
            <div
                ref={containerRef}
                className="flex-1 relative bg-gray-100 overflow-hidden cursor-move"
                style={{ touchAction: 'none' }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onWheel={handleWheel}
            >
                {currentFloor && (
                    <svg
                        ref={svgRef}
                        className="w-full h-full block pointer-events-none" // Events handled by parent div for pan, but children need events?
                    // Actually, for SVG specific clicks (rooms), we need pointer-events-auto on children
                    >
                        <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.k})`}>
                            {/* Base Layer - White floor, walls will define structure */}
                            <rect
                                x="0" y="0"
                                width={currentFloor.width}
                                height={currentFloor.height}
                                fill="white"
                            />

                            {/* 1. Walls */}
                            {currentFloor.data?.walls?.map((w, i) => (
                                <line
                                    key={`wall-${i}`}
                                    x1={w.position.start.x} y1={w.position.start.y}
                                    x2={w.position.end.x} y2={w.position.end.y}
                                    stroke="#374151" strokeWidth="6" strokeLinecap="round" // Dark gray walls
                                    opacity="1"
                                />
                            ))}

                            {/* 2. Rooms */}
                            {currentFloor.data?.rooms?.map((r, i) => {
                                const isStart = startNode === r.id;
                                const isEnd = endNode === r.id;
                                const isMatch = searchQuery && (r.name || '').toLowerCase().includes(searchQuery.toLowerCase());

                                let fill = "white";
                                let stroke = "#d1d5db";
                                let strokeWidth = 2;

                                if (isStart) { fill = "rgba(34, 197, 94, 0.4)"; stroke = "#16a34a"; strokeWidth = 3; }
                                else if (isEnd) { fill = "rgba(239, 68, 68, 0.4)"; stroke = "#dc2626"; strokeWidth = 3; }
                                else if (isMatch) { fill = "rgba(234, 179, 8, 0.4)"; stroke = "#ca8a04"; strokeWidth = 3; }

                                return (
                                    <g
                                        key={r.id || i}
                                        className="pointer-events-auto cursor-pointer hover:opacity-80 transition-opacity"
                                        onClick={(e) => { e.stopPropagation(); handleRoomClick(r); }}
                                    >
                                        <rect
                                            x={r.position.start.x} y={r.position.start.y}
                                            width={r.position.end.x - r.position.start.x}
                                            height={r.position.end.y - r.position.start.y}
                                            fill={fill} stroke={stroke} strokeWidth={strokeWidth}
                                            rx="4"
                                            className="transition-colors duration-200"
                                        />
                                        {/* Label */}
                                        {r.name && transform.k > 0.3 && (
                                            <>
                                                <text
                                                    x={r.position.start.x + (r.position.end.x - r.position.start.x) / 2}
                                                    y={r.position.start.y + (r.position.end.y - r.position.start.y) / 2 + 4}
                                                    textAnchor="middle"
                                                    fontSize="12" fill="#1f2937" fontWeight="600"
                                                    pointerEvents="none"
                                                    style={{ textShadow: '0px 0px 4px white' }}
                                                >
                                                    {r.name}
                                                </text>
                                            </>
                                        )}

                                        {/* Start/End Label Badges */}
                                        {isStart && (
                                            <g transform={`translate(${r.position.start.x}, ${r.position.start.y - 40})`}>
                                                <rect x="-10" y="0" width="80" height="30" rx="8" fill="#16a34a" stroke="white" strokeWidth="2" />
                                                <text x="30" y="20" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">START</text>
                                                {/* Arrow */}
                                                <path d="M 30 30 L 35 35 L 25 35 Z" fill="#16a34a" />
                                            </g>
                                        )}
                                        {isEnd && (
                                            <g transform={`translate(${r.position.start.x}, ${r.position.start.y - 40})`}>
                                                <rect x="-10" y="0" width="80" height="30" rx="8" fill="#dc2626" stroke="white" strokeWidth="2" />
                                                <text x="30" y="20" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">END</text>
                                                <path d="M 30 30 L 35 35 L 25 35 Z" fill="#dc2626" />
                                            </g>
                                        )}
                                    </g>
                                );
                            })}

                            {/* Doors - rendered as openings in walls */}
                            {currentFloor.data?.doors?.map((d, i) => (
                                <g key={`door-${i}`}>
                                    <rect
                                        x={d.position.x - (d.width || 30) / 2}
                                        y={d.position.y - 4}
                                        width={d.width || 30}
                                        height={8}
                                        fill="#f3f4f6"
                                        stroke="#9ca3af"
                                        strokeWidth="1"
                                        rx="2"
                                    />
                                </g>
                            ))}

                            {/* 3. Path - rendered through corridors only */}
                            {path && path.length > 0 && (() => {
                                // Get only junction nodes for the path (skip start/end room centers)
                                const corridorPath = path.filter(p => p.type === 'junction' || p.type === 'entrance');
                                // If no junctions, fall back to full path
                                const drawPath = corridorPath.length >= 2 ? corridorPath : path;

                                return (
                                    <>
                                        <polyline
                                            points={drawPath.map(p => `${p.x},${p.y}`).join(' ')}
                                            fill="none" stroke="#2563eb" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"
                                            strokeDasharray="12,8"
                                            className="animate-pulse"
                                        />
                                        {/* Path Nodes (Dots) - only on junctions */}
                                        {drawPath.map((p, i) => (
                                            <circle key={i} cx={p.x} cy={p.y} r="5" fill="#2563eb" stroke="white" strokeWidth="2" />
                                        ))}

                                        {/* Destination Marker - at the last junction point */}
                                        <g transform={`translate(${drawPath[drawPath.length - 1].x}, ${drawPath[drawPath.length - 1].y})`}>
                                            <circle r="10" fill="#dc2626" className="animate-ping opacity-75" />
                                            <circle r="6" fill="#dc2626" stroke="white" strokeWidth="2" />
                                        </g>
                                    </>
                                );
                            })()}
                        </g>
                    </svg>
                )}
            </div>

            {/* Controls Overlay */}
            <div className="absolute right-4 bottom-24 flex flex-col gap-2">
                <button onClick={() => setTransform(t => ({ ...t, k: Math.min(t.k + 0.2, 5) }))} className="p-3 bg-white shadow-lg rounded-full text-gray-600 hover:text-black hover:scale-110 transition-transform"><ZoomIn size={24} /></button>
                <button onClick={() => setTransform(t => ({ ...t, k: Math.max(t.k - 0.2, 0.01) }))} className="p-3 bg-white shadow-lg rounded-full text-gray-600 hover:text-black hover:scale-110 transition-transform"><ZoomOut size={24} /></button>
                <button onClick={() => setTransform({ x: 0, y: 0, k: 0.2 })} className="p-3 bg-white shadow-lg rounded-full text-gray-600 hover:text-black hover:scale-110 transition-transform"><RotateCcw size={24} /></button>
            </div>

            {/* Floor Selector */}
            <div className="absolute right-4 top-24 flex flex-col gap-2 max-h-[50vh] overflow-y-auto no-scrollbar py-2 px-1">
                {floors.map(f => (
                    <button
                        key={f.id}
                        onClick={() => setSelectedFloorId(f.id)}
                        className={`
                            w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-xs shadow-md transition-all border-2
                            ${selectedFloorId === f.id ? 'bg-black text-white border-black scale-105' : 'bg-white text-gray-500 border-gray-100 hover:border-gray-300'}
                        `}
                        title={f.name}
                    >
                        {f.floorNumber ? f.floorNumber : (f.name.match(/\d+/) ? f.name.match(/\d+/)[0] : f.name.substring(0, 2).toUpperCase())}
                    </button>
                ))}
            </div>

            {/* Navigation Footer - positioned above navbar on mobile */}
            {navigationActive && (
                <div className="absolute bottom-24 md:bottom-6 left-4 right-4 z-20">
                    <div className="bg-white/95 backdrop-blur-md rounded-[24px] md:rounded-[32px] p-4 md:p-5 shadow-2xl border border-gray-100 flex items-center justify-between max-w-lg mx-auto animate-in slide-in-from-bottom-5">
                        <div className="flex-1 min-w-0">
                            <p className="text-gray-400 text-[10px] md:text-xs uppercase tracking-widest font-bold mb-1">Navigating to</p>
                            <h3 className="text-lg md:text-xl font-bold text-gray-900 leading-tight truncate">
                                {currentFloor?.data?.rooms?.find(r => r.id === endNode)?.name || 'Destination'}
                            </h3>
                            {path ? (
                                <p className="text-green-600 text-xs md:text-sm font-medium flex items-center gap-1 mt-1 bg-green-50 px-2 py-1 rounded-full w-fit">
                                    <MapPin size={12} /> {Math.round(path.length * 1.5)} steps away
                                </p>
                            ) : (
                                <p className="text-orange-500 text-xs md:text-sm font-medium mt-1 flex items-center gap-1">
                                    <Loader size={12} className="animate-spin" /> Calculating path...
                                </p>
                            )}
                        </div>
                        <div className="w-12 h-12 md:w-14 md:h-14 bg-black rounded-full flex items-center justify-center text-white shadow-lg shadow-black/30 animate-pulse flex-shrink-0 ml-3">
                            <Navigation size={24} fill="currentColor" />
                        </div>
                    </div>
                </div>
            )}

            {/* Start Node Indicator (if only start set) - positioned above navbar on mobile */}
            {!navigationActive && startNode && (
                <div className="absolute bottom-24 md:bottom-6 left-1/2 -translate-x-1/2 z-20">
                    <div className="bg-green-500 text-white px-4 md:px-6 py-2 md:py-3 rounded-full shadow-xl font-bold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 text-sm md:text-base">
                        <MapPin fill="currentColor" size={16} />
                        <span className="truncate max-w-[200px] md:max-w-none">Starting from: {currentFloor?.data?.rooms?.find(r => r.id === startNode)?.name}</span>
                    </div>
                </div>
            )}
        </div>
    );
};

// Helper for loader
const Loader = ({ size, className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
);

export default MapPage;
