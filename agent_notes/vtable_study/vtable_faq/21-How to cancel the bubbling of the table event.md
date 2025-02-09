# How to cancel the bubbling of the table event

## Question

How to cancel the bubbling of the table event?

## Answer

VTable events can be controlled through:
1. Event preventDefault
2. Event stopPropagation
3. Custom event handlers
4. Event capture/bubble phase control

## Code Example

```typescript
const table = new VTable.ListTable({
  container: document.getElementById('container'),
  columns: columns,
  records: data
});

// Method 1: Using preventDefault
table.on('click', (event) => {
  // Prevent default behavior
  event.preventDefault();
  
  // Your custom handling
  console.log('Click handled:', event);
});

// Method 2: Using stopPropagation
table.on('mousedown', (event) => {
  // Stop event from bubbling up
  event.stopPropagation();
  
  // Your custom handling
  console.log('Mousedown handled:', event);
});

// Method 3: Custom event handler with both
table.on('dblclick', (event) => {
  // Prevent default and stop bubbling
  event.preventDefault();
  event.stopPropagation();
  
  // Your custom handling
  console.log('Double click handled:', event);
});

// Method 4: Event phase control
document.addEventListener('click', (event) => {
  // Check if event originated from table
  if (event.target.closest('.vtable')) {
    event.stopPropagation();
  }
}, true); // Use capture phase

// Example with multiple events
const eventHandler = {
  click: (event) => {
    event.stopPropagation();
    console.log('Click:', event);
  },
  mousedown: (event) => {
    event.stopPropagation();
    console.log('Mousedown:', event);
  },
  mouseup: (event) => {
    event.stopPropagation();
    console.log('Mouseup:', event);
  }
};

// Register multiple event handlers
Object.entries(eventHandler).forEach(([event, handler]) => {
  table.on(event, handler);
});

// Clean up event listeners when needed
function cleanup() {
  Object.entries(eventHandler).forEach(([event, handler]) => {
    table.off(event, handler);
  });
}
```

## Related Links

- [VTable Event Documentation](https://visactor.io/vtable/guide/basic_concept/events)
- [Event Handling Examples](https://visactor.io/vtable/examples/interaction/events)
- [Event API Reference](https://visactor.io/vtable/api/events)