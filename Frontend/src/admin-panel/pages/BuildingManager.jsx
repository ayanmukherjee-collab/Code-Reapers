import React, { useState } from 'react';
import { useAdmin } from '../context/AdminContext';
import { Building2, Plus, MapPin, Search, ArrowLeft, Layers } from 'lucide-react';
import { Input, Card } from '../../components';
import FloorMapUploader from '../components/FloorMapUploader';

const BuildingManager = () => {
    const { buildings, addBuilding } = useAdmin();
    const [showAddModal, setShowAddModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // View State
    const [selectedBuilding, setSelectedBuilding] = useState(null);

    // Form State
    const [newBuilding, setNewBuilding] = useState({ name: '', code: '', floors: 1 });

    const handleAdd = (e) => {
        e.preventDefault();
        if (newBuilding.name && newBuilding.code) {
            addBuilding(newBuilding);
            setNewBuilding({ name: '', code: '', floors: 1 });
            setShowAddModal(false);
        }
    };

    const filteredBuildings = buildings.filter(b =>
        b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Render Floors List for Selected Building
    const renderBuildingDetails = () => {
        const floorList = Array.from({ length: selectedBuilding.floors }, (_, i) => ({
            floorNumber: i + 1, // Assume floors start at 1 or G? Let's say 1 for now.
            name: `Floor ${i + 1}`
        }));

        return (
            <div className="animate-in fade-in slide-in-from-right duration-300">
                <button
                    onClick={() => setSelectedBuilding(null)}
                    className="flex items-center gap-2 text-gray-400 hover:text-black mb-6 transition-colors"
                >
                    <ArrowLeft size={20} />
                    Back to Buildings
                </button>

                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold">{selectedBuilding.name}</h1>
                        <p className="text-gray-500 flex items-center gap-2 mt-1">
                            <span className="bg-black text-white px-2 py-0.5 rounded text-xs font-bold">{selectedBuilding.code}</span>
                            <span>{selectedBuilding.floors} Floors Defined</span>
                        </p>
                    </div>
                </div>

                {/* Floors Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
                    {floorList.map((floor) => (
                        <div key={floor.floorNumber} className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center font-bold text-gray-600">
                                    {floor.floorNumber}
                                </div>
                                <h3 className="text-lg font-bold">{floor.name}</h3>
                            </div>

                            {/* Map Uploader Component */}
                            <FloorMapUploader
                                buildingId={selectedBuilding.id}
                                floorNumber={floor.floorNumber}
                                onSaveComplete={(id) => console.log(`Map saved for floor ${floor.floorNumber} ID: ${id}`)}
                            />
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    if (selectedBuilding) {
        return <div className="space-y-8">{renderBuildingDetails()}</div>;
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-black">Building Manager</h1>
                    <p className="text-gray-500 mt-1">Manage campus infrastructure and floor plans.</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-2xl font-bold hover:scale-105 transition-transform shadow-xl"
                >
                    <Plus size={20} />
                    Add Building
                </button>
            </div>

            {/* Search */}
            <Input
                placeholder="Search buildings..."
                leadingIcon={<Search size={20} />}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />

            {/* Grid */}
            {filteredBuildings.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredBuildings.map((building) => (
                        <div key={building.id} className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm hover:shadow-md transition-shadow group flex flex-col justify-between">
                            <div>
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-gray-100 text-black rounded-2xl group-hover:bg-black group-hover:text-white transition-colors">
                                        <Building2 size={24} />
                                    </div>
                                    <span className="px-3 py-1 bg-gray-100 rounded-full text-xs font-bold uppercase text-gray-500">
                                        {building.code}
                                    </span>
                                </div>
                                <h3 className="text-xl font-bold text-black mb-1">{building.name}</h3>
                                <div className="flex items-center gap-2 text-gray-400 mb-4">
                                    <MapPin size={16} />
                                    <span className="text-sm font-medium">{building.floors} Floors</span>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedBuilding(building)}
                                className="w-full py-3 bg-gray-50 text-black font-bold rounded-xl hover:bg-black hover:text-white transition-colors mt-4"
                            >
                                Manage Floors & Maps
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 bg-white rounded-[32px] border border-dashed border-gray-200">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                        <Building2 size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">No Buildings Found</h3>
                    <p className="text-gray-500 mt-2">Get started by adding your first building.</p>
                </div>
            )}

            {/* Add Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white p-8 rounded-[32px] shadow-2xl w-full max-w-md scale-100 animate-in zoom-in-95 duration-200">
                        <h2 className="text-2xl font-bold mb-6">Add New Building</h2>
                        <form onSubmit={handleAdd} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Building Name</label>
                                <Input
                                    placeholder="e.g. Science Block"
                                    value={newBuilding.name}
                                    onChange={(e) => setNewBuilding({ ...newBuilding, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Building Code</label>
                                <Input
                                    placeholder="e.g. SC-01"
                                    value={newBuilding.code}
                                    onChange={(e) => setNewBuilding({ ...newBuilding, code: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Number of Floors</label>
                                <Input
                                    type="number"
                                    min="1"
                                    value={newBuilding.floors}
                                    onChange={(e) => setNewBuilding({ ...newBuilding, floors: parseInt(e.target.value) })}
                                    required
                                />
                            </div>
                            <div className="flex gap-4 mt-8">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="flex-1 py-4 bg-gray-100 text-gray-600 font-bold rounded-2xl hover:bg-gray-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-4 bg-black text-white font-bold rounded-2xl hover:scale-105 transition-transform"
                                >
                                    Create Building
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BuildingManager;
