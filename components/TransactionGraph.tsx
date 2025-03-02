'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
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
  height = 600,
  maxDepth = 7
}: TransactionGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Track nodes and edges already added to prevent duplicates
  const processedNodesRef = useRef<Set<string>>(new Set());
  const processedEdgesRef = useRef<Set<string>>(new Set());
  
  // Track all loaded transactions and accounts to prevent duplicates
  const loadedTransactionsRef = useRef<Set<string>>(new Set());
  const loadedAccountsRef = useRef<Set<string>>(new Set());
  
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

  // Fetch account transactions
  const fetchAccountTransactions = async (
    address: string, 
    limit = 10
  ): Promise<AccountData | null> => {
    try {
      const response = await fetch(`/api/account-transactions/${address}?limit=${limit}`);
      if (!response.ok) {
        throw new Error(`Error fetching transactions: ${response.statusText}`);
      }
      return await response.json();
    } catch (err) {
      console.error('Failed to fetch account transactions:', err);
      setError(`Failed to fetch transactions for ${address}`);
      return null;
    }
  };

  // Add account and its transactions to the graph
  const addAccountToGraph = async (
    address: string,
    depth = 0,
    parentSignature: string | null = null
  ) => {
    // Stop if we've reached the maximum depth
    if (depth >= maxDepth) return;

    // Skip if we've already processed this account
    if (loadedAccountsRef.current.has(address)) return;

    // Mark account as loaded
    loadedAccountsRef.current.add(address);

    // Fetch transactions for this account
    const data = await fetchAccountTransactions(address);
    if (!data) return;

    // Get cy instance
    const cy = cyRef.current;
    if (!cy) return;

    // Create a unique ID for the account node
    const nodeId = address;
    
    // Check if node already exists in cytoscape AND in our local tracking
    if (!cy.getElementById(nodeId).length && !processedNodesRef.current.has(nodeId)) {
      cy.add({
        data: {
          id: nodeId,
          label: shortenString(address),
          type: 'account',
          fullAddress: address
        },
        classes: 'account'
      });
      processedNodesRef.current.add(nodeId);
    }

    // Add transaction nodes and edges
    for (const tx of data.transactions) {
      // Skip if we've already loaded this transaction
      if (loadedTransactionsRef.current.has(tx.signature)) continue;

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
            type: 'account-tx'
          }
        });
        processedEdgesRef.current.add(accountToTxEdgeId);
      }

      // Process accounts involved in this transaction
      for (const acc of tx.accounts) {
        if (acc.pubkey === address) continue; // Skip self-references
        
        const accNodeId = acc.pubkey;

        // Add account node if it doesn't exist
        if (!cy.getElementById(accNodeId).length && !processedNodesRef.current.has(accNodeId)) {
          cy.add({
            data: {
              id: accNodeId,
              label: shortenString(acc.pubkey),
              type: 'account',
              fullAddress: acc.pubkey
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
              type: 'tx-account'
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
                label: formatSolChange(transfer.change)
              },
              classes: 'transfer'
            });
            processedEdgesRef.current.add(transferEdgeId);
          }
        }
      }
    }

    // Run layout
    runLayout(cy);

    // If this is the initial load or the account is at a low depth, recursively load connected accounts
    if (depth < 2) {
      for (const tx of data.transactions) {
        for (const acc of tx.accounts) {
          if (acc.pubkey !== address && !loadedAccountsRef.current.has(acc.pubkey)) {
            await addAccountToGraph(acc.pubkey, depth + 1, tx.signature);
          }
        }
      }
    }
  };

  // Run graph layout
  const runLayout = (cy: cytoscape.Core) => {
    // Cast to any to accommodate dagre-specific options
    cy.layout({
      name: 'dagre',
      rankDir: 'LR',
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
    
    const cy = cyRef.current;
    if (!cy) return;

    // Highlight the selected transaction
    cy.elements().removeClass('highlighted');
    cy.getElementById(signature).addClass('highlighted');

    // Center on the selected transaction
    cy.center(cy.getElementById(signature));

    // Find connected accounts to this transaction
    const connectedAccounts = cy
      .getElementById(signature)
      .connectedEdges()
      .connectedNodes()
      .filter(node => node.data('type') === 'account');

    // Load more transactions for these accounts
    for (const accountNode of connectedAccounts) {
      const accountId = accountNode.id();
      await addAccountToGraph(accountId, 0, signature);
    }

    // Notify parent component
    onTransactionSelect(signature);
  }, [onTransactionSelect, maxDepth]);

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
        name: 'dagre',
        rankDir: 'LR',
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
      
      try {
        if (initialAccount) {
          await addAccountToGraph(initialAccount);
          
          // Focus on initial transaction if provided
          if (initialSignature) {
            await focusOnTransaction(initialSignature);
          }
        } else {
          // If no initial account is provided, try to get account from the transaction
          const response = await fetch(`/api/transaction/${initialSignature}`);
          if (response.ok) {
            const txData = await response.json();
            if (txData.details && txData.details.accounts && txData.details.accounts.length > 0) {
              const mainAccount = txData.details.accounts[0].pubkey;
              await addAccountToGraph(mainAccount);
              await focusOnTransaction(initialSignature);
            }
          }
        }
      } catch (err) {
        console.error('Error loading initial data:', err);
        setError('Failed to load transaction graph data');
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();

    // Cleanup
    return () => {
      cy.destroy();
      processedNodesRef.current.clear();
      processedEdgesRef.current.clear();
      loadedTransactionsRef.current.clear();
      loadedAccountsRef.current.clear();
    };
  }, [initialSignature, initialAccount, debouncedFocusOnTransaction, focusOnTransaction]);

  // Handle window resize
  useEffect(() => {
    const handleResize = debounce(() => {
      if (cyRef.current) {
        cyRef.current.resize();
        cyRef.current.fit();
      }
    }, 250);

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="relative w-full" style={{ height: typeof height === 'number' ? `${height}px` : height }}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background bg-opacity-75 z-10">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
            <p className="mt-2 text-foreground">Loading transaction graph...</p>
          </div>
        </div>
      )}
      
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-background bg-opacity-75 z-10">
          <div className="bg-destructive/10 border border-destructive text-destructive p-4 rounded-md">
            <p>{error}</p>
            <button 
              className="mt-2 px-3 py-1 bg-destructive text-destructive-foreground rounded-md"
              onClick={() => window.location.reload()}
            >
              Retry
            </button>
          </div>
        </div>
      )}
      
      <div 
        ref={containerRef} 
        className="w-full h-full bg-muted/50 rounded-lg border border-border"
      ></div>
      
      <div className="absolute bottom-4 right-4 flex space-x-2">
        <button 
          className="p-2 bg-primary text-primary-foreground rounded-md"
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
          className="p-2 bg-primary text-primary-foreground rounded-md"
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
          className="p-2 bg-primary text-primary-foreground rounded-md"
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