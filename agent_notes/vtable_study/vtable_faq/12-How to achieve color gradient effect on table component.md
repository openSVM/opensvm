# How to achieve color gradient effect on table component

## Question

How to achieve color gradient effect on table component?

## Answer

VTable supports color gradients through several methods:
1. Cell background gradients
2. Value-based color mapping
3. Custom gradient rendering
4. Theme-based gradients

## Code Example

```typescript
const columns = [
  {
    // Method 1: Cell background gradient
    field: 'basic',
    title: 'Basic Gradient',
    style: {
      backgroundColor: {
        gradient: {
          type: 'linear',
          x0: 0,
          y0: 0,
          x1: 1,
          y1: 0,
          stops: [
            { offset: 0, color: '#1890ff' },
            { offset: 1, color: '#36cfc9' }
          ]
        }
      }
    }
  },
  {
    // Method 2: Value-based color mapping
    field: 'value',
    title: 'Value Gradient',
    style: (cell) => {
      const value = cell.value;
      const percentage = (value - minValue) / (maxValue - minValue);
      return {
        backgroundColor: `hsl(${200 + (percentage * 60)}, 80%, 50%)`
      };
    }
  },
  {
    // Method 3: Custom gradient rendering
    field: 'custom',
    title: 'Custom Gradient',
    render: (cell) => ({
      type: 'custom',
      render: (ctx, rect) => {
        const gradient = ctx.createLinearGradient(
          rect.x, rect.y,
          rect.x + rect.width, rect.y
        );
        gradient.addColorStop(0, '#1890ff');
        gradient.addColorStop(1, '#36cfc9');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
        
        // Draw text
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(
          cell.value,
          rect.x + rect.width / 2,
          rect.y + rect.height / 2
        );
      }
    })
  }
];

// Method 4: Theme-based gradients
const table = new VTable.ListTable({
  container: document.getElementById('container'),
  columns: columns,
  records: data,
  theme: {
    headerStyle: {
      backgroundColor: {
        gradient: {
          type: 'linear',
          x0: 0,
          y0: 0,
          x1: 0,
          y1: 1,
          stops: [
            { offset: 0, color: '#f7f7f7' },
            { offset: 1, color: '#e6e6e6' }
          ]
        }
      }
    }
  }
});
```

## Related Links

- [VTable Style Guide](https://visactor.io/vtable/guide/basic_concept/style)
- [Custom Rendering Documentation](https://visactor.io/vtable/guide/advanced/custom_render)
- [Theme Configuration](https://visactor.io/vtable/guide/basic_concept/theme)