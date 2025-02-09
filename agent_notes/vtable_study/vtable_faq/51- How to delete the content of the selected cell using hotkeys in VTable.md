# How to delete the content of the selected cell using hotkeys in VTable

## Question

How to delete the content of the selected cell using hotkeys in VTable?

## Answer

VTable supports content deletion through hotkeys via:
1. Built-in hotkey configuration
2. Custom keyboard handlers
3. Selection-based deletion
4. Batch deletion operations

## Code Example

```typescript
// Create table with hotkey support
const table = new VTable.ListTable({
  container: document.getElementById('container'),
  columns: columns,
  records: data,
  // Enable selection
  selection: {
    enabled: true,
    mode: 'multiple'
  },
  // Method 1: Configure built-in hotkeys
  keyboardOptions: {
    delete: true, // Enable Delete key
    backspace: true // Enable Backspace key
  }
});

// Method 2: Custom keyboard handler
class KeyboardManager {
  constructor(table) {
    this.table = table;
    this.setupKeyboardHandlers();
  }
  
  setupKeyboardHandlers() {
    document.addEventListener('keydown', (event) => {
      // Check if table has focus
      if (!this.table.hasFocus()) return;
      
      if (this.isDeleteKey(event)) {
        this.handleDelete(event);
      }
    });
  }
  
  isDeleteKey(event) {
    return event.key === 'Delete' || 
           (event.key === 'Backspace' && !this.table.isEditing());
  }
  
  handleDelete(event) {
    event.preventDefault();
    
    const selection = this.table.getSelection();
    if (!selection) return;
    
    this.deleteSelectedContent(selection);
  }
  
  deleteSelectedContent(selection) {
    // Get all cells in selection
    const cells = this.getCellsInSelection(selection);
    
    // Delete content from each cell
    cells.forEach(cell => {
      this.deleteCellContent(cell);
    });
    
    // Update table
    this.table.render();
  }
  
  getCellsInSelection(selection) {
    const cells = [];
    
    for (let row = selection.start.row; row <= selection.end.row; row++) {
      for (let col = selection.start.col; col <= selection.end.col; col++) {
        cells.push({ row, col });
      }
    }
    
    return cells;
  }
  
  deleteCellContent(cell) {
    // Check if cell is editable
    if (this.isCellEditable(cell)) {
      this.table.updateCell(cell.row, cell.col, null);
    }
  }
  
  isCellEditable(cell) {
    const column = this.table.getColumns()[cell.col];
    return column.editable !== false;
  }
}

// Initialize keyboard manager
const keyboardManager = new KeyboardManager(table);

// Method 3: Selection-based deletion API
function deleteSelection() {
  const selection = table.getSelection();
  if (!selection) return;
  
  table.startBatchOperation();
  
  try {
    // Delete content in selected range
    for (let row = selection.start.row; row <= selection.end.row; row++) {
      for (let col = selection.start.col; col <= selection.end.col; col++) {
        table.updateCell(row, col, null);
      }
    }
  } finally {
    table.endBatchOperation();
  }
}

// Method 4: Batch deletion with undo support
class DeleteOperation {
  constructor(table, cells) {
    this.table = table;
    this.cells = cells;
    this.oldValues = new Map();
  }
  
  execute() {
    this.cells.forEach(cell => {
      // Store old value for undo
      this.oldValues.set(
        `${cell.row},${cell.col}`,
        this.table.getCellValue(cell.row, cell.col)
      );
      
      // Delete content
      this.table.updateCell(cell.row, cell.col, null);
    });
  }
  
  undo() {
    this.cells.forEach(cell => {
      const key = `${cell.row},${cell.col}`;
      const oldValue = this.oldValues.get(key);
      
      if (oldValue !== undefined) {
        this.table.updateCell(cell.row, cell.col, oldValue);
      }
    });
  }
}

// Example usage with undo support
const undoStack = [];

function deleteWithUndo(cells) {
  const operation = new DeleteOperation(table, cells);
  operation.execute();
  undoStack.push(operation);
}

function undo() {
  const operation = undoStack.pop();
  if (operation) {
    operation.undo();
  }
}
```

## Related Links

- [VTable Keyboard Documentation](https://visactor.io/vtable/guide/basic_concept/keyboard)
- [Selection Guide](https://visactor.io/vtable/guide/basic_concept/selection)
- [Cell Update Examples](https://visactor.io/vtable/examples/cell/update)