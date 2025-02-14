# How to manually update the state when using the Checkbox in the VTable component

## Question

How to manually update the state when using the Checkbox in the VTable component?

## Answer

VTable provides several ways to manage checkbox states:
1. Manual state control
2. Checkbox event handling
3. State synchronization
4. Batch updates

## Code Example

```typescript
const columns = [
  {
    // Method 1: Basic checkbox column
    field: 'selected',
    title: 'Select',
    width: 60,
    columnType: 'checkbox',
    checkbox: {
      // Manual state control
      checked: (cell) => {
        return getCheckboxState(cell.row);
      },
      // Handle state changes
      onChange: (cell, checked) => {
        updateCheckboxState(cell.row, checked);
      }
    }
  }
];

// Create table with checkboxes
const table = new VTable.ListTable({
  container: document.getElementById('container'),
  columns: columns,
  records: data
});

// Method 2: Checkbox state manager
class CheckboxManager {
  constructor(table) {
    this.table = table;
    this.checkedRows = new Set();
    this.setupEventHandlers();
  }
  
  setupEventHandlers() {
    // Handle checkbox changes
    this.table.on('checkbox-change', (event) => {
      const { row, checked } = event;
      this.updateState(row, checked);
    });
  }
  
  updateState(row, checked) {
    if (checked) {
      this.checkedRows.add(row);
    } else {
      this.checkedRows.delete(row);
    }
    
    this.notifyStateChange();
  }
  
  isChecked(row) {
    return this.checkedRows.has(row);
  }
  
  setChecked(row, checked) {
    this.updateState(row, checked);
    this.table.render();
  }
  
  toggleRow(row) {
    this.setChecked(row, !this.isChecked(row));
  }
  
  selectAll() {
    const rowCount = this.table.getRowCount();
    for (let i = 0; i < rowCount; i++) {
      this.checkedRows.add(i);
    }
    this.table.render();
  }
  
  deselectAll() {
    this.checkedRows.clear();
    this.table.render();
  }
  
  getSelectedRows() {
    return Array.from(this.checkedRows);
  }
  
  notifyStateChange() {
    this.table.emit('custom-selection-change', {
      selectedRows: this.getSelectedRows()
    });
  }
}

// Initialize checkbox manager
const checkboxManager = new CheckboxManager(table);

// Method 3: Batch operations
function updateMultipleStates(rows, checked) {
  rows.forEach(row => {
    checkboxManager.setChecked(row, checked);
  });
}

// Method 4: Conditional selection
function selectByCondition(predicate) {
  const data = table.getData();
  data.forEach((record, index) => {
    if (predicate(record)) {
      checkboxManager.setChecked(index, true);
    }
  });
}

// Example usage
function selectRowsWithValue(field, value) {
  selectByCondition(record => record[field] === value);
}

// Example: Select all rows where status is 'active'
selectRowsWithValue('status', 'active');

// Example: Custom checkbox state validation
function validateCheckboxState(row) {
  const record = table.getData()[row];
  // Implement custom validation logic
  return record.isSelectable !== false;
}

// Update checkbox configuration to include validation
const columnsWithValidation = columns.map(column => {
  if (column.columnType === 'checkbox') {
    return {
      ...column,
      checkbox: {
        ...column.checkbox,
        disabled: (cell) => !validateCheckboxState(cell.row)
      }
    };
  }
  return column;
});

table.updateColumns(columnsWithValidation);

// Example: Sync checkbox states with external state
function syncWithExternalState(externalState) {
  checkboxManager.deselectAll();
  
  externalState.selectedIds.forEach(id => {
    const row = findRowByRecordId(id);
    if (row !== -1) {
      checkboxManager.setChecked(row, true);
    }
  });
}

function findRowByRecordId(id) {
  const data = table.getData();
  return data.findIndex(record => record.id === id);
}
```

## Related Links

- [VTable Checkbox Documentation](https://visactor.io/vtable/guide/basic_concept/checkbox)
- [Selection Management Guide](https://visactor.io/vtable/guide/basic_concept/selection)
- [Checkbox Examples](https://visactor.io/vtable/examples/checkbox/basic)