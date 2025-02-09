'use client';

import { SettingsProvider } from '@/lib/settings';
import { ThemeProvider } from '@/lib/theme';
import { SolanaProvider } from '@/app/providers/SolanaProvider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <SettingsProvider>
        <SolanaProvider>
          {children}
        </SolanaProvider>
      </SettingsProvider>
    </ThemeProvider>
  );
}
