# In table component, how can the truncated text, which exceeds the width of the cell, be displayed in a popup window to show the complete content

## Question

In table component, how can the truncated text, which exceeds the width of the cell, be displayed in a popup window to show the complete content?

## Answer

VTable provides tooltip functionality to display the complete content of truncated text. This can be configured using the `tooltip` property in column configuration.

## Code Example

```typescript
const columns = [
  {
    field: 'longText',
    title: 'Text with Tooltip',
    width: 150,
    style: {
      textOverflow: 'ellipsis', // Show ellipsis for truncated text
    },
    tooltip: {
      enabled: true, // Enable tooltip
      placement: 'top', // Tooltip placement
      showDelay: 200, // Delay before showing tooltip
      formatter: (cell) => {
        return cell.value; // Return full text content
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
- [Tooltip Example](https://visactor.io/vtable/examples/tooltip/basic)