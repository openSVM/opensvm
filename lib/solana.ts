import { Connection, PublicKey, clusterApiUrl, ParsedTransactionWithMeta, GetProgramAccountsFilter, SystemProgram, MessageAccountKeys, VersionedBlockResponse, AccountInfo, ConfirmedSignatureInfo, ParsedInstruction, VersionedTransaction } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, getMint } from '@solana/spl-token';
import { opensvmRpcEndpoints } from './opensvm-rpc';

// Utility function to chunk array into smaller arrays
function chunks<T>(array: T[], size: number): T[][] {
  if (!array?.length) return [];
  return Array.from({ length: Math.ceil(array.length / size) }, (_, i) =>
    array.slice(i * size, i * size + size)
  ).filter(chunk => chunk.length > 0);
}

export interface TransactionInfo {
  signature: string;
  timestamp: number;
  slot: number;
  success: boolean;
  type: 'sol' | 'token' | 'nft' | 'unknown';
  amount?: number;
  symbol?: string;
  mint?: string;
}

export interface DetailedTransactionInfo extends TransactionInfo {
  blockTime: number;
  fee: number;
  status: 'confirmed' | 'finalized' | 'processed';
}

export interface TokenAccount {
  mint: string;
  owner: string;
  symbol: string;
  decimals: number;
  uiAmount: number;
  icon?: string;
  usdValue: number;
  address: string;
}

export interface AccountData {
  lamports: number;
  owner: string;
  executable: boolean;
  tokenAccounts: TokenAccount[];
  isSystemProgram: boolean;
}

export interface TransactionHistoryOptions {
  limit?: number;
  before?: string;
  until?: string;
  type?: 'all' | 'sol' | 'token' | 'nft';
}

// Use mainnet RPC endpoints
const RPC_ENDPOINTS = [
    "opensvm",
    "https://solana-mainnet.core.chainstack.com/263c9f53f4e4cdb897c0edc4a64cd007",
    "https://api.mainnet-beta.solana.com",
    "https://solana-api.projectserum.com",
];

// Cache the validated connection
let cachedConnection: Connection | null = null;

async function validateConnection(endpoint: string): Promise<boolean> {
  try {
    // Special handling for OpenSVM endpoints
    if (endpoint === 'opensvm') {
      // Try the first OpenSVM endpoint as a test
      const testConnection = new Connection(opensvmRpcEndpoints[0], {
        commitment: 'confirmed',
        wsEndpoint: undefined,
      });
      await testConnection.getLatestBlockhash();
      return true;
    }

    // Regular endpoint validation
    const testConnection = new Connection(endpoint, {
      commitment: 'confirmed',
      wsEndpoint: undefined,
    });
    await testConnection.getLatestBlockhash();
    return true;
  } catch (error) {
    console.warn(`Endpoint ${endpoint} failed health check:`, error);
    return false;
  }
}

async function createConnection(): Promise<Connection> {
  // Return cached connection if available
  if (cachedConnection) {
    try {
      await cachedConnection.getLatestBlockhash();
      return cachedConnection;
    } catch (error) {
      console.warn('Cached connection failed, refreshing...');
      cachedConnection = null;
    }
  }

  // Try each endpoint until we find a working one
  for (const endpoint of RPC_ENDPOINTS) {
    console.log(`Trying endpoint: ${endpoint}`);
    if (endpoint === 'opensvm') {
      // For OpenSVM, create a connection pool with all endpoints
      const connections = opensvmRpcEndpoints.map(url => new Connection(url, {
        commitment: 'confirmed',
        wsEndpoint: undefined,
      }));
      
      // Try each OpenSVM endpoint until one works
      for (const conn of connections) {
        try {
          await conn.getLatestBlockhash();
          cachedConnection = conn;
          return cachedConnection;
        } catch (error) {
          console.warn('OpenSVM endpoint failed:', error);
          continue;
        }
      }
    } else {
      const isValid = await validateConnection(endpoint);
      if (isValid) {
        cachedConnection = new Connection(endpoint, {
          commitment: 'confirmed',
          wsEndpoint: undefined,
        });
        return cachedConnection;
      }
    }
  }

  // If all endpoints fail, use fallback public RPC
  console.error('All RPC endpoints failed, using fallback public RPC');
  const fallbackEndpoint = clusterApiUrl('mainnet-beta');
  cachedConnection = new Connection(fallbackEndpoint, { 
    commitment: 'confirmed',
    wsEndpoint: undefined,
  });
  return cachedConnection;
}

