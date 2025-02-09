# How to customize highlighted cells in the VTable component

## Question

How to customize highlighted cells in the VTable component?

## Answer

VTable provides several ways to customize cell highlighting:
1. Highlight style configuration
2. Custom highlight conditions
3. Dynamic highlight effects
4. Highlight state management

## Code Example

```typescript
const columns = [
  {
    // Method 1: Basic cell highlighting
    field: 'basic',
    title: 'Basic Highlight',
    width: 150,
    style: {
      highlight: {
        backgroundColor: '#e6f7ff',
        color: '#1890ff'
      }
    }
  },
  {
    // Method 2: Conditional highlighting
    field: 'conditional',
    title: 'Conditional Highlight',
    width: 150,
    style: (cell) => ({
      highlight: cell.value > 100 ? {
        backgroundColor: '#f6ffed',
        color: '#52c41a'
      } : {
        backgroundColor: '#fff1f0',
        color: '#ff4d4f'
      }
    })
  }
];

// Create table with highlights
const table = new VTable.ListTable({
  container: document.getElementById('container'),
  columns: columns,
  records: data,
  // Global highlight configuration
  highlight: {
    enabled: true,
    style: {
      backgroundColor: '#e6f7ff',
      borderColor: '#91d5ff'
    }
  }
});

// Method 3: Highlight manager
class HighlightManager {
  constructor(table) {
    this.table = table;
    this.highlightedCells = new Set();
    this.setupHighlightHandling();
  }
  
  setupHighlightHandling() {
    // Handle cell click for highlighting
    this.table.on('click', (event) => {
      const { row, col } = event;
      this.toggleHighlight(row, col);
    });
    
    // Clear highlights on escape
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        this.clearHighlights();
      }
    });
  }
  
  toggleHighlight(row, col) {
    const key = `${row},${col}`;
    
    if (this.highlightedCells.has(key)) {
      this.highlightedCells.delete(key);
    } else {
      this.highlightedCells.add(key);
    }
    
    this.updateHighlights();
  }
  
  isHighlighted(row, col) {
    return this.highlightedCells.has(`${row},${col}`);
  }
  
  clearHighlights() {
    this.highlightedCells.clear();
    this.updateHighlights();
  }
  
  updateHighlights() {
    this.table.render();
  }
  
  getHighlightStyle(cell) {
    if (this.isHighlighted(cell.row, cell.col)) {
      return {
        backgroundColor: '#e6f7ff',
        color: '#1890ff',
        fontWeight: 'bold'
      };
    }
    return null;
  }
}

// Initialize highlight manager
const highlightManager = new HighlightManager(table);

// Method 4: Custom highlight patterns
class HighlightPattern {
  constructor(table) {
    this.table = table;
    this.patterns = new Map();
  }
  
  addPattern(name, config) {
    this.patterns.set(name, config);
  }
  
  removePattern(name) {
    this.patterns.delete(name);
  }
  
  applyPattern(name, range) {
    const pattern = this.patterns.get(name);
    if (!pattern) return;
    
    const { startRow, endRow, startCol, endCol } = range;
    
    for (let row = startRow; row <= endRow; row++) {
      for (let col = startCol; col <= endCol; col++) {
        if (this.shouldHighlight(pattern, row, col)) {
          highlightManager.toggleHighlight(row, col);
        }
      }
    }
  }
  
  shouldHighlight(pattern, row, col) {
    switch (pattern.type) {
      case 'checkerboard':
        return (row + col) % 2 === 0;
      case 'diagonal':
        return row === col;
      case 'custom':
        return pattern.predicate(row, col);
      default:
        return false;
    }
  }
}

// Initialize pattern manager
const patternManager = new HighlightPattern(table);

// Add patterns
patternManager.addPattern('checkerboard', {
  type: 'checkerboard',
  style: {
    backgroundColor: '#f0f5ff'
  }
});

patternManager.addPattern('diagonal', {
  type: 'diagonal',
  style: {
    backgroundColor: '#f6ffed'
  }
});

// Example: Custom highlight pattern
patternManager.addPattern('custom', {
  type: 'custom',
  predicate: (row, col) => {
    return row % 3 === 0 && col % 2 === 0;
  },
  style: {
    backgroundColor: '#fff7e6'
  }
});
```

## Related Links

- [VTable Highlight Documentation](https://visactor.io/vtable/guide/basic_concept/highlight)
- [Style Configuration Guide](https://visactor.io/vtable/guide/basic_concept/style)
- [Highlight Examples](https://visactor.io/vtable/examples/highlight/basic)