# How to specify the width of a column and enable automatic line wrapping in a table component

## Question

How to specify the width of a column and enable automatic line wrapping in a table component?

## Answer

You can specify column width and enable text wrapping in VTable through column configuration. Use the `width` property to set column width and `wordWrap` for text wrapping behavior.

## Code Example

```typescript
const columns = [
  {
    field: 'description',
    title: 'Description',
    width: 200, // Set fixed width in pixels
    wordWrap: true, // Enable text wrapping
    style: {
      wordWrap: true,
      lineClamp: 2 // Optional: limit to 2 lines
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

- [VTable Column Configuration](https://visactor.io/vtable/guide/basic_concept/columns)
- [Text Wrapping Example](https://visactor.io/vtable/examples/cell/word-wrap)