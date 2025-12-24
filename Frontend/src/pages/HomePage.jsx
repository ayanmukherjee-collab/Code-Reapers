import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { Card, Input, ChatbotBubble } from '../components';
import { studentContent, doctorContent, quickRoutes } from '../data/dummyData';
import { Search, SlidersHorizontal, ChevronRight, GraduationCap, Users, Bell, MapPin, Activity, ArrowRight } from 'lucide-react';

/**
 * HomePage Component - Refined Layout & Global Search
 * Search Filters: Faculty, Clubs, Locations, Events
 */
const HomePage = () => {
    const navigate = useNavigate();
    const { user, currentRole } = useUser();
    const content = currentRole === 'doctor' ? doctorContent : studentContent;
    const [searchTerm, setSearchTerm] = useState('');

    // Global Search Logic
    const hasSearch = searchTerm.length > 0;

    // Aggregate searchable items
    const allItems = [
        ...(content.faculty || []).map(f => ({ ...f, type: 'Faculty', link: '/faculty' })),
        ...(content.shortcuts || []).map(s => ({ ...s, type: 'Location', link: '/map' })), // Generic Map Link
        ...(content.activities || []).map(a => ({ ...a, name: a.title, type: 'Event', link: '/schedule' })),
        ...(quickRoutes || []).map(r => ({ ...r, type: 'Quick Route', link: '/map' })),
    ];

    const searchResults = hasSearch
        ? allItems.filter(item =>
            item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.type.toLowerCase().includes(searchTerm.toLowerCase())
        )
        : [];

    return (
        <div className="min-h-screen bg-[#FAFAFA] pb-32">
            {/* Header Section */}
            <header className="px-6 pt-16 pb-8 bg-white rounded-b-[40px] shadow-sm relative z-20">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <p className="text-gray-400 text-sm font-bold tracking-widest uppercase mb-1">Good Morning</p>
                        <h1 className="text-display text-black">{user.name?.split(' ')[0]}</h1>
                    </div>
                    <button
                        onClick={() => navigate('/profile')}
                        className="w-14 h-14 bg-black rounded-full flex items-center justify-center text-white text-xl font-bold shadow-xl"
                    >
                        {user.name?.charAt(0)}
                    </button>
                </div>

                {/* Global Search Input */}
                <Input
                    placeholder={`Search ${currentRole === 'student' ? 'campus...' : 'wards...'}`}
                    leadingIcon={<Search size={24} />}
                    trailingIcon={<SlidersHorizontal size={20} />}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </header>

            {/* Search Results Overlay or List */}
            {hasSearch ? (
                <div className="px-6 pt-6 space-y-4">
                    {searchResults.length > 0 ? (
                        searchResults.map((result, idx) => (
                            <div
                                key={idx}
                                onClick={() => navigate(result.link)}
                                className="p-6 bg-white rounded-[32px] shadow-sm border border-gray-50 flex items-center justify-between active:scale-[0.98] transition-transform cursor-pointer"
                            >
                                <div>
                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">{result.type}</span>
                                    <h3 className="text-lg font-bold text-black mt-1">{result.name || result.title}</h3>
                                </div>
                                <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center">
                                    <ArrowRight size={20} className="text-black" />
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-10 text-gray-400 font-medium">
                            No results found for "{searchTerm}"
                        </div>
                    )}
                </div>
            ) : (
                /* Default Content (Only shown when not searching) */
                <main className="space-y-6 pt-8 px-6">

                    {/* Navigation Cards (Faculty & Clubs for Students) */}
                    {currentRole === 'student' && (
                        <>
                            {/* Faculty Card */}
                            <button
                                onClick={() => navigate('/faculty')}
                                className="w-full bg-white p-8 rounded-[32px] shadow-sm border border-gray-50 flex items-center justify-between active:scale-[0.98] transition-transform"
                            >
                                <div className="flex items-center gap-6">
                                    <div className="w-16 h-16 bg-black rounded-[24px] flex items-center justify-center text-white shadow-lg">
                                        <GraduationCap size={32} />
                                    </div>
                                    <div className="text-left">
                                        <h2 className="text-title text-black">Faculty</h2>
                                        <p className="text-gray-500 font-medium mt-1">Directory & Availability</p>
                                    </div>
                                </div>
                                <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center">
                                    <ChevronRight size={24} className="text-gray-400" />
                                </div>
                            </button>

                            {/* Clubs Card */}
                            <button
                                onClick={() => navigate('/clubs')}
                                className="w-full bg-white p-8 rounded-[32px] shadow-sm border border-gray-50 flex items-center justify-between active:scale-[0.98] transition-transform"
                            >
                                <div className="flex items-center gap-6">
                                    <div className="w-16 h-16 bg-black rounded-[24px] flex items-center justify-center text-white shadow-lg">
                                        <Users size={32} />
                                    </div>
                                    <div className="text-left">
                                        <h2 className="text-title text-black">Clubs</h2>
                                        <p className="text-gray-500 font-medium mt-1">Events & Memberships</p>
                                    </div>
                                </div>
                                <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center">
                                    <ChevronRight size={24} className="text-gray-400" />
                                </div>
                            </button>
                        </>
                    )}

                    {/* Doctor Specific Navigation */}
                    {currentRole === 'doctor' && (
                        <section>
                            <div className="flex items-center justify-between mb-5">
                                <h2 className="text-title text-black">Active Wards</h2>
                            </div>
                            <div className="flex w-full gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x -mx-6 px-6">
                                {content.wards.map((ward) => (
                                    <div
                                        key={ward.id}
                                        className="snap-center flex-shrink-0 w-[280px] p-6 bg-black rounded-[32px] text-white shadow-xl"
                                    >
                                        <div className="flex justify-between items-start mb-8">
                                            <div className="p-3 bg-white/10 rounded-2xl">
                                                <Activity size={24} />
                                            </div>
                                            <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-bold">
                                                Floor {ward.floor}
                                            </span>
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-bold mb-1">{ward.name}</h3>
                                            <p className="text-gray-400 mb-4">{ward.patients} Patients</p>
                                            <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                                                <div className="bg-white h-full" style={{ width: '80%' }}></div>
                                            </div>
                                            <p className="text-xs text-gray-400 mt-2 text-right">{ward.available} beds available</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Recent Activity Feed */}
                    <section className="pt-4">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-title text-black">Updates</h2>
                            <Bell size={24} className="text-black" />
                        </div>

                        <div className="space-y-4">
                            {content.activities.map((activity) => (
                                <div
                                    key={activity.id}
                                    className="p-6 bg-white rounded-[32px] shadow-sm border border-gray-50"
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <span className="px-3 py-1 bg-gray-100 rounded-full text-xs font-bold uppercase text-gray-500">
                                            {activity.time}
                                        </span>
                                    </div>
                                    <h3 className="text-xl font-bold text-black mb-2 leading-tight">
                                        {activity.title}
                                    </h3>
                                    <p className="text-gray-500 font-medium leading-relaxed mb-4">
                                        {activity.description}
                                    </p>
                                    <div className="flex items-center gap-2 text-gray-400">
                                        <MapPin size={16} />
                                        <span className="text-sm font-bold">{activity.location}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </main>
            )}

            {/* AI Chatbot Floating Bubble */}
            <ChatbotBubble />
        </div>
    );
};

export default HomePage;
