# How to edit a table's cell with VTable

## Question

How to edit a table's cell with VTable?

## Answer

VTable provides several ways to implement cell editing:
1. Built-in editor configuration
2. Custom editor implementation
3. Edit mode control
4. Validation and formatting

## Code Example

```typescript
const columns = [
  {
    field: 'text',
    title: 'Text Editor',
    width: 200,
    // Basic text editor
    editor: {
      type: 'text',
      enabled: true
    }
  },
  {
    field: 'number',
    title: 'Number Editor',
    width: 150,
    // Number editor with validation
    editor: {
      type: 'number',
      enabled: true,
      options: {
        min: 0,
        max: 100,
        step: 1
      }
    }
  },
  {
    field: 'select',
    title: 'Select Editor',
    width: 150,
    // Dropdown select editor
    editor: {
      type: 'select',
      enabled: true,
      options: {
        values: ['Option 1', 'Option 2', 'Option 3']
      }
    }
  },
  {
    field: 'custom',
    title: 'Custom Editor',
    width: 200,
    // Custom editor implementation
    editor: {
      type: 'custom',
      component: {
        render: (cell, container) => {
          const input = document.createElement('input');
          input.type = 'text';
          input.value = cell.value;
          input.className = 'custom-editor';
          
          // Custom validation
          input.addEventListener('input', (event) => {
            const value = event.target.value;
            if (isValid(value)) {
              input.classList.remove('invalid');
            } else {
              input.classList.add('invalid');
            }
          });
          
          container.appendChild(input);
          return input;
        },
        getValue: (element) => {
          return element.value;
        }
      }
    }
  }
];

const table = new VTable.ListTable({
  container: document.getElementById('container'),
  columns: columns,
  records: data,
  // Global edit configuration
  edit: {
    enabled: true,
    mode: 'cell', // or 'row'
    defaultEditorOptions: {
      autoSelect: true,
      autoValidate: true
    }
  }
});

// Handle edit events
table.on('beforeEdit', (event) => {
  const { cell } = event;
  // Optionally prevent editing
  if (!canEdit(cell)) {
    event.preventDefault();
  }
});

table.on('afterEdit', (event) => {
  const { cell, oldValue, newValue } = event;
  console.log(`Cell edited: ${oldValue} -> ${newValue}`);
  
  // Validate and possibly revert changes
  if (!isValidEdit(cell, newValue)) {
    table.updateCell(cell.row, cell.col, oldValue);
  }
});

// Programmatic edit control
function startEditing(row, col) {
  table.startEdit(row, col);
}

function stopEditing() {
  table.stopEdit();
}

// Custom validation function
function isValid(value) {
  // Your validation logic
  return true;
}

// Check if cell can be edited
function canEdit(cell) {
  // Your permission logic
  return true;
}

// Validate edit result
function isValidEdit(cell, value) {
  // Your validation logic
  return true;
}
```

## Related Links

- [VTable Edit Documentation](https://visactor.io/vtable/guide/basic_concept/edit)
- [Editor Examples](https://visactor.io/vtable/examples/edit/basic)
- [Custom Editor Guide](https://visactor.io/vtable/guide/advanced/custom_editor)