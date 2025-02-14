# How to automatically calculate and display the aggregate values of the VTable's pivot table

## Question

How to automatically calculate and display the aggregate values of the VTable's pivot table?

## Answer

VTable's pivot table functionality supports automatic aggregation through:
1. Built-in aggregation functions
2. Custom aggregation methods
3. Multiple measure calculations
4. Dynamic aggregation updates

## Code Example

```typescript
// Sample data
const data = [
  { category: 'A', product: 'X', sales: 100, quantity: 5 },
  { category: 'A', product: 'Y', sales: 200, quantity: 8 },
  { category: 'B', product: 'X', sales: 150, quantity: 6 }
];

// Create pivot table with aggregations
const pivotTable = new VTable.PivotTable({
  container: document.getElementById('container'),
  records: data,
  rows: ['category'],
  columns: ['product'],
  indicators: [
    {
      // Basic sum aggregation
      field: 'sales',
      title: 'Total Sales',
      aggregation: 'sum'
    },
    {
      // Custom aggregation function
      field: 'quantity',
      title: 'Avg Quantity',
      aggregation: (values) => {
        const sum = values.reduce((a, b) => a + b, 0);
        return values.length ? sum / values.length : 0;
      }
    },
    {
      // Calculated measure
      field: 'avgSale',
      title: 'Avg Sale Value',
      aggregation: (values, records) => {
        const totalSales = records.reduce((sum, r) => sum + r.sales, 0);
        const totalQuantity = records.reduce((sum, r) => sum + r.quantity, 0);
        return totalQuantity ? totalSales / totalQuantity : 0;
      }
    }
  ],
  // Optional: Aggregation configuration
  aggregation: {
    // Column totals
    showColumnTotal: true,
    columnTotalTitle: 'Total',
    // Row totals
    showRowTotal: true,
    rowTotalTitle: 'Total',
    // Grand total
    showGrandTotal: true,
    grandTotalTitle: 'Grand Total'
  }
});

// Define custom aggregation functions
const customAggregations = {
  weightedAverage: (values, records, field) => {
    const weights = records.map(r => r.weight || 1);
    const weightedSum = values.reduce((sum, value, i) => sum + value * weights[i], 0);
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    return totalWeight ? weightedSum / totalWeight : 0;
  },
  
  median: (values) => {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  }
};

// Update aggregation methods dynamically
function updateAggregation(field, method) {
  pivotTable.updateIndicator({
    field: field,
    aggregation: customAggregations[method] || method
  });
}
```

## Related Links

- [VTable Pivot Table Documentation](https://visactor.io/vtable/guide/pivot_table/basic)
- [Aggregation Examples](https://visactor.io/vtable/examples/pivot/aggregation)
- [Custom Aggregation Guide](https://visactor.io/vtable/guide/pivot_table/custom_aggregation)