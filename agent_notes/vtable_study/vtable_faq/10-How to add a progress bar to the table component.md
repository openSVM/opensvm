# How to add a progress bar to the table component

## Question

How to add a progress bar to the table component?

## Answer

VTable provides built-in support for progress bars through the `progressbar` column type, or you can create custom progress bars using the render function.

## Code Example

```typescript
const columns = [
  {
    field: 'progress',
    title: 'Progress',
    width: 200,
    // Method 1: Using built-in progressbar
    columnType: 'progressbar',
    progressbar: {
      min: 0,
      max: 100,
      showValue: true, // Show percentage
      style: {
        barHeight: 16,
        barColor: '#1890ff',
        backgroundColor: '#f0f0f0',
        borderRadius: 4
      }
    }
  },
  {
    field: 'customProgress',
    title: 'Custom Progress',
    width: 200,
    // Method 2: Custom rendering
    render: (cell) => {
      const value = cell.value;
      const percentage = Math.min(100, Math.max(0, value));
      
      return {
        type: 'html',
        html: `
          <div style="
            width: 100%;
            height: 16px;
            background: #f0f0f0;
            border-radius: 4px;
            overflow: hidden;
          ">
            <div style="
              width: ${percentage}%;
              height: 100%;
              background: linear-gradient(90deg, #1890ff, #36cfc9);
              transition: width 0.3s;
            "></div>
            <div style="
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              color: ${percentage > 50 ? '#fff' : '#000'};
              font-size: 12px;
            ">
              ${percentage}%
            </div>
          </div>
        `
      };
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

- [VTable Progress Bar Documentation](https://visactor.io/vtable/guide/basic_concept/progress_bar)
- [Progress Bar Examples](https://visactor.io/vtable/examples/cell/progress-bar)