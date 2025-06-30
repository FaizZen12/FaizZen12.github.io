import React from 'react';
import { LucideIcon } from 'lucide-react';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'circle';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  icon?: LucideIcon;
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  icon: Icon,
  className = ''
}) => {
  const baseClasses = 'transition-all duration-200 font-medium focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variantClasses = {
    primary: 'bg-gray-900 text-white hover:bg-gray-800 focus:ring-gray-500',
    secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-500',
    outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-500',
    circle: 'bg-gray-900 text-white hover:bg-gray-800 focus:ring-gray-500 rounded-full p-3'
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm rounded-md',
    md: 'px-4 py-2 text-base rounded-md',
    lg: 'px-6 py-3 text-lg rounded-lg'
  };

  const circleSize = variant === 'circle' ? '' : sizeClasses[size];

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${circleSize}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
    >
      {Icon && <Icon size={variant === 'circle' ? 20 : 16} className={variant === 'circle' ? '' : 'mr-2 inline'} />}
      {variant !== 'circle' && children}
    </button>
  );
};