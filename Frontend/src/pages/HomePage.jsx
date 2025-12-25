import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { Input, ChatbotBubble } from '../components';
import { studentContent, doctorContent, quickRoutes } from '../data/dummyData';
import { Search, SlidersHorizontal, ArrowRight } from 'lucide-react';
import StudentDashboard from './dashboard/StudentDashboard';
import DoctorDashboard from './dashboard/DoctorDashboard';


/**
 * HomePage Component - Role-Based Routing
 */
const HomePage = () => {
    const navigate = useNavigate();
    const { user, userProfile, currentRole } = useUser();
    const [searchTerm, setSearchTerm] = useState('');

    const content = currentRole === 'doctor' ? doctorContent : studentContent;

    // Search Logic
    const hasSearch = searchTerm.length > 0;
    const allItems = [
        ...(content.faculty || []).map(f => ({ ...f, type: 'Faculty', link: '/faculty' })),
        ...(content.shortcuts || []).map(s => ({ ...s, type: 'Location', link: '/map' })),
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
                        <h1 className="text-display text-black">
                            {userProfile?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'User'}
                        </h1>
                        {currentRole && (
                            <span className="inline-block mt-2 px-3 py-1 bg-gray-100 rounded-full text-[10px] font-bold uppercase tracking-widest text-gray-500">
                                {currentRole} View
                            </span>
                        )}
                    </div>
                    <button
                        onClick={() => navigate('/profile')}
                        className="w-14 h-14 bg-black rounded-full flex items-center justify-center text-white text-xl font-bold shadow-xl overflow-hidden hover:scale-105 transition-transform"
                    >
                        {userProfile?.name ? (
                            userProfile.name.charAt(0).toUpperCase()
                        ) : (
                            <div className="w-full h-full bg-gray-300 animate-pulse"></div>
                        )}
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

            {/* Search Results Overlay */}
            {hasSearch ? (
                <div className="px-6 pt-6 space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
                    {searchResults.length > 0 ? (
                        searchResults.map((result, idx) => (
                            <div
                                key={idx}
                                onClick={() => navigate(result.link)}
                                className="p-6 bg-white rounded-[32px] shadow-sm border border-gray-50 flex items-center justify-between active:scale-[0.98] transition-transform cursor-pointer group"
                            >
                                <div>
                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">{result.type}</span>
                                    <h3 className="text-lg font-bold text-black mt-1">{result.name || result.title}</h3>
                                </div>
                                <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center group-hover:bg-black group-hover:text-white transition-colors">
                                    <ArrowRight size={20} />
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
                /* Role-Based Dashboard Logic */
                currentRole === 'doctor' ? (
                    <DoctorDashboard user={user} userProfile={userProfile} />
                ) : (
                    <StudentDashboard
                        user={user}
                        userProfile={userProfile}
                        searchTerm={searchTerm}
                        setSearchTerm={setSearchTerm}
                    />
                )
            )}

            {/* AI Chatbot Floating Bubble */}
            <ChatbotBubble />
        </div>
    );
};

export default HomePage;
