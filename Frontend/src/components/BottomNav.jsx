import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Map, Calendar, User } from 'lucide-react';

/**
 * BottomNav Component - Refined
 * White Theme, Soft Shadow, Minimalist
 */
const BottomNav = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const currentPath = location.pathname;

    const tabs = [
        { id: 'home', path: '/', icon: Home },
        { id: 'map', path: '/map', icon: Map },
        { id: 'schedule', path: '/schedule', icon: Calendar },
        { id: 'profile', path: '/profile', icon: User },
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 px-6 pb-8 pt-4 pointer-events-none">
            <div className="pointer-events-auto bg-white rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.12)] mx-auto max-w-sm h-[72px] flex items-center justify-around px-2 border border-gray-100">
                {tabs.map((tab) => {
                    const isActive = currentPath === tab.path;
                    const Icon = tab.icon;

                    return (
                        <button
                            key={tab.id}
                            onClick={() => navigate(tab.path)}
                            className={`
                relative flex items-center justify-center
                w-16 h-16 rounded-full
                transition-all duration-300
                ${isActive ? 'bg-gray-50' : 'bg-transparent'}
              `}
                        >
                            <Icon
                                size={26}
                                strokeWidth={isActive ? 2.5 : 2}
                                className={`transition-colors duration-300 ${isActive ? 'text-black' : 'text-gray-400'}`}
                            />
                            {isActive && (
                                <span className="absolute bottom-2 w-1 h-1 bg-black rounded-full" />
                            )}
                        </button>
                    );
                })}
            </div>
        </nav>
    );
};

export default BottomNav;
