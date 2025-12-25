import React, { useState, useRef, useEffect } from 'react';
import { Button, Input } from '../../components'; // Assuming these exist in ../../components
import { Upload, Cpu, Save, Loader, Layers } from 'lucide-react';
import { db, storage } from '../../config/firebase';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const MapManager = () => {
    const [imageFile, setImageFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [processing, setProcessing] = useState(false);
    const [detectionResult, setDetectionResult] = useState(null);
    const [floorName, setFloorName] = useState('');
    const [ocrResult, setOcrResult] = useState(null);
    const canvasRef = useRef(null);

    // AI API URL (Local python server)
    const AI_API_URL = "http://localhost:5000";

    const handleImageSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
            setDetectionResult(null); // Reset previous results
        }
    };

    const processMap = async () => {
        if (!imageFile) return;

        setProcessing(true);
        const formData = new FormData();
        formData.append('image', imageFile);

        try {
            // Call the local Python API
            const response = await fetch(`${AI_API_URL}/detect-roboflow`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.statusText}`);
            }

            const data = await response.json();
            console.log("AI Result:", data);
            setDetectionResult(data);
        } catch (error) {
            console.error("Failed to process map:", error);
            alert("Failed to connect to AI Server. Is 'python AI/run.py' running?");
        } finally {
            setProcessing(false);
        }
    };

    const drawDetections = (ctx, result, scaleX, scaleY) => {
        if (!result || !result.detections) return;

        const { walls, rooms, doors } = result.detections;

        // Draw Rooms
        rooms?.forEach(room => {
            const x = room.position.start.x * scaleX;
            const y = room.position.start.y * scaleY;
            const w = (room.position.end.x - room.position.start.x) * scaleX;
            const h = (room.position.end.y - room.position.start.y) * scaleY;

            ctx.fillStyle = 'rgba(102, 126, 234, 0.3)';
            ctx.strokeStyle = 'rgba(102, 126, 234, 1)';
            ctx.lineWidth = 2;
            ctx.fillRect(x, y, w, h);
            ctx.strokeRect(x, y, w, h);

            // Text
            ctx.fillStyle = '#fff';
            ctx.font = '12px Arial';
            ctx.fillText(room.name || room.class, x + 5, y + 20);
        });

        // Draw Walls
        ctx.strokeStyle = '#ff6b6b';
        ctx.lineWidth = 3;
        walls?.forEach(wall => {
            ctx.beginPath();
            ctx.moveTo(wall.position.start.x * scaleX, wall.position.start.y * scaleY);
            ctx.lineTo(wall.position.end.x * scaleX, wall.position.end.y * scaleY);
            ctx.stroke();
        });

        // Draw Doors
        doors?.forEach(door => {
            const x = door.hinge.x * scaleX;
            const y = door.hinge.y * scaleY;
            const radius = (door.width || 30) * scaleX; // Approximate scaling

            ctx.strokeStyle = '#feca57';
            ctx.fillStyle = 'rgba(254, 202, 87, 0.5)';
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI / 2); // Simple arc
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(x, y, 5, 0, Math.PI * 2); // Hinge
            ctx.fill();
        });
    };

    useEffect(() => {
        if (canvasRef.current && previewUrl) {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            const img = new Image();
            img.onload = () => {
                // Resize logic if needed, but for now map 1:1 or fit
                const maxWidth = 800;
                const scale = maxWidth / img.width; // Scale to fit container
                canvas.width = maxWidth;
                canvas.height = img.height * scale;

                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                if (detectionResult) {
                    // Start Drawing Overlay
                    // Note: Detection coordinates are usually in original image space.
                    // We need to scale them.
                    const serverScaleX = canvas.width / detectionResult.detections.imageSize.width;
                    const serverScaleY = canvas.height / detectionResult.detections.imageSize.height;

                    drawDetections(ctx, detectionResult, serverScaleX, serverScaleY);
                }
            };
            img.src = previewUrl;
        }
    }, [previewUrl, detectionResult]);


    const saveMap = async () => {
        if (!imageFile || !detectionResult || !floorName) {
            alert("Please provide a name, upload an image, and process it first.");
            return;
        }

        setProcessing(true);
        try {
            // 1. Upload Image to Firebase Storage
            const storageRef = ref(storage, `floors/${Date.now()}_${imageFile.name}`);
            await uploadBytes(storageRef, imageFile);
            const downloadURL = await getDownloadURL(storageRef);

            // 2. Save Data to Firestore
            await addDoc(collection(db, "floors"), {
                name: floorName,
                imageUrl: downloadURL,
                width: detectionResult.detections.imageSize.width,
                height: detectionResult.detections.imageSize.height,
                data: detectionResult.detections,
                graph: detectionResult.navigationGraph,
                createdAt: new Date()
            });

            alert("Floor plan saved successfully!");
            setFloorName('');
            setImageFile(null);
            setPreviewUrl(null);
            setDetectionResult(null);

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
                        <h2 className="font-bold text-xl mb-4">2. Process & Details</h2>
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

                        {detectionResult && (
                            <div className="p-4 bg-green-50 rounded-xl border border-green-100 text-green-800 text-sm">
                                <p className="font-bold flex items-center gap-2"><Layers size={16} /> Detection Complete</p>
                                <ul className="mt-2 space-y-1 list-disc list-inside opacity-80">
                                    <li>Rooms: {detectionResult.detections.rooms.length}</li>
                                    <li>Walls: {detectionResult.detections.walls.length}</li>
                                    <li>Doors: {detectionResult.detections.doors.length}</li>
                                </ul>
                            </div>
                        )}
                    </div>

                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                        <h2 className="font-bold text-xl mb-4">3. Save</h2>
                        <Button
                            onClick={saveMap}
                            fullWidth
                            disabled={!detectionResult || !floorName || processing}
                            variant="primary"
                            icon={<Save />}
                        >
                            Save to Database
                        </Button>
                    </div>
                </div>

                {/* Right: Preview */}
                <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-gray-100 p-6 flex items-center justify-center min-h-[500px] bg-gray-50">
                    {previewUrl ? (
                        <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-white">
                            <canvas ref={canvasRef} className="max-w-full h-auto block" />
                        </div>
                    ) : (
                        <div className="text-gray-400 text-center">
                            <Layers size={48} className="mx-auto mb-4 opacity-20" />
                            <p>Upload an image to see the preview</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MapManager;
