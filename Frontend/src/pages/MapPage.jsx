import React, { useState, useEffect, useRef } from 'react';
import { Button, Input } from '../components';
import { Search, Compass, ScanLine, Navigation, MapPin } from 'lucide-react';
import { db } from '../config/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { findPath } from '../utils/pathfinder';

const MapPage = () => {
    const [floors, setFloors] = useState([]);
    const [selectedFloorId, setSelectedFloorId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [navigationActive, setNavigationActive] = useState(false);
    const [startNode, setStartNode] = useState(null); // ID of start room
    const [endNode, setEndNode] = useState(null);     // ID of end room
    const [path, setPath] = useState(null);

    const canvasRef = useRef(null);
    const containerRef = useRef(null);

    // Fetch Floors on Mount
    useEffect(() => {
        const fetchFloors = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, "floors"));
                const floorsData = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setFloors(floorsData);
                if (floorsData.length > 0) {
                    setSelectedFloorId(floorsData[0].id);
                }
            } catch (error) {
                console.error("Error fetching floors:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchFloors();
    }, []);

    const currentFloor = floors.find(f => f.id === selectedFloorId);

    // Filtered Rooms for Search
    const filteredRooms = currentFloor?.data?.rooms?.filter(room =>
        (room.name || room.class || '').toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

    // Pathfinding Effect
    useEffect(() => {
        if (navigationActive && currentFloor && startNode && endNode) {
            const calculatedPath = findPath(currentFloor.graph, startNode, endNode);
            setPath(calculatedPath);
        } else {
            setPath(null);
        }
    }, [navigationActive, startNode, endNode, currentFloor]);


    // Drawing Logic
    const drawMap = () => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container || !currentFloor) return;

        const ctx = canvas.getContext('2d');
        const img = new Image();
        img.onload = () => {
            // Fit to width logic
            const containerWidth = container.clientWidth;
            const containerHeight = container.clientHeight; // Or calculated height

            const scale = containerWidth / currentFloor.width;

            // Set canvas dimensions
            canvas.width = containerWidth;
            canvas.height = currentFloor.height * scale;

            // Draw Base Image
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            // Draw Overlay (Rooms, Walls, Doors)
            const { rooms, walls, doors } = currentFloor.data;
            const serverScaleX = canvas.width / currentFloor.width;
            const serverScaleY = canvas.height / currentFloor.height; // Should be same as scale

            // Draw Walls
            ctx.strokeStyle = '#ff6b6b';
            ctx.lineWidth = 2;
            walls.forEach(wall => {
                ctx.beginPath();
                ctx.moveTo(wall.position.start.x * serverScaleX, wall.position.start.y * serverScaleY);
                ctx.lineTo(wall.position.end.x * serverScaleX, wall.position.end.y * serverScaleY);
                ctx.stroke();
            });

            // Draw Doors
            doors?.forEach(door => {
                const x = door.hinge.x * serverScaleX;
                const y = door.hinge.y * serverScaleY;
                const radius = (door.width || 30) * serverScaleX;

                ctx.strokeStyle = '#feca57';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(x, y, radius, 0, Math.PI / 2);
                ctx.stroke();
            });

            // Draw Rooms & Labels
            rooms.forEach(room => {
                const x = room.position.start.x * serverScaleX;
                const y = room.position.start.y * serverScaleY;
                const w = (room.position.end.x - room.position.start.x) * serverScaleX;
                const h = (room.position.end.y - room.position.start.y) * serverScaleY;

                // Highlight if searching or selected
                const isSelected = room.id === startNode || room.id === endNode;
                const isMatch = searchQuery && filteredRooms.some(r => r.id === room.id);

                if (isSelected || isMatch) {
                    ctx.fillStyle = 'rgba(102, 126, 234, 0.4)';
                    ctx.strokeStyle = '#667eea';
                    ctx.lineWidth = 2;
                    ctx.fillRect(x, y, w, h);
                    ctx.strokeRect(x, y, w, h);
                }

                // Text Label
                if (room.name) {
                    ctx.fillStyle = '#000'; // Black text for strict B&W theme, or maintain contrast
                    ctx.font = '10px sans-serif'; // Cleaner font
                    ctx.fillText(room.name, x + 5, y + 15);
                }
            });

            // Draw Path if Active
            if (path && path.length > 0) {
                ctx.beginPath();
                ctx.strokeStyle = '#000'; // Strict B&W - Path is black
                ctx.lineWidth = 4;
                ctx.lineCap = 'round';
                ctx.setLineDash([10, 10]); // Dashed line

                path.forEach((node, index) => {
                    const px = node.x * serverScaleX;
                    const py = node.y * serverScaleY;
                    if (index === 0) ctx.moveTo(px, py);
                    else ctx.lineTo(px, py);
                });
                ctx.stroke();
                ctx.setLineDash([]); // Reset dash

                // Draw Start/End Markers
                const start = path[0];
                const end = path[path.length - 1];

                // Start Dot
                ctx.fillStyle = '#000';
                ctx.beginPath();
                ctx.arc(start.x * serverScaleX, start.y * serverScaleY, 6, 0, Math.PI * 2);
                ctx.fill();

                // End Target
                ctx.beginPath();
                ctx.arc(end.x * serverScaleX, end.y * serverScaleY, 8, 0, Math.PI * 2);
                ctx.fillStyle = '#000';
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(end.x * serverScaleX, end.y * serverScaleY, 4, 0, Math.PI * 2);
                ctx.fill();
            }

        };
        img.src = currentFloor.imageUrl; // Firestore Image URL
    };

    useEffect(() => {
        drawMap();
        window.addEventListener('resize', drawMap);
        return () => window.removeEventListener('resize', drawMap);
    }, [currentFloor, path, searchQuery, startNode, endNode]);


    const handleRoomClick = (room) => {
        if (!room) return;
        if (!startNode) {
            setStartNode(room.id);
            alert(`Starting point set to: ${room.name}`);
        } else if (!endNode) {
            setEndNode(room.id);
            setNavigationActive(true);
        } else {
            // Reset
            setStartNode(room.id);
            setEndNode(null);
            setNavigationActive(false);
            setPath(null);
            alert(`New start point: ${room.name}`);
        }
    };

    // Click handler for canvas (Hit testing)
    const handleCanvasClick = (e) => {
        if (!currentFloor) return;
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        const clickX = (e.clientX - rect.left) * scaleX;
        const clickY = (e.clientY - rect.top) * scaleY;

        // Convert back to original image coordinates for hit detection
        const serverScaleX = canvas.width / currentFloor.width;
        const imageX = clickX / serverScaleX;
        const imageY = clickY / serverScaleY; // Check if this is correct scaling direction

        // Simple Hit Test
        const clickedRoom = currentFloor.data.rooms.find(room => {
            return (
                imageX >= room.position.start.x &&
                imageX <= room.position.end.x &&
                imageY >= room.position.start.y &&
                imageY <= room.position.end.y
            );
        });

        if (clickedRoom) {
            handleRoomClick(clickedRoom);
        }
    };


    if (loading) return <div className="h-screen flex items-center justify-center">Loading Maps...</div>;
    if (floors.length === 0) return <div className="h-screen flex items-center justify-center">No maps found. Please ask Admin to upload one.</div>;

    return (
        <div className="h-screen bg-[#FAFAFA] relative overflow-hidden flex flex-col">

            {/* Top Bar */}
            <div className="absolute top-4 left-4 right-4 z-20">
                <div className="bg-white rounded-full shadow-lg p-3 flex items-center gap-3">
                    <Search className="text-gray-400" />
                    <input
                        className="flex-1 bg-transparent outline-none"
                        placeholder="Search rooms..."
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
                            Exit Nav
                        </button>
                    )}
                </div>
            </div>

            {/* Map Canvas Container */}
            <div ref={containerRef} className="flex-1 relative bg-gray-100 overflow-auto touch-manipulation">
                <canvas
                    ref={canvasRef}
                    onClick={handleCanvasClick}
                    className="mx-auto my-auto block max-w-full"
                />
            </div>

            {/* Floor Selector */}
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2">
                {floors.map(f => (
                    <button
                        key={f.id}
                        onClick={() => setSelectedFloorId(f.id)}
                        className={`
                            w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-md transition-all
                            ${selectedFloorId === f.id ? 'bg-black text-white scale-110' : 'bg-white text-gray-500'}
                        `}
                    >
                        {f.name.substring(0, 2)}
                    </button>
                ))}
            </div>

            {/* Navigation Footer */}
            {navigationActive && path && (
                <div className="absolute bottom-20 left-4 right-4 z-20">
                    <div className="bg-black text-white rounded-3xl p-5 shadow-2xl flex items-center justify-between">
                        <div>
                            <p className="text-gray-400 text-xs uppercase tracking-widest font-bold">Navigating to</p>
                            <h3 className="text-xl font-bold">{currentFloor?.data?.rooms?.find(r => r.id === endNode)?.name || 'Destination'}</h3>

                        </div>
                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-black">
                            <Navigation size={24} fill="currentColor" />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MapPage;
