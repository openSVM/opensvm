# How to improve the performance of rendering a large number of charts in a web page

## Question

How to improve the performance of rendering a large number of charts in a web page?

## Answer

When dealing with multiple charts in VTable, there are several optimization strategies you can implement to improve rendering performance:

1. Virtual scrolling
2. Lazy loading
3. Chart instance reuse
4. Optimized data updates

## Code Example

```typescript
// Enable virtual scrolling
const table = new VTable.ListTable({
  container: document.getElementById('container'),
  columns: columns,
  records: data,
  virtual: true, // Enable virtual scrolling
  defaultRowHeight: 40,
  defaultHeaderRowHeight: 40
});

// Implement chart instance reuse
const chartCache = new Map();

const columns = [
  {
    field: 'chart',
    title: 'Chart',
    width: 200,
    render: (cell) => {
      const chartId = `chart-${cell.row}`;
      
      // Reuse existing chart instance
      if (chartCache.has(chartId)) {
        const chart = chartCache.get(chartId);
        chart.updateData(cell.value);
        return chart;
      }

      // Create new chart instance if needed
      const chart = new Chart({
        data: cell.value,
        // Chart configuration
      });
      
      chartCache.set(chartId, chart);
      return chart;
    }
  }
];

// Clean up when needed
function dispose() {
  chartCache.forEach(chart => chart.dispose());
  chartCache.clear();
}
```

## Related Links

- [VTable Virtual Scrolling](https://visactor.io/vtable/guide/basic_concept/virtual_scroll)
- [Performance Optimization Guide](https://visactor.io/vtable/guide/performance)
- [Chart Integration Example](https://visactor.io/vtable/examples/chart/sparkline)