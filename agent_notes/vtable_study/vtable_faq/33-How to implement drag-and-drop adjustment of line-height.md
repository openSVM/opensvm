# How to implement drag-and-drop adjustment of line-height

## Question

How to implement drag-and-drop adjustment of line-height?

## Answer

VTable supports drag-and-drop line height adjustment through:
1. Row resize handlers
2. Drag interaction
3. Height constraints
4. Visual feedback

## Code Example

```typescript
const table = new VTable.ListTable({
  container: document.getElementById('container'),
  columns: columns,
  records: data,
  // Enable row resize
  rowResize: {
    enabled: true,
    minHeight: 30,
    maxHeight: 200
  }
});

// Implement custom row resize functionality
class RowResizeManager {
  constructor(table) {
    this.table = table;
    this.isDragging = false;
    this.currentRow = null;
    this.startY = 0;
    this.startHeight = 0;
    
    this.setupResizeHandlers();
  }
  
  setupResizeHandlers() {
    const container = this.table.getContainer();
    
    // Add resize handles to rows
    this.table.on('render', () => {
      this.addResizeHandles();
    });
    
    // Handle drag events
    container.addEventListener('mousedown', this.onDragStart.bind(this));
    document.addEventListener('mousemove', this.onDrag.bind(this));
    document.addEventListener('mouseup', this.onDragEnd.bind(this));
  }
  
  addResizeHandles() {
    const rows = this.table.getAllRows();
    rows.forEach(row => {
      const handle = document.createElement('div');
      handle.className = 'row-resize-handle';
      handle.style.cssText = `
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        height: 4px;
        cursor: row-resize;
        background: transparent;
        transition: background-color 0.2s;
      `;
      
      handle.dataset.rowIndex = row.index;
      
      // Show handle on hover
      handle.addEventListener('mouseenter', () => {
        handle.style.backgroundColor = 'rgba(24,144,255,0.2)';
      });
      
      handle.addEventListener('mouseleave', () => {
        if (!this.isDragging) {
          handle.style.backgroundColor = 'transparent';
        }
      });
      
      const rowElement = this.table.getRowElement(row.index);
      if (rowElement) {
        rowElement.appendChild(handle);
      }
    });
  }
  
  onDragStart(event) {
    const handle = event.target.closest('.row-resize-handle');
    if (!handle) return;
    
    this.isDragging = true;
    this.currentRow = parseInt(handle.dataset.rowIndex);
    this.startY = event.clientY;
    this.startHeight = this.table.getRowHeight(this.currentRow);
    
    // Add visual feedback
    document.body.style.cursor = 'row-resize';
    this.showResizeGuide();
  }
  
  onDrag(event) {
    if (!this.isDragging) return;
    
    const delta = event.clientY - this.startY;
    const newHeight = Math.max(30, Math.min(200, this.startHeight + delta));
    
    // Update resize guide position
    this.updateResizeGuide(newHeight);
    
    // Optional: Live update row height
    this.table.setRowHeight(this.currentRow, newHeight);
  }
  
  onDragEnd() {
    if (!this.isDragging) return;
    
    this.isDragging = false;
    this.currentRow = null;
    
    // Remove visual feedback
    document.body.style.cursor = '';
    this.removeResizeGuide();
    
    // Refresh table layout
    this.table.render();
  }
  
  showResizeGuide() {
    const guide = document.createElement('div');
    guide.className = 'resize-guide';
    guide.style.cssText = `
      position: fixed;
      left: 0;
      right: 0;
      height: 1px;
      background: #1890ff;
      pointer-events: none;
    `;
    
    document.body.appendChild(guide);
    this.resizeGuide = guide;
  }
  
  updateResizeGuide(height) {
    if (!this.resizeGuide) return;
    
    const rowRect = this.table.getRowRect(this.currentRow);
    this.resizeGuide.style.top = `${rowRect.y + height}px`;
  }
  
  removeResizeGuide() {
    if (this.resizeGuide) {
      this.resizeGuide.remove();
      this.resizeGuide = null;
    }
  }
}

// Initialize row resize functionality
const rowResize = new RowResizeManager(table);
```

## Related Links

- [VTable Row Configuration](https://visactor.io/vtable/guide/basic_concept/rows)
- [Row Height Examples](https://visactor.io/vtable/examples/row/height)
- [Drag and Drop Guide](https://visactor.io/vtable/guide/advanced/drag_drop)