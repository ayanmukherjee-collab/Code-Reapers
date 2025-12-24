import React from 'react';

/**
 * Card Component - Radical Redesign
 * Minimalist, subtle border, generous padding
 */
const Card = ({
    variant = 'default',
    padding = 'lg',
    className = '',
    onClick,
    children,
    ...props
}) => {
    const baseStyles = `
    rounded-3xl
    transition-all duration-300
    w-full
  `;

    const variants = {
        default: 'bg-white border border-gray-100 shadow-sm',
        flat: 'bg-gray-50 border-none',
        black: 'bg-black text-white shadow-xl',
        outline: 'bg-transparent border-2 border-gray-100',
    };

    const paddings = {
        none: 'p-0',
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8', // Massive padding for mobile
    };

    const interactiveStyles = onClick
        ? 'cursor-pointer active:scale-[0.98] hover:shadow-md'
        : '';

    return (
        <div
            className={`
        ${baseStyles}
        ${variants[variant]}
        ${paddings[padding]}
        ${interactiveStyles}
        ${className}
      `}
            onClick={onClick}
            {...props}
        >
            {children}
        </div>
    );
};

export default Card;
