# How to implement hover to a cell to show or hide part of the content

## Question

How to implement hover to a cell to show or hide part of the content?

## Answer

VTable provides several ways to implement hover-based content visibility:
1. Hover state styling
2. Dynamic content rendering
3. Tooltip integration
4. Custom hover effects

## Code Example

```typescript
const columns = [
  {
    // Method 1: Using hover state styling
    field: 'basicHover',
    title: 'Basic Hover',
    width: 200,
    style: {
      // Default state
      textOverflow: 'ellipsis',
      overflow: 'hidden',
      // Hover state
      hover: {
        textOverflow: 'clip',
        overflow: 'visible',
        backgroundColor: '#f5f5f5'
      }
    }
  },
  {
    // Method 2: Dynamic content rendering
    field: 'dynamicContent',
    title: 'Dynamic Content',
    width: 200,
    render: (cell) => {
      return {
        type: 'html',
        html: `
          <div class="hover-container">
            <div class="visible-content">${cell.value.short}</div>
            <div class="hover-content">${cell.value.full}</div>
          </div>
        `,
        style: `
          .hover-container {
            position: relative;
          }
          .hover-content {
            display: none;
            position: absolute;
            top: 0;
            left: 0;
            background: white;
            border: 1px solid #ddd;
            padding: 8px;
            z-index: 1;
          }
          .hover-container:hover .hover-content {
            display: block;
          }
        `
      };
    }
  },
  {
    // Method 3: Tooltip integration
    field: 'tooltipHover',
    title: 'Tooltip Hover',
    width: 150,
    tooltip: {
      enabled: true,
      showDelay: 0,
      hideDelay: 200,
      formatter: (cell) => {
        return cell.value.details;
      }
    }
  },
  {
    // Method 4: Custom hover effect
    field: 'customHover',
    title: 'Custom Hover',
    width: 200,
    render: (cell) => {
      return {
        type: 'custom',
        render: (ctx, rect, helpers) => {
          const { isHovered } = helpers;
          
          // Draw background
          ctx.fillStyle = isHovered ? '#f5f5f5' : '#ffffff';
          ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
          
          // Draw content
          ctx.fillStyle = '#000000';
          if (isHovered) {
            // Draw expanded content
            ctx.font = 'bold 12px Arial';
            drawExpandedContent(ctx, cell.value, rect);
          } else {
            // Draw collapsed content
            ctx.font = '12px Arial';
            drawCollapsedContent(ctx, cell.value, rect);
          }
        }
      };
    }
  }
];

const table = new VTable.ListTable({
  container: document.getElementById('container'),
  columns: columns,
  records: data,
  // Enable hover effects
  hover: {
    enabled: true,
    highlightMode: 'cell' // or 'row', 'column'
  }
});

// Helper functions for custom rendering
function drawExpandedContent(ctx, value, rect) {
  // Implementation for expanded content
}

function drawCollapsedContent(ctx, value, rect) {
  // Implementation for collapsed content
}

// Optional: Add custom hover handlers
table.on('cell-hover', (event) => {
  const { row, col } = event;
  // Custom hover logic
});

table.on('cell-hover-out', (event) => {
  const { row, col } = event;
  // Custom hover out logic
});
```

## Related Links

- [VTable Hover Documentation](https://visactor.io/vtable/guide/basic_concept/hover)
- [Cell Style Guide](https://visactor.io/vtable/guide/basic_concept/style)
- [Custom Rendering Examples](https://visactor.io/vtable/examples/cell/custom-render)