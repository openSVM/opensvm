# How to implement dimension drill-down function when using VTable pivot table component

## Question

How to implement dimension drill-down function when using VTable pivot table component?

## Answer

VTable's pivot table supports dimension drill-down through:
1. Hierarchical dimension configuration
2. Drill-down event handling
3. Dynamic dimension updates
4. State management

## Code Example

```typescript
// Define hierarchical dimensions
const dimensions = {
  time: ['year', 'quarter', 'month'],
  location: ['region', 'country', 'city'],
  product: ['category', 'subcategory', 'product']
};

// Create pivot table with drill-down support
const pivotTable = new VTable.PivotTable({
  container: document.getElementById('container'),
  records: data,
  // Initial dimension configuration
  rows: ['year', 'region'],
  columns: ['category'],
  indicators: [
    {
      field: 'sales',
      title: 'Sales',
      aggregation: 'sum'
    }
  ]
});

// Method 1: Drill-down manager
class DrillDownManager {
  constructor(table, dimensions) {
    this.table = table;
    this.dimensions = dimensions;
    this.drillState = new Map();
    this.setupDrillHandlers();
  }
  
  setupDrillHandlers() {
    this.table.on('cell-click', (event) => {
      const { row, col } = event;
      if (this.isDrillable(row, col)) {
        this.handleDrill(row, col);
      }
    });
  }
  
  isDrillable(row, col) {
    const cell = this.table.getCellByRowCol(row, col);
    const dimension = this.getDimension(cell);
    
    return dimension && this.hasNextLevel(dimension);
  }
  
  getDimension(cell) {
    // Determine dimension from cell metadata
    return cell.dimensionKey;
  }
  
  hasNextLevel(dimension) {
    const hierarchy = this.dimensions[dimension];
    const currentLevel = this.getCurrentLevel(dimension);
    return hierarchy.indexOf(currentLevel) < hierarchy.length - 1;
  }
  
  getCurrentLevel(dimension) {
    return this.drillState.get(dimension) || this.dimensions[dimension][0];
  }
  
  handleDrill(row, col) {
    const cell = this.table.getCellByRowCol(row, col);
    const dimension = this.getDimension(cell);
    const nextLevel = this.getNextLevel(dimension);
    
    if (nextLevel) {
      this.drillState.set(dimension, nextLevel);
      this.updateDimensions();
    }
  }
  
  getNextLevel(dimension) {
    const hierarchy = this.dimensions[dimension];
    const currentLevel = this.getCurrentLevel(dimension);
    const currentIndex = hierarchy.indexOf(currentLevel);
    
    return hierarchy[currentIndex + 1];
  }
  
  updateDimensions() {
    const rows = this.table.getRows().map(row => {
      const dimension = this.getDimension(row);
      return this.drillState.get(dimension) || row;
    });
    
    this.table.setRows(rows);
  }
  
  rollUp(dimension) {
    const hierarchy = this.dimensions[dimension];
    const currentLevel = this.getCurrentLevel(dimension);
    const currentIndex = hierarchy.indexOf(currentLevel);
    
    if (currentIndex > 0) {
      const previousLevel = hierarchy[currentIndex - 1];
      this.drillState.set(dimension, previousLevel);
      this.updateDimensions();
    }
  }
}

// Initialize drill-down manager
const drillManager = new DrillDownManager(pivotTable, dimensions);

// Method 2: Custom drill-down UI
function addDrillDownIndicators() {
  const columns = pivotTable.getColumns();
  
  const enhancedColumns = columns.map(column => ({
    ...column,
    render: (cell) => {
      if (!drillManager.isDrillable(cell.row, cell.col)) {
        return cell.value;
      }
      
      return {
        type: 'html',
        html: `
          <div class="drillable-cell">
            ${cell.value}
            <span class="drill-indicator">▼</span>
          </div>
        `,
        style: `
          .drillable-cell {
            display: flex;
            align-items: center;
            gap: 4px;
          }
          .drill-indicator {
            font-size: 10px;
            color: #1890ff;
          }
        `
      };
    }
  }));
  
  pivotTable.updateColumns(enhancedColumns);
}

// Method 3: Drill path tracking
class DrillPathTracker {
  constructor() {
    this.paths = new Map();
  }
  
  addDrillStep(dimension, level, value) {
    if (!this.paths.has(dimension)) {
      this.paths.set(dimension, []);
    }
    
    this.paths.get(dimension).push({ level, value });
  }
  
  getDrillPath(dimension) {
    return this.paths.get(dimension) || [];
  }
  
  clearPath(dimension) {
    this.paths.delete(dimension);
  }
  
  generateBreadcrumb(dimension) {
    const path = this.getDrillPath(dimension);
    return path.map(step => `${step.level}: ${step.value}`).join(' > ');
  }
}

// Initialize path tracker
const pathTracker = new DrillPathTracker();
```

## Related Links

- [VTable Pivot Table Documentation](https://visactor.io/vtable/guide/pivot_table/basic)
- [Dimension Configuration Guide](https://visactor.io/vtable/guide/pivot_table/dimensions)
- [Drill-down Examples](https://visactor.io/vtable/examples/pivot/drill-down)