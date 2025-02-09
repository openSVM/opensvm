# How the VTable component progressively loads sub-nodes in a list

## Question

How can the VTable component progressively load sub-nodes in a list?

## Answer

VTable supports progressive loading of sub-nodes through:
1. Lazy loading configuration
2. Dynamic node expansion
3. Loading state management
4. Asynchronous data fetching

## Code Example

```typescript
// Method 1: Basic lazy loading
const columns = [
  {
    field: 'name',
    title: 'Name',
    width: 200,
    // Tree column configuration
    tree: {
      indent: 20,
      expanded: false
    }
  }
];

// Create table with lazy loading
const table = new VTable.ListTable({
  container: document.getElementById('container'),
  columns: columns,
  records: data,
  // Enable tree structure
  tree: {
    enabled: true,
    // Lazy loading configuration
    loadChildren: async (node) => {
      // Simulate API call
      const children = await fetchChildNodes(node.id);
      return children;
    }
  }
});

// Method 2: Node loading manager
class NodeLoadingManager {
  constructor(table) {
    this.table = table;
    this.loadingNodes = new Set();
    this.loadedNodes = new Set();
    this.setupLoadingHandlers();
  }
  
  setupLoadingHandlers() {
    this.table.on('node-expand', async (event) => {
      const { node } = event;
      
      if (!this.isNodeLoaded(node)) {
        await this.loadNodeChildren(node);
      }
    });
  }
  
  async loadNodeChildren(node) {
    if (this.isNodeLoading(node)) return;
    
    this.setNodeLoading(node, true);
    
    try {
      const children = await this.fetchChildren(node);
      this.addChildren(node, children);
      this.markNodeLoaded(node);
    } catch (error) {
      this.handleLoadError(node, error);
    } finally {
      this.setNodeLoading(node, false);
    }
  }
  
  setNodeLoading(node, loading) {
    const key = this.getNodeKey(node);
    
    if (loading) {
      this.loadingNodes.add(key);
    } else {
      this.loadingNodes.delete(key);
    }
    
    this.updateLoadingState(node);
  }
  
  isNodeLoading(node) {
    return this.loadingNodes.has(this.getNodeKey(node));
  }
  
  isNodeLoaded(node) {
    return this.loadedNodes.has(this.getNodeKey(node));
  }
  
  markNodeLoaded(node) {
    this.loadedNodes.add(this.getNodeKey(node));
  }
  
  getNodeKey(node) {
    return node.id;
  }
  
  updateLoadingState(node) {
    // Update loading indicator
    this.table.updateCell(node.row, 'name', {
      loading: this.isNodeLoading(node)
    });
  }
  
  addChildren(parent, children) {
    this.table.addRows(children, parent.row + 1);
  }
  
  async fetchChildren(node) {
    // Implement your data fetching logic
    return [];
  }
  
  handleLoadError(node, error) {
    console.error(`Failed to load children for node ${node.id}:`, error);
  }
}

// Initialize loading manager
const loadingManager = new NodeLoadingManager(table);

// Method 3: Custom loading states
function createLoadingIndicator(node) {
  return {
    type: 'html',
    html: `
      <div class="loading-indicator ${node.loading ? 'active' : ''}">
        <div class="spinner"></div>
        ${node.name}
      </div>
    `,
    style: `
      .loading-indicator {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .spinner {
        width: 16px;
        height: 16px;
        border: 2px solid #f3f3f3;
        border-top: 2px solid #3498db;
        border-radius: 50%;
        display: none;
      }
      .loading-indicator.active .spinner {
        display: block;
        animation: spin 1s linear infinite;
      }
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `
  };
}

// Method 4: Batch loading optimization
class BatchLoadingManager {
  constructor(loadingManager, batchSize = 10) {
    this.loadingManager = loadingManager;
    this.batchSize = batchSize;
    this.queue = [];
    this.processing = false;
  }
  
  queueNode(node) {
    this.queue.push(node);
    
    if (!this.processing) {
      this.processBatch();
    }
  }
  
  async processBatch() {
    this.processing = true;
    
    while (this.queue.length > 0) {
      const batch = this.queue.splice(0, this.batchSize);
      await Promise.all(
        batch.map(node => this.loadingManager.loadNodeChildren(node))
      );
    }
    
    this.processing = false;
  }
}
```

## Related Links

- [VTable Tree Documentation](https://visactor.io/vtable/guide/basic_concept/tree)
- [Lazy Loading Guide](https://visactor.io/vtable/guide/advanced/lazy_loading)
- [Tree Examples](https://visactor.io/vtable/examples/tree/basic)