import React from 'react';
import { Bath, LogOut, Building2, Coffee } from 'lucide-react';

/**
 * QuickRoute Component
 * FIXED: Better visual weight for chips
 */
const QuickRoute = ({ routes, onRouteSelect }) => {
    const getIcon = (type) => {
        const iconProps = { size: 16, strokeWidth: 2.5 };
        switch (type) {
            case 'restroom': return <Bath {...iconProps} />;
            case 'exit': return <LogOut {...iconProps} />;
            case 'reception': return <Building2 {...iconProps} />;
            case 'cafeteria': return <Coffee {...iconProps} />;
            default: return <Building2 {...iconProps} />;
        }
    };

    return (
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1">
            {routes.map((route) => (
                <button
                    key={route.id}
                    onClick={() => onRouteSelect(route)}
                    className="
            flex-shrink-0 flex items-center gap-2
            px-4 py-2.5 bg-white rounded-xl
            border border-gray-200 shadow-sm
            hover:border-black hover:shadow-md
            transition-all duration-200 active:scale-95
            text-sm font-semibold text-black
          "
                >
                    <span className="text-gray-500">{getIcon(route.type)}</span>
                    {route.name}
                </button>
            ))}
        </div>
    );
};

export default QuickRoute;
