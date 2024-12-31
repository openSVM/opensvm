import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  className?: string;
}

export function Select({ className = '', ...props }: SelectProps) {
  return (
    <select
      className={`block w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#00ffbd] focus:border-transparent ${className}`}
      {...props}
    />
  );
} 