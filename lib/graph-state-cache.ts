/**
 * GraphStateCache - A utility for preserving graph state during navigation
 * 
 * This module provides functionality to cache and restore graph state,
 * including viewport position, focused transaction, and graph elements.
 */

// Interface for viewport state
export interface ViewportState {
  zoom: number;
  pan: { x: number; y: number };
}

// Interface for graph state
export interface GraphState { 
  focusedTransaction: string;
  title?: string;
  timestamp?: number;
  nodes: string[];  // Node IDs
  edges: string[];  // Edge IDs
  viewportState: ViewportState;
}

// Extended state tracking for expansion depth
export interface EnhancedGraphState extends GraphState {
  expandedNodes: Set<string>;  // Tracks which nodes have been expanded
  expansionDepth: Record<string, number>;  // Tracks expansion depth per node
  expandedTimestamp?: number; // When the graph was last expanded
}

// For backward compatibility with existing code
export interface SavedGraphState {
  nodes: string[];  // Node IDs
  edges: string[];  // Edge IDs
  viewportState: ViewportState;
}

// Cache TTL in milliseconds (30 minutes)
const CACHE_TTL = 30 * 60 * 1000;
// Maximum number of transaction states to store in memory
const MAX_MEMORY_CACHE_SIZE = 200000000;

// Storage key
const GRAPH_STATE_STORAGE_KEY = 'opensvm-graph-state';

/**
 * GraphStateCache - Provides methods for persisting and retrieving graph state
 */
export class GraphStateCache {
  // In-memory cache for faster access during user session
  private static memoryCache: Map<string, EnhancedGraphState> = new Map();
  
  /**
   * Save graph state to local storage and in-memory cache
   * @param state - The graph state to save
   * @param signature - Optional transaction signature as a key
   */
  static saveState(state: GraphState, signature?: string): void {
    try {
      let enhancedState: EnhancedGraphState;
      if (signature) {
        const existing = GraphStateCache.memoryCache.get(signature);
        if (existing) {
          // Merge the new state with the existing enhanced state without discarding expansion info
          enhancedState = {
            ...state,
            expandedNodes: existing.expandedNodes,
            expansionDepth: existing.expansionDepth,
            expandedTimestamp: Date.now()
          };
        } else {
          // Check if state already has enhanced properties (rarely provided), otherwise create new ones
          if ((state as EnhancedGraphState).expandedNodes && (state as EnhancedGraphState).expansionDepth) {
            enhancedState = { ...state } as EnhancedGraphState;
            enhancedState.expandedTimestamp = Date.now();
          } else {
            enhancedState = {
              ...state,
              expandedNodes: new Set<string>(),
              expansionDepth: {},
              expandedTimestamp: Date.now()
            };
          }
        }
        GraphStateCache.memoryCache.set(signature, enhancedState);
      }
      const key = signature ? `${GRAPH_STATE_STORAGE_KEY}-${signature}` : GRAPH_STATE_STORAGE_KEY;
      // When saving to local storage, include enhanced fields if available, converting Set to an array for serialization
      let stateToStore: any = state;
      if (signature && GraphStateCache.memoryCache.has(signature)) {
        const data = GraphStateCache.memoryCache.get(signature)!;
        stateToStore = {
          ...data,
          expandedNodes: Array.from(data.expandedNodes)
        };
      }
      localStorage.setItem(key, JSON.stringify(stateToStore));
    } catch (error) {
      console.error('Failed to save graph state:', error);
    }
  }

  /**
   * Automatically save graph state based on focused transaction
   * @param state - The graph state to save
   */
  static autoSave(state: GraphState): void {
    if (state.focusedTransaction) {
      // Throttle saves to prevent excessive writes
      // Skip if no nodes or edges are provided
      if (!state.nodes || !state.edges || (state.nodes.length === 0 && state.edges.length === 0)) {
        return;
      }
      const signature = state.focusedTransaction;
      const existing = GraphStateCache.memoryCache.get(signature);
      const now = Date.now();
      
      // Only save if: No existing state OR significant changes detected
      if (!existing || 
          (now - (existing.expandedTimestamp || 0) > 2000) || 
          (Math.abs(existing.nodes.length - state.nodes.length) > 3) ||
          (existing.focusedTransaction !== state.focusedTransaction)) {
          
        GraphStateCache.saveState(state, signature);
        
        // Also save as the latest state
        GraphStateCache.saveState(state);
      }
      
      // Keep the cache size in check
      GraphStateCache.trimMemoryCache();
    }
  }

