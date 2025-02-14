# How to implement multi-level headers in a basic table

## Question

How to implement multi-level headers in a basic table?

## Answer

Multi-level headers can be implemented in VTable by configuring the header structure in the column definitions. You can define hierarchical headers by specifying parent-child relationships in the column configuration.

## Code Example

```typescript
const columns = [
  {
    field: 'column1',
    title: 'Parent Header 1',
    children: [
      {
        field: 'child1',
        title: 'Child Header 1'
      },
      {
        field: 'child2',
        title: 'Child Header 2'
      }
    ]
  }
];

const table = new VTable.ListTable({
  container: document.getElementById('container'),
  columns: columns,
  records: data
});
```

## Related Links

- [VTable Documentation](https://visactor.io/vtable)
- [Multi-level Headers Example](https://visactor.io/vtable/examples/header/multi-level)