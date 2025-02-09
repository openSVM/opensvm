# How to customize the content of a tooltip in a pop-up box

## Question

How to customize the content of a tooltip in a pop-up box?

## Answer

VTable allows you to customize tooltip content using the `tooltip.formatter` property. You can return custom HTML content or format the data in any way you need.

## Code Example

```typescript
const columns = [
  {
    field: 'data',
    title: 'Custom Tooltip',
    tooltip: {
      enabled: true,
      formatter: (cell) => {
        // Custom tooltip content
        return `
          <div style="padding: 10px">
            <h3>${cell.value.title}</h3>
            <p>ID: ${cell.value.id}</p>
            <p>Description: ${cell.value.description}</p>
            <div style="color: ${cell.value.status === 'active' ? 'green' : 'red'}">
              Status: ${cell.value.status}
            </div>
          </div>
        `;
      },
      style: {
        // Custom tooltip styles
        backgroundColor: '#f5f5f5',
        border: '1px solid #ddd',
        borderRadius: '4px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }
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

- [VTable Tooltip Documentation](https://visactor.io/vtable/guide/basic_concept/tooltip)
- [Custom Tooltip Example](https://visactor.io/vtable/examples/tooltip/custom-content)