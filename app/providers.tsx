'use client';

import { ThemeProvider } from '@/lib/theme';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider defaultTheme="theme-paper">
      {children}
    </ThemeProvider>
  );
} 