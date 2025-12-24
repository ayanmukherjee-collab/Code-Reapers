import React from 'react';
import { Navigation, Check } from 'lucide-react';
import Button from './Button';

/**
 * ScheduleItem Component
 * FIXED: Better visual hierarchy, consistent with overall design
 */
const ScheduleItem = ({ item, onNavigate, isLast = false }) => {
    const isActive = item.status === 'current';
    const isPast = item.status === 'past';

    return (
        <div className="flex gap-4">
            {/* Timeline Indicator */}
            <div className="flex flex-col items-center">
                <div
                    className={`
            w-3 h-3 rounded-full flex-shrink-0
            ${isActive
                            ? 'bg-black ring-4 ring-gray-200'
                            : isPast
                                ? 'bg-gray-300'
                                : 'bg-white border-2 border-gray-300'
                        }
          `}
                />
                {!isLast && (
                    <div className="flex-1 w-0.5 bg-gray-200 my-2" />
                )}
            </div>

            {/* Content Card */}
            <div
                className={`
          flex-1 mb-4 p-5 rounded-2xl
          ${isActive
                        ? 'bg-black text-white shadow-xl'
                        : 'bg-white border border-gray-100 shadow-sm'
                    }
        `}
            >
                {/* Time */}
                <div className={`text-[10px] font-semibold uppercase tracking-wide mb-1.5 ${isActive ? 'text-gray-400' : 'text-gray-400'}`}>
                    {item.time}
                </div>

                {/* Title */}
                <h4 className={`font-bold text-base mb-1 ${isActive ? 'text-white' : 'text-black'}`}>
                    {item.title}
                </h4>

                {/* Location */}
                <div className={`text-sm mb-4 ${isActive ? 'text-gray-400' : 'text-gray-500'}`}>
                    {item.location}
                </div>

                {/* Navigate Button */}
                {!isPast && (
                    <Button
                        variant={isActive ? 'secondary' : 'primary'}
                        size="sm"
                        onClick={() => onNavigate(item)}
                        className={isActive ? '!bg-white !text-black !border-0' : ''}
                        icon={<Navigation size={14} strokeWidth={2.5} />}
                    >
                        Navigate Now
                    </Button>
                )}

                {isPast && (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-400">
                        <Check size={14} strokeWidth={2.5} />
                        Completed
                    </span>
                )}
            </div>
        </div>
    );
};

export default ScheduleItem;
