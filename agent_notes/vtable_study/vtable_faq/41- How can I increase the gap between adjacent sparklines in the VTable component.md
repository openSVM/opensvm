# How can I increase the gap between adjacent sparklines in the VTable component

## Question

How can I increase the gap between adjacent sparklines in the VTable component?

## Answer

VTable provides several ways to adjust sparkline spacing:
1. Padding configuration
2. Custom sparkline rendering
3. Cell spacing adjustment
4. Layout management

## Code Example

```typescript
const columns = [
  {
    // Method 1: Using padding in sparkline configuration
    field: 'trend',
    title: 'Trend',
    width: 200,
    sparkline: {
      type: 'line',
      data: (record) => record.trendData,
      style: {
        padding: {
          left: 10,
          right: 10
        }
      }
    }
  },
  {
    // Method 2: Custom sparkline with spacing
    field: 'customSparkline',
    title: 'Custom Sparkline',
    width: 200,
    render: (cell) => {
      return {
        type: 'html',
        html: `
          <div class="sparkline-container">
            <div class="sparkline-wrapper">
              ${renderSparkline(cell.value)}
            </div>
          </div>
        `,
        style: `
          .sparkline-container {
            padding: 0 10px;
            height: 100%;
            display: flex;
            align-items: center;
          }
          .sparkline-wrapper {
            flex: 1;
            height: 30px;
          }
        `
      };
    }
  },
  {
    // Method 3: Canvas-based sparkline with spacing
    field: 'canvasSparkline',
    title: 'Canvas Sparkline',
    width: 200,
    render: (cell) => ({
      type: 'custom',
      render: (ctx, rect) => {
        const padding = 10;
        const sparklineRect = {
          x: rect.x + padding,
          y: rect.y + 5,
          width: rect.width - (padding * 2),
          height: rect.height - 10
        };
        
        drawSparkline(ctx, sparklineRect, cell.value);
      }
    })
  }
];

// Helper function to render HTML sparkline
function renderSparkline(data) {
  const values = data.map(v => v.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;
  
  const points = values.map((v, i) => {
    const x = (i / (values.length - 1)) * 100;
    const y = 100 - ((v - min) / range) * 100;
    return `${x},${y}`;
  });
  
  return `
    <svg width="100%" height="100%" preserveAspectRatio="none">
      <polyline
        points="${points.join(' ')}"
        fill="none"
        stroke="#1890ff"
        stroke-width="2"
      />
    </svg>
  `;
}

// Helper function to draw canvas sparkline
function drawSparkline(ctx, rect, data) {
  const values = data.map(v => v.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;
  
  ctx.beginPath();
  values.forEach((v, i) => {
    const x = rect.x + (i / (values.length - 1)) * rect.width;
    const y = rect.y + rect.height - ((v - min) / range) * rect.height;
    
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });
  
  ctx.strokeStyle = '#1890ff';
  ctx.lineWidth = 2;
  ctx.stroke();
}

// Create table with spaced sparklines
const table = new VTable.ListTable({
  container: document.getElementById('container'),
  columns: columns,
  records: data,
  // Global cell padding
  defaultStyle: {
    padding: [5, 10]
  }
});

// Method 4: Dynamic spacing manager
class SparklineSpacingManager {
  constructor(table) {
    this.table = table;
    this.spacing = 10;
  }
  
  setSpacing(spacing) {
    this.spacing = spacing;
    this.updateSpacing();
  }
  
  updateSpacing() {
    const columns = this.table.getColumns();
    const updatedColumns = columns.map(column => {
      if (column.sparkline) {
        return {
          ...column,
          sparkline: {
            ...column.sparkline,
            style: {
              ...column.sparkline.style,
              padding: {
                left: this.spacing,
                right: this.spacing
              }
            }
          }
        };
      }
      return column;
    });
    
    this.table.updateColumns(updatedColumns);
  }
}

// Initialize spacing manager
const spacingManager = new SparklineSpacingManager(table);
```

## Related Links

- [VTable Sparkline Documentation](https://visactor.io/vtable/guide/basic_concept/sparkline)
- [Cell Style Guide](https://visactor.io/vtable/guide/basic_concept/style)
- [Custom Rendering Examples](https://visactor.io/vtable/examples/cell/custom-render)