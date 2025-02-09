# How to merge cells with the same content in table component

## Question

How to merge cells with the same content in table component?

## Answer

VTable supports cell merging through several approaches:
1. Auto-merging cells with same content
2. Custom merge rules
3. Programmatic cell merging
4. Header cell merging

## Code Example

```typescript
const columns = [
  {
    field: 'category',
    title: 'Category',
    mergeCell: true // Enable auto-merging for this column
  },
  {
    field: 'subCategory',
    title: 'Sub Category',
    // Custom merge rules
    mergeCell: (cell, table) => {
      const prevCell = table.getCellByRowCol(cell.row - 1, cell.col);
      if (!prevCell) return false;
      
      // Merge if current cell has same value as previous cell
      // and their parent categories are the same
      return cell.value === prevCell.value && 
             table.getCellValue(cell.row, 0) === table.getCellValue(prevCell.row, 0);
    }
  }
];

// Table with merged cells
const table = new VTable.ListTable({
  container: document.getElementById('container'),
  columns: columns,
  records: data,
  // Enable cell merging globally
  cellMerge: {
    enable: true,
    // Optional: Custom merge strategy
    strategy: (cell, table) => {
      // Your custom merge logic here
      return {
        spanning: true,
        spanRows: 2, // Number of rows to merge
        spanCols: 1  // Number of columns to merge
      };
    }
  }
});

// Header cell merging example
const multiLevelColumns = [
  {
    title: 'Product Info',
    children: [
      {
        field: 'category',
        title: 'Category'
      },
      {
        field: 'name',
        title: 'Name'
      }
    ]
  },
  {
    title: 'Sales Info',
    children: [
      {
        field: 'quantity',
        title: 'Quantity'
      },
      {
        field: 'revenue',
        title: 'Revenue'
      }
    ]
  }
];

// Table with merged header cells
const tableWithMergedHeaders = new VTable.ListTable({
  container: document.getElementById('container'),
  columns: multiLevelColumns,
  records: data
});
```

## Related Links

- [VTable Cell Merging Documentation](https://visactor.io/vtable/guide/basic_concept/merge_cell)
- [Cell Merge Examples](https://visactor.io/vtable/examples/cell/merge)
- [Multi-level Headers](https://visactor.io/vtable/examples/header/multi-level)