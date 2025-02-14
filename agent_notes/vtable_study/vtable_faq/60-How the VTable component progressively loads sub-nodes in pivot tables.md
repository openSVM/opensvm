# How the VTable component progressively loads sub-nodes in pivot tables

## Question

How can the VTable component progressively load sub-nodes in pivot tables?

## Answer

VTable supports progressive loading in pivot tables through:
1. Pivot node configuration
2. Asynchronous data loading
3. Expansion state management
4. Loading optimization

## Code Example

```typescript
// Method 1: Basic pivot table with lazy loading
const pivotTable = new VTable.PivotTable({
  container: document.getElementById('container'),
  rows: ['region', 'country', 'city'],
  columns: ['year', 'quarter'],
  indicators: [
    {
      field: 'sales',
      title: 'Sales',
      aggregation: 'sum'
    }
  ],
  // Enable lazy loading
  lazyLoad: {
    enabled: true,
    loadChildren: async (node) => {
      // Load child nodes data
      return await fetchPivotData(node);
    }
  }
});

// Method 2: Pivot loading manager
class PivotLoadingManager {
  constructor(table) {
    this.table = table;
    this.loadingStates = new Map();
    this.cache = new Map();
    this.setupLoadingHandlers();
  }
  
  setupLoadingHandlers() {
    this.table.on('node-expand', async (event) => {
      const { node } = event;
      
      if (!this.isNodeLoaded(node)) {
        await this.loadNodeData(node);
      }
    });
  }
  
  async loadNodeData(node) {
    if (this.isNodeLoading(node)) return;
    
    const cacheKey = this.getCacheKey(node);
    if (this.cache.has(cacheKey)) {
      this.applyCache(node, cacheKey);
      return;
    }
    
    this.setLoadingState(node, true);
    
    try {
      const data = await this.fetchData(node);
      this.cache.set(cacheKey, data);
      this.updatePivotData(node, data);
    } catch (error) {
      this.handleLoadError(node, error);
    } finally {
      this.setLoadingState(node, false);
    }
  }
  
  getCacheKey(node) {
    return `${node.dimension}:${node.value}:${node.level}`;
  }
  
  setLoadingState(node, loading) {
    this.loadingStates.set(this.getCacheKey(node), loading);
    this.updateLoadingIndicator(node);
  }
  
  isNodeLoading(node) {
    return this.loadingStates.get(this.getCacheKey(node)) || false;
  }
  
  isNodeLoaded(node) {
    return this.cache.has(this.getCacheKey(node));
  }
  
  updateLoadingIndicator(node) {
    const loading = this.isNodeLoading(node);
    this.table.updatePivotNode(node, { loading });
  }
  
  applyCache(node, cacheKey) {
    const data = this.cache.get(cacheKey);
    this.updatePivotData(node, data);
  }
  
  updatePivotData(node, data) {
    this.table.updatePivotData(node, data);
  }
  
  clearCache() {
    this.cache.clear();
  }
}

// Initialize loading manager
const pivotLoadingManager = new PivotLoadingManager(pivotTable);

// Method 3: Custom loading renderer
function createLoadingRenderer(node) {
  return {
    type: 'html',
    html: `
      <div class="pivot-node ${node.loading ? 'loading' : ''}">
        <span class="node-value">${node.value}</span>
        ${node.loading ? '<div class="loading-spinner"></div>' : ''}
      </div>
    `,
    style: `
      .pivot-node {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .loading-spinner {
        width: 12px;
        height: 12px;
        border: 2px solid #f3f3f3;
        border-top: 2px solid #1890ff;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `
  };
}

// Method 4: Optimized data fetching
class PivotDataFetcher {
  constructor(batchSize = 5) {
    this.batchSize = batchSize;
    this.queue = [];
    this.processing = false;
  }
  
  queueFetch(node) {
    return new Promise((resolve, reject) => {
      this.queue.push({ node, resolve, reject });
      
      if (!this.processing) {
        this.processBatch();
      }
    });
  }
  
  async processBatch() {
    this.processing = true;
    
    while (this.queue.length > 0) {
      const batch = this.queue.splice(0, this.batchSize);
      const nodes = batch.map(item => item.node);
      
      try {
        const results = await this.fetchBatchData(nodes);
        batch.forEach((item, index) => {
          item.resolve(results[index]);
        });
      } catch (error) {
        batch.forEach(item => {
          item.reject(error);
        });
      }
    }
    
    this.processing = false;
  }
  
  async fetchBatchData(nodes) {
    // Implement batch data fetching
    return Promise.all(nodes.map(node => fetchPivotData(node)));
  }
}

// Initialize data fetcher
const dataFetcher = new PivotDataFetcher();
```

## Related Links

- [VTable Pivot Documentation](https://visactor.io/vtable/guide/pivot_table/basic)
- [Lazy Loading Guide](https://visactor.io/vtable/guide/advanced/lazy_loading)
- [Pivot Examples](https://visactor.io/vtable/examples/pivot/basic)