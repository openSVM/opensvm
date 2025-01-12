'use client';

import * as React from 'react';
import { useTheme } from '@/lib/theme';
import { Button } from './button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './dropdown-menu';

const themes = [
  { 
    name: 'PAPER', 
    value: 'paper',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none">
        <rect x="3" y="3" width="18" height="18" rx="2" />
      </svg>
    )
  },
  { 
    name: 'HIGH CONTRAST', 
    value: 'high-contrast',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </svg>
    )
  },
  { 
    name: 'DOS', 
    value: 'dos',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none">
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <rect x="8" y="21" width="8" height="1" />
        <rect x="11" y="17" width="2" height="4" />
      </svg>
    )
  },
  { 
    name: 'CYBERPUNK', 
    value: 'cyberpunk',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    )
  },
  { 
    name: 'SOLARIZED', 
    value: 'solarized',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none">
        <circle cx="12" cy="12" r="5" />
        <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
      </svg>
    )
  }
] as const;

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const currentTheme = themes.find(t => t.value === theme) || themes[1];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon"
          className="h-9 w-9 p-0 flex items-center justify-center bg-background hover:bg-accent hover:text-accent-foreground"
          >
          {currentTheme.icon}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end"
        className="w-[200px] bg-background border border-border"
      >
        {themes.map((t) => (
          <DropdownMenuItem
            key={t.value}
            onClick={() => setTheme(t.value)}
            className={`
              cursor-pointer px-4 py-2 flex items-center gap-3
              ${theme === t.value ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50'}
            `}
          >
            {t.icon}
            <span className="text-sm font-medium">{t.name}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 