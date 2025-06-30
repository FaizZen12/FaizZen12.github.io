import React from 'react';

interface InputProps {
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyPress?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  className?: string;
  disabled?: boolean;
}

export const Input: React.FC<InputProps> = ({
  type = 'text',
  placeholder,
  value,
  onChange,
  onKeyPress,
  className = '',
  disabled = false
}) => {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      onKeyPress={onKeyPress}
      disabled={disabled}
      className={`
        w-full px-4 py-3 text-gray-900 bg-transparent
        placeholder-gray-500 border-none outline-none
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
    />
  );
};