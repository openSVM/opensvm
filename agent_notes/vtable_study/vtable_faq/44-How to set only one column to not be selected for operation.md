# How to set only one column to not be selected for operation

## Question

How to set only one column to not be selected for operation?

## Answer

VTable provides several ways to restrict column selection:
1. Column selection configuration
2. Selection event handling
3. Column-specific restrictions
4. Custom selection validation

## Code Example

```typescript
const columns = [
  {
    field: 'id',
    title: 'ID',
    width: 100,
    // Method 1: Disable selection for this column
    selectable: false
  },
  {
    field: 'name',
    title: 'Name',
    width: 150,
    // Allow selection for this column
    selectable: true
  }
];

// Create table with selection restrictions
const table = new VTable.ListTable({
  container: document.getElementById('container'),
  columns: columns,
  records: data,
  // Enable selection
  selection: {
    enabled: true,
    mode: 'multiple',
    showSelectedBorder: true
  }
});

// Method 2: Selection event handling
table.on('before-selection-change', (event) => {
  const { ranges } = event;
  
  // Check if restricted column is included in selection
  const hasRestrictedColumn = ranges.some(range => 
    isRestrictedColumnInRange(range)
  );
  
  if (hasRestrictedColumn) {
    // Prevent selection
    event.preventDefault();
    // Or modify selection to exclude restricted column
    event.ranges = adjustRangesToExcludeRestricted(ranges);
  }
});

// Helper function to check if range includes restricted column
function isRestrictedColumnInRange(range) {
  const restrictedColumnIndex = 0; // Index of the restricted column
  return range.start.col <= restrictedColumnIndex && 
         range.end.col >= restrictedColumnIndex;
}

// Helper function to adjust selection ranges
function adjustRangesToExcludeRestricted(ranges) {
  const restrictedColumnIndex = 0;
  
  return ranges.map(range => {
    // If range crosses restricted column, split it
    if (range.start.col < restrictedColumnIndex && 
        range.end.col > restrictedColumnIndex) {
      return [
        {
          start: { ...range.start },
          end: { ...range.end, col: restrictedColumnIndex - 1 }
        },
        {
          start: { ...range.start, col: restrictedColumnIndex + 1 },
          end: { ...range.end }
        }
      ];
    }
    return range;
  }).flat();
}

// Method 3: Selection manager
class SelectionManager {
  constructor(table, restrictedColumns) {
    this.table = table;
    this.restrictedColumns = new Set(restrictedColumns);
    this.setupSelectionHandling();
  }
  
  setupSelectionHandling() {
    this.table.on('before-selection-change', this.handleSelection.bind(this));
  }
  
  handleSelection(event) {
    const { ranges } = event;
    
    // Validate and adjust selection
    const validRanges = this.validateRanges(ranges);
    
    if (validRanges.length !== ranges.length) {
      event.preventDefault();
      // Apply valid ranges
      this.table.setSelection(validRanges);
    }
  }
  
  validateRanges(ranges) {
    return ranges.filter(range => 
      !this.doesRangeIncludeRestrictedColumns(range)
    );
  }
  
  doesRangeIncludeRestrictedColumns(range) {
    for (let col = range.start.col; col <= range.end.col; col++) {
      if (this.restrictedColumns.has(col)) {
        return true;
      }
    }
    return false;
  }
  
  addRestrictedColumn(columnIndex) {
    this.restrictedColumns.add(columnIndex);
  }
  
  removeRestrictedColumn(columnIndex) {
    this.restrictedColumns.delete(columnIndex);
  }
}

// Initialize selection manager
const selectionManager = new SelectionManager(table, [0]); // Restrict first column

// Method 4: Column configuration helper
function configureColumnSelection(columns, restrictedColumnField) {
  return columns.map(column => ({
    ...column,
    selectable: column.field !== restrictedColumnField
  }));
}

// Example usage of configuration helper
const configuredColumns = configureColumnSelection(columns, 'id');
table.updateColumns(configuredColumns);
```

## Related Links

- [VTable Selection Documentation](https://visactor.io/vtable/guide/basic_concept/selection)
- [Column Configuration Guide](https://visactor.io/vtable/guide/basic_concept/columns)
- [Selection Examples](https://visactor.io/vtable/examples/interaction/selection)