# How to set the expanded and collapsed state of the tree structure

## Question

How to set the expanded and collapsed state of the tree structure?

## Answer

VTable provides several ways to control tree structure expansion states:
1. Initial state configuration
2. Programmatic control
3. Event handling
4. State persistence

## Code Example

```typescript
// Sample tree data
const treeData = [
  {
    id: '1',
    name: 'Parent 1',
    children: [
      { id: '1-1', name: 'Child 1.1' },
      { id: '1-2', name: 'Child 1.2' }
    ]
  },
  {
    id: '2',
    name: 'Parent 2',
    children: [
      { id: '2-1', name: 'Child 2.1' }
    ]
  }
];

// Create TreeTable with expansion control
const table = new VTable.TreeTable({
  container: document.getElementById('container'),
  columns: columns,
  records: treeData,
  
  // Method 1: Initial state configuration
  defaultExpandedRows: ['1'], // Specify initially expanded rows
  defaultExpandAll: false, // Or expand all rows by default
  
  // Tree configuration
  treeConfig: {
    childrenField: 'children',
    openField: 'expanded', // Field to store expansion state
    levelField: 'depth' // Field to store node depth
  }
});

// Method 2: Programmatic control
function expandRow(rowId) {
  table.expandRow(rowId);
}

function collapseRow(rowId) {
  table.collapseRow(rowId);
}

function toggleRow(rowId) {
  table.toggleRow(rowId);
}

// Expand/collapse multiple rows
function expandRows(rowIds) {
  rowIds.forEach(id => table.expandRow(id));
}

function collapseAll() {
  table.collapseAll();
}

function expandAll() {
  table.expandAll();
}

// Method 3: Event handling
table.on('expandedRowsChange', (event) => {
  const { expandedRows, collapsedRows, changedRows } = event;
  console.log('Expanded rows:', expandedRows);
  console.log('Changed rows:', changedRows);
  
  // Save state if needed
  saveExpandState(expandedRows);
});

// Method 4: State persistence
function saveExpandState(expandedRows) {
  localStorage.setItem('treeExpandState', JSON.stringify(expandedRows));
}

function loadExpandState() {
  try {
    const savedState = JSON.parse(localStorage.getItem('treeExpandState'));
    if (savedState) {
      // Restore expansion state
      table.setExpandedRows(savedState);
    }
  } catch (error) {
    console.error('Failed to load expand state:', error);
  }
}

// Custom expansion logic
function expandToLevel(level) {
  const allRows = table.getAllRows();
  allRows.forEach(row => {
    if (row.depth < level) {
      table.expandRow(row.id);
    } else {
      table.collapseRow(row.id);
    }
  });
}

// Expand path to specific node
function expandToNode(nodeId) {
  const path = findNodePath(nodeId);
  if (path) {
    path.forEach(id => table.expandRow(id));
  }
}
```

## Related Links

- [VTable TreeTable Documentation](https://visactor.io/vtable/guide/basic_concept/tree_table)
- [Tree State Management](https://visactor.io/vtable/guide/basic_concept/tree_state)
- [Tree Examples](https://visactor.io/vtable/examples/tree/basic)