# VTable table component, using customLayout to customize the drawing elements, how to listen for mouse hover events on the elements, similar to the DOM's mouseenter event

## Question

When using customLayout to customize drawing elements in VTable, how to listen for mouse hover events on the elements, similar to the DOM's mouseenter event?

## Answer

You can implement hover detection for custom elements through:
1. Hit testing
2. Hover state tracking
3. Event handling
4. Custom hover regions

## Code Example

```typescript
// Method 1: Basic hover detection
const columns = [
  {
    field: 'custom',
    title: 'Custom Layout',
    width: 200,
    render: (cell) => ({
      type: 'custom',
      render: (ctx, rect, helpers) => {
        const { isHovered } = helpers;
        
        // Draw different states based on hover
        if (isHovered) {
          drawHoverState(ctx, rect);
        } else {
          drawNormalState(ctx, rect);
        }
      }
    })
  }
];

// Method 2: Custom hover region manager
class HoverRegionManager {
  constructor(table) {
    this.table = table;
    this.regions = new Map();
    this.hoveredRegion = null;
    this.setupHoverTracking();
  }
  
  setupHoverTracking() {
    this.table.on('mousemove', (event) => {
      const { x, y } = event;
      this.checkHover(x, y);
    });
    
    this.table.on('mouseleave', () => {
      this.clearHover();
    });
  }
  
  addRegion(id, bounds, callbacks) {
    this.regions.set(id, { bounds, callbacks });
  }
  
  removeRegion(id) {
    this.regions.delete(id);
  }
  
  checkHover(x, y) {
    let newHoveredRegion = null;
    
    // Check each region
    for (const [id, region] of this.regions) {
      if (this.isPointInBounds(x, y, region.bounds)) {
        newHoveredRegion = id;
        break;
      }
    }
    
    // Handle hover state changes
    if (newHoveredRegion !== this.hoveredRegion) {
      // Handle mouseout
      if (this.hoveredRegion) {
        const oldRegion = this.regions.get(this.hoveredRegion);
        oldRegion.callbacks.onMouseOut?.();
      }
      
      // Handle mouseenter
      if (newHoveredRegion) {
        const newRegion = this.regions.get(newHoveredRegion);
        newRegion.callbacks.onMouseEnter?.();
      }
      
      this.hoveredRegion = newHoveredRegion;
      this.table.render();
    }
  }
  
  isPointInBounds(x, y, bounds) {
    return x >= bounds.x && 
           x <= bounds.x + bounds.width &&
           y >= bounds.y && 
           y <= bounds.y + bounds.height;
  }
  
  clearHover() {
    if (this.hoveredRegion) {
      const region = this.regions.get(this.hoveredRegion);
      region.callbacks.onMouseOut?.();
      this.hoveredRegion = null;
      this.table.render();
    }
  }
  
  isHovered(id) {
    return this.hoveredRegion === id;
  }
}

// Initialize hover manager
const hoverManager = new HoverRegionManager(table);

// Method 3: Custom element with hover
class CustomElement {
  constructor(id, rect) {
    this.id = id;
    this.rect = rect;
    this.isHovered = false;
    this.setupHover();
  }
  
  setupHover() {
    hoverManager.addRegion(this.id, this.rect, {
      onMouseEnter: () => {
        this.isHovered = true;
        this.onHoverChange();
      },
      onMouseOut: () => {
        this.isHovered = false;
        this.onHoverChange();
      }
    });
  }
  
  onHoverChange() {
    // Handle hover state change
  }
  
  render(ctx) {
    ctx.fillStyle = this.isHovered ? '#e6f7ff' : '#ffffff';
    ctx.fillRect(
      this.rect.x,
      this.rect.y,
      this.rect.width,
      this.rect.height
    );
  }
  
  dispose() {
    hoverManager.removeRegion(this.id);
  }
}

// Method 4: Complex layout with multiple hover regions
function createComplexLayout(cell) {
  const elements = [];
  const baseRect = cell.rect;
  
  // Create icon element
  elements.push(new CustomElement(
    `${cell.row}-icon`,
    {
      x: baseRect.x,
      y: baseRect.y,
      width: 24,
      height: baseRect.height
    }
  ));
  
  // Create text element
  elements.push(new CustomElement(
    `${cell.row}-text`,
    {
      x: baseRect.x + 24,
      y: baseRect.y,
      width: baseRect.width - 48,
      height: baseRect.height
    }
  ));
  
  // Create action button
  elements.push(new CustomElement(
    `${cell.row}-action`,
    {
      x: baseRect.x + baseRect.width - 24,
      y: baseRect.y,
      width: 24,
      height: baseRect.height
    }
  ));
  
  return {
    type: 'custom',
    render: (ctx, rect) => {
      elements.forEach(element => element.render(ctx));
    },
    dispose: () => {
      elements.forEach(element => element.dispose());
    }
  };
}
```

## Related Links

- [VTable Custom Layout Documentation](https://visactor.io/vtable/guide/advanced/custom_layout)
- [Event Handling Guide](https://visactor.io/vtable/guide/basic_concept/events)
- [Interactive Examples](https://visactor.io/vtable/examples/interaction/hover)