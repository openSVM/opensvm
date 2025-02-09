# After custom rendering in the column configuration of the VTable component, the icon configuration fails- How to solve this

## Question

After custom rendering in the column configuration of the VTable component, the icon configuration fails- How to solve this?

## Answer

This issue can be resolved through:
1. Proper icon integration with custom rendering
2. Icon configuration preservation
3. Combined rendering approaches
4. Icon state management

## Code Example

```typescript
const columns = [
  {
    // Method 1: Preserve icon with custom rendering
    field: 'status',
    title: 'Status',
    width: 150,
    icon: {
      type: 'circle',
      fill: '#1890ff'
    },
    render: (cell) => {
      // Get icon configuration
      const iconConfig = cell.column.icon;
      
      return {
        type: 'custom',
        render: (ctx, rect) => {
          // Draw icon first
          if (iconConfig) {
            drawIcon(ctx, rect, iconConfig);
          }
          
          // Draw custom content
          const iconWidth = iconConfig ? 20 : 0;
          const textX = rect.x + iconWidth + 8;
          
          ctx.fillStyle = '#000';
          ctx.fillText(cell.value, textX, rect.y + rect.height / 2);
        }
      };
    }
  },
  {
    // Method 2: Combined HTML and icon rendering
    field: 'action',
    title: 'Action',
    width: 150,
    icon: {
      type: 'custom',
      svg: `
        <svg viewBox="0 0 24 24" width="16" height="16">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
        </svg>
      `
    },
    render: (cell) => ({
      type: 'html',
      html: `
        <div class="cell-content">
          <span class="icon-wrapper">
            ${cell.column.icon.svg}
          </span>
          <span class="text">${cell.value}</span>
        </div>
      `,
      style: `
        .cell-content {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .icon-wrapper {
          display: flex;
          align-items: center;
        }
        .icon-wrapper svg {
          fill: #1890ff;
        }
      `
    })
  }
];

// Helper function to draw icons
function drawIcon(ctx, rect, iconConfig) {
  const size = 16;
  const x = rect.x + 8;
  const y = rect.y + (rect.height - size) / 2;
  
  switch (iconConfig.type) {
    case 'circle':
      ctx.beginPath();
      ctx.arc(x + size/2, y + size/2, size/2, 0, Math.PI * 2);
      ctx.fillStyle = iconConfig.fill;
      ctx.fill();
      break;
      
    case 'square':
      ctx.fillStyle = iconConfig.fill;
      ctx.fillRect(x, y, size, size);
      break;
      
    case 'custom':
      if (iconConfig.draw) {
        iconConfig.draw(ctx, x, y, size);
      }
      break;
  }
}

// Method 3: Icon manager for custom rendering
class IconManager {
  constructor(table) {
    this.table = table;
    this.iconCache = new Map();
    this.setupIconHandling();
  }
  
  setupIconHandling() {
    // Pre-load and cache icons
    this.table.getColumns().forEach(column => {
      if (column.icon) {
        this.cacheIcon(column.icon);
      }
    });
  }
  
  cacheIcon(iconConfig) {
    if (iconConfig.type === 'custom' && iconConfig.url) {
      const img = new Image();
      img.src = iconConfig.url;
      img.onload = () => {
        this.iconCache.set(iconConfig.url, img);
      };
    }
  }
  
  drawIcon(ctx, rect, iconConfig) {
    if (iconConfig.type === 'custom' && iconConfig.url) {
      const img = this.iconCache.get(iconConfig.url);
      if (img) {
        ctx.drawImage(img, rect.x + 8, rect.y + 4, 16, 16);
      }
    } else {
      drawIcon(ctx, rect, iconConfig);
    }
  }
}

// Initialize icon manager
const iconManager = new IconManager(table);

// Method 4: Custom icon renderer
function createIconRenderer(iconConfig) {
  return (ctx, rect) => {
    // Preserve original icon configuration
    const originalIcon = iconConfig;
    
    return {
      type: 'custom',
      render: (ctx, rect) => {
        // Draw icon
        if (originalIcon) {
          iconManager.drawIcon(ctx, rect, originalIcon);
        }
        
        // Return icon width for content positioning
        return originalIcon ? 24 : 0;
      }
    };
  };
}
```

## Related Links

- [VTable Icon Documentation](https://visactor.io/vtable/guide/basic_concept/icon)
- [Custom Rendering Guide](https://visactor.io/vtable/guide/advanced/custom_render)
- [Icon Examples](https://visactor.io/vtable/examples/icon/basic)