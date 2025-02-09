# How to set multi-level table headers

## Question

How to set multi-level table headers?

## Answer

VTable supports multi-level headers through:
1. Hierarchical column configuration
2. Header grouping
3. Nested header definitions
4. Custom header rendering

## Code Example

```typescript
// Method 1: Basic multi-level headers
const columns = [
  {
    title: 'Product Information',
    children: [
      {
        field: 'id',
        title: 'ID',
        width: 100
      },
      {
        field: 'name',
        title: 'Name',
        width: 150
      }
    ]
  },
  {
    title: 'Sales Information',
    children: [
      {
        title: 'Performance',
        children: [
          {
            field: 'sales',
            title: 'Sales',
            width: 120
          },
          {
            field: 'profit',
            title: 'Profit',
            width: 120
          }
        ]
      },
      {
        title: 'Timeline',
        children: [
          {
            field: 'date',
            title: 'Date',
            width: 120
          },
          {
            field: 'quarter',
            title: 'Quarter',
            width: 100
          }
        ]
      }
    ]
  }
];

// Create table with multi-level headers
const table = new VTable.ListTable({
  container: document.getElementById('container'),
  columns: columns,
  records: data,
  // Header configuration
  header: {
    height: 40, // Height per header row
    style: {
      textAlign: 'center',
      borderColor: '#e8e8e8'
    }
  }
});

// Method 2: Dynamic header configuration
class HeaderManager {
  constructor(table) {
    this.table = table;
    this.headerLevels = new Map();
  }
  
  addHeaderLevel(config) {
    const { level, groups } = config;
    this.headerLevels.set(level, groups);
    this.updateHeaders();
  }
  
  updateHeaders() {
    const columns = this.buildHeaderHierarchy();
    this.table.updateColumns(columns);
  }
  
  buildHeaderHierarchy() {
    // Start with leaf columns
    let columns = this.getLeafColumns();
    
    // Build hierarchy from bottom up
    for (let level = Math.max(...this.headerLevels.keys()); level > 0; level--) {
      const groups = this.headerLevels.get(level) || [];
      columns = this.groupColumns(columns, groups);
    }
    
    return columns;
  }
  
  groupColumns(columns, groups) {
    return groups.map(group => ({
      title: group.title,
      children: columns.filter(col => 
        group.fields.includes(col.field || col.children?.[0]?.field)
      )
    }));
  }
  
  getLeafColumns() {
    return this.table.getColumns()
      .filter(col => !col.children)
      .map(col => ({ ...col }));
  }
}

// Method 3: Custom header rendering
const customColumns = [
  {
    title: 'Custom Group',
    children: [
      {
        field: 'value',
        title: 'Value',
        width: 150,
        headerStyle: {
          render: (ctx, rect, column) => {
            // Draw custom header
            ctx.fillStyle = '#f0f0f0';
            ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
            
            // Draw text
            ctx.fillStyle = '#000';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(
              column.title,
              rect.x + rect.width / 2,
              rect.y + rect.height / 2
            );
            
            // Draw indicator
            drawHeaderIndicator(ctx, rect);
          }
        }
      }
    ]
  }
];

// Helper function for custom header rendering
function drawHeaderIndicator(ctx, rect) {
  const size = 6;
  const x = rect.x + rect.width - size - 8;
  const y = rect.y + rect.height / 2;
  
  ctx.beginPath();
  ctx.moveTo(x, y - size);
  ctx.lineTo(x + size, y);
  ctx.lineTo(x, y + size);
  ctx.fillStyle = '#1890ff';
  ctx.fill();
}

// Initialize header manager
const headerManager = new HeaderManager(table);

// Example: Add header levels
headerManager.addHeaderLevel({
  level: 1,
  groups: [
    {
      title: 'Basic Info',
      fields: ['id', 'name']
    },
    {
      title: 'Metrics',
      fields: ['sales', 'profit']
    }
  ]
});
```

## Related Links

- [VTable Header Documentation](https://visactor.io/vtable/guide/basic_concept/header)
- [Column Configuration Guide](https://visactor.io/vtable/guide/basic_concept/columns)
- [Header Examples](https://visactor.io/vtable/examples/header/multi-level)