import React from 'react';

interface CoinsIconProps {
  size?: number;
  className?: string;
}

export const CoinsIcon: React.FC<CoinsIconProps> = ({ size = 16, className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="8" cy="8" r="7" />
    <circle cx="16" cy="16" r="7" />
  </svg>
);