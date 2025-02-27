'use client';

import { Suspense, useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// Static navbar is imported normally since it's critical
import { NavbarStatic } from './NavbarStatic';

// Dynamic import for interactive navbar with no SSR
const NavbarInteractive = dynamic(
  () => import('./NavbarInteractive').then(mod => mod.NavbarInteractive),
  {
    loading: () => null,
    ssr: false // Disable SSR to reduce initial bundle size
  }
);

interface NavbarProps {
  children: React.ReactNode;
}

function NavbarSkeleton() {
  return (
    <div className="h-14 bg-background border-b border-border">
      <div className="container mx-auto px-4 h-full flex items-center justify-between">
        <div className="w-32 h-6 bg-muted animate-pulse rounded" />
        <div className="w-64 h-8 bg-muted animate-pulse rounded" />
        <div className="w-48 h-8 bg-muted animate-pulse rounded" />
      </div>
    </div>
  );
}

export function Navbar({ children }: NavbarProps) {
  const [isClient, setIsClient] = useState(false);

  // Only enable interactive features after hydration
  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <div>
      <div className="relative">
        {/* Static navbar shell that renders immediately */}
        <NavbarStatic />
        
        {/* Interactive elements that load progressively */}
        <div className="absolute top-0 left-0 right-0">
          <Suspense fallback={<NavbarSkeleton />}>
            {isClient && <NavbarInteractive />}
          </Suspense>
        </div>
      </div>

      {/* Main content */}
      <main className="pt-14 min-h-screen">
        {children}
      </main>
    </div>
  );
}
