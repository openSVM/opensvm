# How to display table row numbers

## Question

How to display table row numbers?

## Answer

VTable provides several methods to display row numbers:
1. Built-in row number column
2. Custom row number implementation
3. Dynamic row numbering
4. Formatted row numbers

## Code Example

```typescript
const columns = [
  {
    // Method 1: Built-in row number column
    field: '#',
    title: '#',
    width: 60,
    rowNumber: true // Enable built-in row numbering
  },
  {
    // Method 2: Custom row number implementation
    field: 'customNumber',
    title: 'No.',
    width: 80,
    render: (cell) => {
      return {
        type: 'text',
        text: `Row ${cell.row + 1}` // Custom format
      };
    }
  },
  // Other columns...
];

// Create table with row numbers
const table = new VTable.ListTable({
  container: document.getElementById('container'),
  columns: columns,
  records: data,
  // Optional: Row number configuration
  rowNumber: {
    // Global row number settings
    enabled: true,
    width: 60,
    align: 'center',
    formatter: (rowIndex) => {
      return `#${rowIndex + 1}`; // Custom format
    }
  }
});

// Method 3: Dynamic row numbering with pagination
const paginatedTable = new VTable.ListTable({
  container: document.getElementById('container'),
  columns: [
    {
      field: '#',
      title: '#',
      width: 60,
      render: (cell) => {
        const pageSize = 10;
        const currentPage = table.getCurrentPage();
        const rowNumber = (currentPage - 1) * pageSize + cell.row + 1;
        return {
          type: 'text',
          text: rowNumber.toString()
        };
      }
    },
    // Other columns...
  ],
  records: data,
  pagination: {
    enabled: true,
    pageSize: 10
  }
});

// Method 4: Formatted row numbers with sections
function getFormattedRowNumber(rowIndex, sectionIndex) {
  return `${sectionIndex + 1}.${rowIndex + 1}`;
}

const sectionedTable = new VTable.ListTable({
  container: document.getElementById('container'),
  columns: [
    {
      field: '#',
      title: '#',
      width: 80,
      render: (cell) => {
        const section = Math.floor(cell.row / 5); // Group every 5 rows
        const rowInSection = cell.row % 5;
        return {
          type: 'text',
          text: getFormattedRowNumber(rowInSection, section)
        };
      }
    },
    // Other columns...
  ],
  records: data
});
```

## Related Links

- [VTable Row Configuration](https://visactor.io/vtable/guide/basic_concept/rows)
- [Row Number Examples](https://visactor.io/vtable/examples/row/row-number)
- [Pagination Guide](https://visactor.io/vtable/guide/basic_concept/pagination)