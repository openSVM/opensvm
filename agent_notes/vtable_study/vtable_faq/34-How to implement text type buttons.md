# How to implement text type buttons

## Question

How to implement text type buttons in VTable?

## Answer

VTable supports text type buttons through:
1. Custom cell rendering
2. HTML button integration
3. Interactive text styling
4. Click event handling

## Code Example

```typescript
const columns = [
  {
    // Method 1: HTML button
    field: 'action',
    title: 'Action',
    width: 120,
    render: (cell) => ({
      type: 'html',
      html: `
        <button 
          class="text-button"
          data-row="${cell.row}"
          data-action="${cell.value.type}"
        >
          ${cell.value.text}
        </button>
      `,
      style: `
        .text-button {
          border: none;
          background: none;
          color: #1890ff;
          cursor: pointer;
          padding: 4px 8px;
          font-size: 14px;
        }
        .text-button:hover {
          color: #40a9ff;
          background: rgba(24,144,255,0.1);
        }
      `,
      afterRender: (container) => {
        const button = container.querySelector('.text-button');
        button.addEventListener('click', (event) => {
          event.stopPropagation();
          const { row, action } = event.target.dataset;
          handleButtonClick(row, action);
        });
      }
    })
  },
  {
    // Method 2: Custom text button
    field: 'customAction',
    title: 'Custom Action',
    width: 120,
    render: (cell) => ({
      type: 'custom',
      render: (ctx, rect, helpers) => {
        const { isHovered, isPressed } = helpers;
        
        // Draw button background
        ctx.fillStyle = isHovered 
          ? 'rgba(24,144,255,0.1)' 
          : 'transparent';
        ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
        
        // Draw text
        ctx.fillStyle = isPressed 
          ? '#096dd9' 
          : isHovered ? '#40a9ff' : '#1890ff';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(
          cell.value.text,
          rect.x + rect.width / 2,
          rect.y + rect.height / 2
        );
      }
    }),
    onClick: (cell) => {
      handleButtonClick(cell.row, cell.value.type);
    }
  }
];

const table = new VTable.ListTable({
  container: document.getElementById('container'),
  columns: columns,
  records: data
});

// Handle button clicks
function handleButtonClick(row, action) {
  switch (action) {
    case 'edit':
      table.startEdit(row);
      break;
    case 'delete':
      if (confirm('Delete this row?')) {
        table.deleteRow(row);
      }
      break;
    case 'view':
      showDetails(row);
      break;
    default:
      console.log(`Unknown action: ${action}`);
  }
}

// Example button states manager
class ButtonStateManager {
  constructor(table) {
    this.table = table;
    this.disabledButtons = new Set();
    this.loadingButtons = new Set();
  }
  
  setDisabled(row, disabled) {
    const key = `${row}`;
    if (disabled) {
      this.disabledButtons.add(key);
    } else {
      this.disabledButtons.delete(key);
    }
    this.table.render();
  }
  
  setLoading(row, loading) {
    const key = `${row}`;
    if (loading) {
      this.loadingButtons.add(key);
    } else {
      this.loadingButtons.delete(key);
    }
    this.table.render();
  }
  
  isDisabled(row) {
    return this.disabledButtons.has(`${row}`);
  }
  
  isLoading(row) {
    return this.loadingButtons.has(`${row}`);
  }
}

// Initialize button state manager
const buttonStates = new ButtonStateManager(table);
```

## Related Links

- [VTable Custom Rendering](https://visactor.io/vtable/guide/advanced/custom_render)
- [Cell Events Guide](https://visactor.io/vtable/guide/basic_concept/events)
- [Interactive Cell Examples](https://visactor.io/vtable/examples/cell/interactive)