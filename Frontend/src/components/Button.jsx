import React from 'react';

/**
 * Button Component - Radical Redesign
 * Height: 56px, Bold Text, Full Pill
 */
const Button = ({
    variant = 'primary',
    fullWidth = false,
    icon,
    children,
    className = '',
    ...props
}) => {
    const variants = {
        primary: 'bg-black text-white hover:bg-gray-900 shadow-lg',
        secondary: 'bg-white text-black border-2 border-gray-100 hover:bg-gray-50',
        ghost: 'bg-transparent text-black hover:bg-gray-100',
    };

    return (
        <button
            className={`
        btn-base px-8
        ${variants[variant]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
            {...props}
        >
            {icon && <span className="mr-3">{icon}</span>}
            {children}
        </button>
    );
};

export default Button;
