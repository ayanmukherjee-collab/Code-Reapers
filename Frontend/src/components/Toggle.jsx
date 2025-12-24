import React from 'react';

/**
 * Toggle Component
 * Clean toggle switch with smooth animation
 */
const Toggle = ({ label, description, checked, onChange }) => {
    return (
        <div
            className="flex items-center justify-between py-5 cursor-pointer"
            onClick={() => onChange(!checked)}
        >
            <div className="flex-1 pr-4">
                <h4 className="font-semibold text-black text-sm">
                    {label}
                </h4>
                {description && (
                    <p className="text-gray-500 text-xs mt-0.5">
                        {description}
                    </p>
                )}
            </div>

            {/* Toggle Switch */}
            <button
                role="switch"
                aria-checked={checked}
                className={`
          relative inline-flex h-7 w-12 items-center rounded-full
          transition-colors duration-300
          ${checked ? 'bg-black' : 'bg-gray-200'}
        `}
            >
                <span
                    className={`
            inline-block h-5 w-5 transform rounded-full bg-white
            shadow-sm transition-transform duration-300
            ${checked ? 'translate-x-6' : 'translate-x-1'}
          `}
                />
            </button>
        </div>
    );
};

export default Toggle;
