import React from 'react';
import FloorPlanNavigator from './FloorPlanNavigator';

/**
 * FloorPlanScanner Page
 * 
 * A dedicated page for scanning and navigating floor plans.
 * Uses unified detection + A* pathfinding.
 */
const FloorPlanScanner = () => {
    return (
        <div className="min-h-screen bg-gray-900">
            {/* Header */}
            <header className="bg-gray-800 shadow-lg">
                <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
                    <h1 className="text-xl font-bold text-white">LocAlte</h1>
                    <button
                        onClick={() => window.navigateTo('home')}
                        className="text-gray-400 hover:text-white transition-colors text-sm"
                    >
                        ← Back to Home
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <FloorPlanNavigator />

            {/* Footer */}
            <footer className="bg-gray-800 py-3 mt-4">
                <div className="max-w-7xl mx-auto px-4 text-center text-gray-500 text-sm">
                    OpenCV Detection + A* Pathfinding • Indoor Navigation v3.0
                </div>
            </footer>
        </div>
    );
};

export default FloorPlanScanner;
