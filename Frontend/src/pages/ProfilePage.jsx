import React from 'react';
import { useUser } from '../context/UserContext';
import { Button } from '../components';
import { Settings, Shield, ChevronRight, LogOut, Check } from 'lucide-react';

/**
 * ProfilePage Component - Radical Redesign
 * Huge Avatar, Chunky List Items
 */
const ProfilePage = () => {
    const { user, currentRole, availableRoles, switchRole, settings, updateSettings } = useUser();

    return (
        <div className="min-h-screen bg-[#FAFAFA] pb-32 px-6 pt-20">

            {/* Profile Header */}
            <div className="flex flex-col items-center mb-12">
                <div className="w-32 h-32 bg-black rounded-full flex items-center justify-center text-white text-5xl font-bold shadow-2xl mb-6 ring-8 ring-white">
                    {user.name.charAt(0)}
                </div>
                <h1 className="text-display text-black text-center mb-1">{user.name}</h1>
                <span className="px-6 py-2 bg-gray-200 rounded-full text-sm font-extrabold uppercase tracking-widest text-gray-600">
                    {user.role} &bull; {user.department}
                </span>
            </div>

            {/* Role Switcher */}
            <div className="bg-white p-2 rounded-[32px] shadow-sm mb-8 flex">
                {availableRoles.map(role => (
                    <button
                        key={role}
                        onClick={() => switchRole(role)}
                        className={`
                 flex-1 py-4 text-center rounded-[24px] font-bold text-lg
                 transition-all duration-300
                 ${currentRole === role ? 'bg-black text-white shadow-lg' : 'text-gray-400 hover:text-black'}
               `}
                    >
                        {role.charAt(0).toUpperCase() + role.slice(1)}
                    </button>
                ))}
            </div>

            {/* Settings List */}
            <div className="space-y-4 mb-10">
                <h2 className="text-title text-black px-2">Settings</h2>

                {/* Toggle Item 1 */}
                <div
                    className="p-6 bg-white rounded-[32px] flex items-center justify-between shadow-sm active:scale-98 transition-transform cursor-pointer"
                    onClick={() => updateSettings('offlineMaps', !settings.offlineMaps)}
                >
                    <div>
                        <h3 className="text-xl font-bold text-black">Offline Maps</h3>
                        <p className="text-gray-500 font-medium mt-1">Download for use without WiFi</p>
                    </div>
                    <div className={`
               w-16 h-10 rounded-full p-1 transition-colors duration-300
               ${settings.offlineMaps ? 'bg-black' : 'bg-gray-200'}
            `}>
                        <div className={`
                  w-8 h-8 bg-white rounded-full shadow-md transform transition-transform duration-300
                  ${settings.offlineMaps ? 'translate-x-6' : 'translate-x-0'}
               `}></div>
                    </div>
                </div>

                {/* Toggle Item 2 */}
                <div
                    className="p-6 bg-white rounded-[32px] flex items-center justify-between shadow-sm active:scale-98 transition-transform cursor-pointer"
                    onClick={() => updateSettings('accessibilityMode', !settings.accessibilityMode)}
                >
                    <div>
                        <h3 className="text-xl font-bold text-black">Accessibility</h3>
                        <p className="text-gray-500 font-medium mt-1">Avoid stairs, prefer elevators</p>
                    </div>
                    <div className={`
               w-16 h-10 rounded-full p-1 transition-colors duration-300
               ${settings.accessibilityMode ? 'bg-black' : 'bg-gray-200'}
            `}>
                        <div className={`
                  w-8 h-8 bg-white rounded-full shadow-md transform transition-transform duration-300
                  ${settings.accessibilityMode ? 'translate-x-6' : 'translate-x-0'}
               `}></div>
                    </div>
                </div>
            </div>

            <Button fullWidth variant="secondary" className="!h-16 text-lg" icon={<LogOut size={24} />}>
                Sign Out
            </Button>

        </div>
    );
};

export default ProfilePage;
