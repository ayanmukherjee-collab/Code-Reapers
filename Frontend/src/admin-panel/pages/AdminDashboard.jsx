import React from 'react';
import { useAdmin } from '../context/AdminContext';
import { Building2, Users, Calendar, Radio, Plus, ArrowRight, Activity, TrendingUp, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
    const { organization, buildings, personnel } = useAdmin();
    const navigate = useNavigate();

    if (!organization) return null;

    const stats = [
        { label: 'Total Buildings', value: buildings.length, icon: Building2, color: 'bg-black' },
        { label: 'Personnel', value: personnel.length, icon: Users, color: 'bg-black' },
        { label: 'Active Alerts', value: '0', icon: Radio, color: 'bg-black' },
        { label: 'Events Today', value: '0', icon: Calendar, color: 'bg-black' },
    ];

    const quickActions = [
        { label: 'Add Building', icon: Plus, action: () => navigate('/admin/buildings') },
        { label: 'Manage Staff', icon: Users, action: () => navigate('/admin/personnel') },
        { label: 'Create Alert', icon: Radio, action: () => navigate('/admin/broadcast') },
        { label: 'Manage Organization', icon: Settings, action: () => navigate('/admin/setup') },
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header / Welcome */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-black">{organization.name}</h1>
                    <p className="text-gray-500 mt-1 flex items-center gap-2">
                        <span className="capitalize px-3 py-1 bg-black text-white text-xs rounded-full">{organization.type}</span>
                        <span>Dashboard Overview</span>
                    </p>
                </div>
                <div className="flex items-center gap-2 bg-gray-100 text-black px-4 py-2 rounded-full text-sm font-bold">
                    <div className="w-2 h-2 bg-black rounded-full animate-pulse"></div>
                    System Operational
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {stats.map((stat, idx) => (
                    <div key={idx} className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm hover:shadow-md transition-shadow group">
                        <div className={`w-10 h-10 ${stat.color} rounded-full flex items-center justify-center text-white mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                            <stat.icon size={20} />
                        </div>
                        <h3 className="text-4xl font-bold text-black mb-1">{stat.value}</h3>
                        <p className="text-gray-400 text-sm font-medium uppercase tracking-wide">{stat.label}</p>
                    </div>
                ))}
            </div>

            {/* Main Content Split */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left Column: Quick Actions & Recent */}
                <div className="lg:col-span-2 space-y-8">

                    {/* Quick Actions */}
                    <div className="bg-black text-white p-8 rounded-[32px] relative overflow-hidden shadow-2xl">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-gray-800 rounded-full blur-3xl -mr-20 -mt-20 opacity-50"></div>
                        <h2 className="text-xl font-bold mb-6 relative z-10">Quick Actions</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 relative z-10">
                            {quickActions.map((action, idx) => (
                                <button
                                    key={idx}
                                    onClick={action.action}
                                    className="flex items-center gap-3 p-4 bg-white/10 hover:bg-white/20 rounded-2xl backdrop-blur-sm transition-colors text-left group"
                                >
                                    <div className="w-10 h-10 bg-white text-black rounded-full flex items-center justify-center group-hover:scale-105 transition-transform">
                                        <action.icon size={20} />
                                    </div>
                                    <span className="font-medium">{action.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Recent Activity Placeholder */}
                    <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-black">Recent Activity</h2>
                            <button className="text-sm font-bold text-gray-400 hover:text-black transition-colors">View All</button>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-2xl">
                                <div className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center flex-shrink-0">
                                    <Activity size={20} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-black">System Initialized</h4>
                                    <p className="text-sm text-gray-500">The organization dashboard was successfully set up.</p>
                                    <span className="text-xs text-gray-400 mt-2 block">Just now</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: System Status / Insights */}
                <div className="space-y-8">
                    <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm h-full">
                        <h2 className="text-xl font-bold text-black mb-6">Insights</h2>
                        <div className="flex flex-col gap-6">
                            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                <div className="flex items-center gap-2 text-black font-bold mb-2">
                                    <TrendingUp size={18} />
                                    <span>Growth</span>
                                </div>
                                <p className="text-3xl font-bold text-black">0%</p>
                                <p className="text-sm text-gray-500">User growth this week</p>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                <p className="text-sm text-gray-400 mb-2">Storage Used</p>
                                <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden mb-2">
                                    <div className="bg-black h-full w-[5%]"></div>
                                </div>
                                <p className="text-sm font-bold text-black">5% <span className="text-gray-400 font-normal">of 1GB</span></p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
