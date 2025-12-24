import React from 'react';

/**
 * FloorSelector Component
 * FIXED: Better visual weight and active state
 */
const FloorSelector = ({ selectedFloor, onFloorChange }) => {
    const floors = ['3', '2', '1', 'G', 'B1'];

    return (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-1.5">
            {floors.map((floor, index) => {
                const isActive = selectedFloor === floor;
                return (
                    <button
                        key={floor}
                        onClick={() => onFloorChange(floor)}
                        className={`
              w-11 h-11 flex items-center justify-center
              font-bold text-sm rounded-xl
              transition-all duration-200
              ${index < floors.length - 1 ? 'mb-1' : ''}
              ${isActive
                                ? 'bg-black text-white shadow-md'
                                : 'bg-transparent text-gray-400 hover:bg-gray-100 hover:text-black'
                            }
            `}
                    >
                        {floor}
                    </button>
                );
            })}
        </div>
    );
};

export default FloorSelector;
