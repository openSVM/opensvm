# In the VTable integrated VChart chart scene, how to deal with the truncation of dots at the edge

## Question

In the VTable integrated VChart chart scene, how to deal with the truncation of dots at the edge?

## Answer

When integrating VChart with VTable, edge truncation can be handled through:
1. Chart padding configuration
2. Cell size management
3. Chart clipping control
4. Custom rendering bounds

## Code Example

```typescript
const columns = [
  {
    field: 'chart',
    title: 'Chart',
    width: 200,
    render: (cell) => {
      // Method 1: Configure chart with padding
      return new VChart.ScatterChart({
        data: cell.value,
        width: 180,
        height: 60,
        // Add padding to prevent edge truncation
        padding: {
          left: 10,
          right: 10,
          top: 5,
          bottom: 5
        },
        point: {
          style: {
            size: 4,
            // Ensure points don't exceed bounds
            clip: true
          }
        }
      });
    }
  },
  {
    field: 'customChart',
    title: 'Custom Chart',
    width: 200,
    render: (cell) => {
      // Method 2: Custom rendering with bounds control
      return {
        type: 'custom',
        render: (ctx, rect) => {
          // Calculate safe drawing area
          const padding = 5;
          const bounds = {
            x: rect.x + padding,
            y: rect.y + padding,
            width: rect.width - (padding * 2),
            height: rect.height - (padding * 2)
          };
          
          // Draw points within safe bounds
          const data = cell.value;
          data.forEach(point => {
            const x = bounds.x + (point.x * bounds.width);
            const y = bounds.y + (point.y * bounds.height);
            
            // Only draw if within bounds
            if (x >= bounds.x && x <= bounds.x + bounds.width &&
                y >= bounds.y && y <= bounds.y + bounds.height) {
              ctx.beginPath();
              ctx.arc(x, y, 2, 0, Math.PI * 2);
              ctx.fill();
            }
          });
        }
      };
    }
  }
];

// Create table with chart integration
const table = new VTable.ListTable({
  container: document.getElementById('container'),
  columns: columns,
  records: data,
  // Method 3: Adjust cell dimensions
  defaultRowHeight: 80, // Ensure enough height for charts
  cellPadding: [10, 10] // Add padding to cells
});

// Method 4: Handle resize events
table.on('resize', () => {
  // Update chart dimensions if needed
  table.getColumns().forEach(column => {
    if (column.chart) {
      const width = column.width - 20; // Account for padding
      column.chart.resize(width, 60);
    }
  });
});

// Helper function to scale data to safe bounds
function scaleDataToBounds(data, padding = 0.1) {
  const xValues = data.map(d => d.x);
  const yValues = data.map(d => d.y);
  
  const xMin = Math.min(...xValues);
  const xMax = Math.max(...xValues);
  const yMin = Math.min(...yValues);
  const yMax = Math.max(...yValues);
  
  const xRange = xMax - xMin;
  const yRange = yMax - yMin;
  
  // Add padding to ranges
  const xPadding = xRange * padding;
  const yPadding = yRange * padding;
  
  return data.map(point => ({
    x: (point.x - xMin + xPadding) / (xRange + xPadding * 2),
    y: (point.y - yMin + yPadding) / (yRange + yPadding * 2)
  }));
}
```

## Related Links

- [VTable VChart Integration](https://visactor.io/vtable/guide/advanced/vchart)
- [Chart Cell Examples](https://visactor.io/vtable/examples/chart/basic)
- [Custom Rendering Guide](https://visactor.io/vtable/guide/advanced/custom_render)