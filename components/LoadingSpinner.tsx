'use client';

interface LoadingSpinnerProps {
  className?: string;
}

export default function LoadingSpinner({ className = '' }: LoadingSpinnerProps) {
  return (
    <div className="flex items-center justify-center p-4">
      <div
        className={`animate-spin rounded-full h-8 w-8 border-b-2 border-primary ${className}`}
        role="status"
        aria-label="Loading"
      >
        <span className="sr-only">Loading...</span>
      </div>
    </div>
  );
}