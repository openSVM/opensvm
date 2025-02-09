# How to dynamically set the min and max values of the progressBar type in the VTable component based on the data items of the current row

## Question

How to dynamically set the min and max values of the progressBar type in the VTable component based on the data items of the current row?

## Answer

VTable's progressBar can be dynamically configured through:
1. Dynamic progress configuration
2. Row-based calculations
3. Custom progress rendering
4. Value normalization

## Code Example

```typescript
const columns = [
  {
    // Method 1: Basic dynamic progress bar
    field: 'progress',
    title: 'Progress',
    width: 200,
    columnType: 'progressbar',
    progressbar: (cell) => {
      const row = cell.row;
      const rowData = cell.table.getData()[row];
      
      return {
        min: rowData.minValue || 0,
        max: rowData.maxValue || 100,
        value: cell.value,
        showValue: true,
        style: {
          barColor: getProgressColor(cell.value, rowData.minValue, rowData.maxValue)
        }
      };
    }
  },
  {
    // Method 2: Custom progress calculation
    field: 'customProgress',
    title: 'Custom Progress',
    width: 200,
    render: (cell) => {
      const rowData = cell.table.getData()[cell.row];
      const { current, target } = rowData;
      
      // Calculate progress percentage
      const progress = (current / target) * 100;
      
      return {
        type: 'html',
        html: `
          <div class="custom-progress">
            <div class="progress-bar" 
                 style="width: ${progress}%; 
                        background-color: ${getColorByProgress(progress)}">
            </div>
            <span class="progress-text">
              ${current} / ${target} (${progress.toFixed(1)}%)
            </span>
          </div>
        `,
        style: `
          .custom-progress {
            position: relative;
            width: 100%;
            height: 20px;
            background: #f5f5f5;
            border-radius: 4px;
            overflow: hidden;
          }
          .progress-bar {
            height: 100%;
            transition: width 0.3s;
          }
          .progress-text {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: #fff;
            text-shadow: 0 0 2px rgba(0,0,0,0.5);
          }
        `
      };
    }
  }
];

// Helper function to get progress color
function getProgressColor(value, min, max) {
  const percentage = ((value - min) / (max - min)) * 100;
  
  if (percentage < 30) return '#ff4d4f';
  if (percentage < 70) return '#faad14';
  return '#52c41a';
}

// Helper function for custom color calculation
function getColorByProgress(progress) {
  if (progress < 30) return '#ff4d4f';
  if (progress < 70) return '#faad14';
  return '#52c41a';
}

// Create table with dynamic progress bars
const table = new VTable.ListTable({
  container: document.getElementById('container'),
  columns: columns,
  records: data
});

// Method 3: Progress bar manager for complex calculations
class ProgressManager {
  constructor(table) {
    this.table = table;
    this.cache = new Map();
  }
  
  calculateProgress(row) {
    const cacheKey = `row-${row}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }
    
    const rowData = this.table.getData()[row];
    const progress = this.computeProgress(rowData);
    
    this.cache.set(cacheKey, progress);
    return progress;
  }
  
  computeProgress(rowData) {
    // Complex progress calculation logic
    const { current, target, weights = {} } = rowData;
    
    // Apply weights to different factors
    let weightedProgress = 0;
    let totalWeight = 0;
    
    Object.entries(weights).forEach(([factor, weight]) => {
      weightedProgress += (rowData[factor] / target) * weight;
      totalWeight += weight;
    });
    
    return totalWeight > 0 
      ? (weightedProgress / totalWeight) * 100 
      : (current / target) * 100;
  }
  
  clearCache() {
    this.cache.clear();
  }
}

// Initialize progress manager
const progressManager = new ProgressManager(table);

// Update progress when data changes
table.on('data-change', () => {
  progressManager.clearCache();
  table.render();
});
```

## Related Links

- [VTable Progress Bar Documentation](https://visactor.io/vtable/guide/basic_concept/progress_bar)
- [Custom Rendering Guide](https://visactor.io/vtable/guide/advanced/custom_render)
- [Dynamic Column Configuration](https://visactor.io/vtable/guide/basic_concept/columns)