// Initialize connection to RPC - now returns a Promise
export const initializeConnection = createConnection();

// Export a function to get the current connection or create a new one if needed
export async function getConnection(): Promise<Connection> {
  return cachedConnection || createConnection();
}

// Get RPC latency
export async function getRPCLatency(): Promise<number> {
  const start = performance.now();
  try {
    const connection = await getConnection();
    await connection.getLatestBlockhash();
    return Math.round(performance.now() - start);
  } catch (error) {
    console.error('Error measuring RPC latency:', error);
    return 0;
  }
}

// Get network stats
export interface NetworkStats {
  epoch: number;
  epochProgress: number;
  blockHeight: number;
  activeValidators: number | null;
  tps: number;
  successRate: number;
}

// Cache for network stats
let networkStatsCache: NetworkStats | null = null;
const STATS_CACHE_DURATION = 10000; // 10 seconds
let lastStatsUpdate = 0;

export async function getNetworkStats(): Promise<NetworkStats | null> {
  const now = Date.now();
  
  // Return cached stats if available and fresh
  if (networkStatsCache && (now - lastStatsUpdate) < STATS_CACHE_DURATION) {
    return networkStatsCache;
  }

  try {
    const connection = await getConnection();
    const [epochInfo, validators, perfSamples] = await Promise.all([
      connection.getEpochInfo(),
      connection.getVoteAccounts(),
      connection.getRecentPerformanceSamples(1)
    ]);

    networkStatsCache = {
      epoch: epochInfo.epoch,
      epochProgress: (epochInfo.slotIndex / epochInfo.slotsInEpoch) * 100,
      blockHeight: epochInfo.absoluteSlot,
      activeValidators: validators.current.length + validators.delinquent.length,
      tps: perfSamples[0] ? Math.round(perfSamples[0].numTransactions / perfSamples[0].samplePeriodSecs) : 0,
      successRate: 100
    };

    lastStatsUpdate = now;
    return networkStatsCache;
  } catch (error) {
    console.error('Error fetching network stats:', error);
    return networkStatsCache || null;
  }
}

// Export the connection getter for direct access
// Get transaction details
export async function getTransactionDetails(signature: string): Promise<ParsedTransactionWithMeta | null> {
  try {
    const connection = await getConnection();
    const transactions = await connection.getParsedTransactions(
      [signature],
      {
        maxSupportedTransactionVersion: 0,
        commitment: 'confirmed'
      }
    );
    return transactions[0] || null;
  } catch (error) {
    console.error('Error fetching transaction details:', error);
    return null;
  }
}

// Get block details
export async function getBlockDetails(slot: number): Promise<VersionedBlockResponse | null> {
  try {
    const connection = await getConnection();
    const block = await connection.getBlock(slot, {
      maxSupportedTransactionVersion: 0,
      commitment: 'confirmed'
    });
    return block;
  } catch (error) {
    console.error('Error fetching block details:', error);
    return null;
  }
}

export const connection = {
  get current() {
    if (!cachedConnection) {
      throw new Error('Connection not initialized. Call getConnection() first.');
    }
    return cachedConnection;
  }
};

// Store WebSocket subscriptions by address
const transactionSubscriptions = new Map<string, number>();

