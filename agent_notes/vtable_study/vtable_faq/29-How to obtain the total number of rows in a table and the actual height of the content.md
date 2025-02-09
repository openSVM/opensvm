# How to obtain the total number of rows in a table and the actual height of the content

## Question

How to obtain the total number of rows in a table and the actual height of the content?

## Answer

VTable provides several methods to get row count and content dimensions:
1. Row count methods
2. Dimension calculations
3. Content height measurement
4. Viewport information

## Code Example

```typescript
const table = new VTable.ListTable({
  container: document.getElementById('container'),
  columns: columns,
  records: data
});

// Method 1: Get basic row information
function getBasicRowInfo() {
  // Total number of rows
  const totalRows = table.getRowCount();
  
  // Number of header rows
  const headerRows = table.getHeaderRowCount();
  
  // Number of body rows
  const bodyRows = table.getBodyRowCount();
  
  return {
    total: totalRows,
    header: headerRows,
    body: bodyRows
  };
}

// Method 2: Get dimension information
function getDimensionInfo() {
  // Total table height
  const totalHeight = table.getTotalHeight();
  
  // Content height (excluding headers)
  const contentHeight = table.getContentHeight();
  
  // Header height
  const headerHeight = table.getHeaderHeight();
  
  // Viewport dimensions
  const viewport = table.getViewport();
  
  return {
    total: totalHeight,
    content: contentHeight,
    header: headerHeight,
    viewport: viewport
  };
}

// Method 3: Get row-specific heights
function getRowHeights() {
  const heights = [];
  const rowCount = table.getRowCount();
  
  for (let i = 0; i < rowCount; i++) {
    heights.push({
      row: i,
      height: table.getRowHeight(i)
    });
  }
  
  return heights;
}

// Method 4: Calculate visible content
function getVisibleContent() {
  const viewport = table.getViewport();
  const visibleRange = table.getVisibleRange();
  
  return {
    firstVisibleRow: visibleRange.start.row,
    lastVisibleRow: visibleRange.end.row,
    visibleHeight: viewport.height,
    scrollTop: viewport.scrollTop
  };
}

// Listen for dimension changes
table.on('size-change', (event) => {
  const { width, height } = event;
  console.log('Table dimensions changed:', { width, height });
});

// Example usage
function logTableMetrics() {
  const rowInfo = getBasicRowInfo();
  const dimensions = getDimensionInfo();
  
  console.log('Row Information:', rowInfo);
  console.log('Dimensions:', dimensions);
  
  // Calculate average row height
  const avgRowHeight = dimensions.content / rowInfo.body;
  console.log('Average row height:', avgRowHeight);
  
  // Get scroll information
  const scrollInfo = table.getScrollOffset();
  console.log('Scroll position:', scrollInfo);
}

// Update metrics when data changes
table.on('data-change', () => {
  logTableMetrics();
});
```

## Related Links

- [VTable Dimension Documentation](https://visactor.io/vtable/guide/basic_concept/dimensions)
- [Row Configuration Guide](https://visactor.io/vtable/guide/basic_concept/rows)
- [Viewport Management](https://visactor.io/vtable/guide/basic_concept/viewport)