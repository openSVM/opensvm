# How to display tree structure data in a table

## Question

How to display tree structure data in a table?

## Answer

VTable provides built-in support for tree structure data through its TreeTable component. You can display hierarchical data with expandable/collapsible rows and customizable indentation.

## Code Example

```typescript
// Sample tree-structured data
const treeData = [
  {
    id: '1',
    name: 'Parent 1',
    children: [
      {
        id: '1-1',
        name: 'Child 1.1',
        children: [
          { id: '1-1-1', name: 'Grandchild 1.1.1' }
        ]
      },
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

// Column configuration
const columns = [
  {
    field: 'name',
    title: 'Name',
    width: 300,
    tree: {
      indent: 20, // Indentation for each level
      expandIcon: {
        // Custom expand/collapse icons
        collapsed: {
          type: 'plus',
          fill: '#1890ff'
        },
        expanded: {
          type: 'minus',
          fill: '#1890ff'
        }
      }
    }
  },
  {
    field: 'id',
    title: 'ID',
    width: 100
  }
];

// Create TreeTable instance
const table = new VTable.TreeTable({
  container: document.getElementById('container'),
  columns: columns,
  records: treeData,
  defaultExpandedRows: ['1'], // Initially expanded rows
  defaultExpandAll: false, // Whether to expand all rows by default
  
  // Optional: Custom tree node configuration
  treeConfig: {
    childrenField: 'children', // Field containing child nodes
    openField: 'expanded', // Field indicating expanded state
    levelField: 'depth', // Field storing node depth
  }
});

// Handle expand/collapse events
table.on('expandedRowsChange', (event) => {
  console.log('Expanded rows:', event.expandedRows);
});

// Programmatically expand/collapse nodes
function expandNode(rowId) {
  table.expandRow(rowId);
}

function collapseNode(rowId) {
  table.collapseRow(rowId);
}

// Get current tree state
function getTreeState() {
  return {
    expandedRows: table.getExpandedRows(),
    collapsedRows: table.getCollapsedRows()
  };
}
```

## Related Links

- [VTable TreeTable Documentation](https://visactor.io/vtable/guide/basic_concept/tree_table)
- [Tree Table Examples](https://visactor.io/vtable/examples/tree/basic)
- [Tree Configuration Guide](https://visactor.io/vtable/guide/basic_concept/tree_config)