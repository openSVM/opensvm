'use client';

import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import cytoscape from 'cytoscape';
import dagre from 'cytoscape-dagre';
import { useRouter } from 'next/navigation';
import { GraphStateCache, ViewportState } from '@/lib/graph-state-cache';
import { debounce } from '@/lib/utils';
import { TrackingStatsPanel } from './TrackingStatsPanel';
import { TransactionGraphClouds } from '../TransactionGraphClouds';
import { GPUAcceleratedForceGraph } from './GPUAcceleratedForceGraph';
import {
  TransactionGraphProps,
  createAddressFilter,
  createTransactionFilter,
  initializeCytoscape,
  setupGraphInteractions,
  resizeGraph,
  fetchTransactionData,
  fetchAccountTransactions,
  queueAccountFetch as queueAccountFetchUtil,
  processAccountFetchQueue as processAccountFetchQueueUtil,
  addAccountToGraph as addAccountToGraphUtil,
  expandTransactionGraph as expandTransactionGraphUtil,
  focusOnTransaction as focusOnTransactionUtil
} from './';

// Register the dagre layout extension
if (typeof window !== 'undefined') {
  cytoscape.use(dagre);
}

interface CachedNode {
  data: {
    id: string;
    [key: string]: any;
  };
  [key: string]: any;
}

interface CachedEdge {
  data: {
    id: string;
    [key: string]: any;
  };
  [key: string]: any;
}

interface CachedState {
  nodes: CachedNode[];
  edges?: CachedEdge[];
}

interface TrackingStats {
  totalTransactions: number;
  splTransfers: number;
  filteredSplTransfers: number;
  topVolumeByAddress: Array<{
    address: string;
    volume: number;
    tokenSymbol: string;
  }>;
  topVolumeByToken: Array<{
    token: string;
    volume: number;
    transactionCount: number;
  }>;
  lastUpdate: number;
  isTracking: boolean;
  trackedAddress: string | null;
}

