import React from 'react';

interface ChipProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export const Chip: React.FC<ChipProps> = ({ children, onClick, className = '' }) => {
  return (
    <button
      onClick={onClick}
      className={`
        px-4 py-2 border border-gray-300 text-gray-700 
        hover:bg-gray-50 transition-colors duration-200
        rounded-full text-sm font-medium
        ${className}
      `}
    >
      {children}
    </button>
  );
};