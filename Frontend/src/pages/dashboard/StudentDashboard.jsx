import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Input } from '../../components';
import { studentContent, quickRoutes } from '../../data/dummyData';
import { Search, SlidersHorizontal, ChevronRight, GraduationCap, Users, Bell, MapPin, ArrowRight } from 'lucide-react';

const StudentDashboard = ({ user, userProfile, searchTerm, setSearchTerm }) => {
    const navigate = useNavigate();
    const content = studentContent;

    // Search Logic (Passed from parent or handled locally if fully isolated, but for now assuming Search is in Header which is common)
    // Actually, based on HomePage, the search and header were part of the page. 
    // I will keep the specific content here.

    return (
        <main className="space-y-6 pt-8 px-6">
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
    );
};

export default StudentDashboard;
