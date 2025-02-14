# How to use the right-click menu to copy, paste and delete cells in VTable

## Question

How to use the right-click menu to copy, paste and delete cells in VTable?

## Answer

VTable provides comprehensive right-click menu functionality for cell operations through:
1. Built-in menu items
2. Custom menu actions
3. Clipboard operations
4. Selection handling

## Code Example

```typescript
const table = new VTable.ListTable({
  container: document.getElementById('container'),
  columns: columns,
  records: data,
  // Enable selection
  selection: {
    enabled: true,
    mode: 'multiple'
  },
  // Configure context menu
  contextMenu: {
    items: [
      {
        name: 'copy',
        text: 'Copy',
        shortcut: 'Ctrl+C',
        icon: {
          type: 'copy',
          fill: '#1890ff'
        },
        action: (cell) => {
          const selection = table.getSelection();
          if (selection) {
            table.copy();
          } else {
            table.copyCell(cell);
          }
        }
      },
      {
        name: 'paste',
        text: 'Paste',
        shortcut: 'Ctrl+V',
        icon: {
          type: 'paste',
          fill: '#1890ff'
        },
        action: (cell) => {
          table.paste();
        },
        // Only enable if clipboard has content
        enabled: async () => {
          try {
            const text = await navigator.clipboard.readText();
            return !!text;
          } catch {
            return false;
          }
        }
      },
      {
        name: 'delete',
        text: 'Delete',
        shortcut: 'Delete',
        icon: {
          type: 'delete',
          fill: '#ff4d4f'
        },
        action: (cell) => {
          const selection = table.getSelection();
          if (selection) {
            table.clearCells(selection);
          } else {
            table.clearCell(cell.row, cell.col);
          }
        }
      }
    ]
  }
});

// Handle clipboard events
table.on('beforecopy', (event) => {
  console.log('About to copy:', event.cells);
  // Optionally prevent copy
  // event.preventDefault();
});

table.on('beforepaste', (event) => {
  console.log('About to paste:', event.text);
  // Optionally modify paste content
  // event.text = modifyPasteContent(event.text);
});

// Custom clipboard handling
function handleCustomCopy() {
  const selection = table.getSelection();
  if (!selection) return;

  const cells = table.getCells(selection);
  const customFormat = formatCellsForCopy(cells);
  
  navigator.clipboard.writeText(customFormat)
    .then(() => console.log('Custom copy successful'))
    .catch(err => console.error('Copy failed:', err));
}

function handleCustomPaste() {
  navigator.clipboard.readText()
    .then(text => {
      const data = parsePastedContent(text);
      const selection = table.getSelection();
      if (selection) {
        table.updateCells(selection, data);
      }
    })
    .catch(err => console.error('Paste failed:', err));
}
```

## Related Links

- [VTable Context Menu Documentation](https://visactor.io/vtable/guide/basic_concept/context_menu)
- [Copy & Paste Guide](https://visactor.io/vtable/guide/basic_concept/copy_paste)
- [Selection Documentation](https://visactor.io/vtable/guide/basic_concept/selection)