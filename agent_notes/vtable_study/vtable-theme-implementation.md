# VTable Theme Implementation Plan

## Current Issues
1. Using next-themes instead of custom theme system
2. Limited theme support (only high-contrast)
3. Inconsistent use of CSS variables
4. Hardcoded colors in table configuration

## Implementation Steps

### 1. Update VTable Component
- Replace next-themes with custom useTheme hook
- Create theme-specific color mappings:
  ```typescript
  const themeColors = {
    paper: {
      header: {
        text: 'hsl(var(--foreground))',
        background: 'hsl(var(--muted))',
        border: 'hsl(var(--border))'
      },
      cell: {
        text: 'hsl(var(--foreground))',
        background: 'hsl(var(--background))',
        border: 'hsl(var(--border))',
        hover: 'hsl(var(--muted))'
      }
    },
    'high-contrast': {
      header: {
        text: '#ffffff',
        background: '#1d1d1d',
        border: '#333333'
      },
      cell: {
        text: '#ffffff',
        background: '#000000',
        border: '#333333',
        hover: '#1d1d1d'
      }
    },
    cyberpunk: {
      header: {
        text: 'hsl(var(--neon))',
        background: 'hsl(var(--cyber-dark))',
        border: 'hsl(var(--neon-border))'
      },
      cell: {
        text: 'hsl(var(--foreground))',
        background: 'hsl(var(--cyber-bg))',
        border: 'hsl(var(--neon-border))',
        hover: 'hsl(var(--cyber-hover))'
      }
    },
    solarized: {
      header: {
        text: 'hsl(var(--sol-text))',
        background: 'hsl(var(--sol-bg-highlight))',
        border: 'hsl(var(--sol-border))'
      },
      cell: {
        text: 'hsl(var(--sol-text))',
        background: 'hsl(var(--sol-bg))',
        border: 'hsl(var(--sol-border))',
        hover: 'hsl(var(--sol-bg-highlight))'
      }
    }
  };
  ```

### 2. Update CSS Styles
- Update scrollbar styles to use theme variables:
  ```css
  .vtable ::-webkit-scrollbar-track {
    background: hsl(var(--muted));
  }
  
  .vtable ::-webkit-scrollbar-thumb {
    background: hsl(var(--muted-foreground));
    border-radius: var(--radius);
  }
  
  .vtable ::-webkit-scrollbar-thumb:hover {
    background: hsl(var(--foreground));
  }
  ```

### 3. Integration Testing
1. Test with all themes:
   - Paper theme
   - High-contrast theme
   - Cyberpunk theme
   - Solarized theme
2. Verify:
   - Header styles
   - Cell styles
   - Hover effects
   - Scrollbar appearance
   - Focus states
   - Loading states

## Expected Results
- VTable appearance matches the selected theme
- Consistent visual hierarchy across themes
- Improved accessibility with proper contrast
- Smooth transitions between themes