export async function getTransactionHistory(
  address: string,
  options: TransactionHistoryOptions = {},
  onNewTransaction?: (tx: DetailedTransactionInfo) => void
): Promise<TransactionInfo[]> {
  // Validate input parameters
  if (!address) {
    console.error('Address is required');
    return [];
  }

  try {
    // Validate Solana address
    let pubkey: PublicKey;
    try {
      pubkey = new PublicKey(address);
      if (!PublicKey.isOnCurve(pubkey.toBytes())) {
        console.error('Invalid Solana address');
        return [];
      }
    } catch (err) {
      console.error('Invalid Solana address format');
      return [];
    }

    const connection = await getConnection();
    const { limit = 50, before, until, type = 'all' } = options;

    // Get signatures with proper range handling and consistency
    const minContextSlot = await connection.getSlot('confirmed');
    const signatures = await connection.getSignaturesForAddress(
      pubkey,
      {
        limit,
        before: before ? before : undefined,
        until: until ? until : undefined,
        minContextSlot
      },
      'confirmed'
    ) || [];

    // Return early if no signatures
    if (signatures.length === 0) {
      return [];
    }

    // Ensure signatures array is valid
    if (!Array.isArray(signatures)) {
      console.error('Invalid signatures array');
      return [];
    }

    // Shared transaction processing logic
    function processTransaction(tx: ParsedTransactionWithMeta, signature: string, blockTime: number | null, slot: number): TransactionInfo | null {
        // Basic signature check
        if (!signature) return null;

        // Initialize transaction info with defaults
        const txInfo: TransactionInfo = {
            signature,
            timestamp: blockTime || 0,
            slot: slot || 0,
            success: tx.meta?.err === null,
            type: 'unknown',
            amount: undefined,
            symbol: undefined,
            mint: undefined
        };

        // Return early if no metadata
        const meta = tx.meta;
        if (!meta) return txInfo;

        // Extract balance information
        const preBalances = meta.preBalances || [];
        const postBalances = meta.postBalances || [];
        const preTokenBalances = meta.preTokenBalances || [];
        const postTokenBalances = meta.postTokenBalances || [];
        
        // Check for token transfers
        const tokenBalance = preTokenBalances?.[0] || postTokenBalances?.[0];
        if (tokenBalance?.mint) {
            txInfo.type = 'token';
            txInfo.mint = tokenBalance.mint;
            if (tokenBalance.uiTokenAmount?.uiAmount) {
                txInfo.amount = Number(tokenBalance.uiTokenAmount.uiAmount);
            }
        }
        // Check for SOL transfers
        else if (preBalances.length > 0 && postBalances.length > 0) {
            const balanceChange = Math.abs(postBalances[0] - preBalances[0]);
            if (balanceChange > 0) {
                txInfo.type = 'sol';
                txInfo.amount = balanceChange / 1e9;
            }
        }

        // Filter by type if specified
        if (type !== 'all' && type !== txInfo.type) {
            return null;
        }

        return txInfo;
    }

    // Batch fetch transactions in chunks
    const chunkedSignatures = chunks(signatures, 100);
    const transactionResults = await Promise.all(
      chunkedSignatures.map(async (chunk) => {
        try {
          const txs = await connection.getParsedTransactions(
            chunk.map(sig => sig.signature),
            {
              maxSupportedTransactionVersion: 0,
              commitment: 'confirmed'
            }
          );
          
          return chunk.map((sig, i): TransactionInfo | null => {
            const tx = txs[i];
            if (!tx) return null;
            return processTransaction(tx, sig.signature, sig.blockTime, sig.slot);
          });
        } catch (err) {
          console.error('Error processing transaction chunk:', err);
          return [];
        }
      })
    );

    // Safely process and flatten results
    const transactions = (transactionResults || [])
      .flat()
      .filter((tx): tx is TransactionInfo => {
        if (!tx || typeof tx !== 'object') return false;
        return 'signature' in tx && typeof tx.signature === 'string';
      })
      .map(tx => {
        // Ensure all required fields have valid values
        return {
          signature: tx.signature,
          timestamp: typeof tx.timestamp === 'number' ? tx.timestamp : 0,
          slot: typeof tx.slot === 'number' ? tx.slot : 0,
          success: typeof tx.success === 'boolean' ? tx.success : false,
          type: tx.type || 'unknown',
          amount: typeof tx.amount === 'number' ? tx.amount : undefined,
          symbol: typeof tx.symbol === 'string' ? tx.symbol : undefined,
          mint: typeof tx.mint === 'string' ? tx.mint : undefined
        };
      });

    // Setup WebSocket subscription for new transactions if callback provided
    if (onNewTransaction && !transactionSubscriptions.has(address)) {
      const subId = await connection.onLogs(
        pubkey,
        async (logs) => {
          try {
            const signature = logs.signature;
            const txs = await connection.getParsedTransactions(
              [signature],
              {
                maxSupportedTransactionVersion: 0,
                commitment: 'confirmed'
              }
            );
            const tx = txs[0];
            
            if (!tx) return;

            // Use shared transaction processing logic
            const txInfo = processTransaction(tx, signature, tx.blockTime, tx.slot || 0);
            if (!txInfo) return;

            // Add detailed transaction info
            const detailedTxInfo: DetailedTransactionInfo = {
              ...txInfo,
              blockTime: tx.blockTime || 0,
              fee: tx.meta?.fee || 0,
              status: 'confirmed'
            };

            onNewTransaction(detailedTxInfo);
          } catch (err) {
            console.error('Error processing new transaction:', err);
          }
        },
        'confirmed'
      );
      transactionSubscriptions.set(address, subId);
    }

    return transactions;
  } catch (error) {
    console.error('Error fetching transaction history:', error);
    throw error;
  }
}

