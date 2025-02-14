# Can the VTable table component copy the contents of selected cells

## Question

Can the VTable table component copy the contents of selected cells?

## Answer

Yes, VTable supports copying selected cell contents through:
1. Built-in copy functionality
2. Keyboard shortcuts
3. Context menu integration
4. Custom copy implementations

## Code Example

```typescript
const table = new VTable.ListTable({
  container: document.getElementById('container'),
  columns: columns,
  records: data,
  // Enable cell selection
  selection: {
    enabled: true,
    mode: 'multiple', // or 'single'
    showSelectedBorder: true
  },
  // Enable copy functionality
  copyable: true,
  // Optional: Customize copy behavior
  copyConfig: {
    // Custom copy formatter
    copyFormatter: (cells) => {
      return cells.map(row => 
        row.map(cell => cell.value).join('\t')
      ).join('\n');
    },
    // Include headers in copy
    includeHeader: true,
    // Custom header formatter
    headerFormatter: (headers) => {
      return headers.join('\t');
    }
  }
});

// Handle copy events
table.on('beforecopy', (event) => {
  console.log('About to copy:', event.cells);
  // Optionally prevent copy
  // event.preventDefault();
});

table.on('copy', (event) => {
  console.log('Copied cells:', event.cells);
  console.log('Copied text:', event.text);
});

// Programmatic copy operations
function copySelection() {
  const selection = table.getSelection();
  if (selection) {
    table.copy();
  }
}

// Custom copy implementation
function customCopy() {
  const selection = table.getSelection();
  if (!selection) return;

  const cells = table.getCells(selection);
  const customFormat = cells.map(cell => {
    return {
      value: cell.value,
      formatted: cell.formatted,
      row: cell.row,
      col: cell.col
    };
  });

  // Copy to clipboard using the Clipboard API
  navigator.clipboard.writeText(JSON.stringify(customFormat))
    .then(() => {
      console.log('Custom format copied');
    })
    .catch(err => {
      console.error('Copy failed:', err);
    });
}

// Enable keyboard shortcuts
document.addEventListener('keydown', (event) => {
  if (event.ctrlKey && event.key === 'c') {
    copySelection();
  }
});
```

## Related Links

- [VTable Selection Documentation](https://visactor.io/vtable/guide/basic_concept/selection)
- [Copy & Paste Guide](https://visactor.io/vtable/guide/basic_concept/copy_paste)
- [Selection Examples](https://visactor.io/vtable/examples/interaction/selection)