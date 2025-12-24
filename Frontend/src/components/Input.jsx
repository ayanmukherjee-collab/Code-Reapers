import React from 'react';

/**
 * Input Component - Radical Redesign
 * Height: 56px, Large Icon, #F5F5F5 Background
 */
const Input = ({
    leadingIcon,
    trailingIcon,
    placeholder = 'Search...',
    className = '',
    ...props
}) => {
    return (
        <div className={`relative flex items-center ${className}`}>
            {leadingIcon && (
                <span className="absolute left-6 text-gray-400 pointer-events-none">
                    {leadingIcon}
                </span>
            )}
            <input
                type="text"
                placeholder={placeholder}
                className={`
          input-base w-full
          ${leadingIcon ? 'pl-14' : 'pl-6'}
          ${trailingIcon ? 'pr-14' : 'pr-6'}
          text-black placeholder-gray-400
          border-0 outline-none
          focus:ring-2 focus:ring-black focus:ring-offset-2
          transition-all duration-200
        `}
                {...props}
            />
            {trailingIcon && (
                <span className="absolute right-4 text-gray-500">
                    {trailingIcon}
                </span>
            )}
        </div>
    );
};

export default Input;
