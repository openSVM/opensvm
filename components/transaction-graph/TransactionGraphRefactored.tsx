'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { GraphStateCache } from '@/lib/graph-state-cache';
import { debounce } from '@/lib/utils';
import { TrackingStatsPanel } from './TrackingStatsPanel';
import { TransactionGraphClouds } from '../TransactionGraphClouds';
import { GPUAcceleratedForceGraph } from './GPUAcceleratedForceGraph';
import { 
  TransactionGraphProps, 
  resizeGraph, 
  fetchTransactionData, 
  fetchAccountTransactions,
  debugLog,
  errorLog
} from './';
import { 
  useFullscreenMode,
  useAddressTracking,
  useGPUForceGraph,
  useCloudView,
  useLayoutManager,
  useGraphInitialization,
  useAccountFetching,
  useViewportNavigation
} from './hooks';

// Constants
const EXCLUDED_ACCOUNTS = new Set([
  '11111111111111111111111111111111',
  'ComputeBudget111111111111111111111111111111',
  'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
  'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL',
  'So11111111111111111111111111111111111111112',
  'SysvarC1ock11111111111111111111111111111111',
  'SysvarRent111111111111111111111111111111111',
  'SysvarRecentB1ockHashes11111111111111111111',
  'SysvarS1otHashes111111111111111111111111111',
  'SysvarStakeHistory1111111111111111111111111',
  'SysvarInstructions1111111111111111111111111',
  'SysvarEpochSchedule11111111111111111111111111',
  'SysvarSlotHistory11111111111111111111111111',
  'SysvarRewards111111111111111111111111111111',
  'SysvarFees111111111111111111111111111111111',
  'Vote111111111111111111111111111111111111111',
  'Stake11111111111111111111111111111111111111',
  'Config1111111111111111111111111111111111111',
  '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
  'BPFLoaderUpgradeab1e11111111111111111111111',
  'BPFLoader1111111111111111111111111111111111',
  'BPFLoader2111111111111111111111111111111111',
  'NativeLoader1111111111111111111111111111111',
  'LoaderUpgradeab1e11111111111111111111111111'
]);