function TransactionGraph({
  initialSignature,
  initialAccount,
  onTransactionSelect,
  clientSideNavigation = true,
  width = '100%',
  height = '100%',
  maxDepth = 2 // Reduced from 3 to 2 for better performance
}: TransactionGraphProps) {
  // Component refs 
  const containerRef = useRef<HTMLDivElement>(null);
  const isInitialized = useRef<boolean>(false);
  const timeoutIds = useRef<NodeJS.Timeout[]>([]);
  const cyRef = useRef<cytoscape.Core | null>(null);
  
  // Layout control refs - prevent excessive layout runs
  const lastLayoutTime = useRef<number>(0);
  const layoutCooldown = useRef<boolean>(false);
  const pendingLayoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Viewport state preservation
  const preservedViewport = useRef<{ zoom: number; pan: { x: number; y: number } } | null>(null);
  
  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  
  // GPU Force Graph State
  const [useGPUGraph, setUseGPUGraph] = useState<boolean>(true); // Always use GPU by default
  const [gpuGraphData, setGpuGraphData] = useState<{ nodes: any[]; links: any[] }>({ nodes: [], links: [] });
  
  // Address tracking state
  const [trackedAddress, setTrackedAddress] = useState<string | null>(null);
  const [isTrackingMode, setIsTrackingMode] = useState<boolean>(false);
  const [trackingStats, setTrackingStats] = useState<TrackingStats | null>(null);
  const trackingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const trackedTransactionsRef = useRef<Set<string>>(new Set());
  const MAX_TRACKED_TRANSACTIONS = 50; // Reduced from 100 to 50 for better performance
  
  // Excluded accounts and program identifiers
  const EXCLUDED_ACCOUNTS = useMemo(() => new Set([
    'ComputeBudget111111111111111111111111111111',
    '11111111111111111111111111111111',
    'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
    'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL',
    'SysvarRent111111111111111111111111111111111',
    'SysvarC1ock11111111111111111111111111111111',
    'SysvarRecentB1ockHashes11111111111111111111',
    'MEisE1HzehtrDpAAT8PnLHjpSSkRYakotTuJRPjTpo8',
    'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s'
  ]), []);

  const EXCLUDED_PROGRAM_SUBSTRINGS = useMemo(() => [
    'jupiter',
    'raydium',
    'orca',
    'serum',
    'whirlpool',
    'liquidity',
    'swap',
    'dex',
    'amm',
    'farm',
    'vault',
    'pool',
    'token-2022',
    'memo',
    'log',
    'instruction'
  ], []);

  // State management
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingProgress, setLoadingProgress] = useState<number>(0);
  const [totalAccounts, setTotalAccounts] = useState<number>(0);
  const [expandedNodesCount, setExpandedNodesCount] = useState<number>(0);
  const [currentSignature, setCurrentSignature] = useState<string>(initialSignature);
  const [error, setError] = useState<{message: string; severity: 'error' | 'warning'} | null>(null);
  const [viewportState, setViewportState] = useState<ViewportState | null>(null);

  const [navigationHistory, setNavigationHistory] = useState<string[]>([]);
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState<number>(-1);
  const [isNavigatingHistory, setIsNavigatingHistory] = useState<boolean>(false);

  // Cloud view state
  const [showCloudViewPanel, setShowCloudViewPanel] = useState<boolean>(false);

  // Refs for tracking state
  const processedNodesRef = useRef<Set<string>>(new Set());
  const processedEdgesRef = useRef<Set<string>>(new Set());
  const loadedTransactionsRef = useRef<Set<string>>(new Set());
  const loadedAccountsRef = useRef<Set<string>>(new Set());
  const transactionCache = useRef<Map<string, any>>(new Map());
  const pendingFetchesRef = useRef<Set<string>>(new Set());
  const isProcessingQueueRef = useRef<boolean>(false);
  const fetchQueueRef = useRef<Array<{address: string; depth: number; parentSignature: string | null}>>([]);
  const queueAccountFetchRef = useRef<any>(null);
  const focusSignatureRef = useRef<string>(initialSignature);
  const initialSignatureRef = useRef<string>(initialSignature);
  const initialAccountRef = useRef<string>(initialAccount);

  const router = useRouter();

  // Filtering functions
  const shouldExcludeAddress = useMemo(
    () => createAddressFilter(EXCLUDED_ACCOUNTS, EXCLUDED_PROGRAM_SUBSTRINGS),
    [EXCLUDED_ACCOUNTS, EXCLUDED_PROGRAM_SUBSTRINGS]
  );

  const shouldIncludeTransaction = useMemo(
    () => createTransactionFilter(shouldExcludeAddress),
    [shouldExcludeAddress]
  );

  // Optimized layout function with throttling
  const runLayoutOptimized = useCallback((fit = false, animate = false) => {
    if (!cyRef.current || layoutCooldown.current) return;
    
    // Clear any pending layout
    if (pendingLayoutRef.current) {
      clearTimeout(pendingLayoutRef.current);
    }
    
    // Throttle layout calls to prevent excessive re-rendering
    const now = Date.now();
    if (now - lastLayoutTime.current < 1000) { // 1 second cooldown
      pendingLayoutRef.current = setTimeout(() => runLayoutOptimized(fit, animate), 500);
      return;
    }
    
    lastLayoutTime.current = now;
    layoutCooldown.current = true;
    
    // Preserve viewport if not fitting
    if (!fit && cyRef.current) {
      preservedViewport.current = {
        zoom: cyRef.current.zoom(),
        pan: cyRef.current.pan()
      };
    }
    
    const layout = cyRef.current.layout({
      name: 'dagre',
      // @ts-ignore - dagre layout options
      rankDir: 'TB',
      fit: fit,
      padding: 50,
      animate: animate,
      animationDuration: animate ? 300 : 0,
      stop: () => {
        layoutCooldown.current = false;
        
        // Restore viewport if it was preserved
        if (!fit && preservedViewport.current && cyRef.current) {
          cyRef.current.zoom(preservedViewport.current.zoom);
          cyRef.current.pan(preservedViewport.current.pan);
          preservedViewport.current = null;
        }
      }
    });
    
    layout.run();
  }, []);

  // Enhanced fetch function with better error handling
  const fetchTransactionDataWithCache = useCallback(async (signature: string, signal?: AbortSignal) => {
    return fetchTransactionData(signature, transactionCache.current);
  }, []);

  const fetchAccountTransactionsWithError = useCallback(async (pubkey: string, signal?: AbortSignal) => {
    try {
      return await fetchAccountTransactions(pubkey, signal);
    } catch (error) {
      console.error(`Error fetching transactions for ${pubkey}:`, error);
      return { address: pubkey, transactions: [] };
    }
  }, []);

  // Helper function to check if an account has SPL transfers
  const checkForSplTransfers = useCallback(async (address: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/account-transfers/${address}?limit=1`, {
        headers: { 'Cache-Control': 'no-cache' }
      });
      
      if (response.ok) {
        const data = await response.json();
        return (data.data && data.data.length > 0);
      }
      return false;
    } catch (error) {
      console.warn(`Could not check SPL transfers for ${address}:`, error);
      return false; // Default to no SPL transfers on error
    }
  }, []);

  // Optimized addAccountToGraph with reduced layout calls and fallback depth
  const addAccountToGraph = useCallback(async (
    address: string,
    totalAccounts: number,
    depth = 0,
    parentSignature: string | null = null
  ) => {
    // Check if this account has SPL transfers first to determine max depth
    const hasSplTransfers = await checkForSplTransfers(address);
    const effectiveMaxDepth = hasSplTransfers ? maxDepth : 1; // Reduce to depth 1 if no SPL transfers
    
    const result = await addAccountToGraphUtil(
      address,
      totalAccounts,
      depth,
      parentSignature,
      undefined, // newElements
      effectiveMaxDepth, // maxDepth
      shouldExcludeAddress,
      shouldIncludeTransaction,
      fetchAccountTransactionsWithError,
      cyRef,
      loadedAccountsRef,
      pendingFetchesRef,
      loadedTransactionsRef,
      processedNodesRef,
      processedEdgesRef,
      setLoadingProgress,
      queueAccountFetchRef.current
    );

    // Only run layout every 5 nodes to reduce blinking
    if (cyRef.current) {
      const elementCount = cyRef.current.elements().length;
      if (elementCount % 5 === 0) {
        runLayoutOptimized(false, false);
      }
    }

    return result;
  }, [
    shouldExcludeAddress,
    shouldIncludeTransaction,
    fetchAccountTransactionsWithError,
    runLayoutOptimized,
    maxDepth,
    checkForSplTransfers,
    // Add missing refs
    loadedAccountsRef,
    pendingFetchesRef,
    loadedTransactionsRef,
    processedNodesRef,
    processedEdgesRef,
    setLoadingProgress
  ]);

  // Fetch and process a single account
  const fetchAndProcessAccount = useCallback(async (
    address: string,
    depth = 0,
    parentSignature: string | null = null
  ) => {
    try {
      await addAccountToGraph(address, totalAccounts, depth, parentSignature);
    } catch (e) {
      const accountKey = `${address}:${depth}`;
      console.error(`Error processing account ${address}:`, e);
      pendingFetchesRef.current?.delete(accountKey);
    }
  }, [addAccountToGraph, totalAccounts]);

  // Convert Cytoscape data to GPU graph format
  const convertToGPUGraphData = useCallback(() => {
    if (!cyRef.current) return { nodes: [], links: [] };

    const nodes = cyRef.current.nodes().map((node) => {
      const data = node.data();
      return {
        id: data.id,
        type: data.type || 'account',
        label: data.label || data.id,
        status: data.status,
        tracked: data.tracked || false,
        color: data.type === 'transaction' ? '#3b82f6' : (data.tracked ? '#ef4444' : '#10b981')
      };
    });

    const links = cyRef.current.edges().map((edge) => {
      const data = edge.data();
      return {
        source: data.source,
        target: data.target,
        type: data.type || 'interaction',
        value: data.value || 1,
        color: '#64748b'
      };
    });

    return { nodes, links };
  }, []);

  // Update GPU graph data when Cytoscape changes
  const updateGPUGraphData = useCallback(() => {
    if (useGPUGraph) {
      const newData = convertToGPUGraphData();
      setGpuGraphData(newData);
    }
  }, [useGPUGraph, convertToGPUGraphData]);

  // GPU Graph event handlers
  const handleGPUNodeClick = useCallback((node: any) => {
    if (node.type === 'transaction') {
      // Use the focus function when it's available
      if (cyRef.current) {
        focusOnTransactionUtil(node.id, false, cyRef, onTransactionSelect, clientSideNavigation);
      }
    } else if (node.type === 'account') {
      // Handle account selection
      console.log('Account clicked:', node.id);
    }
  }, [onTransactionSelect, clientSideNavigation]);

  const handleGPUNodeHover = useCallback((node: any) => {
    // Handle node hover for GPU graph
    if (node) {
      console.log('Hovered node:', node.id);
    }
  }, []);

  // Process the fetch queue in parallel
  const processAccountFetchQueue = useCallback(() => {
    processAccountFetchQueueUtil(
      fetchQueueRef,
      fetchAndProcessAccount,
      isProcessingQueueRef
    );
  }, [fetchAndProcessAccount]);

  // Queue an account for fetching
  const queueAccountFetch = useCallback((address: string, depth = 0, parentSignature: string | null = null) => {
    if (!address || loadedAccountsRef.current.has(address) || pendingFetchesRef.current.has(`${address}:${depth}`)) {
      return;
    }
    queueAccountFetchUtil(
      address,
      depth,
      parentSignature,
      fetchQueueRef,
      pendingFetchesRef,
      loadedAccountsRef,
      setTotalAccounts,
      processAccountFetchQueue,
      isProcessingQueueRef
    );
  }, [processAccountFetchQueue]);

  // Set the ref to the queueAccountFetch function
  useEffect(() => {
    queueAccountFetchRef.current = queueAccountFetch;
  }, [queueAccountFetch]);

  // Expand the transaction graph incrementally
  const expandTransactionGraph = useCallback(async (signature: string, signal?: AbortSignal) => {
    if (loadedTransactionsRef.current.has(signature)) return false;
    
    // Preserve viewport before expansion
    if (cyRef.current) {
      preservedViewport.current = {
        zoom: cyRef.current.zoom(),
        pan: cyRef.current.pan()
      };
    }
    
    const result = await expandTransactionGraphUtil(
      signature,
      cyRef,
      fetchTransactionDataWithCache,
      queueAccountFetch,
      addAccountToGraph,
      setExpandedNodesCount,
      loadedTransactionsRef,
      signal
    );
    
    // Run layout after expansion but preserve viewport
    if (result && cyRef.current) {
      runLayoutOptimized(false, false);
    }
    
    return result;
  }, [fetchTransactionDataWithCache, queueAccountFetch, addAccountToGraph, runLayoutOptimized]);

  // Focus on a specific transaction with optimized viewport handling
  const focusOnTransaction = useCallback(async (
    signature: string,
    addToHistory = true,
    incrementalLoad = true,
    preserveViewport = true
  ) => {
    if (!signature) return;

    const loadingKey = `loading_${signature}`;
    if (pendingFetchesRef.current.has(loadingKey)) {
      return;
    }

    try {
      pendingFetchesRef.current.add(loadingKey);
      setCurrentSignature(signature);
      focusSignatureRef.current = signature;

      const useNavigation = clientSideNavigation && !isNavigatingHistory;

      if (incrementalLoad) {
        await focusOnTransactionUtil(
          signature,
          cyRef,
          focusSignatureRef,
          setCurrentSignature,
          viewportState,
          setViewportState,
          expandTransactionGraph,
          onTransactionSelect,
          router,
          false, // Force client-side navigation to false
          incrementalLoad,
          preserveViewport
        );
      }
      
      if (addToHistory && !isNavigatingHistory && signature) {
        setNavigationHistory(prev => {
          const newHistory = prev.slice(0, currentHistoryIndex + 1);
          
          if (newHistory.length === 0 || newHistory[newHistory.length - 1] !== signature) {
            newHistory.push(signature);
            setCurrentHistoryIndex(newHistory.length - 1);
          }
          return newHistory;
        });
      }

      // Only fit/center if viewport is not being preserved and it's the initial load
      if (!preserveViewport && cyRef.current) {
        const elements = cyRef.current.elements();
        if (elements.length > 0 && (!currentSignature || currentSignature !== signature)) {
          requestAnimationFrame(() => {
            if (cyRef.current) {
              cyRef.current.fit(elements, 50);
              cyRef.current.center();
            }
          });
        }
      }
    } finally {
      pendingFetchesRef.current.delete(loadingKey);
    }
  }, [
    viewportState,
    expandTransactionGraph,
    onTransactionSelect,
    router,
    clientSideNavigation,
    isNavigatingHistory,
    currentHistoryIndex,
    queueAccountFetch,
    currentSignature
  ]);

  // Address tracking functionality
  const startAddressTracking = useCallback(async (address: string) => {
    if (trackedAddress === address && isTrackingMode) return;
    
    if (trackingIntervalRef.current) {
      clearInterval(trackingIntervalRef.current);
    }
    
    trackedTransactionsRef.current.clear();
    setTrackedAddress(address);
    setIsTrackingMode(true);
    
    if (cyRef.current) {
      const addressNode = cyRef.current.getElementById(address);
      if (addressNode.length > 0) {
        addressNode.addClass('tracked-address');
      }
    }
    
    setTrackingStats({
      totalTransactions: 0,
      splTransfers: 0,
      filteredSplTransfers: 0,
      topVolumeByAddress: [],
      topVolumeByToken: [],
      lastUpdate: Date.now(),
      isTracking: true,
      trackedAddress: address
    });

    // Simplified tracking with reduced API calls
    try {
      const response = await fetch(`/api/account-transfers/${address}?limit=10`); // Reduced from 20 to 10
      if (response.ok) {
        const data = await response.json();
        const transfers = data.data || [];
        
        if (transfers.length > 0) {
          const filterResponse = await fetch('/api/filter-transactions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ transactions: transfers.slice(0, 10) }) // Only process 10 transactions
          });
          
          if (filterResponse.ok) {
            const filteredData = await filterResponse.json();
            // Process filtered transactions without excessive graph updates
          }
        }
      }
    } catch (error) {
      console.error('Error starting address tracking:', error);
    }
  }, [trackedAddress, isTrackingMode]);

  const stopAddressTracking = useCallback(() => {
    if (trackingIntervalRef.current) {
      clearInterval(trackingIntervalRef.current);
    }
    
    setTrackedAddress(null);
    setIsTrackingMode(false);
    setTrackingStats(null);
    trackedTransactionsRef.current.clear();
    
    if (cyRef.current) {
      cyRef.current.elements('.tracked-address').removeClass('tracked-address');
    }
  }, []);

  // Setup graph interactions
  const setupGraphInteractionsCallback = useCallback((cy: cytoscape.Core) => {
    setupGraphInteractions(
      cy,
      containerRef,
      focusSignatureRef,
      focusOnTransaction,
      (state: ViewportState) => {
        // Update viewport state - placeholder implementation
        console.log('Viewport state updated:', state);
      },
      startAddressTracking
    );
  }, [focusOnTransaction, startAddressTracking]);

  // Initialize graph once - no dependencies to prevent re-initialization
  useEffect(() => {
    if (!containerRef.current || cyRef.current) {
      return;
    }

    // Find the Cytoscape data container
    const cytoscapeContainer = containerRef.current.querySelector('#cytoscape-data-container') as HTMLDivElement;
    if (!cytoscapeContainer) {
      console.error('Cytoscape data container not found');
      return;
    }

    isInitialized.current = false;
    timeoutIds.current = [];

    // Clear all state
    processedNodesRef.current.clear();
    processedEdgesRef.current.clear();
    loadedTransactionsRef.current.clear();
    loadedAccountsRef.current.clear();
    transactionCache.current.clear();
    pendingFetchesRef.current.clear();
    isProcessingQueueRef.current = false;

    const cy = initializeCytoscape(cytoscapeContainer);
    cyRef.current = cy;
    setupGraphInteractionsCallback(cy);

    return () => {
      timeoutIds.current.forEach(clearTimeout);
      if (pendingLayoutRef.current) {
        clearTimeout(pendingLayoutRef.current);
      }
      if (cyRef.current) {
        cyRef.current.destroy();
        cyRef.current = null;
      }
    };
  }, []); // No dependencies to prevent re-initialization

  // Update GPU graph data when Cytoscape graph changes
  useEffect(() => {
    if (cyRef.current && useGPUGraph) {
      // Set up listener for graph changes
      const updateHandler = () => {
        updateGPUGraphData();
      };
      
      cyRef.current.on('add remove data', updateHandler);
      
      // Initial update
      updateGPUGraphData();
      
      return () => {
        if (cyRef.current) {
          cyRef.current.off('add remove data', updateHandler);
        }
      };
    }
  }, [useGPUGraph, updateGPUGraphData]);

  // Handle initial signature loading
  useEffect(() => {
    if (!cyRef.current || !initialSignature || initialSignature === initialSignatureRef.current) {
      return;
    }

    initialSignatureRef.current = initialSignature;
    
    const loadInitialSignature = async () => {
      if (isInitialized.current) return;
      isInitialized.current = true;

      setLoading(true);
      setError(null);
      setTotalAccounts(0);
      setLoadingProgress(0);

      try {
        const cachedState = GraphStateCache.loadState(initialSignature);
        
        // Create initial transaction node
        if (cyRef.current && !cyRef.current.getElementById(initialSignature).length) {
          cyRef.current.add({ 
            data: { 
              id: initialSignature, 
              label: initialSignature.slice(0, 8) + '...', 
              type: 'transaction' 
            }, 
            classes: 'transaction highlight-transaction' 
          });
        }

        // Restore cached state if available
        if (cachedState && Array.isArray(cachedState.nodes) && cachedState.nodes.length > 0) {
          try {
            const typedState = cachedState as unknown as CachedState;
            typedState.nodes.forEach(node => {
              if (node.data && !cyRef.current?.getElementById(node.data.id).length) {
                cyRef.current?.add(node);
              }
            });
            
            if (typedState.edges) {
              typedState.edges.forEach(edge => {
                if (edge.data && !cyRef.current?.getElementById(edge.data.id).length) {
                  cyRef.current?.add(edge);
                }
              });
            }
            
            runLayoutOptimized(false, false);
          } catch (err) {
            console.warn('Error restoring cached state:', err);
          }
        } else {
          // Fetch fresh data
          const response = await fetch(`/api/transaction/${initialSignature}`);
          
          if (response.ok) {
            const txData = await response.json();
            
            if (txData.details?.accounts?.length > 0) {
              const firstAccount = txData.details.accounts[0].pubkey;
              if (firstAccount) {
                queueAccountFetch(firstAccount, 0, initialSignature);
                
                // Wait for initial processing with better fallback
                await new Promise<void>((resolve) => {
                  let attempts = 0;
                  const maxAttempts = 50; // Reduced from 100
                  const checkInterval = setInterval(() => {
                    attempts++;
                    const elements = cyRef.current?.elements().length || 0;
                    
                    if (elements > 1 || attempts >= maxAttempts) {
                      clearInterval(checkInterval);
                      
                      // If still no elements, show helpful message
                      if (elements <= 1) {
                        setError({
                          message: `Limited transaction data found for ${initialSignature.substring(0, 8)}... This transaction may not involve significant SPL transfers.`,
                          severity: 'warning'
                        });
                      }
                      
                      resolve();
                    }
                  }, 100);
                  
                  timeoutIds.current.push(setTimeout(() => {
                    clearInterval(checkInterval);
                    resolve();
                  }, 5000)); // Reduced from 10000
                });
              }
            }

            await focusOnTransaction(initialSignature, true, true, false);
          }
          
          // Set initial viewport only for fresh data
          if (cyRef.current) {
            requestAnimationFrame(() => {
              if (cyRef.current) {
                runLayoutOptimized(true, false);
                setTimeout(() => {
                  if (cyRef.current) {
                    cyRef.current.zoom(0.8);
                  }
                }, 100);
              }
            });
          }
        }
      } catch (err) {
        console.error('Error loading initial transaction:', err);
        setError({
          message: `Failed to load transaction: ${err}`,
          severity: 'error'
        });
      } finally {
        setLoading(false);
      }
    };

    loadInitialSignature();
  }, [initialSignature, focusOnTransaction, queueAccountFetch, runLayoutOptimized]);

  // Handle initial account loading
  useEffect(() => {
    if (!cyRef.current || !initialAccount || initialAccount === initialAccountRef.current) {
      return;
    }

    initialAccountRef.current = initialAccount;
    
    const loadInitialAccount = async () => {
      if (isInitialized.current) return;
      isInitialized.current = true;

      setLoading(true);
      setError(null);
      setTotalAccounts(0);
      setLoadingProgress(0);

      try {
        await new Promise<void>((resolve) => {
          queueAccountFetch(initialAccount, 0, null);
          
          let attempts = 0;
          const maxAttempts = 50; // Reduced from 100
          const checkInterval = setInterval(() => {
            attempts++;
            const elements = cyRef.current?.elements().length || 0;
            
            // More lenient loading - resolve if we have any elements OR if we've tried enough
            if (elements > 0 || attempts >= maxAttempts) {
              clearInterval(checkInterval);
              
              // If no elements after max attempts, show a helpful message
              if (elements === 0) {
                setError({
                  message: `No SPL transfers found for account ${initialAccount.substring(0, 8)}... This account may not have significant token transfer activity.`,
                  severity: 'warning'
                });
              }
              
              resolve();
            }
          }, 100);
          
          timeoutIds.current.push(setTimeout(() => {
            clearInterval(checkInterval);
            resolve();
          }, 5000)); // Reduced from 10000
        });
        
        if (cyRef.current && cyRef.current.elements().length > 0) {
          requestAnimationFrame(() => {
            if (cyRef.current) {
              runLayoutOptimized(true, false);
              setTimeout(() => {
                if (cyRef.current) {
                  cyRef.current.zoom(0.8);
                }
              }, 100);
            }
          });
        }
      } catch (err) {
        console.error('Error loading initial account:', err);
        setError({
          message: `Failed to load account: ${err}`,
          severity: 'error'
        });
      } finally {
        setLoading(false);
      }
    };

    loadInitialAccount();
  }, [initialAccount, queueAccountFetch, runLayoutOptimized]);

  // Cleanup tracking on unmount
  useEffect(() => {
    return () => {
      if (trackingIntervalRef.current) {
        clearInterval(trackingIntervalRef.current);
      }
    };
  }, []);

  // Update internal state when props change
  useEffect(() => {
    const isProgrammaticNavigation = sessionStorage.getItem('programmatic_nav') === 'true';

    if (initialSignature && initialSignature !== initialSignatureRef.current) {
      initialSignatureRef.current = initialSignature;

      if (!isProgrammaticNavigation && initialSignature !== currentSignature) {
        if (GraphStateCache.hasState(initialSignature)) {
          focusOnTransaction(initialSignature, false, false, false);
        } else {
          focusOnTransaction(initialSignature, false, true, false);
        }
      }
    }

    sessionStorage.removeItem('programmatic_nav');
  }, [initialSignature, currentSignature, focusOnTransaction]);

  // Handle window resize with debouncing
  useEffect(() => {
    const handleResize = debounce(() => {
      if (cyRef.current && containerRef.current) {
        resizeGraph(cyRef, true);
      }
    }, 250);

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Resize graph callback for fullscreen changes
  const resizeGraphCallback = useCallback(() => {
    if (cyRef.current && containerRef.current) {
      resizeGraph(cyRef, true);
    }
  }, []);

  // Fullscreen functionality
  const toggleFullscreen = useCallback(async () => {
    if (!containerRef.current) return;
    
    try {
      if (!isFullscreen) {
        if (containerRef.current.requestFullscreen) {
          await containerRef.current.requestFullscreen();
        } else if ((containerRef.current as any).webkitRequestFullscreen) {
          await (containerRef.current as any).webkitRequestFullscreen();
        } else if ((containerRef.current as any).mozRequestFullScreen) {
          await (containerRef.current as any).mozRequestFullScreen();
        } else if ((containerRef.current as any).msRequestFullscreen) {
          await (containerRef.current as any).msRequestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        } else if ((document as any).mozCancelFullScreen) {
          await (document as any).mozCancelFullScreen();
        } else if ((document as any).msExitFullscreen) {
          await (document as any).msExitFullscreen();
        }
      }
    } catch (err) {
      console.error('Error toggling fullscreen:', err);
    }
  }, [isFullscreen]);

  // Handle fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );
      setIsFullscreen(isCurrentlyFullscreen);
      
      // Resize graph when entering/exiting fullscreen
      if (cyRef.current) {
        setTimeout(() => {
          resizeGraphCallback();
        }, 100);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, [resizeGraphCallback]);

  // Navigation functions
  const navigateBack = useCallback(() => {
    if (currentHistoryIndex > 0) {
      const newIndex = currentHistoryIndex - 1;
      const signature = navigationHistory[newIndex];
      setCurrentHistoryIndex(newIndex);
      setIsNavigatingHistory(true);
      focusOnTransaction(signature, false, false, false);
      setTimeout(() => setIsNavigatingHistory(false), 100);
    }
  }, [currentHistoryIndex, navigationHistory, focusOnTransaction]);

  const navigateForward = useCallback(() => {
    if (currentHistoryIndex < navigationHistory.length - 1) {
      const newIndex = currentHistoryIndex + 1;
      const signature = navigationHistory[newIndex];
      setCurrentHistoryIndex(newIndex);
      setIsNavigatingHistory(true);
      focusOnTransaction(signature, false, false, false);
      setTimeout(() => setIsNavigatingHistory(false), 100);
    }
  }, [currentHistoryIndex, navigationHistory, focusOnTransaction]);

  // Cloud view functions
  const showCloudView = useCallback(() => {
    setShowCloudViewPanel(true);
  }, []);

  const handleLoadGraphState = useCallback((state: any) => {
    try {
      if (cyRef.current && state.nodes) {
        cyRef.current.elements().remove();
        
        if (state.nodes.length > 0) {
          cyRef.current.add(state.nodes);
        }
        if (state.edges && state.edges.length > 0) {
          cyRef.current.add(state.edges);
        }
        
        runLayoutOptimized(true, false);
        
        if (state.focusedTransaction) {
          setCurrentSignature(state.focusedTransaction);
          focusSignatureRef.current = state.focusedTransaction;
        }
        
        setShowCloudViewPanel(false);
      }
    } catch (error) {
      console.error('Error loading graph state:', error);
      setError({
        message: 'Failed to load saved graph state',
        severity: 'error'
      });
    }
  }, [runLayoutOptimized]);

  const handleSaveCurrentState = useCallback(() => {
    try {
      if (cyRef.current) {
        const currentState = {
          nodes: cyRef.current.nodes().map(node => ({
            data: node.data(),
            position: node.position(),
            classes: node.classes()
          })),
          edges: cyRef.current.edges().map(edge => ({
            data: edge.data(),
            classes: edge.classes()
          })),
          focusedTransaction: currentSignature,
          timestamp: Date.now()
        };
        
        GraphStateCache.saveState(currentSignature, currentState);
        setError({
          message: 'Graph state saved successfully',
          severity: 'warning'
        });
        
        setTimeout(() => setError(null), 3000);
      }
    } catch (error) {
      console.error('Error saving graph state:', error);
      setError({
        message: 'Failed to save graph state',
        severity: 'error'
      });
    }
  }, [currentSignature]);

  return (
    <div className={`transaction-graph-wrapper relative w-full h-full transition-all flex flex-col ${isFullscreen ? 'bg-background' : ''}`}>
      {error && (
        <div className={`absolute bottom-4 right-4 p-4 rounded-md shadow-lg z-20 ${
          error.severity === 'error' ? 'bg-destructive/90 text-destructive-foreground' : 'bg-warning/90 text-warning-foreground'
        }`}>
          <div className="flex items-start">
            <div className="flex-1">{error.message}</div>
            <button
              onClick={() => setError(null)}
              className="ml-4 text-current hover:text-current/80"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <TrackingStatsPanel 
        stats={trackingStats}
        onStopTracking={stopAddressTracking}
      />

      {showCloudViewPanel && (
        <div className="absolute top-4 left-4 z-30">
          <TransactionGraphClouds
            currentFocusedTransaction={currentSignature}
            onLoadState={handleLoadGraphState}
            onSaveCurrentState={handleSaveCurrentState}
          />
        </div>
      )}

      <div 
        ref={containerRef}
        className={`graph-container w-full bg-muted/50 rounded-lg border border-border overflow-hidden ${isFullscreen ? 'rounded-none border-none bg-background' : ''}`}
        style={{ 
          width: '100%', 
          height: isFullscreen ? '100vh' : '100%',
          position: 'relative',
          overflow: 'hidden',
          margin: isFullscreen ? '0' : '0 auto',
          // GPU acceleration hints
          willChange: 'transform',
          transform: 'translateZ(0)',
          backfaceVisibility: 'hidden',
          perspective: '1000px',
        }}
      >
        {useGPUGraph ? (
          <GPUAcceleratedForceGraph
            graphData={gpuGraphData}
            onNodeClick={handleGPUNodeClick}
            onNodeHover={handleGPUNodeHover}
            width={containerRef.current?.clientWidth || 800}
            height={containerRef.current?.clientHeight || 600}
            use3D={false}
            enableGPUParticles={true}
          />
        ) : null}
        
        {/* Hidden Cytoscape container for data processing - always present */}
        <div 
          id="cytoscape-data-container"
          style={{ 
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            visibility: useGPUGraph ? 'hidden' : 'visible',
            pointerEvents: useGPUGraph ? 'none' : 'auto'
          }}
        />
      </div>

      {/* Controls overlay */}
      <div className="absolute bottom-4 right-4 flex gap-2 bg-background/90 p-2 rounded-md shadow-md backdrop-blur-sm border border-border">
        <button 
          className={`p-1.5 hover:bg-primary/10 rounded-md transition-colors ${currentHistoryIndex <= 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={navigateBack}
          disabled={currentHistoryIndex <= 0}
          title="Navigate back"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5"></path>
            <path d="M12 19l-7-7 7-7"></path>
          </svg>
        </button>
        
        <button 
          className={`p-1.5 hover:bg-primary/10 rounded-md transition-colors ${currentHistoryIndex >= navigationHistory.length - 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={navigateForward}
          disabled={currentHistoryIndex >= navigationHistory.length - 1}
          title="Navigate forward"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14"></path>
            <path d="M12 5l7 7-7 7"></path>
          </svg>
        </button>

        <button 
          className={`p-1.5 rounded-md transition-colors ${useGPUGraph ? 'bg-primary text-primary-foreground' : 'hover:bg-primary/10'}`}
          onClick={() => setUseGPUGraph(!useGPUGraph)}
          title={useGPUGraph ? "Switch to Cytoscape" : "Switch to GPU rendering"}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
            <line x1="8" y1="21" x2="16" y2="21"></line>
            <line x1="12" y1="17" x2="12" y2="21"></line>
          </svg>
        </button>

        <button 
          className="p-1.5 hover:bg-primary/10 rounded-md transition-colors"
          onClick={showCloudView}
          title="Cloud view"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"></path>
          </svg>
        </button>

        <button 
          className="p-1.5 hover:bg-primary/10 rounded-md transition-colors"
          onClick={toggleFullscreen}
          title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {isFullscreen ? (
              <>
                <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"></path>
              </>
            ) : (
              <>
                <path d="M3 7V5a2 2 0 0 1 2-2h2m10 0h2a2 2 0 0 1 2 2v2m0 10v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2"></path>
              </>
            )}
          </svg>
        </button>
      </div>

      {loading && (
        <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-sm text-muted-foreground">
              Loading graph... {loadingProgress.toFixed(0)}%
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Accounts processed: {expandedNodesCount}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default React.memo(TransactionGraph);