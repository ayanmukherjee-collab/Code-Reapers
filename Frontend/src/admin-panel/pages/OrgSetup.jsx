import React, { useState, useEffect } from 'react';
import { useAdmin } from '../context/AdminContext';
import { Building2, Activity, Briefcase, Check, Plus, X, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const OrgSetup = () => {
    const { createOrganization, user, organization } = useAdmin();
    const navigate = useNavigate();

    const [name, setName] = useState('');
    const [selectedType, setSelectedType] = useState(null);
    const [positions, setPositions] = useState([]);
    const [newPosition, setNewPosition] = useState('');
    const [loading, setLoading] = useState(false);

    // Redirect if already has org
    useEffect(() => {
        if (organization) {
            navigate('/admin'); // or where the dashboard home is
        }
    }, [organization, navigate]);

    const options = [
        { id: 'college', label: 'College / University', icon: Building2, desc: 'Students, Faculty, Staff' },
        { id: 'hospital', label: 'Hospital / Clinic', icon: Activity, desc: 'Doctors, Nurses, Patients' },
        { id: 'business', label: 'Corporate Office', icon: Briefcase, desc: 'Employees, Managers, Clients' },
    ];

    const templates = {
        college: ['Student', 'Faculty', 'Staff', 'Admin'],
        hospital: ['Doctor', 'Nurse', 'Patient', 'Admin'],
        business: ['Employee', 'Manager', 'Admin']
    };

    const handleTypeSelect = (typeId) => {
        setSelectedType(typeId);
        setPositions(templates[typeId] || []);
    };

    const addPosition = () => {
        if (newPosition.trim()) {
            setPositions([...positions, newPosition.trim()]);
            setNewPosition('');
        }
    };

    const removePosition = (index) => {
        setPositions(positions.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        if (!name || !selectedType || positions.length === 0) return;
        setLoading(true);
        try {
            await createOrganization({
                name,
                type: selectedType,
                positions
            });
            // Context update will trigger redirect or we can force it
            navigate('/admin');
        } catch (error) {
            console.error("Failed to create org", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto pt-10 pb-20">
            <h1 className="text-4xl font-bold text-black mb-2">Welcome, {user?.displayName || 'Admin'}.</h1>
            <p className="text-xl text-gray-500 mb-10">Let's set up your organization.</p>

            {/* Step 1: Name */}
            <div className="mb-12">
                <label className="block text-lg font-semibold mb-3">1. Organization Name</label>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Harvard University"
                    className="w-full text-2xl p-4 border-b-2 border-gray-200 focus:border-black outline-none bg-transparent transition-colors"
                />
            </div>

            {/* Step 2: Type */}
            <div className="mb-12">
                <label className="block text-lg font-semibold mb-4">2. Organization Type</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {options.map((opt) => (
                        <button
                            key={opt.id}
                            onClick={() => handleTypeSelect(opt.id)}
                            className={`
                                group relative p-6 rounded-[24px] border-2 text-left transition-all duration-300
                                ${selectedType === opt.id
                                    ? 'border-black bg-black text-white shadow-xl scale-105'
                                    : 'border-gray-100 bg-white hover:border-gray-200'}
                            `}
                        >
                            <div className={`
                                w-12 h-12 rounded-xl flex items-center justify-center mb-4
                                ${selectedType === opt.id ? 'bg-white/20' : 'bg-gray-50 text-black'}
                            `}>
                                <opt.icon size={24} />
                            </div>
                            <h3 className="text-lg font-bold mb-1">{opt.label}</h3>
                            <p className={`text-xs ${selectedType === opt.id ? 'text-gray-400' : 'text-gray-500'}`}>{opt.desc}</p>

                            {selectedType === opt.id && (
                                <div className="absolute top-4 right-4 text-white">
                                    <Check size={16} strokeWidth={4} />
                                </div>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Step 3: Positions */}
            {selectedType && (
                <div className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <label className="block text-lg font-semibold mb-4">3. Define Positions / Roles</label>
                    <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm">
                        <div className="flex flex-wrap gap-2 mb-4">
                            {positions.map((pos, idx) => (
                                <div key={idx} className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full text-sm font-medium">
                                    {pos}
                                    <button onClick={() => removePosition(idx)} className="hover:text-red-500">
                                        <X size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>

                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newPosition}
                                onChange={(e) => setNewPosition(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && addPosition()}
                                placeholder="Add another position..."
                                className="flex-1 px-4 py-3 bg-gray-50 rounded-xl outline-none focus:ring-2 ring-black/5"
                            />
                            <button
                                onClick={addPosition}
                                className="px-4 py-3 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors"
                            >
                                <Plus size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Submit */}
            <div className="flex justify-end">
                <button
                    onClick={handleSubmit}
                    disabled={!name || !selectedType || loading}
                    className={`
                        flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-lg transition-all
                        ${(!name || !selectedType || loading)
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : 'bg-black text-white hover:scale-105 shadow-xl'}
                    `}
                >
                    {loading ? 'Creating...' : 'Create Organization'}
                    {!loading && <ArrowRight size={20} />}
                </button>
            </div>
        </div>
    );
};

export default OrgSetup;
