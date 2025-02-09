# How to control the timing of exiting edit mode after implementing editable cells in VTable components

## Question

How to control the timing of exiting edit mode after implementing editable cells in VTable components?

## Answer

VTable provides several ways to control edit mode exit timing:
1. Edit mode event handling
2. Custom exit conditions
3. Validation-based exit
4. Edit state management

## Code Example

```typescript
const columns = [
  {
    field: 'name',
    title: 'Name',
    width: 150,
    editor: {
      type: 'text',
      // Method 1: Basic edit control
      options: {
        autoCommit: false, // Disable automatic commit
        validateOnExit: true // Enable validation before exit
      }
    }
  }
];

// Create table with edit control
const table = new VTable.ListTable({
  container: document.getElementById('container'),
  columns: columns,
  records: data,
  editor: {
    enabled: true
  }
});

// Method 2: Edit mode controller
class EditController {
  constructor(table) {
    this.table = table;
    this.setupEditHandlers();
    this.pendingChanges = new Map();
  }
  
  setupEditHandlers() {
    // Handle edit start
    this.table.on('edit-start', (event) => {
      this.handleEditStart(event);
    });
    
    // Handle edit end attempt
    this.table.on('before-edit-end', (event) => {
      this.handleEditEnd(event);
    });
    
    // Handle value changes
    this.table.on('edit-value-change', (event) => {
      this.handleValueChange(event);
    });
  }
  
  handleEditStart(event) {
    const { row, col } = event;
    // Store original value
    this.pendingChanges.set(
      `${row},${col}`,
      this.table.getCellValue(row, col)
    );
  }
  
  handleEditEnd(event) {
    const { row, col, value } = event;
    
    // Validate changes before allowing exit
    if (!this.validateEdit(row, col, value)) {
      event.preventDefault();
      return;
    }
    
    // Clear pending changes
    this.pendingChanges.delete(`${row},${col}`);
  }
  
  handleValueChange(event) {
    const { row, col, value } = event;
    // Perform real-time validation
    if (!this.validateValue(value)) {
      this.showValidationError(row, col);
    }
  }
  
  validateEdit(row, col, value) {
    // Implement custom validation logic
    return true;
  }
  
  validateValue(value) {
    // Implement value validation
    return true;
  }
  
  showValidationError(row, col) {
    // Show error indication
  }
  
  cancelEdit(row, col) {
    const key = `${row},${col}`;
    const originalValue = this.pendingChanges.get(key);
    
    if (originalValue !== undefined) {
      this.table.updateCell(row, col, originalValue);
      this.pendingChanges.delete(key);
    }
    
    this.table.stopEdit();
  }
}

// Initialize edit controller
const editController = new EditController(table);

// Method 3: Custom exit conditions
function shouldExitEdit(cell, value) {
  // Check if value meets requirements
  if (!isValidValue(value)) {
    return false;
  }
  
  // Check if all required fields are filled
  if (hasRequiredFields(cell.row) && !areRequiredFieldsFilled(cell.row)) {
    return false;
  }
  
  return true;
}

// Method 4: Edit state manager
class EditStateManager {
  constructor(table) {
    this.table = table;
    this.editingCells = new Set();
    this.setupStateTracking();
  }
  
  setupStateTracking() {
    this.table.on('edit-start', (event) => {
      this.editingCells.add(`${event.row},${event.col}`);
    });
    
    this.table.on('edit-end', (event) => {
      this.editingCells.delete(`${event.row},${event.col}`);
    });
  }
  
  isEditing(row, col) {
    return this.editingCells.has(`${row},${col}`);
  }
  
  getEditingCells() {
    return Array.from(this.editingCells).map(key => {
      const [row, col] = key.split(',').map(Number);
      return { row, col };
    });
  }
  
  finishAllEdits() {
    this.getEditingCells().forEach(cell => {
      this.table.stopEdit(cell.row, cell.col);
    });
  }
}

// Initialize state manager
const editStateManager = new EditStateManager(table);
```

## Related Links

- [VTable Editor Documentation](https://visactor.io/vtable/guide/basic_concept/editor)
- [Edit Events Guide](https://visactor.io/vtable/guide/basic_concept/events)
- [Edit Mode Examples](https://visactor.io/vtable/examples/editor/edit-mode)