export default function TransactionGraph({
  initialSignature,
  initialAccount,
  onTransactionSelect,
  clientSideNavigation = true,
  width = '100%',
  height = '100%',
  maxDepth = 2
}: TransactionGraphProps) {
  // Component refs
  const timeoutIds = useRef<NodeJS.Timeout[]>([]);
  const router = useRouter();
  
  // Use custom hooks
  const { isFullscreen, toggleFullscreen, containerRef } = useFullscreenMode();
  const { 
    trackedAddress,
    isTrackingMode,
    trackingStats,
    startTrackingAddress,
    stopTrackingAddress,
    updateTrackingStats,
    trackedTransactionsRef,
    MAX_TRACKED_TRANSACTIONS
  } = useAddressTracking();
  const { 
    useGPUGraph,
    setUseGPUGraph,
    gpuGraphData,
    updateGPUGraphData,
    handleGPUNodeClick,
    handleGPUNodeHover
  } = useGPUForceGraph();
  const { 
    isCloudView,
    toggleCloudView,
    switchToGraphView,
    switchToCloudView,
    cloudViewRef
  } = useCloudView();
  const { 
    isLayoutRunning,
    runLayout,
    debouncedLayout,
    cleanupLayout
  } = useLayoutManager();
  const { 
    cyRef,
    isInitialized,
    isInitializing,
    initializeGraph,
    cleanupGraph,
    isGraphReady
  } = useGraphInitialization();
  const { 
    queueAccountFetch,
    processAccountFetchQueue,
    addAccountToGraph,
    expandTransactionGraph,
    focusOnTransaction
  } = useAccountFetching();
  const { 
    preserveViewport,
    restoreViewport,
    centerOnTransaction
  } = useViewportNavigation();

  // State management
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isEmpty, setIsEmpty] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [progressMessage, setProgressMessage] = useState<string>('');
  const [showControls, setShowControls] = useState<boolean>(false);
  const [currentSignature, setCurrentSignature] = useState<string | null>(initialSignature || null);
  const [currentAccount, setCurrentAccount] = useState<string | null>(initialAccount || null);

  // Graph state cache
  const graphStateCache = useMemo(() => new GraphStateCache(), []);

  // Enhanced layout function
  const runLayoutWithProgress = async (layoutType: string = 'dagre', forceRun: boolean = false) => {
    if (!isGraphReady() || !cyRef.current) return;

    setProgressMessage(`Running ${layoutType} layout...`);
    setProgress(20);

    try {
      await runLayout(cyRef.current, layoutType, forceRun);
      setProgress(100);
      setTimeout(() => setProgress(0), 1000);
    } catch (error) {
      errorLog('Layout error:', error);
      setProgress(0);
    }
  };

  // Enhanced fetch function
  const fetchData = async (signature: string, account: string | null = null) => {
    if (!signature) return;

    setIsLoading(true);
    setError(null);
    setProgress(10);
    setProgressMessage('Fetching transaction data...');

    try {
      const data = await fetchTransactionData(signature);
      
      if (!data || !cyRef.current) {
        setError('Failed to fetch transaction data');
        return;
      }

      setProgress(50);
      setProgressMessage('Processing transaction data...');

      // Process and add to graph
      const elements = processTransactionData(data, account);
      
      setProgress(80);
      setProgressMessage('Updating graph...');

      // Add elements to cytoscape
      cyRef.current.batch(() => {
        elements.nodes.forEach(node => {
          if (!cyRef.current!.getElementById(node.data.id).length) {
            cyRef.current!.add(node);
          }
        });
        elements.edges.forEach(edge => {
          if (!cyRef.current!.getElementById(edge.data.id).length) {
            cyRef.current!.add(edge);
          }
        });
      });

      // Update GPU graph
      updateGPUGraphData(cyRef.current);

      // Run layout
      await runLayoutWithProgress('dagre', true);

      setProgress(100);
      setTimeout(() => {
        setProgress(0);
        setProgressMessage('');
      }, 1000);

    } catch (error) {
      errorLog('Fetch error:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  // Process transaction data into cytoscape elements
  const processTransactionData = (data: any, focusAccount: string | null = null) => {
    const nodes: any[] = [];
    const edges: any[] = [];

    // Add transaction node
    nodes.push({
      data: {
        id: data.signature,
        label: `${data.signature.substring(0, 8)}...`,
        type: 'transaction',
        signature: data.signature,
        success: !data.err,
        size: 20,
        color: data.err ? '#ef4444' : '#10b981'
      }
    });

    // Add account nodes and edges
    if (data.accounts) {
      data.accounts.forEach((account: any, index: number) => {
        if (EXCLUDED_ACCOUNTS.has(account.pubkey)) return;

        nodes.push({
          data: {
            id: account.pubkey,
            label: `${account.pubkey.substring(0, 8)}...`,
            type: 'account',
            pubkey: account.pubkey,
            isSigner: account.isSigner,
            isWritable: account.isWritable,
            size: focusAccount === account.pubkey ? 25 : 15,
            color: account.isSigner ? '#8b5cf6' : '#6b7280'
          }
        });

        edges.push({
          data: {
            id: `${data.signature}-${account.pubkey}`,
            source: data.signature,
            target: account.pubkey,
            type: 'account_interaction',
            color: account.isWritable ? '#f59e0b' : '#6b7280'
          }
        });
      });
    }

    return { nodes, edges };
  };

  // Initialize graph
  useEffect(() => {
    if (!containerRef.current || isInitialized) return;

    const initAsync = async () => {
      try {
        await initializeGraph(containerRef.current!, onTransactionSelect);
        
        // Load initial data
        if (initialSignature) {
          await fetchData(initialSignature, initialAccount);
        } else if (initialAccount) {
          await fetchAccountData(initialAccount);
        }
      } catch (error) {
        errorLog('Graph initialization failed:', error);
        setError('Failed to initialize graph');
      }
    };

    initAsync();
  }, [initialSignature, initialAccount, onTransactionSelect]);

  // Fetch account data
  const fetchAccountData = async (account: string) => {
    if (!account) return;

    setIsLoading(true);
    setError(null);
    setProgress(10);
    setProgressMessage('Fetching account transactions...');

    try {
      const transactions = await fetchAccountTransactions(account);
      
      if (!transactions || !cyRef.current) {
        setError('Failed to fetch account transactions');
        return;
      }

      setProgress(50);
      setProgressMessage('Processing account data...');

      // Process transactions
      const elements = processAccountTransactions(transactions, account);
      
      setProgress(80);
      setProgressMessage('Updating graph...');

      // Add to graph
      cyRef.current.batch(() => {
        elements.nodes.forEach(node => {
          if (!cyRef.current!.getElementById(node.data.id).length) {
            cyRef.current!.add(node);
          }
        });
        elements.edges.forEach(edge => {
          if (!cyRef.current!.getElementById(edge.data.id).length) {
            cyRef.current!.add(edge);
          }
        });
      });

      // Update GPU graph
      updateGPUGraphData(cyRef.current);

      // Run layout
      await runLayoutWithProgress('dagre', true);

      setProgress(100);
      setTimeout(() => {
        setProgress(0);
        setProgressMessage('');
      }, 1000);

    } catch (error) {
      errorLog('Account fetch error:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  // Process account transactions
  const processAccountTransactions = (transactions: any[], account: string) => {
    const nodes: any[] = [];
    const edges: any[] = [];

    // Add account node
    nodes.push({
      data: {
        id: account,
        label: `${account.substring(0, 8)}...`,
        type: 'account',
        pubkey: account,
        size: 25,
        color: '#8b5cf6'
      }
    });

    // Add transaction nodes
    transactions.forEach((tx: any) => {
      if (!tx.signature) return;

      nodes.push({
        data: {
          id: tx.signature,
          label: `${tx.signature.substring(0, 8)}...`,
          type: 'transaction',
          signature: tx.signature,
          success: !tx.err,
          size: 15,
          color: tx.err ? '#ef4444' : '#10b981'
        }
      });

      edges.push({
        data: {
          id: `${account}-${tx.signature}`,
          source: account,
          target: tx.signature,
          type: 'account_transaction',
          color: '#6b7280'
        }
      });
    });

    return { nodes, edges };
  };

  // Navigation functions
  const navigateToTransaction = (signature: string) => {
    if (clientSideNavigation) {
      router.push(`/tx/${signature}`);
    } else {
      window.open(`/tx/${signature}`, '_blank');
    }
  };

  const navigateToAccount = (address: string) => {
    if (clientSideNavigation) {
      router.push(`/account/${address}`);
    } else {
      window.open(`/account/${address}`, '_blank');
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      timeoutIds.current.forEach(id => clearTimeout(id));
      cleanupLayout();
      cleanupGraph();
      stopTrackingAddress();
    };
  }, []);

  // Handle window resize
  useEffect(() => {
    const handleResize = debounce(() => {
      if (cyRef.current) {
        resizeGraph(cyRef.current);
      }
    }, 250);

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Render
  return (
    <div 
      ref={containerRef}
      className={`relative w-full h-full bg-background ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}
      style={{ width, height }}
    >
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-20 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-sm text-muted-foreground">{progressMessage}</p>
            {progress > 0 && (
              <div className="w-48 h-2 bg-muted rounded-full mt-2">
                <div 
                  className="h-full bg-primary rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="absolute top-4 left-4 right-4 z-30 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
          <p className="text-sm text-destructive">{error}</p>
          <button 
            onClick={() => setError(null)}
            className="mt-2 text-xs text-destructive hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Controls */}
      <div className="absolute top-4 right-4 z-30 flex gap-2">
        <button
          onClick={toggleFullscreen}
          className="p-2 bg-background/80 backdrop-blur-sm border border-border rounded-lg hover:bg-muted"
          title="Toggle Fullscreen"
        >
          {isFullscreen ? '⛶' : '⛶'}
        </button>
        
        <button
          onClick={toggleCloudView}
          className="p-2 bg-background/80 backdrop-blur-sm border border-border rounded-lg hover:bg-muted"
          title="Toggle Cloud View"
        >
          {isCloudView ? '📊' : '☁️'}
        </button>
        
        <button
          onClick={() => setUseGPUGraph(!useGPUGraph)}
          className="p-2 bg-background/80 backdrop-blur-sm border border-border rounded-lg hover:bg-muted"
          title="Toggle GPU Acceleration"
        >
          {useGPUGraph ? '🖥️' : '🎮'}
        </button>
      </div>

      {/* Main content */}
      {isCloudView ? (
        <div ref={cloudViewRef} className="w-full h-full">
          <TransactionGraphClouds
            signature={currentSignature}
            account={currentAccount}
            onTransactionSelect={onTransactionSelect}
            onSwitchToGraph={switchToGraphView}
          />
        </div>
      ) : (
        <div className="w-full h-full">
          {useGPUGraph ? (
            <GPUAcceleratedForceGraph
              data={gpuGraphData}
              onNodeClick={handleGPUNodeClick}
              onNodeHover={handleGPUNodeHover}
              width={width}
              height={height}
            />
          ) : (
            <div id="cy-container" className="w-full h-full" />
          )}
        </div>
      )}

      {/* Address tracking panel */}
      {isTrackingMode && trackingStats && (
        <TrackingStatsPanel
          stats={trackingStats}
          onClose={stopTrackingAddress}
          className="absolute bottom-4 left-4 z-30"
        />
      )}
    </div>
  );
}