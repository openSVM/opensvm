# How to customize the context menu in the table component

## Question

How to customize the context menu in the table component?

## Answer

VTable allows you to customize the context menu (right-click menu) through:
1. Built-in menu configuration
2. Custom menu items
3. Event handling
4. Dynamic menu generation

## Code Example

```typescript
// Create table with custom context menu
const table = new VTable.ListTable({
  container: document.getElementById('container'),
  columns: columns,
  records: data,
  // Context menu configuration
  contextMenu: {
    // Basic menu items
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
          table.copyCell(cell);
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
          table.pasteToCell(cell);
        }
      },
      { type: 'separator' },
      {
        name: 'custom',
        text: 'Custom Action',
        // Dynamic enable/disable
        enabled: (cell) => {
          return cell.value !== null;
        },
        // Dynamic visibility
        visible: (cell) => {
          return cell.col > 0;
        },
        action: (cell) => {
          console.log('Custom action:', cell);
        }
      }
    ],
    // Menu style
    style: {
      background: '#ffffff',
      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
      borderRadius: '4px'
    }
  }
});

// Dynamic context menu based on cell content
function getContextMenuItems(cell) {
  const baseItems = [
    {
      name: 'edit',
      text: 'Edit',
      action: () => table.startEdit(cell)
    }
  ];

  if (cell.value > 0) {
    baseItems.push({
      name: 'highlight',
      text: 'Highlight',
      action: () => highlightCell(cell)
    });
  }

  return baseItems;
}

// Handle context menu events
table.on('contextmenu', (event) => {
  const { cell, items } = event;
  
  // Modify menu items dynamically
  event.items = getContextMenuItems(cell);
});

table.on('contextmenuclick', (event) => {
  const { cell, item } = event;
  console.log(`Context menu item "${item.name}" clicked for cell:`, cell);
});

// Custom context menu implementation
function customContextMenu(cell) {
  return {
    items: [
      {
        name: 'analyze',
        text: 'Analyze Data',
        submenu: [
          {
            name: 'trend',
            text: 'Show Trend',
            action: () => showTrendAnalysis(cell)
          },
          {
            name: 'compare',
            text: 'Compare Values',
            action: () => compareValues(cell)
          }
        ]
      }
    ]
  };
}
```

## Related Links

- [VTable Context Menu Documentation](https://visactor.io/vtable/guide/basic_concept/context_menu)
- [Context Menu Examples](https://visactor.io/vtable/examples/menu/context)
- [Custom Menu Tutorial](https://visactor.io/vtable/guide/advanced/custom_menu)