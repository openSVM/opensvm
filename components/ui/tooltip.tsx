'use client';

import { useState, useRef, useEffect } from 'react';

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function Tooltip({ content, children, className = '' }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const tooltipRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isVisible && tooltipRef.current && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      
      // Position above the element by default
      let x = rect.left + (rect.width - tooltipRect.width) / 2;
      let y = rect.top - tooltipRect.height - 8;

      // Adjust if tooltip would go off screen
      if (y < 0) {
        y = rect.bottom + 8; // Show below instead
      }
      if (x < 0) {
        x = 0;
      } else if (x + tooltipRect.width > window.innerWidth) {
        x = window.innerWidth - tooltipRect.width;
      }

      setPosition({ x, y });
    }
  }, [isVisible]);

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      className="relative inline-block"
    >
      {children}
      {isVisible && (
        <div
          ref={tooltipRef}
          className={`fixed z-50 p-2 bg-background border border-border rounded-lg shadow-lg text-sm ${className}`}
          style={{
            left: position.x,
            top: position.y,
            transform: 'translate3d(0, 0, 0)',
            pointerEvents: 'none'
          }}
        >
          {content}
        </div>
      )}
    </div>
  );
}
