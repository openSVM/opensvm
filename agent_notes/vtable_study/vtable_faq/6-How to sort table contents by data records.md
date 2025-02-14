# How to sort table contents by data records

## Question

How to sort table contents by data records?

## Answer

VTable provides built-in sorting functionality that can be enabled through column configuration. You can specify sort modes and custom sort functions for different data types.

## Code Example

```typescript
const columns = [
  {
    field: 'name',
    title: 'Name',
    sort: true // Enable basic sorting
  },
  {
    field: 'value',
    title: 'Value',
    sort: {
      enable: true,
      mode: 'multi', // Enable multi-column sorting
      sortMethod: (a, b) => {
        // Custom sort function
        return a - b;
      }
    }
  }
];

const table = new VTable.ListTable({
  container: document.getElementById('container'),
  columns: columns,
  records: data,
  sortState: {
    // Initial sort state
    field: 'value',
    order: 'desc'
  }
});

// Listen to sort events
table.on('sort', (event) => {
  console.log('Sort changed:', event.sortState);
});
```

## Related Links

- [VTable Sorting Documentation](https://visactor.io/vtable/guide/basic_concept/sort)
- [Sort Examples](https://visactor.io/vtable/examples/sort/basic)
- [Multi-column Sort Example](https://visactor.io/vtable/examples/sort/multi-sort)