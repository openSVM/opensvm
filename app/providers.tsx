'use client';

import { SettingsProvider } from '@/lib/settings';
import { ThemeProvider } from '@/lib/theme';
import { SolanaProvider } from '@/app/providers/SolanaProvider';
import { WalletProvider } from '@/app/providers/WalletProvider';
import { useState, useEffect } from 'react';

// Defer wallet initialization until after settings and connection are ready
function DeferredWalletProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Small delay to ensure settings and connection are initialized
    const timer = setTimeout(() => {
      setMounted(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <WalletProvider>
      {children}
    </WalletProvider>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <SettingsProvider>
        <SolanaProvider>
          <DeferredWalletProvider>
            {children}
          </DeferredWalletProvider>
        </SolanaProvider>
      </SettingsProvider>
    </ThemeProvider>
  );
}
