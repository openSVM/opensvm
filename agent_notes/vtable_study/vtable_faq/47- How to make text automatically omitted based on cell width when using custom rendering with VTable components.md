# How to make text automatically omitted based on cell width when using custom rendering with VTable components

## Question

How to make text automatically omitted based on cell width when using custom rendering with VTable components?

## Answer

VTable provides several ways to handle text omission in custom rendering:
1. Text measurement
2. Ellipsis rendering
3. Dynamic text truncation
4. Custom omission styles

## Code Example

```typescript
const columns = [
  {
    // Method 1: Basic text omission
    field: 'basic',
    title: 'Basic Omission',
    width: 150,
    render: (cell) => {
      const text = cell.value?.toString() || '';
      
      return {
        type: 'html',
        html: `
          <div class="omit-text" title="${text}">
            ${text}
          </div>
        `,
        style: `
          .omit-text {
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            width: 100%;
          }
        `
      };
    }
  },
  {
    // Method 2: Canvas-based text omission
    field: 'custom',
    title: 'Custom Omission',
    width: 150,
    render: (cell) => ({
      type: 'custom',
      render: (ctx, rect) => {
        const text = cell.value?.toString() || '';
        const padding = 8;
        const maxWidth = rect.width - (padding * 2);
        
        // Draw text with ellipsis
        drawTruncatedText(ctx, text, {
          x: rect.x + padding,
          y: rect.y + rect.height / 2,
          maxWidth,
          ellipsis: '...'
        });
      }
    })
  }
];

// Helper function for text truncation
function drawTruncatedText(ctx, text, options) {
  const { x, y, maxWidth, ellipsis = '...' } = options;
  
  ctx.textBaseline = 'middle';
  
  if (ctx.measureText(text).width <= maxWidth) {
    // Text fits, draw normally
    ctx.fillText(text, x, y);
    return;
  }
  
  // Text needs truncation
  const ellipsisWidth = ctx.measureText(ellipsis).width;
  let truncated = text;
  let width = ctx.measureText(truncated).width;
  
  while (width + ellipsisWidth > maxWidth && truncated.length > 0) {
    truncated = truncated.slice(0, -1);
    width = ctx.measureText(truncated).width;
  }
  
  ctx.fillText(truncated + ellipsis, x, y);
}

// Method 3: Text measurement manager
class TextMeasurer {
  constructor() {
    this.canvas = document.createElement('canvas');
    this.context = this.canvas.getContext('2d');
    this.cache = new Map();
  }
  
  measureText(text, font = '14px Arial') {
    const key = `${text}:${font}`;
    
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }
    
    this.context.font = font;
    const width = this.context.measureText(text).width;
    this.cache.set(key, width);
    
    return width;
  }
  
  truncateText(text, maxWidth, options = {}) {
    const {
      ellipsis = '...',
      font = '14px Arial',
      minLength = 1
    } = options;
    
    const ellipsisWidth = this.measureText(ellipsis, font);
    let truncated = text;
    
    while (
      truncated.length > minLength &&
      this.measureText(truncated, font) + ellipsisWidth > maxWidth
    ) {
      truncated = truncated.slice(0, -1);
    }
    
    return truncated.length === text.length
      ? text
      : truncated + ellipsis;
  }
  
  clearCache() {
    this.cache.clear();
  }
}

// Initialize text measurer
const textMeasurer = new TextMeasurer();

// Method 4: Multi-line text omission
function renderMultiLineText(ctx, text, rect, options = {}) {
  const {
    lineHeight = 20,
    maxLines = 2,
    padding = 8,
    ellipsis = '...'
  } = options;
  
  const maxWidth = rect.width - (padding * 2);
  const words = text.split(' ');
  const lines = [];
  let currentLine = words[0];
  
  // Split text into lines
  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const width = ctx.measureText(currentLine + ' ' + word).width;
    
    if (width <= maxWidth) {
      currentLine += ' ' + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  lines.push(currentLine);
  
  // Draw lines with omission
  const y = rect.y + padding;
  lines.slice(0, maxLines).forEach((line, index) => {
    if (index === maxLines - 1 && lines.length > maxLines) {
      // Last visible line needs ellipsis
      const truncated = textMeasurer.truncateText(line, maxWidth - ctx.measureText(ellipsis).width);
      ctx.fillText(truncated + ellipsis, rect.x + padding, y + (index * lineHeight));
    } else {
      ctx.fillText(line, rect.x + padding, y + (index * lineHeight));
    }
  });
}
```

## Related Links

- [VTable Custom Rendering](https://visactor.io/vtable/guide/advanced/custom_render)
- [Text Style Guide](https://visactor.io/vtable/guide/basic_concept/style)
- [Cell Rendering Examples](https://visactor.io/vtable/examples/cell/custom-render)