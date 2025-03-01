'use client';

import { useState, useEffect } from 'react';
import { NavbarStatic } from './NavbarStatic';
import { NavbarInteractive } from './NavbarInteractive';

interface NavbarProps {
  children: React.ReactNode;
}

export function Navbar({ children }: NavbarProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      {/* Fixed header with proper z-index */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-background border-b border-border">
        <div className="container mx-auto px-4 h-14 flex items-center">
          {/* Base static navbar that's always visible */}
          <NavbarStatic />
          
          {/* Interactive elements rendered on top with higher z-index */}
          <div className="absolute inset-0 z-50">
            {mounted && <NavbarInteractive />}
          </div>
        </div>
      </header>

      {/* Main content with proper padding */}
      <main className="pt-14 min-h-screen">
        {children}
      </main>
    </>
  );
}