  /**
   * Get list of all saved graphs with metadata
   * @returns Array of saved graph metadata
   */
  static getSavedGraphs(): Array<{
    signature: string;
    title?: string;
    timestamp?: number;
  }> {
    try {
      const savedGraphs: Array<{
        signature: string;
        title?: string;
        timestamp?: number;
      }> = [];

      // Find all keys related to graph state
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(GRAPH_STATE_STORAGE_KEY) && key !== GRAPH_STATE_STORAGE_KEY) {
          // Extract signature from key
          const signature = key.replace(`${GRAPH_STATE_STORAGE_KEY}-`, '');
          try {
            const storedState = localStorage.getItem(key);
            if (storedState) {
              const state = JSON.parse(storedState) as GraphState;
              savedGraphs.push({
                signature,
                title: state.title || signature.substring(0, 8) + '...',
                timestamp: state.timestamp || Date.now()
              });
            }
          } catch (e) {
            // Skip invalid entries
            console.error('Invalid graph state entry:', e);
          }
        }
      }
      
      // Sort by timestamp descending (newest first)
      return savedGraphs.sort((a, b) => 
        (b.timestamp || 0) - (a.timestamp || 0)
      );
    } catch (error) {
      return [];
    }
  }

  /**
   * Load graph state from local storage
   * @param signature - Optional transaction signature to load specific state
   * @returns The loaded graph state or null if none exists
   */
  static loadState(signature?: string): GraphState | null {
    try {
      // First check in-memory cache for faster access
      if (signature && GraphStateCache.memoryCache.has(signature)) {
        const cached = GraphStateCache.memoryCache.get(signature);
        // Update timestamp to mark as recently accessed
        cached.expandedTimestamp = Date.now();
        return cached;
      }
      
      // If not in memory, load from local storage
      const key = signature ? `${GRAPH_STATE_STORAGE_KEY}-${signature}` : GRAPH_STATE_STORAGE_KEY;
      const storedState = localStorage.getItem(key);
      
      if (storedState) {
        const parsedState = JSON.parse(storedState) as GraphState;
        
        // Convert the parsed state to an EnhancedGraphState if loading by signature
        if (signature && !((parsedState as EnhancedGraphState).expandedNodes instanceof Set)) {
          // Handle conversion from array to Set for expandedNodes
          const enhancedState: EnhancedGraphState = {
            ...parsedState,
            expandedNodes: new Set(Array.isArray((parsedState as any).expandedNodes) ? 
              (parsedState as any).expandedNodes : []),
            expansionDepth: (parsedState as any).expansionDepth || {},
            expandedTimestamp: Date.now()
          };
          return enhancedState;
        }
        return parsedState;
      }
    } catch (error) {
      console.error('Failed to load graph state:', error);
      }
    
    return null;
  }

  /**
   * Clear all graph states from local storage
   */
  static clearAllStates(): void {
    try {
      // Find all keys related to graph state
      const statesToRemove: string[] = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(GRAPH_STATE_STORAGE_KEY)) {
          statesToRemove.push(key);
        }
      }
      
      // Remove all found states
      statesToRemove.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.error('Failed to clear graph states:', error);
    }
  }

  /**
   * Check if a state exists for a specific transaction
   * @param signature - The transaction signature to check
   * @returns Whether a state exists for the given transaction
   */
  static hasState(signature: string): boolean {
    try {
      // First check in-memory cache for faster access and to catch states not yet persisted
      if (GraphStateCache.memoryCache.has(signature)) {
        return true;
      }
      
      // Then check localStorage as a fallback
      const key = `${GRAPH_STATE_STORAGE_KEY}-${signature}`;
      return typeof localStorage !== 'undefined' && localStorage.getItem(key) !== null;
    } catch (e) {
      console.error('Error checking for graph state:', e);
      return false;
    }
  }
  
  /**
   * Delete a saved graph state
   * @param signature - The transaction signature to delete
   * @returns Whether the deletion was successful
   */
  static deleteGraph(signature: string): boolean {
    try {
      const key = `${GRAPH_STATE_STORAGE_KEY}-${signature}`;
      localStorage.removeItem(key);
      // Also remove from memory cache
      GraphStateCache.memoryCache.delete(signature);
      return true;
    } catch (e) {
      console.error('Error deleting graph state:', e);
      return false;
    }
  }
  
  /**
   * Trim the in-memory cache to prevent excessive memory usage
   * Uses LRU strategy based on access timestamp
   */
  private static trimMemoryCache(): void {
    if (GraphStateCache.memoryCache.size <= MAX_MEMORY_CACHE_SIZE) return;
    
    // Convert to array and sort by timestamp (oldest first)
    const entries = Array.from(GraphStateCache.memoryCache.entries())
      .sort((a, b) => (a[1].expandedTimestamp || 0) - (b[1].expandedTimestamp || 0));
      
    // Remove oldest entries until we're under the limit
    while (entries.length > MAX_MEMORY_CACHE_SIZE) {
      const oldest = entries.shift();
      if (oldest) {
        GraphStateCache.memoryCache.delete(oldest[0]);
      }
    }
  }
}