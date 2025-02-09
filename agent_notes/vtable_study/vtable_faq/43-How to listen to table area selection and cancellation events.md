# How to listen to table area selection and cancellation events

## Question

How to listen to table area selection and cancellation events?

## Answer

VTable provides several ways to handle selection events:
1. Selection event listeners
2. Selection state tracking
3. Custom selection handling
4. Selection range management

## Code Example

```typescript
const table = new VTable.ListTable({
  container: document.getElementById('container'),
  columns: columns,
  records: data,
  // Enable selection
  selection: {
    enabled: true,
    mode: 'multiple', // or 'single'
    showSelectedBorder: true
  }
});

// Method 1: Basic selection events
table.on('selection-change', (event) => {
  const { ranges, added, removed } = event;
  
  console.log('Selected ranges:', ranges);
  console.log('Newly selected cells:', added);
  console.log('Deselected cells:', removed);
});

// Method 2: Detailed selection tracking
class SelectionTracker {
  constructor(table) {
    this.table = table;
    this.selectedRanges = new Set();
    this.setupListeners();
  }
  
  setupListeners() {
    // Track selection changes
    this.table.on('selection-change', this.handleSelectionChange.bind(this));
    
    // Track selection cancellation
    this.table.on('selection-cancel', this.handleSelectionCancel.bind(this));
    
    // Track selection start
    this.table.on('selection-start', this.handleSelectionStart.bind(this));
    
    // Track selection end
    this.table.on('selection-end', this.handleSelectionEnd.bind(this));
  }
  
  handleSelectionChange(event) {
    const { ranges } = event;
    this.selectedRanges = new Set(ranges);
    this.notifySelectionUpdate();
  }
  
  handleSelectionCancel() {
    this.selectedRanges.clear();
    this.notifySelectionUpdate();
  }
  
  handleSelectionStart(event) {
    const { row, col } = event;
    console.log('Selection started at:', { row, col });
  }
  
  handleSelectionEnd(event) {
    const { ranges } = event;
    console.log('Selection ended with ranges:', ranges);
  }
  
  notifySelectionUpdate() {
    const selectedCells = this.getSelectedCells();
    this.emitSelectionUpdate(selectedCells);
  }
  
  getSelectedCells() {
    const cells = [];
    this.selectedRanges.forEach(range => {
      for (let row = range.start.row; row <= range.end.row; row++) {
        for (let col = range.start.col; col <= range.end.col; col++) {
          cells.push({
            row,
            col,
            value: this.table.getCellValue(row, col)
          });
        }
      }
    });
    return cells;
  }
  
  emitSelectionUpdate(cells) {
    this.table.emit('custom-selection-update', {
      cells,
      count: cells.length,
      isEmpty: cells.length === 0
    });
  }
}

// Method 3: Custom selection handler
class SelectionHandler {
  constructor(table) {
    this.table = table;
    this.setupCustomHandling();
  }
  
  setupCustomHandling() {
    // Handle selection before it occurs
    this.table.on('before-selection-change', (event) => {
      const { ranges } = event;
      
      // Optionally prevent selection
      if (!this.isValidSelection(ranges)) {
        event.preventDefault();
        return;
      }
      
      // Modify selection if needed
      event.ranges = this.adjustSelection(ranges);
    });
  }
  
  isValidSelection(ranges) {
    // Implement custom validation logic
    return ranges.every(range => {
      return this.isRangeValid(range);
    });
  }
  
  isRangeValid(range) {
    // Example: Prevent selection of specific columns
    const restrictedCols = [0, 2]; // Column indices to restrict
    return !restrictedCols.some(col => 
      col >= range.start.col && col <= range.end.col
    );
  }
  
  adjustSelection(ranges) {
    // Modify selection ranges if needed
    return ranges.map(range => {
      return this.adjustRange(range);
    });
  }
  
  adjustRange(range) {
    // Example: Expand selection to include related cells
    return {
      start: {
        row: range.start.row,
        col: range.start.col
      },
      end: {
        row: range.end.row,
        col: range.end.col + 1 // Include next column
      }
    };
  }
}

// Initialize selection handling
const selectionTracker = new SelectionTracker(table);
const selectionHandler = new SelectionHandler(table);

// Method 4: Selection state persistence
function saveSelectionState() {
  const selection = table.getSelection();
  if (selection) {
    localStorage.setItem('tableSelection', JSON.stringify(selection));
  }
}

function restoreSelectionState() {
  const savedSelection = localStorage.getItem('tableSelection');
  if (savedSelection) {
    try {
      const selection = JSON.parse(savedSelection);
      table.setSelection(selection);
    } catch (error) {
      console.error('Failed to restore selection:', error);
    }
  }
}
```

## Related Links

- [VTable Selection Documentation](https://visactor.io/vtable/guide/basic_concept/selection)
- [Event Handling Guide](https://visactor.io/vtable/guide/basic_concept/events)
- [Selection Examples](https://visactor.io/vtable/examples/interaction/selection)