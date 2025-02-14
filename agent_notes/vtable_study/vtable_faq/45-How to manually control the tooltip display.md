# How to manually control the tooltip display

## Question

How to manually control the tooltip display?

## Answer

VTable provides several ways to control tooltip display:
1. Manual tooltip configuration
2. Programmatic tooltip control
3. Custom tooltip triggers
4. Dynamic tooltip content

## Code Example

```typescript
const columns = [
  {
    // Method 1: Basic manual tooltip
    field: 'basic',
    title: 'Basic Tooltip',
    width: 150,
    tooltip: {
      enabled: true,
      // Manual trigger mode
      trigger: 'manual',
      // Custom show/hide control
      showTooltip: (cell) => {
        return cell.value.length > 10;
      }
    }
  },
  {
    // Method 2: Programmatic tooltip
    field: 'custom',
    title: 'Custom Tooltip',
    width: 150,
    tooltip: {
      enabled: true,
      trigger: 'manual',
      content: (cell) => {
        return {
          title: 'Details',
          content: getTooltipContent(cell)
        };
      }
    }
  }
];

// Create table with manual tooltips
const table = new VTable.ListTable({
  container: document.getElementById('container'),
  columns: columns,
  records: data
});

// Method 3: Tooltip controller
class TooltipController {
  constructor(table) {
    this.table = table;
    this.activeTooltip = null;
    this.setupTooltipControl();
  }
  
  setupTooltipControl() {
    // Handle cell hover
    this.table.on('cell-hover', (event) => {
      const { row, col } = event;
      this.handleCellHover(row, col);
    });
    
    // Handle hover out
    this.table.on('cell-hover-out', () => {
      this.hideTooltip();
    });
    
    // Handle scroll
    this.table.on('scroll', () => {
      this.hideTooltip();
    });
  }
  
  handleCellHover(row, col) {
    const cell = this.table.getCellByRowCol(row, col);
    
    if (this.shouldShowTooltip(cell)) {
      this.showTooltip(cell);
    } else {
      this.hideTooltip();
    }
  }
  
  shouldShowTooltip(cell) {
    // Implement custom logic for when to show tooltip
    if (!cell) return false;
    
    const content = cell.value?.toString() || '';
    const cellWidth = this.table.getColumnWidth(cell.col);
    
    // Show tooltip if content might be truncated
    return this.measureTextWidth(content) > cellWidth;
  }
  
  showTooltip(cell) {
    if (this.activeTooltip?.row === cell.row && 
        this.activeTooltip?.col === cell.col) {
      return;
    }
    
    this.hideTooltip();
    
    this.activeTooltip = {
      row: cell.row,
      col: cell.col,
      content: this.getTooltipContent(cell)
    };
    
    this.table.showTooltip(cell.row, cell.col, this.activeTooltip.content);
  }
  
  hideTooltip() {
    if (this.activeTooltip) {
      this.table.hideTooltip();
      this.activeTooltip = null;
    }
  }
  
  getTooltipContent(cell) {
    // Implement custom tooltip content generation
    return {
      title: this.table.getColumns()[cell.col].title,
      content: cell.value?.toString()
    };
  }
  
  measureTextWidth(text, font = '14px Arial') {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    context.font = font;
    return context.measureText(text).width;
  }
}

// Initialize tooltip controller
const tooltipController = new TooltipController(table);

// Method 4: Manual tooltip API usage
function showCustomTooltip(row, col, content) {
  table.showTooltip(row, col, {
    title: 'Custom Tooltip',
    content: content,
    style: {
      backgroundColor: '#fff',
      border: '1px solid #ddd',
      borderRadius: '4px',
      padding: '8px',
      maxWidth: '300px'
    }
  });
}

function hideCustomTooltip() {
  table.hideTooltip();
}

// Example: Show tooltip after some action
table.on('click', (event) => {
  const { row, col } = event;
  showCustomTooltip(row, col, 'Clicked cell content');
  
  // Hide tooltip after delay
  setTimeout(() => {
    hideCustomTooltip();
  }, 2000);
});
```

## Related Links

- [VTable Tooltip Documentation](https://visactor.io/vtable/guide/basic_concept/tooltip)
- [Custom Tooltip Examples](https://visactor.io/vtable/examples/tooltip/custom)
- [Event Handling Guide](https://visactor.io/vtable/guide/basic_concept/events)