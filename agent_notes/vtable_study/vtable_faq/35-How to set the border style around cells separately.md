# How to set the border style around cells separately

## Question

How to set the border style around cells separately?

## Answer

VTable allows customization of individual cell borders through:
1. Cell border styling
2. Conditional borders
3. Border templates
4. Custom border rendering

## Code Example

```typescript
const columns = [
  {
    // Method 1: Basic border styling
    field: 'basic',
    title: 'Basic Borders',
    width: 150,
    style: {
      borderLeft: '1px solid #ddd',
      borderRight: '1px solid #ddd',
      borderTop: '1px solid #ddd',
      borderBottom: '1px solid #ddd'
    }
  },
  {
    // Method 2: Conditional borders
    field: 'conditional',
    title: 'Conditional Borders',
    width: 150,
    style: (cell) => {
      const borders = {
        borderLeft: '1px solid #ddd',
        borderRight: '1px solid #ddd',
        borderTop: '1px solid #ddd',
        borderBottom: '1px solid #ddd'
      };
      
      // Add highlight border for specific conditions
      if (cell.value > 100) {
        borders.borderLeft = '2px solid #1890ff';
      }
      
      if (cell.row % 2 === 0) {
        borders.borderBottom = '2px dashed #52c41a';
      }
      
      return borders;
    }
  },
  {
    // Method 3: Border templates
    field: 'template',
    title: 'Border Template',
    width: 150,
    style: (cell) => {
      const template = getBorderTemplate(cell);
      return {
        ...template,
        // Override specific borders if needed
        borderTop: cell.row === 0 ? '2px solid #1890ff' : template.borderTop
      };
    }
  },
  {
    // Method 4: Custom border rendering
    field: 'custom',
    title: 'Custom Borders',
    width: 150,
    render: (cell) => ({
      type: 'custom',
      render: (ctx, rect) => {
        // Draw cell content
        ctx.fillStyle = '#000';
        ctx.fillText(cell.value, rect.x + 8, rect.y + rect.height / 2);
        
        // Draw custom borders
        ctx.beginPath();
        
        // Left border with gradient
        const leftGradient = ctx.createLinearGradient(
          rect.x, rect.y,
          rect.x, rect.y + rect.height
        );
        leftGradient.addColorStop(0, '#1890ff');
        leftGradient.addColorStop(1, '#52c41a');
        
        ctx.strokeStyle = leftGradient;
        ctx.lineWidth = 2;
        ctx.moveTo(rect.x, rect.y);
        ctx.lineTo(rect.x, rect.y + rect.height);
        ctx.stroke();
        
        // Other borders
        ctx.strokeStyle = '#ddd';
        ctx.lineWidth = 1;
        
        // Top border (dashed)
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(rect.x, rect.y);
        ctx.lineTo(rect.x + rect.width, rect.y);
        ctx.stroke();
        
        // Reset line dash
        ctx.setLineDash([]);
        
        // Right and bottom borders
        ctx.beginPath();
        ctx.moveTo(rect.x + rect.width, rect.y);
        ctx.lineTo(rect.x + rect.width, rect.y + rect.height);
        ctx.lineTo(rect.x, rect.y + rect.height);
        ctx.stroke();
      }
    })
  }
];

// Border template helper
function getBorderTemplate(cell) {
  const templates = {
    header: {
      borderBottom: '2px solid #1890ff',
      borderRight: '1px solid #ddd'
    },
    group: {
      borderTop: '2px solid #52c41a',
      borderBottom: '2px solid #52c41a'
    },
    normal: {
      borderBottom: '1px solid #ddd',
      borderRight: '1px solid #ddd'
    }
  };
  
  if (cell.isHeader) {
    return templates.header;
  }
  
  if (cell.isGroupStart) {
    return templates.group;
  }
  
  return templates.normal;
}

const table = new VTable.ListTable({
  container: document.getElementById('container'),
  columns: columns,
  records: data,
  // Global border settings
  defaultStyle: {
    borderColor: '#ddd',
    borderWidth: 1
  }
});
```

## Related Links

- [VTable Style Documentation](https://visactor.io/vtable/guide/basic_concept/style)
- [Cell Styling Examples](https://visactor.io/vtable/examples/style/cell)
- [Custom Rendering Guide](https://visactor.io/vtable/guide/advanced/custom_render)