'use client';

import React from 'react';

interface VirtualTableErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface VirtualTableErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class VirtualTableErrorBoundary extends React.Component<
  VirtualTableErrorBoundaryProps,
  VirtualTableErrorBoundaryState
> {
  constructor(props: VirtualTableErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): VirtualTableErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Only log errors that are not DOM manipulation related
    if (!error.message.includes('removeChild') && !error.message.includes('appendChild')) {
      console.error('VirtualTable error:', error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      // Fallback UI for virtual table errors
      return this.props.fallback || (
        <div className="p-4 border border-destructive/20 rounded-lg bg-destructive/5">
          <p className="text-sm text-muted-foreground">
            Table rendering error. Refreshing...
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              // Force a re-render after a short delay
              setTimeout(() => window.location.reload(), 100);
            }}
            className="mt-2 text-xs text-primary hover:underline"
          >
            Reload Table
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}