# What table components support displaying mini-charts within cells

## Question

What table components support displaying mini-charts within cells?

## Answer

VTable supports several types of mini-charts within cells:
1. Built-in sparklines
2. VChart integration
3. Custom chart rendering
4. Third-party chart library integration

## Code Example

```typescript
const columns = [
  {
    // Built-in sparkline
    field: 'trend',
    title: 'Sparkline',
    width: 200,
    sparkline: {
      type: 'line',
      data: (record) => record.trendData
    }
  },
  {
    // VChart integration
    field: 'vchart',
    title: 'VChart',
    width: 200,
    render: (cell) => {
      return new VChart.LineChart({
        data: cell.value,
        width: 180,
        height: 40
      });
    }
  },
  {
    // Custom chart rendering
    field: 'custom',
    title: 'Custom Chart',
    width: 200,
    render: (cell) => ({
      type: 'custom',
      render: (ctx, rect) => {
        // Custom canvas drawing
        const data = cell.value;
        const width = rect.width;
        const height = rect.height;
        
        ctx.beginPath();
        data.forEach((value, index) => {
          const x = rect.x + (index * width) / data.length;
          const y = rect.y + height - (value * height);
          
          if (index === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        });
        
        ctx.strokeStyle = '#1890ff';
        ctx.stroke();
      }
    })
  },
  {
    // Third-party chart (e.g., ECharts)
    field: 'echarts',
    title: 'ECharts',
    width: 200,
    render: (cell) => ({
      type: 'html',
      html: '<div class="chart-container"></div>',
      afterRender: (container) => {
        const chart = echarts.init(container.querySelector('.chart-container'));
        chart.setOption({
          // ECharts configuration
          series: [{
            type: 'line',
            data: cell.value
          }]
        });
      }
    })
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
- [VChart Integration Guide](https://visactor.io/vtable/guide/advanced/vchart)
- [Custom Rendering Documentation](https://visactor.io/vtable/guide/advanced/custom_render)