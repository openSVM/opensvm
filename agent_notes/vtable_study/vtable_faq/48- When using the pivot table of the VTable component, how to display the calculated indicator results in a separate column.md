# When using the pivot table of the VTable component, how to display the calculated indicator results in a separate column

## Question

When using the pivot table of the VTable component, how to display the calculated indicator results in a separate column?

## Answer

VTable's pivot table supports calculated columns through:
1. Custom indicator configuration
2. Calculated field definitions
3. Aggregation functions
4. Dynamic column generation

## Code Example

```typescript
// Create pivot table with calculated indicators
const pivotTable = new VTable.PivotTable({
  container: document.getElementById('container'),
  records: data,
  rows: ['category', 'product'],
  columns: ['region'],
  indicators: [
    // Basic indicator
    {
      field: 'sales',
      title: 'Sales',
      aggregation: 'sum'
    },
    // Method 1: Calculated indicator
    {
      field: 'profit_margin',
      title: 'Profit Margin',
      // Calculate based on other fields
      calculated: (record) => {
        return (record.profit / record.sales) * 100;
      },
      // Format the result
      format: (value) => `${value.toFixed(2)}%`
    }
  ]
});

// Method 2: Custom indicator manager
class IndicatorManager {
  constructor(table) {
    this.table = table;
    this.calculatedFields = new Map();
  }
  
  addCalculatedIndicator(config) {
    const {
      field,
      title,
      calculation,
      format,
      dependencies = []
    } = config;
    
    this.calculatedFields.set(field, {
      calculation,
      format,
      dependencies
    });
    
    this.updateIndicators();
  }
  
  updateIndicators() {
    const currentIndicators = this.table.getIndicators();
    const newIndicators = [
      ...currentIndicators,
      ...Array.from(this.calculatedFields.entries()).map(([field, config]) => ({
        field,
        title: field,
        calculated: (record) => {
          const deps = config.dependencies.map(dep => record[dep]);
          return config.calculation(...deps);
        },
        format: config.format
      }))
    ];
    
    this.table.setIndicators(newIndicators);
  }
  
  removeCalculatedIndicator(field) {
    this.calculatedFields.delete(field);
    this.updateIndicators();
  }
}

// Initialize indicator manager
const indicatorManager = new IndicatorManager(pivotTable);

// Add calculated indicators
indicatorManager.addCalculatedIndicator({
  field: 'avg_order_value',
  title: 'Average Order Value',
  calculation: (sales, orders) => sales / orders,
  dependencies: ['sales', 'orders'],
  format: (value) => `$${value.toFixed(2)}`
});

// Method 3: Dynamic indicator generation
function generatePerformanceIndicators(metrics) {
  return metrics.map(metric => ({
    field: `${metric}_performance`,
    title: `${metric.charAt(0).toUpperCase() + metric.slice(1)} Performance`,
    calculated: (record) => {
      const actual = record[metric];
      const target = record[`${metric}_target`];
      return (actual / target) * 100;
    },
    format: (value) => `${value.toFixed(1)}%`
  }));
}

// Add performance indicators
const metrics = ['sales', 'profit', 'orders'];
const performanceIndicators = generatePerformanceIndicators(metrics);

pivotTable.setIndicators([
  ...pivotTable.getIndicators(),
  ...performanceIndicators
]);

// Method 4: Aggregated calculations
function addAggregatedIndicators() {
  const indicators = [
    {
      field: 'total_revenue',
      title: 'Total Revenue',
      aggregation: (values, records) => {
        return records.reduce((sum, record) => {
          return sum + (record.sales * (1 - record.discount));
        }, 0);
      },
      format: (value) => `$${value.toFixed(2)}`
    },
    {
      field: 'contribution_margin',
      title: 'Contribution Margin',
      aggregation: (values, records) => {
        const revenue = records.reduce((sum, r) => sum + r.sales, 0);
        const costs = records.reduce((sum, r) => sum + r.costs, 0);
        return ((revenue - costs) / revenue) * 100;
      },
      format: (value) => `${value.toFixed(1)}%`
    }
  ];
  
  pivotTable.setIndicators([
    ...pivotTable.getIndicators(),
    ...indicators
  ]);
}
```

## Related Links

- [VTable Pivot Table Documentation](https://visactor.io/vtable/guide/pivot_table/basic)
- [Calculated Fields Guide](https://visactor.io/vtable/guide/pivot_table/calculated_fields)
- [Indicator Examples](https://visactor.io/vtable/examples/pivot/indicators)