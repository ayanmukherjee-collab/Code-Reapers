import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Building2, Users, Calendar, Radio, LogOut, Settings } from 'lucide-react';

const AdminLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const menuItems = [
        { id: 'dashboard', label: 'Home', icon: LayoutDashboard, path: '/admin' },
        { id: 'buildings', label: 'Builds', icon: Building2, path: '/admin/buildings' },
        { id: 'personnel', label: 'Users', icon: Users, path: '/admin/personnel' },
        { id: 'schedule', label: 'Plan', icon: Calendar, path: '/admin/schedule' },
        { id: 'broadcast', label: 'Alerts', icon: Radio, path: '/admin/broadcast' },
    ];

    return (
        <div className="flex h-screen bg-[#FAFAFA] flex-col md:flex-row relative">

            {/* Desktop Sidebar (Hidden on Mobile) */}
            <aside className="hidden md:flex w-64 bg-black text-white flex-col pt-8 pb-6 px-4 shadow-2xl z-20">
                <div className="mb-10 px-2">
                    <h1 className="text-2xl font-bold tracking-tighter">Campus<span className="text-gray-400">Admin</span></h1>
                    <p className="text-xs text-gray-500 mt-1">v2.0 dashboard</p>
                </div>

                <nav className="flex-1 space-y-2">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;
                        return (
                            <button
                                key={item.id}
                                onClick={() => navigate(item.path)}
                                className={`
                                    w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-200
                                    ${isActive ? 'bg-white text-black font-bold' : 'text-gray-400 hover:bg-white/10 hover:text-white'}
                                `}
                            >
                                <Icon size={20} />
                                <span>{item.label === 'Home' ? 'Dashboard' : item.label === 'Builds' ? 'Buildings' : item.label === 'Users' ? 'Personnel' : item.label === 'Plan' ? 'Schedule' : 'Broadcast'}</span>
                            </button>
                        );
                    })}
                </nav>

                <div className="mt-auto pt-6 border-t border-white/10 space-y-2">
                    <button onClick={() => navigate('/')} className="w-full flex items-center gap-4 px-4 py-3 text-gray-400 hover:text-white transition-colors">
                        <LogOut size={20} />
                        <span>Exit Admin</span>
                    </button>
                </div>
            </aside>

            {/* Mobile Header (Hidden on Desktop) */}
            <div className="md:hidden flex items-center justify-between px-6 pt-6 pb-2 z-10">
                <div>
                    <h1 className="text-xl font-bold tracking-tighter">Campus<span className="text-gray-400">Admin</span></h1>
                </div>
                <button
                    onClick={() => navigate('/')}
                    className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-gray-600 active:bg-gray-100"
                >
                    <LogOut size={18} />
                </button>
            </div>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto relative pb-32 md:pb-0">
                <div className="p-6 md:p-8 max-w-7xl mx-auto">
                    <Outlet />
                </div>
            </main>

            {/* Mobile Bottom Nav (Capsule) */}
            <nav className="md:hidden fixed bottom-6 left-0 right-0 z-50 px-6 pointer-events-none">
                <div className="pointer-events-auto bg-white rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.12)] mx-auto max-w-sm h-[72px] flex items-center justify-around px-2 border border-gray-100">
                    {menuItems.map((tab) => {
                        const isActive = location.pathname === tab.path;
                        const Icon = tab.icon;

                        return (
                            <button
                                key={tab.id}
                                onClick={() => navigate(tab.path)}
                                className={`
                                    relative flex flex-col items-center justify-center
                                    w-14 h-14 rounded-full
                                    transition-all duration-300
                                    ${isActive ? 'bg-gray-50' : 'bg-transparent'}
                                `}
                            >
                                <Icon
                                    size={24}
                                    strokeWidth={isActive ? 2.5 : 2}
                                    className={`transition-colors duration-300 ${isActive ? 'text-black' : 'text-gray-400'}`}
                                />
                            </button>
                        );
                    })}
                </div>
            </nav>
        </div>
    );
};

export default AdminLayout;
