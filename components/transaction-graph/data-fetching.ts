'use client';

import cytoscape from 'cytoscape';
import { AccountData, FetchQueueItem, GraphElementAddResult, Transaction } from './types';
import { formatSolChange, formatTimestamp, shortenString } from './utils';
import { runIncrementalLayout } from './layout';
import { GraphStateCache } from '@/lib/graph-state-cache';

/**
 * Fetch transaction data with caching
 * @param signature Transaction signature
 * @param transactionCache Cache for transaction data
 * @returns Transaction data
 */
export const fetchTransactionData = async (
  signature: string,
  transactionCache: Map<string, any>
): Promise<any> => {
  // Check if we have this in memory cache first
  const cachedData = transactionCache.get(signature);
  if (cachedData) {
    return cachedData;
  }
  
  try {
    // Fetch from API if not in cache
    const response = await fetch(`/api/transaction/${signature}`, {
      headers: { 'Cache-Control': 'no-cache' } // Ensure fresh data
    });
    
    if (!response.ok) {
      throw new Error(`Error fetching transaction: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Cache the result for future use
    transactionCache.set(signature, data);
    
    return data;
  } catch (error) {
    console.error(`Failed to fetch transaction data ${signature}:`, error);
    throw error;
  }
};

/**
 * Fetch account transactions with SPL transfer filtering and guaranteed fallback
 * @param address Account address
 * @param signal Optional abort signal
 * @returns Account data with guaranteed non-null result
 */
export const fetchAccountTransactions = async (
  address: string,
  signal?: AbortSignal
): Promise<AccountData | null> => {
  console.log(`Starting fetch for account: ${address}`);
  
  try {
    // Circuit breaker for problematic accounts - still return empty data
    if (address === 'FetTyW8xAYfd33x4GMHoE7hTuEdWLj1fNnhJuyVMUGGa' || 
        address === 'WaLLeTaS7qTaSnKFTYJNGAeu7VzoLMUV9QCMfKxFsgt' ||
        address === 'RecipienTEKQQQQQQQQQQQQQQQQQQQQQQQQQQFrThs') {
      console.log(`Circuit breaker: Skipping problematic account ${address}`);
      return { address, transactions: [] };
    }

    // First try to get SPL transfers (top 10 by volume)
    console.log(`Trying SPL transfers for ${address}`);
    try {
      const transfersResponse = await fetch(`/api/account-transfers/${address}?limit=10`, {
        signal,
        headers: { 'Cache-Control': 'no-cache' }
      });

      if (transfersResponse.ok) {
        const transfersData = await transfersResponse.json();
        const transfers = transfersData.data || [];
        
        if (transfers.length > 0) {
          // Convert transfers to transaction format
          const transactions = transfers.map((transfer: any) => ({
            signature: transfer.txId,
            timestamp: new Date(transfer.date).getTime(),
            slot: 0,
            err: null,
            success: true,
            accounts: [
              { pubkey: transfer.from, isSigner: false, isWritable: true },
              { pubkey: transfer.to, isSigner: false, isWritable: true }
            ],
            transfers: [{
              account: transfer.to,
              change: parseFloat(transfer.tokenAmount) * 1e9 // Convert to lamports
            }],
            memo: null
          }));
          
          console.log(`✓ Found ${transactions.length} SPL transfers for ${address}`);
          return { address, transactions };
        }
      } else {
        console.warn(`SPL transfers API failed for ${address}: ${transfersResponse.status}`);
      }
    } catch (transferError) {
      console.warn(`SPL transfers fetch failed for ${address}:`, transferError);
    }

    // Fallback: Get regular transactions with timeout protection
    console.log(`Falling back to regular transactions for ${address}`);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // Reduced to 10s
      
      // Use existing signal if provided, otherwise use our controller
      const fetchSignal = signal || controller.signal;
      
      const response = await fetch(`/api/account-transactions/${address}?limit=5`, {
        signal: fetchSignal,
        headers: { 'Cache-Control': 'no-cache' }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        if (response.status === 400) {
          console.warn(`Bad request for account ${address}, returning empty transactions`);
          return { address, transactions: [] };
        }
        throw new Error(`Error fetching transactions: ${response.statusText} (${response.status})`);
      }
      
      const data = await response.json();
      const transactionCount = data.transactions?.length || 0;
      console.log(`✓ Fallback: Found ${transactionCount} regular transactions for ${address}`);
      
      // Always return valid data structure, even if empty
      return {
        address,
        transactions: data.transactions || []
      };
      
    } catch (fallbackError) {
      console.warn(`Regular transactions fallback failed for ${address}:`, fallbackError);
    }
    
    // Final fallback: Return empty transactions but still mark account as processed
    console.log(`All fetches failed for ${address}, returning empty transactions`);
    return { address, transactions: [] };
    
  } catch (err) {
    console.error(`Critical error fetching transactions for ${address}:`, err);
    // Always return a valid structure, never null
    return { address, transactions: [] };
  }
};

/**
 * Queue an account for fetching
 * @param address Account address
 * @param depth Current depth in the graph
 * @param parentSignature Parent transaction signature
 * @param fetchQueueRef Reference to fetch queue
 * @param pendingFetchesRef Reference to pending fetches
 * @param loadedAccountsRef Reference to loaded accounts
 * @param setTotalAccounts Function to update total accounts count
 * @param processAccountFetchQueue Function to process the fetch queue
 * @param isProcessingQueueRef Reference to track if queue is being processed (optional)
 */
export const queueAccountFetch = (
  address: string,
  depth = 0,
  parentSignature: string | null = null,
  fetchQueueRef: React.MutableRefObject<FetchQueueItem[]>, 
  pendingFetchesRef: React.MutableRefObject<Set<string>>,
  loadedAccountsRef: React.MutableRefObject<Set<string>>,
  setTotalAccounts: (cb: (prev: number) => number) => void,
  processAccountFetchQueue: () => void,
  isProcessingQueueRef?: React.MutableRefObject<boolean>
): void => {
  const accountKey = `${address}:${depth}`;
  // Validate address to prevent null/empty values
  if (!address || typeof address !== 'string') {
    console.warn('Attempted to queue invalid address:', address);
    return;
  }
  
  // Skip if we've already loaded this account
  // Check if we've already loaded or queued this account at this depth or lower
  if (loadedAccountsRef.current?.has(address)) {
    return;
  }

  if (pendingFetchesRef.current?.has(accountKey)) {
    return;
  }
  
  // Enforce maximum queue size to prevent unbounded growth
  const MAX_QUEUE_SIZE = 250; // Reduced from 500 to 250 for better performance
  if (fetchQueueRef.current.length >= MAX_QUEUE_SIZE) {
    console.warn(`Fetch queue size limit reached (${MAX_QUEUE_SIZE}). Skipping address: ${address}`);
    return;
  }
  
  // Mark as pending before adding to queue
  pendingFetchesRef.current.add(accountKey);
  
  // Add to queue
  fetchQueueRef.current.push({ address, depth, parentSignature });
  
  // Update total accounts count for progress tracking
  setTotalAccounts(prev => prev + 1);
  
  // Process queue if not already processing
  if (!isProcessingQueueRef || !isProcessingQueueRef.current) {
    processAccountFetchQueue();
  }
};

/**
 * Process the fetch queue in parallel
 * @param fetchQueueRef Reference to fetch queue
 * @param fetchAndProcessAccount Function to fetch and process an account
 * @param isProcessingQueueRef Reference to track if queue is being processed (optional)
 * @returns Promise that resolves when processing is complete
 */
export const processAccountFetchQueue = async (
  fetchQueueRef: React.MutableRefObject<FetchQueueItem[]>,
  fetchAndProcessAccount: (address: string, depth: number, parentSignature: string | null) => Promise<void>,
  isProcessingQueueRef?: React.MutableRefObject<boolean>
): Promise<void> => { 
  // Early return if queue is empty or already processing
  if (fetchQueueRef.current.length === 0) return;
  if (isProcessingQueueRef && isProcessingQueueRef.current) return;
  
  try {
    // Set processing flag to true if it exists
    if (isProcessingQueueRef) {
      isProcessingQueueRef.current = true;
    }
    
    // Use iterative approach instead of recursion to avoid stack overflow
    while (fetchQueueRef.current.length > 0) {
      // Process batches of 10 accounts in parallel
      const batch = fetchQueueRef.current.splice(0, 10);
      
      // Fetch all accounts in parallel with timeout protection
      await Promise.allSettled(
        batch.map(item => {
          // Add timeout protection for each fetch operation
          const fetchPromise = fetchAndProcessAccount(item.address, item.depth, item.parentSignature);
          const timeoutPromise = new Promise<void>((_, reject) => 
            setTimeout(() => reject(new Error(`Fetch timeout for ${item.address}`)), 30000)
          );
          
          return Promise.race([fetchPromise, timeoutPromise])
            .catch(err => {
              console.error(`Error processing account ${item.address}:`, err);
            });
        })
      );
      
      // Add small delay between batches to prevent overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  } catch (error) {
    console.error('Error processing fetch queue:', error);
  } finally {
    // Always reset processing flag when done
    if (isProcessingQueueRef) {
      isProcessingQueueRef.current = false;
    }
  }
};

/**
 * Add account and its transactions to the graph
 * @param address Account address
 * @param totalAccounts Total number of accounts
 * @param depth Current depth in the graph
 * @param parentSignature Parent transaction signature
 * @param newElements Set of new element IDs
 * @param maxDepth Maximum depth to traverse
 * @param shouldExcludeAddress Function to check if address should be excluded
 * @param shouldIncludeTransaction Function to check if transaction should be included
 * @param fetchAccountTransactions Function to fetch account transactions
 * @param cyRef Reference to cytoscape instance
 * @param loadedAccountsRef Reference to loaded accounts
 * @param pendingFetchesRef Reference to pending fetches
 * @param loadedTransactionsRef Reference to loaded transactions
 * @param processedNodesRef Reference to processed nodes
 * @param processedEdgesRef Reference to processed edges
 * @param setLoadingProgress Function to update loading progress
 * @param queueAccountFetch Function to queue an account for fetching
 * @returns Result object with cytoscape instance, address, and new elements
 */
export const addAccountToGraph = async (
  address: string,
  totalAccounts: number,
  depth = 0,
  parentSignature: string | null = null,
  newElements?: Set<string>,
  maxDepth = 3,
  shouldExcludeAddress?: (address: string) => boolean,
  shouldIncludeTransaction?: (accounts: {pubkey: string}[]) => boolean,
  fetchAccountTransactions?: (address: string, signal?: AbortSignal) => Promise<AccountData | null>,
  cyRef?: React.MutableRefObject<cytoscape.Core | null>,
  loadedAccountsRef?: React.MutableRefObject<Set<string>>,
  pendingFetchesRef?: React.MutableRefObject<Set<string>>,
  loadedTransactionsRef?: React.MutableRefObject<Set<string>>,
  processedNodesRef?: React.MutableRefObject<Set<string>>,
  processedEdgesRef?: React.MutableRefObject<Set<string>>,
  setLoadingProgress?: (cb: (prev: number) => number) => void,
  queueAccountFetch?: (address: string, depth: number, parentSignature: string | null) => void
): Promise<GraphElementAddResult | undefined> => {
  // Stop if we've reached the maximum depth
  if (depth >= maxDepth) return;
  
  // Skip if already loaded
  // Add safety check to ensure loadedAccountsRef.current is defined
  if (loadedAccountsRef?.current?.has(address)) return;
    
  // Skip excluded addresses
  if (shouldExcludeAddress && shouldExcludeAddress(address)) {
    return;
  }
  
  // Fetch transactions for this account
  const data = await fetchAccountTransactions?.(address);
  
  // Always mark account as processed and update progress, even if no data
  loadedAccountsRef?.current?.add(address);
  pendingFetchesRef?.current?.delete(`${address}:${depth}`);
  
  // Update loading progress - ensure progress moves forward even with empty results
  setLoadingProgress?.((prev) => {
    const loadedCount = loadedAccountsRef?.current?.size || 0;
    const total = Math.max(totalAccounts, 1);
    const progress = Math.min(loadedCount / total, 1);
    const newProgress = Math.floor(progress * 100);
    console.log(`Progress update: ${loadedCount}/${total} accounts (${newProgress}%)`);
    return newProgress;
  });
  
  if (!data || !data.transactions || data.transactions.length === 0) {
    console.log(`No transactions found for account ${address}, but marked as processed`);
    return { cy: cyRef?.current, address, newElements: new Set() };
  }

  // Get cy instance and verify it exists
  const cy = cyRef?.current;
  if (!cy) {
    console.warn(`Cytoscape instance not available for account ${address}. Skipping graph updates.`);
    // Still mark the account as processed but return early
    loadedAccountsRef?.current?.add(address);
    pendingFetchesRef?.current?.delete(`${address}:${depth}`);
    return;
  }
  
  try {
    // Create a unique ID for the account node
    const nodeId = address;
    
    // Track new elements if set is provided
    if (newElements && !cy.getElementById(nodeId).length) {
      newElements.add(nodeId);
    }
    
    // Always add account node if it doesn't exist, even if no transactions
    if (!cy.getElementById(nodeId).length && !processedNodesRef?.current?.has(nodeId)) {
      cy.add({
        data: {
          id: nodeId,
          label: shortenString(address),
          type: 'account',
          fullAddress: address,
          status: 'loaded',
          transactionCount: data?.transactions?.length || 0
        },
        classes: 'account'
      });
      processedNodesRef?.current?.add(nodeId);
      console.log(`Added account node: ${address} with ${data?.transactions?.length || 0} transactions`);
    }

    // If no transactions, return early but still show the account node
    if (!data?.transactions || data.transactions.length === 0) {
      console.log(`Account ${address} has no transactions but node was added to graph`);
      return { cy, address, newElements };
    }

    // Add transaction nodes and edges
    const connectedAccounts = new Set<string>();
    for (const tx of data.transactions) {
      // Skip if we've already loaded this transaction
      if (loadedTransactionsRef?.current?.has(tx.signature)) continue;
      
      // Skip transactions involving excluded accounts
      if (shouldIncludeTransaction && !shouldIncludeTransaction(tx.accounts)) {
        continue;
      }

      // Mark transaction as loaded
      loadedTransactionsRef?.current?.add(tx.signature);
      
      const txNodeId = tx.signature;

      // Only add if node doesn't exist
      if (!cy.getElementById(txNodeId).length && !processedNodesRef?.current?.has(txNodeId)) {
        // Track new elements if set is provided
        if (newElements) {
          newElements.add(txNodeId);
        }
        
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
        processedNodesRef?.current?.add(txNodeId);
      }

      // Create a unique edge ID and check before adding
      const accountToTxEdgeId = `${address}-${tx.signature}`;
      if (!cy.getElementById(accountToTxEdgeId).length && !processedEdgesRef?.current?.has(accountToTxEdgeId)) {
        cy.add({
          data: {
            id: accountToTxEdgeId,
            source: address,
            target: tx.signature,
            type: 'account-tx',
            status: 'loaded'
          }
        });
        processedEdgesRef?.current?.add(accountToTxEdgeId);
        
        // Track new edge elements if set is provided
        if (newElements) {
          newElements.add(accountToTxEdgeId);
        }
      }

      // Process accounts involved in this transaction
      for (const acc of tx.accounts) {
        // Skip self-references
        if (acc.pubkey === address) continue;
        
        // Skip excluded addresses
        if (shouldExcludeAddress && shouldExcludeAddress(acc.pubkey)) 
          continue;

        // Add to connected accounts for later processing
        connectedAccounts.add(acc.pubkey);

        const accNodeId = acc.pubkey;

        // Add account node if it doesn't exist
        if (!cy.getElementById(accNodeId).length && !processedNodesRef?.current?.has(accNodeId)) {
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
          processedNodesRef?.current?.add(accNodeId);
          
          // Track new account node elements if set is provided
          if (newElements) {
            newElements.add(accNodeId);
          }
        }

        // Add edge from transaction to account
        const txToAccEdgeId = `${tx.signature}-${acc.pubkey}`;
        if (!cy.getElementById(txToAccEdgeId).length && !processedEdgesRef?.current?.has(txToAccEdgeId)) {
          cy.add({
            data: {
              id: txToAccEdgeId,
              source: tx.signature,              
              target: acc.pubkey,              
              type: 'tx-account',
              status: 'loaded'
            }
          });
          processedEdgesRef?.current?.add(txToAccEdgeId);
          
          // Track new edge elements if set is provided
          if (newElements) {
            newElements.add(txToAccEdgeId);
          }
        }
      }

      // Process transfers
      for (const transfer of tx.transfers) {
        const targetAccount = transfer.account;
        
        if (address !== targetAccount) {
          const transferEdgeId = `${tx.signature}-${targetAccount}-transfer`;
          if (!cy.getElementById(transferEdgeId).length && !processedEdgesRef?.current?.has(transferEdgeId)) {
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
            processedEdgesRef?.current?.add(transferEdgeId);
            
            // Track new transfer edge elements if set is provided
            if (newElements) {
              newElements.add(transferEdgeId);
            }
          }
        }
      }
    }
    
    // Queue connected accounts for processing if within depth limit
    if (depth < maxDepth - 1) {
      for (const connectedAddress of connectedAccounts) {
        const nextDepth = depth + 1;
        const connectedAccountKey = `${connectedAddress}:${nextDepth}`;
        // Add safety checks to ensure Set objects are defined before calling .has()
        if (!loadedAccountsRef?.current?.has(connectedAddress) && 
            !pendingFetchesRef?.current?.has(connectedAccountKey) && 
            connectedAddress !== address) {
          // Pass the current transaction signature as the parent signature instead of null
          queueAccountFetch?.(connectedAddress, nextDepth, parentSignature);
        }
      }
    }
    
    return { cy, address, newElements };
  } catch (error) {
    console.error(`Error adding account ${address} to graph:`, error);
    // Clean up any partial state
    pendingFetchesRef?.current?.delete(`${address}:${depth}`);
    return;
  }
};

/**
 * Expand the transaction graph
 * @param signature Transaction signature
 * @param cyRef Reference to cytoscape instance
 * @param fetchTransactionData Function to fetch transaction data
 * @param queueAccountFetch Function to queue an account for fetching
 * @param addAccountToGraph Function to add account to graph
 * @param setExpandedNodesCount Function to update expanded nodes count
 * @param loadedTransactionsRef Reference to loaded transactions
 * @param signal Optional AbortSignal for cancelling operations
 * @returns Promise that resolves to true if new elements were added
 */
export const expandTransactionGraph = async (
  signature: string,
  cyRef: React.MutableRefObject<cytoscape.Core | null>,
  fetchTransactionData: (signature: string) => Promise<any>,
  queueAccountFetch: (address: string, depth: number, parentSignature: string | null) => void,
  addAccountToGraph: (address: string, totalAccounts: number, depth: number, parentSignature: string | null, newElements?: Set<string>) => Promise<GraphElementAddResult | undefined>,
  setExpandedNodesCount: (cb: (prev: number) => number) => void,
  loadedTransactionsRef: React.MutableRefObject<Set<string>>,
  signal?: AbortSignal
): Promise<boolean> => {
  const cy = cyRef.current;
  if (!cy) return false;

  // Check if the operation has been aborted
  if (signal?.aborted) {
    return false;
  }

  // Save viewport state before expansion
  const initialViewport = { zoom: cy.zoom(), pan: cy.pan() };
  
  // Track new elements added during this expansion
  const newElements = new Set<string>();

  // Always create or update the transaction node first
  const existingNode = cy.getElementById(signature);
  if (existingNode.length === 0) {
    cy.add({ 
      data: { 
        id: signature, 
        label: signature.slice(0, 8) + '...', 
        type: 'transaction' 
      }, 
      classes: 'transaction' 
    });
  }

  try {
    // Check for abort before expensive operations
    if (signal?.aborted) {
      return false;
    }
    
    // Fetch transaction data even if node exists to ensure we have latest data
    const transactionData = await fetchTransactionData(signature);
    
    // Check for abort after network request
    if (signal?.aborted) {
      return false;
    }
    
    // Add the transaction signature to loadedTransactionsRef to prevent re-processing
    loadedTransactionsRef.current.add(signature);
    
    if (transactionData?.details?.accounts?.length > 0) {
      // Process all accounts in parallel instead of just the first one
      const accountPromises = transactionData.details.accounts.map(account => {
        if (account.pubkey) {
          return new Promise<void>((resolve) => {
            queueAccountFetch(account.pubkey, 1, signature);
            resolve();
          });
        }
        return Promise.resolve();
      });
      
      // Wait for all account queuing to complete
      if (!signal?.aborted) {
        await Promise.all(accountPromises);
        
        // Wait a short time for processing to start
        await new Promise(resolve => {
          const timeout = setTimeout(resolve, 300);
          if (signal) {
            signal.addEventListener('abort', () => {
              clearTimeout(timeout);
              resolve(undefined);
            }, { once: true });
          }
        });
      }
    }
  } catch (error) {
    // Only log errors if they're not from an aborted request
    if (!(error instanceof DOMException && error.name === 'AbortError')) {
      console.error(`Error fetching transaction data for expansion: ${signature}`, error);
    }
    return false;
  }
  
  // Check if aborted after transaction fetch
  if (signal?.aborted) {
    return false;
  }
  
  // Get connected accounts to this transaction
  const connectedAccounts = cy.getElementById(signature).connectedEdges().connectedNodes()
    .filter(node => node.data('type') === 'account')
    .map(node => node.id() as string);

  try {
    // Process accounts in parallel with proper error handling
    if (connectedAccounts.length > 0) {
      const accountProcessPromises = connectedAccounts.map(accountId => 
        addAccountToGraph(accountId, connectedAccounts.length, 1, signature, newElements)
          .catch(err => {
            console.error(`Error processing account ${accountId}:`, err);
            return undefined;
          })
      );
      
      await Promise.all(accountProcessPromises);
    }
    
    // Check for abort after processing accounts
    if (signal?.aborted) {
      return false;
    }
    
    // Apply incremental layout only if we have new elements
    if (newElements.size > 0) {
      const elementsToAnimate = Array.from(newElements);

      // Start with zero opacity for smooth fade-in
      cy.$(elementsToAnimate.map(id => `#${id}`).join(',')).style({
        'opacity': 0
      });
      
      // Run incremental layout that preserves existing node positions
      runIncrementalLayout(cy, elementsToAnimate);
      
      // Update analytics count
      setExpandedNodesCount(prev => prev + newElements.size);
      
      // Animate new elements with a fade-in effect
      cy.$(elementsToAnimate.map(id => `#${id}`).join(',')).animate({
        style: { opacity: 1 }
      }, { 
        duration: 300,
        easing: 'ease-in-out'
      });
      
      // Restore original viewport position to maintain user's perspective
      cy.viewport(initialViewport);
      
      return true;
    }
  } catch (error) {
    // Only log errors if they're not from an aborted request
    if (!(error instanceof DOMException && error.name === 'AbortError')) {
      console.error(`Error processing connected accounts for ${signature}:`, error);
    }
  }
  
  return newElements.size > 0;
};