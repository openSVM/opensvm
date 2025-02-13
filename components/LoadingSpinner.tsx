'use client';

interface LoadingSpinnerProps {
  className?: string;
}

export default function LoadingSpinner({ className }: LoadingSpinnerProps) {
  return (
    <div className="flex items-center justify-center p-8">
      <div className={`animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 ${className || ''}`}></div>
    </div>
  );
}