export async function unsubscribeFromTransactions(address: string): Promise<void> {
  const subId = transactionSubscriptions.get(address);
  if (subId) {
    try {
      const connection = await getConnection();
      await connection.removeOnLogsListener(subId);
      transactionSubscriptions.delete(address);
    } catch (error) {
      console.error('Error unsubscribing from transactions:', error);
    }
  }
}

export async function getTokenInfo(mint: string) {
  try {
    const connection = await getConnection();
    const mintPubkey = new PublicKey(mint);
    const mintInfo = await getMint(connection, mintPubkey);
    return {
      mint,
      supply: Number(mintInfo.supply),
      decimals: mintInfo.decimals,
      isInitialized: mintInfo.isInitialized,
      freezeAuthority: mintInfo.freezeAuthority?.toBase58(),
      mintAuthority: mintInfo.mintAuthority?.toBase58()
    };
  } catch (error) {
    console.error('Error fetching token info:', error);
    throw error;
  }
}

export async function getAccountInfo(address: string) {
  try {
    const connection = await getConnection();
    const pubkey = new PublicKey(address);
    const accountInfo = await connection.getAccountInfo(pubkey);
    if (!accountInfo) {
      throw new Error('Account not found');
    }
    return {
      address,
      lamports: accountInfo.lamports,
      owner: accountInfo.owner.toBase58(),
      executable: accountInfo.executable,
      rentEpoch: accountInfo.rentEpoch,
      space: accountInfo.data.length
    };
  } catch (error) {
    console.error('Error fetching account info:', error);
    throw error;
  }
}

export async function getTokenAccounts(address: string): Promise<AccountData> {
  try {
    const connection = await getConnection();
    const pubkey = new PublicKey(address);
    
    // Get all token accounts owned by this address
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(pubkey, {
      programId: TOKEN_PROGRAM_ID
    });

    // Collect all account pubkeys we need to fetch (main account + all mint accounts)
    const mintPubkeys = tokenAccounts.value.map(ta => new PublicKey(ta.account.data.parsed.info.mint));
    const accountsToFetch = [pubkey, ...mintPubkeys];

    // Fetch all account infos in one RPC call
    const accountInfos = await connection.getMultipleAccountsInfo(accountsToFetch);
    
    const [mainAccountInfo, ...mintAccountInfos] = accountInfos;
    if (!mainAccountInfo) {
      throw new Error('Account not found');
    }

    // Process token accounts with mint info
    const processedAccounts: TokenAccount[] = tokenAccounts.value.map((ta, i) => {
      const parsedInfo = ta.account.data.parsed.info;
      const mintAccountInfo = mintAccountInfos[i];
      if (!mintAccountInfo) {
        throw new Error(`Mint account not found for token ${parsedInfo.mint}`);
      }

      return {
        mint: parsedInfo.mint,
        owner: parsedInfo.owner,
        symbol: '', // Token metadata would need to be fetched separately
        decimals: parsedInfo.tokenAmount.decimals,
        uiAmount: Number(parsedInfo.tokenAmount.uiAmount),
        icon: undefined, // Token metadata would need to be fetched separately
        usdValue: 0, // Token price would need to be fetched separately
        address: ta.pubkey.toBase58()
      };
    });

    const accountData: AccountData = {
      lamports: mainAccountInfo.lamports,
      owner: mainAccountInfo.owner.toBase58(),
      executable: mainAccountInfo.executable,
      tokenAccounts: processedAccounts,
      isSystemProgram: mainAccountInfo.owner.equals(SystemProgram.programId)
    };

    return accountData;
  } catch (error) {
    console.error('Error fetching token accounts:', error);
    throw error;
  }
}
