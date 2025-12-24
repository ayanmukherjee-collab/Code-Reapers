import React from 'react';
import { ChevronRight } from 'lucide-react';

/**
 * ActivityCard Component
 * FIXED: Proper padding, better visual hierarchy
 */
const ActivityCard = ({ activity, onClick, showDivider = true }) => {
    return (
        <button
            onClick={onClick}
            className={`
        w-full flex items-center gap-4 px-4 py-4 text-left
        transition-colors hover:bg-gray-50
        ${showDivider ? 'border-b border-gray-100' : ''}
      `}
        >
            {/* Content */}
            <div className="flex-1 min-w-0">
                <h4 className="font-bold text-black text-sm leading-tight mb-1">
                    {activity.title}
                </h4>
                <p className="text-gray-500 text-xs leading-relaxed line-clamp-1">
                    {activity.description}
                </p>
                <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] text-gray-400 font-semibold uppercase">
                        {activity.time}
                    </span>
                    {activity.location && (
                        <>
                            <span className="w-1 h-1 bg-gray-300 rounded-full" />
                            <span className="text-[10px] text-gray-400 truncate">
                                {activity.location}
                            </span>
                        </>
                    )}
                </div>
            </div>

            {/* Arrow */}
            <ChevronRight size={18} className="text-gray-300 flex-shrink-0" />
        </button>
    );
};

export default ActivityCard;
