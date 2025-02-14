# How to add column total information to the list

## Question

How to add column total information to the list?

## Answer

VTable provides several ways to add column totals:
1. Footer row configuration
2. Aggregation functions
3. Dynamic total calculation
4. Custom total rendering

## Code Example

```typescript
const columns = [
  {
    field: 'name',
    title: 'Name',
    width: 150
  },
  {
    // Method 1: Basic column total
    field: 'value',
    title: 'Value',
    width: 150,
    footer: {
      // Static footer text
      text: (column) => {
        const values = column.table.getData().map(row => row.value);
        const total = values.reduce((sum, val) => sum + val, 0);
        return `Total: ${total}`;
      },
      style: {
        fontWeight: 'bold',
        backgroundColor: '#f5f5f5'
      }
    }
  },
  {
    // Method 2: Custom aggregation
    field: 'customTotal',
    title: 'Custom Total',
    width: 150,
    footer: {
      // Custom aggregation function
      aggregate: (column) => {
        const data = column.table.getData();
        return {
          sum: data.reduce((sum, row) => sum + row.value, 0),
          count: data.length,
          average: data.reduce((sum, row) => sum + row.value, 0) / data.length
        };
      },
      // Custom footer rendering
      render: (footer) => ({
        type: 'html',
        html: `
          <div class="footer-content">
            <div>Sum: ${footer.value.sum}</div>
            <div>Avg: ${footer.value.average.toFixed(2)}</div>
          </div>
        `,
        style: `
          .footer-content {
            padding: 4px 8px;
            background: #f5f5f5;
          }
        `
      })
    }
  }
];

// Create table with totals
const table = new VTable.ListTable({
  container: document.getElementById('container'),
  columns: columns,
  records: data,
  // Enable footer
  footer: {
    height: 40,
    sticky: true // Keep footer visible when scrolling
  }
});

// Method 3: Total manager for complex calculations
class TotalManager {
  constructor(table) {
    this.table = table;
    this.totals = new Map();
    this.setupTotalCalculation();
  }
  
  setupTotalCalculation() {
    // Calculate totals when data changes
    this.table.on('data-change', () => {
      this.calculateTotals();
    });
  }
  
  calculateTotals() {
    const data = this.table.getData();
    const columns = this.table.getColumns();
    
    columns.forEach(column => {
      if (this.shouldCalculateTotal(column)) {
        const total = this.calculateColumnTotal(column, data);
        this.totals.set(column.field, total);
      }
    });
    
    this.updateFooter();
  }
  
  shouldCalculateTotal(column) {
    // Define which columns should have totals
    return typeof column.footer !== 'undefined';
  }
  
  calculateColumnTotal(column, data) {
    const values = data.map(row => row[column.field]);
    
    return {
      sum: values.reduce((sum, val) => sum + (Number(val) || 0), 0),
      min: Math.min(...values.filter(v => !isNaN(v))),
      max: Math.max(...values.filter(v => !isNaN(v))),
      count: values.length,
      average: values.reduce((sum, val) => sum + (Number(val) || 0), 0) / values.length
    };
  }
  
  updateFooter() {
    const columns = this.table.getColumns();
    const updatedColumns = columns.map(column => {
      if (this.totals.has(column.field)) {
        return {
          ...column,
          footer: {
            ...column.footer,
            text: this.formatTotal(this.totals.get(column.field))
          }
        };
      }
      return column;
    });
    
    this.table.updateColumns(updatedColumns);
  }
  
  formatTotal(total) {
    return `Sum: ${total.sum}\nAvg: ${total.average.toFixed(2)}`;
  }
}

// Initialize total manager
const totalManager = new TotalManager(table);

// Method 4: Custom total row
function addCustomTotalRow() {
  const data = table.getData();
  const totalRow = {
    name: 'Total',
    value: data.reduce((sum, row) => sum + row.value, 0),
    customTotal: data.reduce((sum, row) => sum + row.customTotal, 0)
  };
  
  table.setRecords([...data, totalRow]);
}
```

## Related Links

- [VTable Footer Documentation](https://visactor.io/vtable/guide/basic_concept/footer)
- [Column Configuration Guide](https://visactor.io/vtable/guide/basic_concept/columns)
- [Data Aggregation Examples](https://visactor.io/vtable/examples/footer/aggregation)