import React, { useState } from 'react';
import { Input, Button } from '../components';
import { Search, ChevronLeft, Users, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ClubsPage = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');

    const clubs = [
        { id: 1, name: 'Tech Club', members: 120, nextEvent: 'AI Workshop' },
        { id: 2, name: 'Photography', members: 45, nextEvent: 'Photo Walk' },
        { id: 3, name: 'Debate Society', members: 30, nextEvent: 'Open Mic' },
        { id: 4, name: 'Robotics', members: 85, nextEvent: 'Bot Warz' },
    ];

    const filteredClubs = clubs.filter(club =>
        club.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        club.nextEvent.toLowerCase().includes(searchTerm.toLowerCase())
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
                <h1 className="text-display text-black">Clubs</h1>
            </div>

            {/* Search */}
            <div className="mb-8">
                <Input
                    placeholder="Find clubs..."
                    leadingIcon={<Search size={24} />}
                    className="!bg-white shadow-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* List */}
            <div className="grid grid-cols-1 gap-4">
                {filteredClubs.length > 0 ? (
                    filteredClubs.map((club) => (
                        <div key={club.id} className="p-6 bg-white rounded-[32px] shadow-sm border border-gray-100 flex items-center justify-between">
                            <div className="flex items-center gap-5">
                                <div className="w-16 h-16 bg-black rounded-[20px] flex items-center justify-center text-white">
                                    <Users size={28} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-black">{club.name}</h3>
                                    <p className="text-gray-500 font-medium">{club.members} Members</p>
                                </div>
                            </div>

                            <div className="text-right">
                                <span className="block text-xs font-bold uppercase text-gray-400 mb-1">Next Event</span>
                                <span className="inline-block px-3 py-1 bg-gray-100 rounded-full text-xs font-bold text-black">
                                    {club.nextEvent}
                                </span>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-10 text-gray-400">
                        <p>No clubs found.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ClubsPage;
