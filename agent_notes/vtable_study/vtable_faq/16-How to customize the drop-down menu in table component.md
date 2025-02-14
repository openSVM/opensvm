# How to customize the drop-down menu in table component

## Question

How to customize the drop-down menu in table component?

## Answer

VTable allows you to customize drop-down menus through:
1. Built-in dropdown configuration
2. Custom dropdown rendering
3. Event handling for dropdown interactions
4. Integration with external dropdown components

## Code Example

```typescript
const columns = [
  {
    field: 'status',
    title: 'Status',
    width: 150,
    dropdownMenu: {
      // Basic dropdown configuration
      items: [
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
        { value: 'pending', label: 'Pending' }
      ],
      // Custom styling
      style: {
        background: '#fff',
        border: '1px solid #d9d9d9',
        borderRadius: '4px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
      }
    }
  },
  {
    field: 'customDropdown',
    title: 'Custom Dropdown',
    width: 200,
    // Custom dropdown implementation
    render: (cell) => ({
      type: 'html',
      html: `
        <div class="custom-dropdown">
          <select class="dropdown-select">
            <option value="option1">Option 1</option>
            <option value="option2">Option 2</option>
            <option value="option3">Option 3</option>
          </select>
        </div>
      `,
      // Handle dropdown events
      afterRender: (container) => {
        const select = container.querySelector('.dropdown-select');
        select.addEventListener('change', (event) => {
          // Update cell value
          cell.setValue(event.target.value);
        });
      }
    })
  }
];

// Create table with dropdown support
const table = new VTable.ListTable({
  container: document.getElementById('container'),
  columns: columns,
  records: data,
  // Global dropdown configuration
  dropdownMenu: {
    // Custom dropdown positioning
    placement: 'bottom-start',
    // Dropdown offset
    offset: [0, 4],
    // Animation
    animation: {
      duration: 200,
      easing: 'ease-in-out'
    }
  }
});

// Handle dropdown events
table.on('dropdownMenuClick', (event) => {
  const { row, col, value } = event;
  console.log(`Dropdown selected: ${value} at row ${row}, col ${col}`);
});

// Custom dropdown menu with advanced features
function createAdvancedDropdown(cell) {
  return {
    type: 'html',
    html: `
      <div class="advanced-dropdown">
        <div class="dropdown-header">
          <input type="text" placeholder="Search..." class="dropdown-search" />
        </div>
        <div class="dropdown-content">
          ${getDropdownOptions(cell.value)}
        </div>
        <div class="dropdown-footer">
          <button class="dropdown-clear">Clear</button>
          <button class="dropdown-apply">Apply</button>
        </div>
      </div>
    `,
    afterRender: (container) => {
      setupDropdownHandlers(container, cell);
    }
  };
}
```

## Related Links

- [VTable Dropdown Documentation](https://visactor.io/vtable/guide/basic_concept/dropdown)
- [Dropdown Examples](https://visactor.io/vtable/examples/dropdown/basic)
- [Custom Dropdown Tutorial](https://visactor.io/vtable/guide/advanced/custom_dropdown)