import React, { useState } from 'react';
import { studentContent, doctorContent } from '../data/dummyData';
import { Input, Button } from '../components';
import { Search, ChevronLeft, Phone, Mail, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const FacultyPage = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');

    // Using studentContent faculty list for now
    const facultyList = studentContent.faculty || [];

    const filteredFaculty = facultyList.filter(prof =>
        prof.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prof.subject.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-[#FAFAFA] pb-32 pt-6 px-6">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <button
                    onClick={() => navigate(-1)}
                    className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100"
                >
                    <ChevronLeft size={24} />
                </button>
                <h1 className="text-display text-black">Faculty</h1>
            </div>

            {/* Search */}
            <div className="mb-8">
                <Input
                    placeholder="Find professors..."
                    leadingIcon={<Search size={24} />}
                    className="!bg-white shadow-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* List */}
            <div className="space-y-4">
                {filteredFaculty.length > 0 ? (
                    filteredFaculty.map((prof) => (
                        <div key={prof.id} className="p-6 bg-white rounded-[32px] shadow-sm border border-gray-100">
                            <div className="flex items-center gap-5 mb-4">
                                <div className="w-16 h-16 bg-black rounded-[20px] flex items-center justify-center text-white text-xl font-bold">
                                    {prof.name.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-black">{prof.name}</h3>
                                    <p className="text-gray-500 font-medium">{prof.subject}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 mb-4">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${prof.available ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {prof.available ? 'Available Now' : 'Busy'}
                                </span>
                                <span className="px-3 py-1 bg-gray-100 rounded-full text-xs font-bold text-gray-500">
                                    {prof.room}
                                </span>
                            </div>

                            <div className="flex gap-3 mt-4 pt-4 border-t border-gray-50">
                                <Button variant="secondary" className="flex-1 !h-12 !text-sm" icon={<Mail size={18} />}>
                                    Email
                                </Button>
                                <Button variant="secondary" className="flex-1 !h-12 !text-sm" icon={<MapPin size={18} />}>
                                    Locate
                                </Button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-10 text-gray-400">
                        <p>No faculty found matching "{searchTerm}"</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FacultyPage;
