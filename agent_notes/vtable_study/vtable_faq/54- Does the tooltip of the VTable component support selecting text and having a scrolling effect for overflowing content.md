# Does the tooltip of the VTable component support selecting text and having a scrolling effect for overflowing content

## Question

Does the tooltip of the VTable component support selecting text and having a scrolling effect for overflowing content?

## Answer

VTable tooltips can support text selection and scrolling through:
1. Custom tooltip configuration
2. HTML-based tooltips
3. Scrollable content containers
4. Interactive tooltip features

## Code Example

```typescript
const columns = [
  {
    field: 'description',
    title: 'Description',
    width: 150,
    // Method 1: Basic scrollable tooltip
    tooltip: {
      enabled: true,
      content: (cell) => ({
        type: 'html',
        content: `
          <div class="scrollable-tooltip">
            ${cell.value}
          </div>
        `,
        style: `
          .scrollable-tooltip {
            max-height: 200px;
            max-width: 300px;
            overflow-y: auto;
            padding: 8px;
            user-select: text;
          }
        `
      })
    }
  }
];

// Create table with enhanced tooltips
const table = new VTable.ListTable({
  container: document.getElementById('container'),
  columns: columns,
  records: data
});

// Method 2: Custom tooltip manager
class TooltipManager {
  constructor(table) {
    this.table = table;
    this.setupTooltips();
  }
  
  setupTooltips() {
    this.table.setTooltipOptions({
      // Global tooltip configuration
      placement: 'top',
      showDelay: 200,
      hideDelay: 200,
      // Custom tooltip renderer
      renderer: (cell) => this.createTooltip(cell)
    });
  }
  
  createTooltip(cell) {
    const content = this.getTooltipContent(cell);
    
    return {
      type: 'html',
      content: `
        <div class="enhanced-tooltip">
          <div class="tooltip-header">
            ${this.getTooltipHeader(cell)}
          </div>
          <div class="tooltip-content">
            ${content}
          </div>
          ${this.getTooltipFooter(cell)}
        </div>
      `,
      style: this.getTooltipStyles()
    };
  }
  
  getTooltipContent(cell) {
    // Generate tooltip content
    return cell.value;
  }
  
  getTooltipHeader(cell) {
    return `<h3>${cell.column.title}</h3>`;
  }
  
  getTooltipFooter(cell) {
    return `
      <div class="tooltip-footer">
        <span class="tooltip-info">Click to copy</span>
      </div>
    `;
  }
  
  getTooltipStyles() {
    return `
      .enhanced-tooltip {
        background: #fff;
        border: 1px solid #d9d9d9;
        border-radius: 4px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        max-width: 400px;
      }
      
      .tooltip-header {
        padding: 8px;
        border-bottom: 1px solid #f0f0f0;
      }
      
      .tooltip-content {
        padding: 8px;
        max-height: 300px;
        overflow-y: auto;
        user-select: text;
      }
      
      .tooltip-footer {
        padding: 8px;
        border-top: 1px solid #f0f0f0;
        color: #666;
        font-size: 12px;
      }
    `;
  }
}

// Initialize tooltip manager
const tooltipManager = new TooltipManager(table);

// Method 3: Interactive tooltip content
function createInteractiveTooltip(cell) {
  return {
    type: 'html',
    content: `
      <div class="interactive-tooltip">
        <div class="tooltip-tabs">
          <button class="tab-button active" data-tab="preview">Preview</button>
          <button class="tab-button" data-tab="details">Details</button>
        </div>
        <div class="tab-content active" data-tab="preview">
          ${cell.value}
        </div>
        <div class="tab-content" data-tab="details">
          ${getDetailedContent(cell)}
        </div>
      </div>
    `,
    style: `
      .interactive-tooltip {
        min-width: 300px;
      }
      
      .tooltip-tabs {
        display: flex;
        border-bottom: 1px solid #f0f0f0;
      }
      
      .tab-button {
        padding: 8px 16px;
        border: none;
        background: none;
        cursor: pointer;
      }
      
      .tab-button.active {
        border-bottom: 2px solid #1890ff;
      }
      
      .tab-content {
        display: none;
        padding: 16px;
        max-height: 250px;
        overflow-y: auto;
      }
      
      .tab-content.active {
        display: block;
      }
    `,
    afterRender: (container) => {
      setupTooltipInteractions(container);
    }
  };
}

function setupTooltipInteractions(container) {
  const tabs = container.querySelectorAll('.tab-button');
  tabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      const targetTab = e.target.dataset.tab;
      
      // Update active states
      tabs.forEach(t => t.classList.remove('active'));
      e.target.classList.add('active');
      
      // Show selected content
      container.querySelectorAll('.tab-content').forEach(content => {
        content.classList.toggle('active', content.dataset.tab === targetTab);
      });
    });
  });
}
```

## Related Links

- [VTable Tooltip Documentation](https://visactor.io/vtable/guide/basic_concept/tooltip)
- [Custom Tooltip Examples](https://visactor.io/vtable/examples/tooltip/custom)
- [Interactive Features Guide](https://visactor.io/vtable/guide/advanced/interactive)