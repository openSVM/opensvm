# Transaction Graph Streaming Implementation Plan

## Current Issues

1. **Blocking Data Fetching**: The transaction graph loads completely behind a loading overlay and only displays when all data is fetched
2. **Sequential Loading**: Nodes are added one by one, with the complete graph only shown at the end
3. **Insufficient RPC Parallelization**: Not fully utilizing the 250 available RPC endpoints

## Implementation Plan

### 1. Stream Graph Nodes During Loading

#### Changes to TransactionGraph.tsx:

- Split the `addAccountToGraph` function into two parts:
  - `queueAccountFetch`: Queue an account for fetching without waiting
  - `processFetchQueue`: Process the queue in parallel, adding nodes as they arrive
- Remove the loading overlay and show partial graph as it's being built
- Add visual indicators for nodes being loaded
- Implement a state management system to track loading progress
- Adjust the layout to handle incremental updates

### 2. Optimize RPC Endpoint Usage

#### Changes to connection handling:

- Modify `account-transactions` API to process multiple accounts in parallel
- Create a batch request system for related transaction data
- Increase concurrent connection limits
- Implement connection pooling optimizations for the graph visualization
- Add timeouts and fallbacks for individual RPC requests

### 3. UI Feedback During Loading

- Add visual indicators for different loading states
- Show progress indicators for transaction loading
- Implement incremental graph layouts
- Add hover states to show loading progress

## Technical Implementation Details

### New Transaction Graph Loading Flow:

1. Initialize empty graph structure
2. Queue initial transactions/accounts for fetching
3. Process queue with parallelized fetching
4. Add nodes to graph as soon as data arrives
5. Update layout incrementally 
6. Continue fetching in background as user interacts

### RPC Connection Optimization:

1. Create a dedicated connection pool for transaction graph 
2. Implement parallel request batching
3. Add request distribution across all 250 endpoints
4. Implement retries with endpoint rotation
5. Add monitoring for endpoint health