'use client';

import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import cytoscape from 'cytoscape';
import dagre from 'cytoscape-dagre';
import { debounce } from '@/lib/utils';

// Register the dagre layout extension
if (typeof window !== 'undefined') {
  cytoscape.use(dagre);
}

interface Transaction {
  signature: string;
  timestamp: number;
  success: boolean;
  accounts: {
    pubkey: string;
    isSigner: boolean;
    isWritable: boolean;
  }[];
  transfers: {
    account: string;
    change: number;
  }[];
}

interface AccountData {
  address: string;
  transactions: Transaction[];
}

interface TransactionGraphProps {
  initialSignature: string;
  initialAccount?: string;
  onTransactionSelect: (signature: string) => void;
  width?: string | number;
  height?: string | number;
  maxDepth?: number;
}

export default function TransactionGraph({
  initialSignature,
  initialAccount,
  onTransactionSelect,
  width = '100%',
  height = '100%',
  maxDepth = 3
}: TransactionGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);
  
  // Excluded accounts and program identifiers
  const EXCLUDED_ACCOUNTS = useMemo(() => new Set([
    'ComputeBudget111111111111111111111111111111'
  ]), []);
  
  // Program identifiers for Raydium and Jupiter
  const EXCLUDED_PROGRAM_SUBSTRINGS = useMemo(() => [
    // Raydium Pool identifiers
    'LIQUIDITY_POOL',
    'AMM',
    'RaydiumPoolState',
    'Raydium',
    // Jupiter identifiers
    'JUP',
    'Jupiter',
    'JITOSOL'
  ], []);
  
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingProgress, setLoadingProgress] = useState<number>(0);
  const [totalAccounts, setTotalAccounts] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const fetchQueueRef = useRef<Array<{address: string, depth: number, parentSignature: string | null}>>([]);
  
  // Track nodes and edges already added to prevent duplicates
  const processedNodesRef = useRef<Set<string>>(new Set());
  const processedEdgesRef = useRef<Set<string>>(new Set());
  
  // Track all loaded transactions and accounts to prevent duplicates
  const loadedTransactionsRef = useRef<Set<string>>(new Set());
  const loadedAccountsRef = useRef<Set<string>>(new Set());
  
  // Track fetches in progress
  const pendingFetchesRef = useRef<Set<string>>(new Set());
  
  // Track the current focus transaction
  const focusSignatureRef = useRef<string>(initialSignature);

  // Convert lamports to SOL
  const lamportsToSol = (lamports: number): number => {
    return lamports / 1_000_000_000;
  };

  // Format SOL amount with + or - prefix
  const formatSolChange = (lamports: number): string => {
    const sol = lamportsToSol(lamports);
    return sol > 0 ? `+${sol.toFixed(4)} SOL` : `${sol.toFixed(4)} SOL`;
  };

  // Get short version of address or signature
  const shortenString = (str: string, length = 4): string => {
    if (!str) return '';
    return `${str.slice(0, length)}...${str.slice(-length)}`;
  };

  // Format timestamp
  const formatTimestamp = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString();
  };

  // Check if an address should be excluded from the graph
  const shouldExcludeAddress = useCallback((address: string): boolean => {
    // Check for direct matches with excluded accounts
    if (EXCLUDED_ACCOUNTS.has(address)) {
      return true;
    }
    
    // Check for substring matches with program identifiers
    for (const substring of EXCLUDED_PROGRAM_SUBSTRINGS) {
      if (address.includes(substring)) {
        return true;
      }
    }
    
    return false;
  }, [EXCLUDED_ACCOUNTS, EXCLUDED_PROGRAM_SUBSTRINGS]);
  
  // Check if a transaction should be included based on accounts involved
  const shouldIncludeTransaction = useCallback((accounts: {pubkey: string}[]): boolean => 
    !accounts.some(acc => shouldExcludeAddress(acc.pubkey)), [shouldExcludeAddress]);

  // Queue an account fetch
  const queueAccountFetch = (address: string, depth = 0, parentSignature: string | null = null) => {
    // Skip if we've already loaded this account
    if (loadedAccountsRef.current.has(address) || pendingFetchesRef.current.has(address)) return;
    
    // Mark as pending
    pendingFetchesRef.current.add(address);
    
    // Add to queue
    fetchQueueRef.current.push({ address, depth, parentSignature });
    
    // Update total accounts count for progress tracking
    setTotalAccounts(prev => prev + 1);
    
    // Process queue if not already processing
    processAccountFetchQueue();
  };
  
  // Process the fetch queue in parallel
  const processAccountFetchQueue = useCallback(async () => {
    if (fetchQueueRef.current.length === 0) return;
    
    // Process batches of 10 accounts in parallel
    const batch = fetchQueueRef.current.splice(0, 10);
    
    // Fetch all accounts in parallel
    await Promise.allSettled(
      batch.map(item => fetchAndProcessAccount(item.address, item.depth, item.parentSignature))
    );
    
    // Continue processing if there are more items
    if (fetchQueueRef.current.length > 0) {
      processAccountFetchQueue();
    }
  }, []);

  // Fetch account transactions using parallel RPC connections
  const fetchAccountTransactions = async (address: string, limit = 10): Promise<AccountData | null> => {
    try {
      const response = await fetch(`/api/account-transactions/${address}?limit=${limit}`);
      if (!response.ok) throw new Error(`Error fetching transactions: ${response.statusText}`);
      return await response.json();
    } catch (err) {
      setError(`Failed to fetch transactions for ${address}`);
      return null;
    }
  };

  // Fetch and process a single account
  const fetchAndProcessAccount = async (
    address: string,
    depth = 0,
    parentSignature: string | null = null
  ) => {
    try {
      await addAccountToGraph(address, depth, parentSignature);
    } catch (e) {
      console.error(`Error processing account ${address}:`, e);
      pendingFetchesRef.current.delete(address);
    }
  };

  // Add account and its transactions to the graph
  const addAccountToGraph = async (
    address: string,
    depth = 0,
    parentSignature: string | null = null,
  ) => {
    // Stop if we've reached the maximum depth
    if (depth >= maxDepth) return;
    
    // Skip if already loaded
    if (loadedAccountsRef.current.has(address)) return;

    // Skip excluded addresses
    if (shouldExcludeAddress(address)) {
      return;
    }
    
    // Fetch transactions for this account
    const data = await fetchAccountTransactions(address);
    if (!data) {
      pendingFetchesRef.current.delete(address);
      return;
    }
    
    // Mark account as loaded
    loadedAccountsRef.current.add(address);
    pendingFetchesRef.current.delete(address);
    
    // Update loading progress
    setLoadingProgress(prev => {
      const progress = Math.min(loadedAccountsRef.current.size / Math.max(totalAccounts, 1), 1);
      return Math.floor(progress * 100);
    });

    // Get cy instance
    const cy = cyRef.current;
    if (!cy) return;
    
    // Create a unique ID for the account node
    const nodeId = address;
    
    // Add account node if it doesn't exist
    if (!cy.getElementById(nodeId).length && !processedNodesRef.current.has(nodeId)) {
      cy.add({
        data: {
          id: nodeId,
          label: shortenString(address),
          type: 'account',
          fullAddress: address,
          status: 'loaded'
        },
        classes: 'account'
      });
      processedNodesRef.current.add(nodeId);
    }

    // Add transaction nodes and edges
    const connectedAccounts = new Set<string>();
    for (const tx of data.transactions) {
      // Skip if we've already loaded this transaction
      if (loadedTransactionsRef.current.has(tx.signature)) continue;
      
      // Skip transactions involving excluded accounts
      if (!shouldIncludeTransaction(tx.accounts)) {
        continue;
      }

      // Mark transaction as loaded
      loadedTransactionsRef.current.add(tx.signature);
      
      const txNodeId = tx.signature;

      // Only add if node doesn't exist
      if (!cy.getElementById(txNodeId).length && !processedNodesRef.current.has(txNodeId)) {
        cy.add({
          data: {
            id: txNodeId,
            label: shortenString(tx.signature),
            type: 'transaction',
            status: 'loaded',
            timestamp: tx.timestamp,
            formattedTime: formatTimestamp(tx.timestamp),
            success: tx.success,
            fullSignature: tx.signature
          },
          classes: tx.success ? 'transaction success' : 'transaction error'
        });
        processedNodesRef.current.add(txNodeId);
      }

      // Create a unique edge ID and check before adding
      const accountToTxEdgeId = `${address}-${tx.signature}`;
      if (!cy.getElementById(accountToTxEdgeId).length && !processedEdgesRef.current.has(accountToTxEdgeId)) {
        cy.add({
          data: {
            id: accountToTxEdgeId,
            source: address,
            target: tx.signature,
            type: 'account-tx',
            status: 'loaded'
          }
        });
        processedEdgesRef.current.add(accountToTxEdgeId);
      }

      // Process accounts involved in this transaction
      for (const acc of tx.accounts) {
        // Skip self-references
        if (acc.pubkey === address) continue;
        
        // Skip excluded addresses
        if (shouldExcludeAddress(acc.pubkey)) 
          continue;

        // Add to connected accounts for later processing
        connectedAccounts.add(acc.pubkey);

        const accNodeId = acc.pubkey;

        // Add account node if it doesn't exist
        if (!cy.getElementById(accNodeId).length && !processedNodesRef.current.has(accNodeId)) {
          cy.add({
            data: {
              id: accNodeId,
              label: shortenString(acc.pubkey),
              type: 'account',
              fullAddress: acc.pubkey,
              status: 'pending'
            },
            classes: 'account'
          });
          processedNodesRef.current.add(accNodeId);
        }

        // Add edge from transaction to account
        const txToAccountEdgeId = `${tx.signature}-${acc.pubkey}`;
        if (!cy.getElementById(txToAccountEdgeId).length && !processedEdgesRef.current.has(txToAccountEdgeId)) {
          cy.add({
            data: {
              id: txToAccountEdgeId,
              source: tx.signature,              
              target: acc.pubkey,              
              type: 'tx-account',
              status: 'loaded'
            }
          });
          processedEdgesRef.current.add(txToAccountEdgeId);
        }
      }

      // Process transfers
      for (const transfer of tx.transfers) {
        // Add label to the edge indicating the transfer amount
        const sourceAccount = address;
        const targetAccount = transfer.account;
        
        if (sourceAccount !== targetAccount) {
          const transferEdgeId = `${tx.signature}-${targetAccount}-transfer`;
          if (!cy.getElementById(transferEdgeId).length && !processedEdgesRef.current.has(transferEdgeId)) {
            cy.add({
              data: {
                id: transferEdgeId,
                source: tx.signature,
                target: targetAccount,
                type: 'transfer',
                amount: transfer.change,
                label: formatSolChange(transfer.change),
                status: 'loaded'
              },
              classes: 'transfer'
            });
            processedEdgesRef.current.add(transferEdgeId);
          }
        }
      }
    }
    
    // Apply incremental layout
    runIncrementalLayout(cy);
    
    // Queue connected accounts for processing if within depth limit
    if (depth < maxDepth - 2) { // Ensure we respect the reduced depth
      for (const connectedAddress of connectedAccounts) {
        queueAccountFetch(connectedAddress, depth + 1, null);
      }
    }
  };
  
  // Incremental layout that preserves existing positions
  const runIncrementalLayout = (cy: cytoscape.Core) => {
    cy.layout({
      name: 'dagre' as any,
      // Cast to any to allow dagre-specific options
      // @ts-ignore - rankDir is a valid option for dagre layout
      rankDir: 'LR', // Left to right layout
      ranker: 'network-simplex',
      rankSep: 75,
      padding: 50,
      spacingFactor: 1.5,
      animate: true,
      animationDuration: 300,
      fit: false,
      randomize: false,
      nodeDimensionsIncludeLabels: true,
      // Only position nodes that don't have a position
      position: (node: any) => node.position(), 
      transform: (node: any, pos: any) => ({x: pos.x, y: pos.y})
    }).run();
  };

  // Run graph layout
  const runLayout = (cy: cytoscape.Core) => {
    // Cast to any to accommodate dagre-specific options
    cy.layout({
      name: 'dagre' as any,
      // Cast to any to allow dagre-specific options
      // @ts-ignore - rankDir is a valid option for dagre layout
      rankDir: 'LR', // Left to right layout
      ranker: 'network-simplex',
      rankSep: 75,
      padding: 50,
      spacingFactor: 1.5,
      animate: true,
      animationDuration: 500,
      fit: true
    }).run();
  };

  // Focus on a specific transaction
  const focusOnTransaction = useCallback(async (signature: string) => {
    focusSignatureRef.current = signature;

    const cy = cyRef.current; if (!cy) return;

    // Highlight the selected transaction
    cy.elements().removeClass('highlighted');
    cy.getElementById(signature).addClass('highlighted');

    // Center on the selected transaction
    const transactionNode = cy.getElementById(signature);
    if (transactionNode.length) {
      cy.animate({ fit: { eles: transactionNode, padding: 50 } }, { duration: 300 });
    }

    // Find connected accounts to this transaction
    const connectedAccounts = transactionNode.connectedEdges().connectedNodes()
      .filter(node => node.data('type') === 'account');
    for (const account of connectedAccounts) {
      queueAccountFetch(account.id(), 0, signature);
    }

    // Notify parent component
    onTransactionSelect(signature);
  }, [onTransactionSelect]);

  // Debounced version of focusOnTransaction to prevent too many rapid calls
  const debouncedFocusOnTransaction = useCallback(
    debounce((signature: string) => focusOnTransaction(signature), 300),
    [focusOnTransaction]
  );

  // Initialize cytoscape graph
  useEffect(() => {
    if (!containerRef.current) return;

    // Clear existing references to prevent duplicates on re-render
    processedNodesRef.current.clear();
    processedEdgesRef.current.clear();
    loadedTransactionsRef.current.clear();
    loadedAccountsRef.current.clear();

    const cy = cytoscape({
      container: containerRef.current,
      style: [
        {
          selector: 'node',
          style: {
            'label': 'data(label)',
            'text-valign': 'center',
            'text-halign': 'center',
            'font-size': '12px',
            'color': '#fff',
            'text-outline-width': 1,
            'text-outline-color': '#555',
            'background-color': '#666',
            'border-width': 1,
            'border-color': '#333',
          }
        },
        {
          selector: 'node[status="pending"]',
          style: {
            'border-width': 2,
            'border-style': 'dashed',
            'border-color': '#cbd5e0',
            'background-color': 'rgba(160, 174, 192, 0.3)'
          }
        },
        {
          selector: 'node[status="loading"]',
          style: {
            'border-width': 2,
            'border-style': 'dotted',
            'border-color': '#cbd5e0',
            'background-color': 'rgba(160, 174, 192, 0.5)'
          }
        },
        {
          selector: 'node.account',
          style: {
            'shape': 'round-rectangle',
            'background-color': '#4a5568',
            'width': '120px',
            'height': '30px',
          }
        },
        {
          selector: 'node.transaction',
          style: {
            'shape': 'diamond',
            'background-color': '#4299e1',
            'width': '30px',
            'height': '30px',
          }
        },
        {
          selector: 'node.transaction.success',
          style: {
            'background-color': '#48bb78',
          }
        },
        {
          selector: 'node.transaction.error',
          style: {
            'background-color': '#f56565',
          }
        },
        {
          selector: 'node.highlighted',
          style: {
            'border-width': 3,
            'border-color': '#f6ad55',
            'background-color': '#f6e05e',
          }
        },
        {
          selector: 'edge',
          style: {
            'width': 1,
            'line-color': '#a0aec0',
            'target-arrow-color': '#a0aec0',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            'opacity': 0.8,
          }
        },
        {
          selector: 'edge[type="transfer"]',
          style: {
            'width': 2,
            'line-color': '#9ae6b4',
            'target-arrow-color': '#9ae6b4',
            'label': 'data(label)',
            'font-size': '10px',
            'color': '#333',
            'text-background-color': '#fff',
            'text-background-opacity': 0.8,
            'text-background-padding': '2px',
          }
        },
        {
          selector: 'edge.highlighted',
          style: {
            'width': 3,
            'line-color': '#f6ad55',
            'target-arrow-color': '#f6ad55',
          }
        }
      ],
      // Cast to any to accommodate dagre-specific options
      layout: {
        name: 'dagre' as any,
        // Cast to any to allow dagre-specific options 
        // @ts-ignore - rankDir is a valid option for dagre layout
        rankDir: 'LR', // Left to right layout
        ranker: 'network-simplex',
        rankSep: 75,
        padding: 50
      },
      minZoom: 0.2,
      maxZoom: 3,
      wheelSensitivity: 0.3,
    });

    // Save cytoscape instance
    cyRef.current = cy;

    // Add click event for transactions
    cy.on('tap', 'node.transaction', (event) => {
      const signature = event.target.id();
      debouncedFocusOnTransaction(signature);
    });

    // Add hover styling
    cy.on('mouseover', 'node', (event) => {
      event.target.addClass('hover');
    });

    cy.on('mouseout', 'node', (event) => {
      event.target.removeClass('hover');
    });

    // Initial data loading
    const loadInitialData = async () => {
      setLoading(true);
      setError(null);
      setTotalAccounts(0);
      setLoadingProgress(0);
      
      try {
        if (initialAccount) {
          queueAccountFetch(initialAccount, 0, null);
          setLoading(false); // We'll show the graph immediately and stream updates
        } else {
          const response = await fetch(`/api/transaction/${initialSignature}`);
          if (response.ok) {
            const txData = await response.json();
            if (txData.details && txData.details.accounts && txData.details.accounts.length > 0) {
              queueAccountFetch(txData.details.accounts[0].pubkey, 0, initialSignature);
            }
          }
        }
      } catch (err) {
        console.error('Error loading initial data:', err);
        setError('Failed to load transaction graph data');
      } finally {
        setLoading(false);
      }
      
      // Once the initial data starts loading, focus on the transaction
      if (initialSignature) {
        // Wait for the graph to initialize
        const checkForNode = () => {
          if (cyRef.current && cyRef.current.getElementById(initialSignature).length) {
            focusOnTransaction(initialSignature);
          } else {
            // If node isn't available yet, check again after a brief delay
            setTimeout(checkForNode, 100);
          }
        };
        
        // Start checking
        setTimeout(checkForNode, 500);
      }
      setLoading(false);
    };

    loadInitialData();

    // Cleanup
    return () => {
      cy.destroy();
      processedNodesRef.current.clear();
      processedEdgesRef.current.clear();
      loadedTransactionsRef.current.clear();
      loadedAccountsRef.current.clear();
      pendingFetchesRef.current.clear();
    };
  }, [initialSignature, initialAccount, debouncedFocusOnTransaction, focusOnTransaction, processAccountFetchQueue, shouldExcludeAddress, shouldIncludeTransaction]);

  // Handle window resize
  const resizeGraph = useCallback(() => {
    if (cyRef.current) {
      // First resize to adjust the container dimensions
      cyRef.current.resize();
      
      // Only fit all elements if there are elements to fit
      if (cyRef.current.elements().length > 0) {
        cyRef.current.center();
        cyRef.current.fit(undefined, 20);
      }
    }
  }, []);
  
  // Use ResizeObserver for more accurate container resizing
  useEffect(() => {
    if (!containerRef.current) return;
    
    const observer = new ResizeObserver(() => {
      // Slightly longer delay to ensure DOM has fully updated before resize
      setTimeout(resizeGraph, 100);
    });
    
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [resizeGraph]);
  
  useEffect(() => {
    const handleResize = debounce(() => {
      if (cyRef.current) {
        cyRef.current.resize();
        cyRef.current.center();
        cyRef.current.fit(undefined, 20);
      }
    }, 250);

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="transaction-graph-wrapper relative w-full h-full transition-all flex flex-col">
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/75 z-10">
          <div className="bg-destructive/10 border border-destructive text-destructive p-4 rounded-md max-w-md">
            <p>{error}</p>
            <button 
              className="mt-2 px-3 py-1 bg-destructive text-destructive-foreground rounded-md"
              onClick={() => window.location.reload()}
            >Retry
            </button>
          </div>
        </div>
      )}
      
      {/* Progress indicator */}
      {loadingProgress > 0 && loadingProgress < 100 && (
        <div className="graph-loading-indicator">
          Loading data: {loadingProgress}%
        </div>
      )}
      
      <div 
        ref={containerRef}
        className="cytoscape-container w-full bg-muted/50 rounded-lg border border-border overflow-hidden"
        style={{
          width: '100%', // Ensure it always takes full width
          height: '100%', // Ensure it always takes full height
          flex: '1 1 auto' // Allow proper growing/shrinking while maintaining auto basis
        }}
      />

      {/* Controls overlay - floating in bottom right */}
      
      <div className="graph-controls">
        <button 
          className="graph-control-button"
          onClick={() => {
            if (cyRef.current) {
              cyRef.current.fit();
            }
          }}
          title="Fit view"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="15 3 21 3 21 9"></polygon><polygon points="9 21 3 21 3 15"></polygon><line x1="21" y1="3" x2="14" y2="10"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg>
        </button>
        <button 
          className="graph-control-button"
          onClick={() => {
            if (cyRef.current) {
              const zoom = cyRef.current.zoom();
              cyRef.current.zoom(zoom * 1.2);
            }
          }}
          title="Zoom in"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="11" y1="8" x2="11" y2="14"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>
        </button>
        <button 
          className="graph-control-button"
          onClick={() => {
            if (cyRef.current) {
              const zoom = cyRef.current.zoom();
              cyRef.current.zoom(zoom / 1.2);
            }
          }}
          title="Zoom out"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>
        </button>
      </div>
    </div>
  );
}