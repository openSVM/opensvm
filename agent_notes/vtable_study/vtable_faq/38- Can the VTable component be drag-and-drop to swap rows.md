# Can the VTable component be drag-and-drop to swap rows

## Question

Can the VTable component be drag-and-drop to swap rows?

## Answer

Yes, VTable can implement row swapping through drag-and-drop using:
1. Drag event handling
2. Visual feedback
3. Row reordering
4. State management

## Code Example

```typescript
const table = new VTable.ListTable({
  container: document.getElementById('container'),
  columns: columns,
  records: data
});

// Implement row drag-and-drop
class RowDragManager {
  constructor(table) {
    this.table = table;
    this.draggedRow = null;
    this.dragOverRow = null;
    this.dragIndicator = null;
    
    this.setupDragAndDrop();
  }
  
  setupDragAndDrop() {
    // Create drag indicator
    this.createDragIndicator();
    
    // Add drag handlers to rows
    this.table.on('mousedown', (event) => {
      const row = this.table.getRowByEvent(event);
      if (row !== null) {
        this.startDrag(row, event);
      }
    });
    
    document.addEventListener('mousemove', this.onDrag.bind(this));
    document.addEventListener('mouseup', this.endDrag.bind(this));
  }
  
  createDragIndicator() {
    this.dragIndicator = document.createElement('div');
    this.dragIndicator.className = 'row-drag-indicator';
    this.dragIndicator.style.cssText = `
      position: absolute;
      left: 0;
      right: 0;
      height: 2px;
      background: #1890ff;
      pointer-events: none;
      display: none;
      z-index: 1000;
    `;
    
    this.table.getContainer().appendChild(this.dragIndicator);
  }
  
  startDrag(row, event) {
    this.draggedRow = row;
    
    // Add dragging visual feedback
    const rowElement = this.table.getRowElement(row);
    rowElement.classList.add('dragging');
    
    // Store initial mouse position
    this.startY = event.clientY;
    
    // Prevent text selection
    event.preventDefault();
  }
  
  onDrag(event) {
    if (!this.draggedRow) return;
    
    const currentRow = this.table.getRowFromPoint(event.clientX, event.clientY);
    
    if (currentRow !== null && currentRow !== this.draggedRow) {
      this.dragOverRow = currentRow;
      this.showDragIndicator(currentRow);
    } else {
      this.dragOverRow = null;
      this.hideDragIndicator();
    }
  }
  
  endDrag() {
    if (!this.draggedRow) return;
    
    // Remove dragging visual feedback
    const rowElement = this.table.getRowElement(this.draggedRow);
    rowElement.classList.remove('dragging');
    
    // Perform row swap if there's a target row
    if (this.dragOverRow !== null) {
      this.swapRows(this.draggedRow, this.dragOverRow);
    }
    
    // Clean up
    this.draggedRow = null;
    this.dragOverRow = null;
    this.hideDragIndicator();
  }
  
  showDragIndicator(row) {
    const rowRect = this.table.getRowRect(row);
    this.dragIndicator.style.top = `${rowRect.y}px`;
    this.dragIndicator.style.display = 'block';
  }
  
  hideDragIndicator() {
    this.dragIndicator.style.display = 'none';
  }
  
  swapRows(sourceRow, targetRow) {
    // Get current data
    const data = this.table.getData();
    
    // Swap rows in data array
    const temp = data[sourceRow];
    data[sourceRow] = data[targetRow];
    data[targetRow] = temp;
    
    // Update table
    this.table.setRecords(data);
    
    // Emit change event
    this.table.emit('row-swap', {
      sourceRow,
      targetRow,
      data
    });
  }
}

// Initialize drag-and-drop
const dragManager = new RowDragManager(table);

// Add drag styles
const style = document.createElement('style');
style.textContent = `
  .dragging {
    opacity: 0.5;
    background: #f5f5f5;
  }
`;
document.head.appendChild(style);

// Optional: Handle row swap events
table.on('row-swap', (event) => {
  console.log('Rows swapped:', event);
  // Persist new order if needed
  saveRowOrder(event.data);
});
```

## Related Links

- [VTable Event Documentation](https://visactor.io/vtable/guide/basic_concept/events)
- [Row Configuration Guide](https://visactor.io/vtable/guide/basic_concept/rows)
- [Custom Interaction Examples](https://visactor.io/vtable/examples/interaction/custom)