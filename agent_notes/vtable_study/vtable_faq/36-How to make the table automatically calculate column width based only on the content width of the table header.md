# How to make the table automatically calculate column width based only on the content width of the table header

## Question

How to make the table automatically calculate column width based only on the content width of the table header?

## Answer

VTable provides several ways to calculate column widths based on header content:
1. Auto width configuration
2. Header-specific width calculation
3. Custom width algorithms
4. Width constraints

## Code Example

```typescript
const columns = [
  {
    // Method 1: Basic auto width based on header
    field: 'basic',
    title: 'Auto Width Column',
    widthMode: 'autoWidth',
    autoWidth: {
      useHeader: true, // Only use header content
      useBody: false   // Ignore body content
    }
  },
  {
    // Method 2: Custom width calculation
    field: 'custom',
    title: 'Custom Width Column',
    width: (column) => {
      // Calculate width based on header content
      const headerContent = column.title;
      return calculateTextWidth(headerContent) + 32; // padding
    }
  }
];

// Create table with header-based widths
const table = new VTable.ListTable({
  container: document.getElementById('container'),
  columns: columns,
  records: data,
  // Global width configuration
  widthMode: {
    mode: 'standard',
    autoWidth: {
      useHeader: true,
      useBody: false,
      padding: 16
    }
  }
});

// Helper function to calculate text width
function calculateTextWidth(text, font = '14px Arial') {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  context.font = font;
  return context.measureText(text).width;
}

// Method 3: Custom width manager
class HeaderWidthManager {
  constructor(table) {
    this.table = table;
    this.minWidth = 60;
    this.maxWidth = 300;
    this.padding = 16;
    
    this.initializeWidths();
  }
  
  initializeWidths() {
    const columns = this.table.getColumns();
    const newColumns = columns.map(column => ({
      ...column,
      width: this.calculateColumnWidth(column)
    }));
    
    this.table.updateColumns(newColumns);
  }
  
  calculateColumnWidth(column) {
    // Get header content
    const headerContent = column.title;
    
    // Calculate base width from header text
    const textWidth = calculateTextWidth(headerContent);
    
    // Add padding and constrain width
    const width = Math.min(
      this.maxWidth,
      Math.max(this.minWidth, textWidth + this.padding * 2)
    );
    
    return width;
  }
  
  // Update widths when header content changes
  updateHeaderWidths() {
    this.initializeWidths();
  }
}

// Initialize header width manager
const headerWidthManager = new HeaderWidthManager(table);

// Method 4: Width distribution algorithm
function distributeColumnWidths(columns, totalWidth) {
  const headerWidths = columns.map(column => {
    const baseWidth = calculateTextWidth(column.title) + 32;
    return {
      field: column.field,
      width: baseWidth,
      minWidth: Math.min(60, baseWidth)
    };
  });
  
  // Calculate total required width
  const requiredWidth = headerWidths.reduce((sum, col) => sum + col.width, 0);
  
  if (requiredWidth <= totalWidth) {
    // Distribute extra space proportionally
    const extra = totalWidth - requiredWidth;
    const ratio = extra / requiredWidth;
    
    return headerWidths.map(col => ({
      ...col,
      width: col.width + (col.width * ratio)
    }));
  } else {
    // Reduce widths proportionally to fit
    const ratio = totalWidth / requiredWidth;
    
    return headerWidths.map(col => ({
      ...col,
      width: Math.max(col.minWidth, col.width * ratio)
    }));
  }
}
```

## Related Links

- [VTable Width Configuration](https://visactor.io/vtable/guide/basic_concept/width)
- [Auto Width Examples](https://visactor.io/vtable/examples/layout/auto-width)
- [Column Configuration Guide](https://visactor.io/vtable/guide/basic_concept/columns)