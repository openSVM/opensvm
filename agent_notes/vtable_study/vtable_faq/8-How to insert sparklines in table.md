# How to insert sparklines in table

## Question

How to insert sparklines in table?

## Answer

VTable supports embedding sparkline charts within table cells using the built-in sparkline feature or custom rendering with VChart integration.

## Code Example

```typescript
const columns = [
  {
    field: 'trend',
    title: 'Trend',
    width: 200,
    sparkline: {
      type: 'line', // or 'bar', 'area'
      data: (record) => record.trendData,
      // Sparkline configuration
      style: {
        line: {
          stroke: '#1890ff',
          lineWidth: 2
        },
        point: {
          visible: true,
          size: 3,
          fill: '#1890ff'
        },
        area: {
          fill: 'rgba(24,144,255,0.2)'
        }
      }
    }
  },
  {
    field: 'customSparkline',
    title: 'Custom Chart',
    width: 200,
    render: (cell) => {
      // Custom VChart integration
      return new VChart.LineChart({
        data: cell.value,
        width: 180,
        height: 30,
        // Chart configuration
      });
    }
  }
];

const table = new VTable.ListTable({
  container: document.getElementById('container'),
  columns: columns,
  records: data
});
```

## Related Links

- [VTable Sparkline Documentation](https://visactor.io/vtable/guide/basic_concept/sparkline)
- [Sparkline Examples](https://visactor.io/vtable/examples/sparkline/basic)
- [VChart Integration](https://visactor.io/vtable/guide/advanced/vchart)