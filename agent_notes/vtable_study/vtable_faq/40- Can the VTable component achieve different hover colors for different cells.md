# Can the VTable component achieve different hover colors for different cells

## Question

Can the VTable component achieve different hover colors for different cells?

## Answer

Yes, VTable supports different hover colors for cells through:
1. Conditional hover styling
2. Dynamic color calculation
3. Cell-specific hover effects
4. Custom hover rendering

## Code Example

```typescript
const columns = [
  {
    // Method 1: Basic conditional hover
    field: 'basic',
    title: 'Basic Hover',
    width: 150,
    style: {
      hover: (cell) => ({
        backgroundColor: cell.value > 100 ? '#e6f7ff' : '#fff7e6'
      })
    }
  },
  {
    // Method 2: Dynamic hover colors
    field: 'dynamic',
    title: 'Dynamic Hover',
    width: 150,
    style: (cell) => {
      const baseColor = getBaseColor(cell.value);
      return {
        backgroundColor: baseColor,
        hover: {
          backgroundColor: adjustColorBrightness(baseColor, 0.1)
        }
      };
    }
  },
  {
    // Method 3: Complex hover effects
    field: 'complex',
    title: 'Complex Hover',
    width: 150,
    render: (cell) => ({
      type: 'html',
      html: `
        <div class="hover-cell" data-value="${cell.value}">
          ${cell.value}
        </div>
      `,
      style: `
        .hover-cell {
          padding: 8px;
          transition: all 0.3s;
        }
        .hover-cell[data-value^="A"]:hover {
          background: #e6f7ff;
          color: #1890ff;
        }
        .hover-cell[data-value^="B"]:hover {
          background: #fff7e6;
          color: #faad14;
        }
        .hover-cell[data-value^="C"]:hover {
          background: #f6ffed;
          color: #52c41a;
        }
      `
    })
  },
  {
    // Method 4: Custom hover rendering
    field: 'custom',
    title: 'Custom Hover',
    width: 150,
    render: (cell, helpers) => {
      const { isHovered } = helpers;
      
      return {
        type: 'custom',
        render: (ctx, rect) => {
          // Get hover color based on cell value
          const hoverColor = getHoverColor(cell.value);
          
          // Fill background
          ctx.fillStyle = isHovered ? hoverColor : '#ffffff';
          ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
          
          // Draw content
          ctx.fillStyle = isHovered ? '#ffffff' : '#000000';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(
            cell.value,
            rect.x + rect.width / 2,
            rect.y + rect.height / 2
          );
        }
      };
    }
  }
];

// Helper functions for color manipulation
function getBaseColor(value) {
  if (typeof value === 'number') {
    if (value < 0) return '#fff1f0';
    if (value > 100) return '#f6ffed';
    return '#e6f7ff';
  }
  
  if (typeof value === 'string') {
    const firstChar = value.charAt(0).toLowerCase();
    const colors = {
      a: '#e6f7ff',
      b: '#fff7e6',
      c: '#f6ffed',
      d: '#fff1f0'
    };
    return colors[firstChar] || '#f5f5f5';
  }
  
  return '#f5f5f5';
}

function adjustColorBrightness(color, factor) {
  // Convert hex to RGB
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  // Adjust brightness
  const adjustedR = Math.min(255, r + (255 - r) * factor);
  const adjustedG = Math.min(255, g + (255 - g) * factor);
  const adjustedB = Math.min(255, b + (255 - b) * factor);
  
  // Convert back to hex
  return `#${Math.round(adjustedR).toString(16).padStart(2, '0')}${Math.round(adjustedG).toString(16).padStart(2, '0')}${Math.round(adjustedB).toString(16).padStart(2, '0')}`;
}

function getHoverColor(value) {
  // Implement custom hover color logic
  return `hsl(${Math.abs(hashCode(value.toString())) % 360}, 70%, 50%)`;
}

function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash = hash & hash;
  }
  return hash;
}

// Create table with hover effects
const table = new VTable.ListTable({
  container: document.getElementById('container'),
  columns: columns,
  records: data,
  hover: {
    enabled: true,
    highlightMode: 'cell'
  }
});
```

## Related Links

- [VTable Hover Documentation](https://visactor.io/vtable/guide/basic_concept/hover)
- [Style Configuration Guide](https://visactor.io/vtable/guide/basic_concept/style)
- [Custom Rendering Examples](https://visactor.io/vtable/examples/cell/custom-render)