import React, { useState } from 'react';
import { Button, Input } from '../components';
import { quickRoutes, floors } from '../data/dummyData';
import { Search, Compass, ScanLine, Navigation } from 'lucide-react';

/**
 * MapPage Component - Refined Layout
 * Fixes: Collapsed bottom area, transparent floor selector, better hierarchy
 */
const MapPage = () => {
    const [selectedFloor, setSelectedFloor] = useState('G');
    const currentFloor = floors.find(f => f.id === selectedFloor);

    return (
        <div className="h-screen bg-[#FAFAFA] relative overflow-hidden flex flex-col">

            {/* Map Layer (Simulated Full Screen) */}
            <div className="absolute inset-0 bg-[#E5E5E5] z-0">
                {/* Placeholder Map Pattern */}
                <div className="absolute inset-0 opacity-10"
                    style={{ backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)', backgroundSize: '30px 30px' }}
                ></div>

                <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                    <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center shadow-2xl mx-auto mb-6">
                        <Compass size={48} className="text-black" />
                    </div>
                    <h2 className="text-display text-black opacity-30">{currentFloor?.name}</h2>
                </div>
            </div>

            {/* Top Floating Bar */}
            <div className="absolute top-16 left-6 right-6 z-20">
                <div className="bg-white rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-2 flex items-center gap-2">
                    <div className="flex-1">
                        <Input
                            placeholder="Where to?"
                            leadingIcon={<Search size={24} />}
                            className="!bg-transparent !h-12 !shadow-none"
                        />
                    </div>
                    <button className="w-12 h-12 bg-black rounded-full flex items-center justify-center text-white shrink-0 shadow-lg active:scale-90 transition-transform">
                        <ScanLine size={20} />
                    </button>
                </div>
            </div>

            {/* Right Side Floor Selector (Transparent/Glass) */}
            <div className="absolute right-6 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-3">
                {floors.map(f => (
                    <button
                        key={f.id}
                        onClick={() => setSelectedFloor(f.id)}
                        className={`
                w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm
                transition-all duration-300 shadow-md backdrop-blur-sm
                ${selectedFloor === f.id
                                ? 'bg-black text-white scale-110 shadow-xl'
                                : 'bg-white/80 text-gray-500 hover:bg-white'}
              `}
                    >
                        {f.id}
                    </button>
                ))}
            </div>

            {/* Bottom Floating Controls (Deconstructed Sheet) */}
            <div className="absolute bottom-[100px] left-0 right-0 z-20 flex flex-col gap-4 px-6 pointer-events-none">

                {/* Quick Chips (Scrollable) */}
                <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide pointer-events-auto items-center justify-center">
                    {quickRoutes.map(route => (
                        <button
                            key={route.id}
                            className="
                   flex-shrink-0 px-5 py-3 rounded-full 
                   bg-white shadow-lg text-sm font-bold text-black border border-white
                   active:scale-95 transition-transform
                 "
                        >
                            {route.name}
                        </button>
                    ))}
                </div>

                {/* Start Navigation Floating Button */}
                <div className="pointer-events-auto">
                    <button className="
                w-full h-16 bg-black rounded-[32px] text-white 
                shadow-[0_8px_30px_rgb(0,0,0,0.3)]
                flex items-center justify-center gap-3 font-bold text-lg
                active:scale-[0.98] transition-all
             ">
                        <Navigation size={24} fill="currentColor" />
                        Start Navigation
                    </button>
                </div>

            </div>

        </div>
    );
};

export default MapPage;
