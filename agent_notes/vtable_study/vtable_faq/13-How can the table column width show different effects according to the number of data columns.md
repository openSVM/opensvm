# How can the table column width show different effects according to the number of data columns

## Question

How can the table column width show different effects according to the number of data columns?

## Answer

VTable provides several ways to adjust column widths dynamically based on the number of columns:
1. Auto width calculation
2. Percentage-based widths
3. Flex-based distribution
4. Dynamic width adjustment

## Code Example

```typescript
// Function to calculate column configurations based on column count
function getColumnConfig(columns) {
  const columnCount = columns.length;
  
  if (columnCount <= 3) {
    // For few columns, use equal fixed widths
    return columns.map(col => ({
      ...col,
      width: 300
    }));
  } else if (columnCount <= 6) {
    // For medium number of columns, use percentage widths
    return columns.map(col => ({
      ...col,
      width: `${100 / columnCount}%`
    }));
  } else {
    // For many columns, use auto width with min/max constraints
    return columns.map(col => ({
      ...col,
      widthMode: 'autoWidth',
      minWidth: 100,
      maxWidth: 200
    }));
  }
}

// Example usage
const rawColumns = [
  { field: 'col1', title: 'Column 1' },
  { field: 'col2', title: 'Column 2' },
  // ... more columns
];

const table = new VTable.ListTable({
  container: document.getElementById('container'),
  columns: getColumnConfig(rawColumns),
  records: data,
  widthMode: {
    mode: 'standard', // or 'adaptive'
    autoWidth: true
  },
  // Optional: Handle resize events
  onColumnResize: (event) => {
    const newColumns = [...table.getColumns()];
    // Recalculate other column widths if needed
    table.updateColumns(newColumns);
  }
});

// Dynamic column addition example
function addColumn() {
  const currentColumns = table.getColumns();
  const newColumn = { field: `col${currentColumns.length + 1}`, title: `Column ${currentColumns.length + 1}` };
  
  const updatedColumns = [...currentColumns, newColumn];
  table.updateColumns(getColumnConfig(updatedColumns));
}
```

## Related Links

- [VTable Column Width Documentation](https://visactor.io/vtable/guide/basic_concept/layout)
- [Width Mode Examples](https://visactor.io/vtable/examples/layout/width-mode)
- [Dynamic Columns Guide](https://visactor.io/vtable/guide/advanced/dynamic_columns)