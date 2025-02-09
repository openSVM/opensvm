# How to implement scrollbar DOM container boundary display

## Question

How to implement scrollbar DOM container boundary display?

## Answer

VTable provides several ways to handle scrollbar boundaries:
1. Scrollbar configuration
2. Container boundaries
3. Custom scrollbar styling
4. Overflow handling

## Code Example

```typescript
const table = new VTable.ListTable({
  container: document.getElementById('container'),
  columns: columns,
  records: data,
  // Method 1: Basic scrollbar configuration
  scrollBehavior: {
    // Show scrollbars only when needed
    overflowX: 'auto',
    overflowY: 'auto',
    // Scrollbar appearance
    scrollbarSize: 8,
    showScrollbarTrack: true
  }
});

// Method 2: Custom container with boundary handling
function setupTableContainer() {
  const container = document.getElementById('container');
  
  // Set container style
  container.style.cssText = `
    position: relative;
    width: 100%;
    height: 400px;
    border: 1px solid #ddd;
    overflow: hidden; /* Hide native scrollbars */
  `;
  
  // Create custom scrollbar container
  const scrollContainer = document.createElement('div');
  scrollContainer.style.cssText = `
    position: absolute;
    right: 0;
    top: 0;
    width: 12px;
    height: 100%;
    background: #f5f5f5;
  `;
  
  container.appendChild(scrollContainer);
  
  return { container, scrollContainer };
}

// Method 3: Custom scrollbar implementation
class CustomScrollbar {
  constructor(table, container) {
    this.table = table;
    this.container = container;
    this.setupScrollbar();
  }
  
  setupScrollbar() {
    const scrollbar = document.createElement('div');
    scrollbar.className = 'custom-scrollbar';
    scrollbar.style.cssText = `
      position: absolute;
      right: 2px;
      width: 8px;
      background: #bbb;
      border-radius: 4px;
      cursor: pointer;
      transition: opacity 0.2s;
      opacity: 0;
    `;
    
    this.container.appendChild(scrollbar);
    this.scrollbar = scrollbar;
    
    this.bindEvents();
    this.updateScrollbar();
  }
  
  bindEvents() {
    // Show/hide scrollbar on hover
    this.container.addEventListener('mouseenter', () => {
      this.scrollbar.style.opacity = '1';
    });
    
    this.container.addEventListener('mouseleave', () => {
      if (!this.isDragging) {
        this.scrollbar.style.opacity = '0';
      }
    });
    
    // Handle scroll events
    this.table.on('scroll', () => {
      this.updateScrollbar();
    });
    
    // Handle scrollbar drag
    let startY, startScroll;
    
    this.scrollbar.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      startY = e.clientY;
      startScroll = this.table.getScrollOffset().top;
      
      document.addEventListener('mousemove', onDrag);
      document.addEventListener('mouseup', stopDrag);
    });
    
    const onDrag = (e) => {
      if (!this.isDragging) return;
      
      const delta = e.clientY - startY;
      const scrollRatio = this.container.clientHeight / this.table.getTotalHeight();
      this.table.scrollTo(0, startScroll + (delta / scrollRatio));
    };
    
    const stopDrag = () => {
      this.isDragging = false;
      document.removeEventListener('mousemove', onDrag);
      document.removeEventListener('mouseup', stopDrag);
      
      if (!this.container.matches(':hover')) {
        this.scrollbar.style.opacity = '0';
      }
    };
  }
  
  updateScrollbar() {
    const { scrollTop } = this.table.getScrollOffset();
    const totalHeight = this.table.getTotalHeight();
    const viewportHeight = this.container.clientHeight;
    
    // Calculate scrollbar dimensions
    const scrollRatio = viewportHeight / totalHeight;
    const scrollbarHeight = Math.max(30, viewportHeight * scrollRatio);
    const scrollbarTop = (scrollTop / totalHeight) * viewportHeight;
    
    // Update scrollbar position
    this.scrollbar.style.height = `${scrollbarHeight}px`;
    this.scrollbar.style.top = `${scrollbarTop}px`;
  }
}

// Initialize with custom scrollbar
const { container, scrollContainer } = setupTableContainer();
const customScrollbar = new CustomScrollbar(table, scrollContainer);
```

## Related Links

- [VTable Scroll Documentation](https://visactor.io/vtable/guide/basic_concept/scroll)
- [Container Configuration](https://visactor.io/vtable/guide/basic_concept/container)
- [Custom Scrollbar Examples](https://visactor.io/vtable/examples/scroll/custom)