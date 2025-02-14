# How to implement a heatmap using a table component

## Question

How to implement a heatmap using a table component?

## Answer

VTable can be used to create heatmaps by applying color scales to cell backgrounds based on their values. This can be achieved through:
1. Dynamic background color calculation
2. Color scale mapping
3. Custom cell rendering
4. Theme-based coloring

## Code Example

```typescript
// Helper function to generate color based on value
function getHeatmapColor(value, min, max) {
  // Normalize value between 0 and 1
  const normalized = (value - min) / (max - min);
  
  // Color interpolation (blue to red)
  const hue = ((1 - normalized) * 240).toString(10);
  return `hsl(${hue}, 70%, 50%)`;
}

// Alternative: Using predefined color scales
const colorScales = {
  red: ['#fff5f5', '#ff8080', '#ff0000'],
  blue: ['#f0f8ff', '#4da6ff', '#0066cc'],
  gradient: ['#3288bd', '#66c2a5', '#abdda4', '#e6f598', '#fee08b', '#fdae61', '#f46d43', '#d53e4f']
};

const columns = [
  {
    field: 'value',
    title: 'Basic Heatmap',
    width: 100,
    style: (cell) => {
      const value = cell.value;
      return {
        backgroundColor: getHeatmapColor(value, 0, 100),
        color: value > 50 ? '#ffffff' : '#000000' // Text color based on background
      };
    }
  },
  {
    field: 'customHeatmap',
    title: 'Custom Heatmap',
    width: 100,
    render: (cell) => {
      const value = cell.value;
      const colorIndex = Math.floor((value / 100) * (colorScales.gradient.length - 1));
      
      return {
        type: 'html',
        html: `
          <div style="
            width: 100%;
            height: 100%;
            background-color: ${colorScales.gradient[colorIndex]};
            display: flex;
            align-items: center;
            justify-content: center;
            color: ${value > 50 ? '#ffffff' : '#000000'};
          ">
            ${value}
          </div>
        `
      };
    }
  }
];

// Create table with heatmap
const table = new VTable.ListTable({
  container: document.getElementById('container'),
  columns: columns,
  records: data,
  // Optional: Theme configuration for consistent coloring
  theme: {
    cellStyle: {
      padding: [4, 8],
      textAlign: 'center'
    }
  }
});

// Update heatmap colors dynamically
function updateHeatmapColors() {
  const values = table.getData().map(row => row.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  
  table.updateColumns([
    {
      field: 'value',
      style: (cell) => ({
        backgroundColor: getHeatmapColor(cell.value, min, max),
        color: cell.value > (min + max) / 2 ? '#ffffff' : '#000000'
      })
    }
  ]);
}
```

## Related Links

- [VTable Style Guide](https://visactor.io/vtable/guide/basic_concept/style)
- [Custom Rendering Documentation](https://visactor.io/vtable/guide/advanced/custom_render)
- [Color Scale Examples](https://visactor.io/vtable/examples/style/color-scale)