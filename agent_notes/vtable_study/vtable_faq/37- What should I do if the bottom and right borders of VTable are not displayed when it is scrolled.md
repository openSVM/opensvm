# What should I do if the bottom and right borders of VTable are not displayed when it is scrolled

## Question

What should I do if the bottom and right borders of VTable are not displayed when it is scrolled?

## Answer

This issue can be resolved through:
1. Container padding configuration
2. Border overlay implementation
3. Scroll boundary handling
4. Custom border rendering

## Code Example

```typescript
// Method 1: Container padding configuration
const table = new VTable.ListTable({
  container: document.getElementById('container'),
  columns: columns,
  records: data,
  // Add padding to ensure borders are visible
  style: {
    padding: {
      right: 1,  // Space for right border
      bottom: 1  // Space for bottom border
    }
  }
});

// Method 2: Border overlay implementation
function addBorderOverlay() {
  const container = table.getContainer();
  
  // Create border overlay elements
  const rightBorder = document.createElement('div');
  rightBorder.className = 'table-border right';
  rightBorder.style.cssText = `
    position: absolute;
    top: 0;
    right: 0;
    width: 1px;
    height: 100%;
    background: #ddd;
    pointer-events: none;
  `;
  
  const bottomBorder = document.createElement('div');
  bottomBorder.className = 'table-border bottom';
  bottomBorder.style.cssText = `
    position: absolute;
    left: 0;
    bottom: 0;
    width: 100%;
    height: 1px;
    background: #ddd;
    pointer-events: none;
  `;
  
  container.appendChild(rightBorder);
  container.appendChild(bottomBorder);
  
  // Update border positions on scroll
  table.on('scroll', () => {
    updateBorderPositions(rightBorder, bottomBorder);
  });
}

function updateBorderPositions(rightBorder, bottomBorder) {
  const scrollInfo = table.getScrollOffset();
  const viewport = table.getViewport();
  
  // Update right border position
  rightBorder.style.transform = `translateX(${scrollInfo.left}px)`;
  
  // Update bottom border position
  bottomBorder.style.transform = `translateY(${scrollInfo.top}px)`;
}

// Method 3: Scroll boundary handling
function handleScrollBoundaries() {
  const container = table.getContainer();
  
  // Add boundary class based on scroll position
  table.on('scroll', () => {
    const { scrollLeft, scrollTop } = table.getScrollOffset();
    const { scrollWidth, scrollHeight } = table.getScrollBounds();
    const { width, height } = table.getViewport();
    
    // Check if at boundaries
    const atRight = scrollLeft + width >= scrollWidth;
    const atBottom = scrollTop + height >= scrollHeight;
    
    // Update container classes
    container.classList.toggle('at-right-boundary', atRight);
    container.classList.toggle('at-bottom-boundary', atBottom);
  });
}

// Method 4: Custom border rendering
function setupCustomBorders() {
  const originalRender = table.render.bind(table);
  
  table.render = () => {
    // Perform original render
    originalRender();
    
    // Add custom borders
    const ctx = table.getContext();
    const viewport = table.getViewport();
    
    ctx.strokeStyle = '#ddd';
    ctx.lineWidth = 1;
    
    // Draw right border
    ctx.beginPath();
    ctx.moveTo(viewport.width - 0.5, 0);
    ctx.lineTo(viewport.width - 0.5, viewport.height);
    ctx.stroke();
    
    // Draw bottom border
    ctx.beginPath();
    ctx.moveTo(0, viewport.height - 0.5);
    ctx.lineTo(viewport.width, viewport.height - 0.5);
    ctx.stroke();
  };
}

// Initialize all border solutions
function initializeBorderSolutions() {
  addBorderOverlay();
  handleScrollBoundaries();
  setupCustomBorders();
  
  // Add CSS for boundary indicators
  const style = document.createElement('style');
  style.textContent = `
    .at-right-boundary .table-border.right {
      display: none;
    }
    .at-bottom-boundary .table-border.bottom {
      display: none;
    }
  `;
  document.head.appendChild(style);
}
```

## Related Links

- [VTable Scroll Documentation](https://visactor.io/vtable/guide/basic_concept/scroll)
- [Border Configuration](https://visactor.io/vtable/guide/basic_concept/style)
- [Custom Rendering Guide](https://visactor.io/vtable/guide/advanced/custom_render)