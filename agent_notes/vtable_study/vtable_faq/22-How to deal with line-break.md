# How to deal with line-break

## Question

How to deal with line-break in VTable?

## Answer

VTable provides several ways to handle line breaks:
1. Automatic line wrapping
2. Manual line breaks
3. Text overflow handling
4. Custom line break rendering

## Code Example

```typescript
const columns = [
  {
    // Method 1: Automatic line wrapping
    field: 'description',
    title: 'Description',
    width: 200,
    style: {
      wordWrap: true, // Enable automatic wrapping
      lineHeight: 1.5, // Line height for wrapped text
      padding: [8, 12] // Padding for better readability
    }
  },
  {
    // Method 2: Manual line breaks
    field: 'notes',
    title: 'Notes',
    width: 200,
    render: (cell) => {
      // Replace \n with <br> for HTML rendering
      return {
        type: 'html',
        html: cell.value.replace(/\n/g, '<br>')
      };
    }
  },
  {
    // Method 3: Text overflow handling
    field: 'title',
    title: 'Title',
    width: 150,
    style: {
      textOverflow: 'ellipsis', // Show ellipsis for overflow
      overflow: 'hidden',
      lineClamp: 2 // Limit to 2 lines
    }
  },
  {
    // Method 4: Custom line break rendering
    field: 'content',
    title: 'Content',
    width: 200,
    render: (cell) => {
      return {
        type: 'custom',
        render: (ctx, rect) => {
          const text = cell.value;
          const lines = text.split('\n');
          const lineHeight = 20;
          
          lines.forEach((line, index) => {
            ctx.fillText(
              line,
              rect.x + 8,
              rect.y + 8 + (index * lineHeight)
            );
          });
        }
      };
    }
  }
];

// Create table with line break handling
const table = new VTable.ListTable({
  container: document.getElementById('container'),
  columns: columns,
  records: data,
  // Global text wrapping settings
  defaultRowHeight: 'auto', // Adjust row height automatically
  defaultStyle: {
    wordWrap: true,
    padding: [8, 12]
  }
});

// Update cell content with line breaks
function updateCellContent(rowIndex, colIndex, content) {
  const formattedContent = content.replace(/\r\n/g, '\n'); // Normalize line breaks
  table.updateCell(rowIndex, colIndex, formattedContent);
}
```

## Related Links

- [VTable Text Wrapping Guide](https://visactor.io/vtable/guide/basic_concept/text_wrap)
- [Cell Style Documentation](https://visactor.io/vtable/guide/basic_concept/style)
- [Custom Rendering Examples](https://visactor.io/vtable/examples/cell/custom-render)