# How to set the text style of the VTable table component

## Question

How to set the text style of the VTable table component?

## Answer

VTable provides several ways to style text:
1. Global text styles
2. Column-specific styles
3. Conditional text formatting
4. Custom text rendering

## Code Example

```typescript
const columns = [
  {
    // Method 1: Basic text styling
    field: 'basic',
    title: 'Basic Style',
    width: 150,
    style: {
      font: '14px Arial',
      color: '#333333',
      fontWeight: 'bold',
      textAlign: 'center'
    }
  },
  {
    // Method 2: Conditional text styling
    field: 'conditional',
    title: 'Conditional Style',
    width: 150,
    style: (cell) => {
      const value = Number(cell.value);
      return {
        color: value > 0 ? '#52c41a' : value < 0 ? '#ff4d4f' : '#666666',
        fontWeight: Math.abs(value) > 100 ? 'bold' : 'normal',
        fontStyle: value === 0 ? 'italic' : 'normal'
      };
    }
  }
];

// Create table with text styles
const table = new VTable.ListTable({
  container: document.getElementById('container'),
  columns: columns,
  records: data,
  // Method 3: Global text styles
  defaultStyle: {
    font: '14px Arial',
    color: '#333333',
    textAlign: 'left',
    // Header styles
    headerStyle: {
      font: 'bold 14px Arial',
      color: '#1f1f1f',
      backgroundColor: '#fafafa'
    }
  }
});

// Method 4: Text style manager
class TextStyleManager {
  constructor(table) {
    this.table = table;
    this.styles = new Map();
    this.setupStyleHandling();
  }
  
  setupStyleHandling() {
    // Apply styles before render
    this.table.on('before-render', () => {
      this.applyStyles();
    });
  }
  
  addStyle(selector, style) {
    this.styles.set(selector, style);
  }
  
  removeStyle(selector) {
    this.styles.delete(selector);
  }
  
  applyStyles() {
    const columns = this.table.getColumns();
    const updatedColumns = columns.map(column => {
      const columnStyles = this.getStylesForColumn(column);
      return {
        ...column,
        style: (cell) => this.combineStyles(cell, columnStyles)
      };
    });
    
    this.table.updateColumns(updatedColumns);
  }
  
  getStylesForColumn(column) {
    return Array.from(this.styles.entries())
      .filter(([selector]) => this.matchesSelector(column, selector))
      .map(([_, style]) => style);
  }
  
  matchesSelector(column, selector) {
    // Implement selector matching logic
    return true;
  }
  
  combineStyles(cell, styles) {
    return styles.reduce((combined, style) => {
      if (typeof style === 'function') {
        return { ...combined, ...style(cell) };
      }
      return { ...combined, ...style };
    }, {});
  }
}

// Initialize style manager
const styleManager = new TextStyleManager(table);

// Add styles
styleManager.addStyle('header', {
  font: 'bold 14px Arial',
  color: '#1f1f1f',
  backgroundColor: '#fafafa'
});

styleManager.addStyle('numeric', (cell) => ({
  textAlign: 'right',
  font: cell.value > 1000 ? 'bold 14px Arial' : '14px Arial'
}));

// Example: Custom text formatter
class TextFormatter {
  static format(value, options = {}) {
    const {
      type = 'text',
      precision = 2,
      prefix = '',
      suffix = ''
    } = options;
    
    let formatted = value;
    
    switch (type) {
      case 'number':
        formatted = Number(value).toFixed(precision);
        break;
      case 'currency':
        formatted = new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(value);
        break;
      case 'percentage':
        formatted = `${(value * 100).toFixed(precision)}%`;
        break;
    }
    
    return `${prefix}${formatted}${suffix}`;
  }
}

// Apply formatted text
function applyFormattedText(column, type, options = {}) {
  return {
    ...column,
    render: (cell) => ({
      type: 'text',
      text: TextFormatter.format(cell.value, { type, ...options })
    })
  };
}
```

## Related Links

- [VTable Style Documentation](https://visactor.io/vtable/guide/basic_concept/style)
- [Text Formatting Guide](https://visactor.io/vtable/guide/basic_concept/format)
- [Style Examples](https://visactor.io/vtable/examples/style/text)