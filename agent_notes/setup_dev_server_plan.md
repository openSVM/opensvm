# OpenSVM Explorer Implementation Plan

## Layout Structure
1. Update page.tsx to show network cards grid layout
2. Remove current stats grid and recent activity sections
3. Implement 4-column grid for network cards

## Network Card Component
Create new component `components/NetworkCard.tsx`:
1. Props interface:
```typescript
interface NetworkCardProps {
  name: string;           // Network name (e.g., "Solana")
  status: "Active" | "Development";
  stats: {
    blocksProcessed: number | "N/A";
    activeValidators: number | "N/A";
    tps: number | "N/A";
  };
  epoch: {
    current: number | "N/A";
    progress: number;
  };
  tpsHistory: Array<{
    timestamp: number;
    value: number;
  }>;
}
```

2. Visual Elements:
- Dark background with subtle border
- Network name with status badge
- Three metrics in horizontal layout
- Current epoch with progress bar
- TPS History graph using d3.js

## Styling Updates
1. Colors:
- Pure black background (#000000)
- Status badges:
  * Active: Green (#00DC82)
  * Development: Amber/Gold
- Progress bars: Green (#00DC82)
- Graph lines: Green (#00DC82)
- Text:
  * Primary: White
  * Secondary: Gray

2. Typography:
- Use Berkeley Mono for all text
- Large numbers in monospace
- Network names in bold
- Status badges in uppercase

## Component Implementation Steps
1. Create NetworkCard component
2. Implement TPS History graph
3. Create status badge component
4. Style progress bar
5. Update page layout
6. Add network data fetching
7. Implement loading states

## Data Integration
1. Solana Network:
- Use existing connection for live data
- Implement TPS history tracking
- Calculate epoch progress

2. Eclipse Network:
- Add new connection
- Track metrics
- Store historical data

3. Development Networks:
- Show placeholder data
- Add "Development" badges
- Disable live updates

## Final Testing
1. Verify layout matches screenshot
2. Check responsive behavior
3. Test data updates
4. Verify all animations
5. Ensure consistent styling