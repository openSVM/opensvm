# How to display user information, such as a combination of avatar + name, in data analysis reports or tables

## Question

How to display user information, such as a combination of avatar + name, in data analysis reports or tables?

## Answer

You can display combined user information in VTable using custom cell rendering with HTML elements or canvas-based rendering.

## Code Example

```typescript
const columns = [
  {
    field: 'user',
    title: 'User',
    width: 200,
    render: (cell) => {
      const { avatar, name, role } = cell.value;
      
      // Using HTML elements
      return {
        type: 'html',
        html: `
          <div style="display: flex; align-items: center; gap: 8px;">
            <img 
              src="${avatar}" 
              style="width: 32px; height: 32px; border-radius: 50%;"
              alt="${name}"
            />
            <div>
              <div style="font-weight: bold;">${name}</div>
              <div style="color: #666; font-size: 12px;">${role}</div>
            </div>
          </div>
        `
      };
      
      // Alternative: Using canvas-based rendering
      /*
      return {
        type: 'custom',
        render: (ctx, rect) => {
          // Draw avatar
          const img = new Image();
          img.src = avatar;
          ctx.drawImage(img, rect.x, rect.y, 32, 32);
          
          // Draw text
          ctx.fillStyle = '#000';
          ctx.font = 'bold 14px Arial';
          ctx.fillText(name, rect.x + 40, rect.y + 16);
          
          ctx.fillStyle = '#666';
          ctx.font = '12px Arial';
          ctx.fillText(role, rect.x + 40, rect.y + 32);
        }
      };
      */
    }
  }
];

const table = new VTable.ListTable({
  container: document.getElementById('container'),
  columns: columns,
  records: data
});
```

## Related Links

- [VTable Custom Rendering](https://visactor.io/vtable/guide/advanced/custom_render)
- [Cell Rendering Examples](https://visactor.io/vtable/examples/cell/custom-render)