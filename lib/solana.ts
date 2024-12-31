import { Connection, PublicKey, clusterApiUrl, ParsedTransactionWithMeta, BlockResponse, GetProgramAccountsFilter, SystemProgram, MessageAccountKeys } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, getMint } from '@solana/spl-token';

const RPC_ENDPOINTS = [
  'https://solana-mainnet.core.chainstack.com/263c9f53f4e4cdb897c0edc4a64cd007',
  'https://api.mainnet-beta.solana.com',
  'https://solana-api.projectserum.com',
];

// Cache the validated connection
let cachedConnection: Connection | null = null;

async function validateConnection(endpoint: string): Promise<boolean> {
  try {
    const testConnection = new Connection(endpoint, {
      commitment: 'confirmed',
      wsEndpoint: endpoint.startsWith('https') ? endpoint.replace('https', 'wss') : undefined,
    });
    
    // Test the connection with a light RPC call
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
    const isValid = await validateConnection(endpoint);
    if (isValid) {
      cachedConnection = new Connection(endpoint, {
        commitment: 'confirmed',
        wsEndpoint: endpoint.startsWith('https') ? endpoint.replace('https', 'wss') : undefined,
      });
      return cachedConnection;
    }
  }

  // If all endpoints fail, use fallback public RPC
  console.error('All RPC endpoints failed, using fallback public RPC');
  const fallbackEndpoint = clusterApiUrl('mainnet-beta');
  cachedConnection = new Connection(fallbackEndpoint, { commitment: 'confirmed' });
  return cachedConnection;
}

// Initialize connection to RPC - now returns a Promise
export const initializeConnection = createConnection();

// Export a function to get the current connection or create a new one if needed
export async function getConnection(): Promise<Connection> {
  return cachedConnection || createConnection();
}

// Cache for network stats
interface NetworkStatsCache {
  epoch: number;
  epochProgress: number;
  blockHeight: number;
  activeValidators: number | null;
  tps: number;
  successRate: number;
  lastUpdate: number;
}

let networkStatsCache: NetworkStatsCache | null = null;
let slotSubscription: number | null = null;
const VALIDATOR_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
let lastValidatorUpdate = 0;
let validatorCount: number | null = null;

// Add subscription management
const networkStatsSubscribers = new Set<(stats: NetworkStatsCache) => void>();
let networkStatsSubscriptionId: number | null = null;

// Initialize WebSocket subscriptions for network stats
export async function initializeNetworkStatsSubscription(onUpdate?: (stats: NetworkStatsCache) => void) {
  if (!onUpdate) return () => {};

  // Add new subscriber
  networkStatsSubscribers.add(onUpdate);

  // Only create WebSocket connection if it doesn't exist
  if (!networkStatsSubscriptionId) {
    try {
      const connection = await getConnection();
      networkStatsSubscriptionId = connection.onSlotChange(async (slotInfo) => {
        try {
          const now = Date.now();
          const connection = await getConnection();
          const epochInfo = await connection.getEpochInfo().catch(() => null);
          
          if (!epochInfo) {
            console.warn('Failed to fetch epoch info');
            return;
          }

          // Only fetch validator count if cache expired
          if (!validatorCount || now - lastValidatorUpdate > VALIDATOR_CACHE_TTL) {
            try {
              const validators = await connection.getVoteAccounts();
              validatorCount = validators.current.length + validators.delinquent.length;
              lastValidatorUpdate = now;
            } catch (error) {
              console.warn('Failed to fetch validator count');
            }
          }

          // Get performance samples for TPS calculation
          const perfSamples = await connection.getRecentPerformanceSamples(1).catch(() => []);
          const recentSample = perfSamples[0];
          const tps = recentSample ? Math.round(recentSample.numTransactions / recentSample.samplePeriodSecs) : 0;

          // Calculate success rate from recent transactions
          let successRate = 100;
          try {
            const signatures = await connection.getSignaturesForAddress(
              SystemProgram.programId,
              { limit: 100 }
            );
            if (signatures.length > 0) {
              successRate = (signatures.filter(sig => !sig.err).length / signatures.length) * 100;
            }
          } catch (error) {
            console.warn('Failed to fetch transaction success rate');
          }

          networkStatsCache = {
            epoch: epochInfo.epoch,
            epochProgress: (epochInfo.slotIndex / epochInfo.slotsInEpoch) * 100,
            blockHeight: epochInfo.absoluteSlot,
            activeValidators: validatorCount,
            tps,
            successRate,
            lastUpdate: now
          };

          // Notify all subscribers
          networkStatsSubscribers.forEach(subscriber => {
            try {
              subscriber(networkStatsCache);
            } catch (error) {
              console.error('Error in network stats subscriber:', error);
            }
          });
        } catch (error) {
          console.error('Error updating network stats:', error);
        }
      });
    } catch (error) {
      console.error('Failed to initialize slot subscription:', error);
    }
  }

  // Return cleanup function
  return async () => {
    networkStatsSubscribers.delete(onUpdate);

    // If no more subscribers, remove the WebSocket subscription
    if (networkStatsSubscribers.size === 0 && networkStatsSubscriptionId !== null) {
      const connection = await getConnection();
      connection.removeSlotChangeListener(networkStatsSubscriptionId);
      networkStatsSubscriptionId = null;
    }
  };
}

// Get network stats with caching
export async function getNetworkStats(): Promise<NetworkStatsCache | null> {
  if (!networkStatsCache) {
    try {
      const connection = await getConnection();
      const epochInfo = await connection.getEpochInfo();
      const validators = await connection.getVoteAccounts();
      const perfSamples = await connection.getRecentPerformanceSamples(1);
      
      networkStatsCache = {
        epoch: epochInfo.epoch,
        epochProgress: (epochInfo.slotIndex / epochInfo.slotsInEpoch) * 100,
        blockHeight: epochInfo.absoluteSlot,
        activeValidators: validators.current.length + validators.delinquent.length,
        tps: perfSamples[0] ? Math.round(perfSamples[0].numTransactions / perfSamples[0].samplePeriodSecs) : 0,
        successRate: 100,
        lastUpdate: Date.now()
      };
    } catch (error) {
      console.error('Error fetching initial network stats:', error);
      return null;
    }
  }
  return networkStatsCache;
}

// Fetch recent blocks
export async function getRecentBlocks(limit: number = 10): Promise<BlockResponse[]> {
  try {
    const connection = await getConnection();
    const slot = await connection.getSlot();
    const blocks = await Promise.all(
      Array.from({ length: limit }, (_, i) => 
        connection.getBlock(slot - i, {
          maxSupportedTransactionVersion: 0
        })
      )
    );
    return blocks.filter((block): block is BlockResponse => block !== null);
  } catch (error) {
    console.error('Error fetching recent blocks:', error);
    return [];
  }
}

// Fetch top programs by transaction count
export async function getTopPrograms(limit: number = 10): Promise<{ address: string; txCount: number }[]> {
  try {
    const connection = await getConnection();
    const slot = await connection.getSlot();
    const blocks = await Promise.all(
      Array.from({ length: 100 }, (_, i) => 
        connection.getBlock(slot - i)
      )
    );

    const programCounts = new Map<string, number>();
    
    blocks.forEach(block => {
      if (!block) return;
      block.transactions.forEach(tx => {
        if (!tx.meta?.logMessages) return;
        const programIds = new Set(
          tx.meta.logMessages
            .filter(log => log.includes('Program ') && log.includes(' invoke [1]'))
            .map(log => log.split(' ')[1])
            .filter((id): id is string => typeof id === 'string') // Type guard for string
        );
        programIds.forEach(programId => {
          programCounts.set(programId, (programCounts.get(programId) || 0) + 1);
        });
      });
    });

    return Array.from(programCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([address, txCount]) => ({ address, txCount }));
  } catch (error) {
    console.error('Error fetching top programs:', error);
    return [];
  }
}

// Fetch trending tokens
export async function getTrendingTokens(limit: number = 10): Promise<{
  address: string;
  volume24h: number;
  price: number;
  change24h: number;
}[]> {
  try {
    // Get all token accounts with high activity
    const filters: GetProgramAccountsFilter[] = [
      {
        dataSize: 165, // Size of token account data
      },
      {
        memcmp: {
          offset: 32, // Offset of mint address in token account data
          bytes: TOKEN_PROGRAM_ID.toBase58(),
        },
      },
    ];

    const accounts = await connection.getProgramAccounts(TOKEN_PROGRAM_ID, { filters });
    
    // Sort by account data size as a proxy for activity
    const sortedAccounts = [...accounts]
      .sort((a, b) => b.account.data.length - a.account.data.length)
      .slice(0, limit);

    // For each token, get additional metrics
    const tokenData = await Promise.all(
      sortedAccounts.map(async (account) => {
        // In a real implementation, you would fetch price and volume data from a DEX or price oracle
        // For now, we'll return placeholder data
        return {
          address: account.pubkey.toBase58(),
          volume24h: Math.random() * 1000000,
          price: Math.random() * 100,
          change24h: (Math.random() - 0.5) * 20,
        };
      })
    );

    return tokenData;
  } catch (error) {
    console.error('Error fetching trending tokens:', error);
    return [];
  }
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

// Cache for account info
interface AccountCacheEntry {
  data: {
    address: string;
    lamports: number;
    owner: string;
    executable: boolean;
    rentEpoch: number;
    data: any;
  };
  timestamp: number;
  subscription?: number;
}

const accountInfoCache = new Map<string, AccountCacheEntry>();
const ACCOUNT_CACHE_EXPIRY = 30 * 1000;

// Get account info with caching and WebSocket subscription
export async function getAccountInfo(
  address: string,
  onUpdate?: (accountInfo: any) => void
) {
  return (await getMultipleAccounts([address])).get(address) || null;
}

// Batch fetch account info for multiple addresses
export async function getMultipleAccounts(addresses: string[]) {
  try {
    const connection = await getConnection();
    const now = Date.now();
    const result = new Map<string, any>();
    const addressesToFetch: string[] = [];

    // Check cache first
    for (const address of addresses) {
      const cached = accountInfoCache.get(address);
      if (cached && (now - cached.timestamp) < ACCOUNT_CACHE_EXPIRY) {
        result.set(address, cached.data);
      } else {
        addressesToFetch.push(address);
      }
    }

    if (addressesToFetch.length === 0) {
      return result;
    }

    // Fetch uncached accounts in batches of 100
    const BATCH_SIZE = 100;
    const publicKeys = addressesToFetch.map(addr => new PublicKey(addr));
    
    for (let i = 0; i < publicKeys.length; i += BATCH_SIZE) {
      const batch = publicKeys.slice(i, i + BATCH_SIZE);
      const accounts = await connection.getMultipleAccountsInfo(batch, {
        commitment: 'confirmed'
      });
      
      accounts.forEach((account, index) => {
        if (!account) return;

        const address = addressesToFetch[i + index];
        const accountData = {
          address,
          lamports: account.lamports,
          owner: account.owner.toBase58(),
          executable: account.executable,
          rentEpoch: account.rentEpoch,
          data: Buffer.isBuffer(account.data) ? account.data : Buffer.from(account.data, 'base64')
        };

        // Cache the result
        accountInfoCache.set(address, {
          data: accountData,
          timestamp: now
        });

        result.set(address, accountData);
      });
    }

    return result;
  } catch (error) {
    console.error('Error batch fetching accounts:', error);
    return new Map();
  }
}

// Cleanup function to remove account subscriptions
export async function unsubscribeFromAccount(address: string) {
  const cached = accountInfoCache.get(address);
  if (cached?.subscription) {
    const connection = await getConnection();
    connection.removeAccountChangeListener(cached.subscription);
    const { subscription, ...rest } = cached;
    accountInfoCache.set(address, rest);
  }
}

// Get transaction history
export interface TransactionHistoryOptions {
  limit?: number;
  before?: string;
  until?: string;
  type?: 'all' | 'sol' | 'token' | 'nft';
  sortBy?: 'time' | 'slot';
}

export interface TransactionInfo {
  signature: string;
  slot: number;
  blockTime: number;
  status: 'success' | 'error';
  fee: number;
  value: number;
  from: string;
  instructions: Array<{
    program: string;
    data: string;
  }>;
  programs: string[];
}

// Cache for transaction data
const transactionCache = new Map<string, {
  data: DetailedTransactionInfo;
  timestamp: number;
}>();

const TX_CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

// Track active subscriptions to avoid duplicates
const activeSubscriptions = new Map<string, number>();

export async function getTransactionHistory(
  address: string, 
  options: TransactionHistoryOptions = {},
  onUpdate?: (transaction: DetailedTransactionInfo) => void
): Promise<DetailedTransactionInfo[]> {
  try {
    const connection = await getConnection();
    const publicKey = new PublicKey(address);
    const { limit = 50, before, until, type = 'all' } = options;
    const now = Date.now();

    // Get initial transactions in a single call with a larger limit
    const signatures = await connection.getSignaturesForAddress(
      publicKey,
      { 
        limit,
        before: before ? before : undefined,
        until: until ? until : undefined,
      }
    );

    // Process all signatures in a single batch
    const transactions = await getMultipleTransactionDetails(
      signatures.map(sig => sig.signature)
    );

    // Set up WebSocket subscription for new transactions if callback provided
    if (onUpdate && !activeSubscriptions.has(address)) {
      const subId = connection.onLogs(
        publicKey,
        async (logs) => {
          // Only process if signature exists and we have a callback
          if (!logs.signature || !onUpdate) return;

          try {
            // Check if we already have this transaction
            if (transactionCache.has(logs.signature)) return;

            // Fetch and process the new transaction
            const txInfo = (await getMultipleTransactionDetails([logs.signature]))[0];
            if (!txInfo) return;

            // Cache and notify
            transactionCache.set(logs.signature, {
              data: txInfo,
              timestamp: Date.now()
            });

            onUpdate(txInfo);
          } catch (err) {
            console.error('Error processing new transaction:', err);
          }
        },
        'confirmed'
      );

      activeSubscriptions.set(address, subId);
    }

    return transactions.filter((tx): tx is DetailedTransactionInfo => tx !== null);
  } catch (error) {
    console.error('Error fetching transaction history:', error);
    return [];
  }
}

// Cleanup function to remove subscriptions
export async function unsubscribeFromTransactions(address: string) {
  const subId = activeSubscriptions.get(address);
  if (subId !== undefined) {
    const connection = await getConnection();
    connection.removeOnLogsListener(subId);
    activeSubscriptions.delete(address);
  }
}

async function getTokenSymbol(mint: string): Promise<string | undefined> {
  try {
    const accounts = await getMultipleAccounts([mint]);
    const tokenInfo = accounts.get(mint);
    if (tokenInfo?.data && 'parsed' in tokenInfo.data) {
      return tokenInfo.data.parsed.info.symbol;
    }
  } catch (error) {
    console.error('Error fetching token symbol:', error);
  }
  return undefined;
}

// Get transaction details
export interface DetailedTransactionInfo {
  signature: string;
  slot: number;
  blockTime: number | null;
  status: 'success' | 'error';
  fee: number;
  from: string;
  to: string;
  value: number;
  type: string;
  computeUnits: number;
  accounts: string[];
  programs: string[];
  instructions: {
    programId: string;
    data: string;
  }[];
  logs: string[];
}

export async function getTransactionDetails(signature: string): Promise<DetailedTransactionInfo | null> {
  const results = await getMultipleTransactionDetails([signature]);
  return results[0] || null;
}

export async function getMultipleTransactionDetails(signatures: string[]): Promise<(DetailedTransactionInfo | null)[]> {
  try {
    const connection = await getConnection();
    const now = Date.now();
    const result: (DetailedTransactionInfo | null)[] = [];
    const sigsToFetch: string[] = [];

    // Check cache first
    signatures.forEach(sig => {
      const cached = transactionCache.get(sig);
      if (cached && (now - cached.timestamp) < TX_CACHE_EXPIRY) {
        result.push(cached.data);
      } else {
        sigsToFetch.push(sig);
        result.push(null);
      }
    });

    if (sigsToFetch.length === 0) {
      return result;
    }

    // Fetch transactions in batches
    const BATCH_SIZE = 100;
    for (let i = 0; i < sigsToFetch.length; i += BATCH_SIZE) {
      const batch = sigsToFetch.slice(i, i + BATCH_SIZE);
      const txs = await connection.getParsedTransactions(batch, {
        maxSupportedTransactionVersion: 0,
      });

      txs.forEach((tx, index) => {
        if (!tx) return;

        const signature = batch[index];
        const resultIndex = signatures.indexOf(signature);

        // Extract transaction data with proper type safety
        const accountKeys = tx.transaction.message.accountKeys;
        let fromAddress = accountKeys[0].pubkey.toBase58();
        let toAddress = fromAddress;
        let value = 0;
        let type = 'Unknown';
        const programs = new Set<string>();

        if (tx.meta && tx.transaction.message.instructions.length > 0) {
          // Process token balances
          tx.meta.postTokenBalances?.forEach((postBalance: any, index: number) => {
            const preBalance = tx.meta?.preTokenBalances?.[index];
            if (preBalance && postBalance.uiTokenAmount && preBalance.uiTokenAmount) {
              const postAmount = Number(postBalance.uiTokenAmount.uiAmount || 0);
              const preAmount = Number(preBalance.uiTokenAmount.uiAmount || 0);
              if (postAmount !== preAmount) {
                value += Math.abs(postAmount - preAmount);
              }
            }
          });

          // Check for SOL transfers if no token transfers found
          if (value === 0 && tx.meta.preBalances && tx.meta.postBalances) {
            for (let i = 0; i < tx.meta.preBalances.length; i++) {
              const diff = (tx.meta.postBalances[i] - tx.meta.preBalances[i]) / 1e9;
              if (diff < 0 && Math.abs(diff) > (tx.meta.fee || 0) / 1e9) {
                value = Math.abs(diff);
                break;
              }
            }
          }

          // Get all unique programs used
          tx.transaction.message.instructions.forEach((ix: any) => {
            if ('program' in ix && typeof ix.program === 'string') {
              programs.add(ix.program);
            } else if ('programId' in ix) {
              programs.add(ix.programId.toString());
            }
          });

          // Determine transaction type from first instruction
          const instruction = tx.transaction.message.instructions[0];
          if ('program' in instruction && 'parsed' in instruction) {
            if (instruction.program === 'system') {
              type = 'System Transfer';
              if (instruction.parsed.type === 'transfer' && 'info' in instruction.parsed) {
                const info = instruction.parsed.info as { source: string; destination: string };
                fromAddress = info.source;
                toAddress = info.destination;
              }
            } else if (instruction.program === 'spl-token') {
              type = 'Token Transfer';
            }
          } else if ('programId' in instruction) {
            const programId = instruction.programId.toString();
            if (programId === SystemProgram.programId.toString()) {
              type = 'System Transfer';
            } else if (programId === TOKEN_PROGRAM_ID.toString()) {
              type = 'Token Transfer';
            }
          }
        }

        const txInfo: DetailedTransactionInfo = {
          signature,
          slot: tx.slot,
          blockTime: tx.blockTime,
          status: tx.meta?.err ? 'error' : 'success',
          fee: (tx.meta?.fee || 0) / 1e9,
          from: fromAddress,
          to: toAddress,
          value,
          type,
          computeUnits: tx.meta?.computeUnitsConsumed || 0,
          accounts: accountKeys.map(key => key.pubkey.toBase58()),
          programs: Array.from(programs),
          instructions: tx.transaction.message.instructions.map((ix: any) => ({
            programId: 'program' in ix ? ix.program : ix.programId.toString(),
            data: 'data' in ix ? ix.data : '',
          })),
          logs: tx.meta?.logMessages || [],
        };

        // Cache the result
        transactionCache.set(signature, {
          data: txInfo,
          timestamp: now
        });

        result[resultIndex] = txInfo;
      });
    }

    return result;
  } catch (error) {
    console.error('Error fetching transaction details:', error);
    return signatures.map(() => null);
  }
}

// Get token info
export async function getTokenInfo(mintAddress: string) {
  try {
    const connection = await getConnection();
    const mintPublicKey = new PublicKey(mintAddress);
    const [mint, tokenAccounts, priceData] = await Promise.all([
      getMint(connection, mintPublicKey),
      connection.getProgramAccounts(TOKEN_PROGRAM_ID, {
        filters: [
          {
            memcmp: {
              offset: 0,
              bytes: mintPublicKey.toBase58(),
            },
          },
        ],
      }),
      getTokenPrice(mintAddress),
    ]);

    // Calculate total supply and holders
    let totalSupply = 0n;
    const holders = new Set<string>();

    // Get all token accounts in a single batch request
    const accountKeys = tokenAccounts.map(({ pubkey }) => pubkey);
    const accounts = await connection.getMultipleAccountsInfo(accountKeys);

    accounts.forEach((account) => {
      if (account) {
        try {
          const amount = account.data.slice(64, 72).readBigUInt64LE(0);
          const owner = new PublicKey(account.data.slice(32, 64));
          totalSupply += amount;
          if (amount > 0n) {
            holders.add(owner.toBase58());
          }
        } catch (e) {
          console.error('Error parsing token account:', e);
        }
      }
    });

    const supply = Number(totalSupply) / Math.pow(10, mint.decimals);

    return {
      decimals: mint.decimals,
      supply,
      holders: holders.size,
      metadata: null, // You can add metadata fetching if needed
      price: priceData.priceUsd,
      priceChange24h: priceData.priceChange24h,
      volume24h: priceData.volume24h,
      marketCap: priceData.priceUsd ? priceData.priceUsd * supply : null,
    };
  } catch (error) {
    console.error('Error fetching token info:', error);
    return null;
  }
}

// Get block details
export interface BlockDetails {
  slot: number;
  timestamp: number | null;
  blockhash: string;
  parentSlot: number;
  transactions: number;
  previousBlockhash: string;
}

export async function getBlockDetails(slot: number): Promise<BlockDetails | null> {
  try {
    const connection = await getConnection();
    const block = await connection.getBlock(slot, {
      maxSupportedTransactionVersion: 0
    });

    if (!block) {
      return null;
    }

    return {
      slot,
      timestamp: block.blockTime,
      blockhash: block.blockhash,
      parentSlot: block.parentSlot,
      transactions: block.transactions.length,
      previousBlockhash: block.previousBlockhash,
    };
  } catch (error) {
    console.error('Error fetching block details:', error);
    return null;
  }
}

export interface TokenAccountInfo {
  mint: string;
  symbol: string;
  decimals: number;
  uiAmount: number;
  icon?: string;
  owner: string;
  address: string;  // Token account address
  usdValue: number; // Added USD value field
}

export interface AccountData {
  address: string;
  lamports: number;
  owner: string;
  executable: boolean;
  rentEpoch: number;
  tokenAccounts: TokenAccountInfo[];
  isSystemProgram: boolean;
}

// Cache for token metadata
const tokenMetadataCache = new Map<string, {
  symbol: string;
  decimals: number;
  timestamp: number;
}>();

const TOKEN_METADATA_EXPIRY = 5 * 60 * 1000; // 5 minutes

// Add new cache for batch token prices
const BATCH_TOKEN_PRICE_CACHE = new Map<string, {
  data: {
    priceUsd: number | null;
    priceChange24h: number | null;
    volume24h: number | null;
  };
  timestamp: number;
}>();

const BATCH_SIZE = 100; // Maximum batch size for RPC requests
const CACHE_DURATION = 30 * 1000; // 30 seconds cache

export async function getTokenAccounts(address: string): Promise<AccountData> {
  try {
    const connection = await getConnection();
    const publicKey = new PublicKey(address);
    const now = Date.now();
    
    // Get token accounts first to collect all needed addresses
    const tokenAccounts = await connection.getTokenAccountsByOwner(publicKey, {
      programId: TOKEN_PROGRAM_ID
    });

    // Collect all addresses we need to fetch
    const addressesToFetch = new Set<string>([address]); // Start with the main account
    const tokenDataMap = new Map<string, { amount: bigint, pubkey: PublicKey }>();
    const metadataAddresses = new Map<string, string>(); // mint -> metadata address

    // Process token accounts to collect mint addresses
    for (const { account, pubkey } of tokenAccounts.value) {
      const data = Buffer.isBuffer(account.data) ? account.data : Buffer.from(account.data, 'base64');
      if (!data) continue;
      
      try {
        const amount = data.slice(64, 72).readBigUInt64LE(0);
        if (amount === 0n) continue; // Skip zero balances early
        
        const mintAddress = new PublicKey(data.slice(0, 32)).toBase58();
        addressesToFetch.add(mintAddress); // Add mint address
        tokenDataMap.set(mintAddress, { amount, pubkey });

        // Get and add metadata address
        const metadataAddress = (await getMetadataAddress(new PublicKey(mintAddress))).toBase58();
        addressesToFetch.add(metadataAddress);
        metadataAddresses.set(mintAddress, metadataAddress);
      } catch (err) {
        console.error('Error parsing token data:', err);
      }
    }

    // Fetch all accounts in a single batch call
    const accounts = await getMultipleAccounts(Array.from(addressesToFetch));
    
    // Get main account info
    const accountInfo = accounts.get(address);
    if (!accountInfo) {
      throw new Error('Account not found');
    }

    // Early return if no token accounts
    if (tokenAccounts.value.length === 0) {
      return {
        address,
        lamports: accountInfo.lamports,
        owner: accountInfo.owner,
        executable: accountInfo.executable,
        rentEpoch: accountInfo.rentEpoch,
        tokenAccounts: [],
        isSystemProgram: accountInfo.owner === SystemProgram.programId.toBase58()
      };
    }

    // Process mint accounts and their metadata
    const mintAddressesArray = Array.from(tokenDataMap.keys());
    const mintInfoResults: [string, MintInfo | null][] = [];
    
    for (const mintAddress of mintAddressesArray) {
      const cached = tokenMetadataCache.get(mintAddress);
      if (cached && (now - cached.timestamp) < CACHE_DURATION) {
        mintInfoResults.push([mintAddress, { 
          decimals: cached.decimals,
          symbol: cached.symbol
        }]);
        continue;
      }

      const mintAccountInfo = accounts.get(mintAddress);
      const metadataAccountInfo = accounts.get(metadataAddresses.get(mintAddress)!);
      
      // Parse mint data
      const mintData = Buffer.isBuffer(mintAccountInfo?.data) ? 
        mintAccountInfo?.data : 
        mintAccountInfo?.data ? Buffer.from(mintAccountInfo.data, 'base64') : null;

      if (!mintData) {
        mintInfoResults.push([mintAddress, null]);
        continue;
      }

      // First byte is version, next byte is initialized
      const decimals = mintData[44]; // Decimals is at offset 44 in mint account data
      let mintInfo: MintInfo;

      if (metadataAccountInfo?.data) {
        try {
          const metadata = decodeMetadata(
            Buffer.isBuffer(metadataAccountInfo.data) ? 
              metadataAccountInfo.data : 
              Buffer.from(metadataAccountInfo.data, 'base64')
          );
          mintInfo = {
            symbol: metadata.data.symbol || undefined,
            name: metadata.data.name || undefined,
            decimals
          };
        } catch (error) {
          console.error('Error decoding metadata:', error);
          mintInfo = { 
            decimals,
            name: `SPL Token (${mintAddress.slice(0, 4)}...${mintAddress.slice(-4)})`
          };
        }
      } else {
        mintInfo = { 
          decimals,
          name: `SPL Token (${mintAddress.slice(0, 4)}...${mintAddress.slice(-4)})`
        };
      }

      // Cache the result
      tokenMetadataCache.set(mintAddress, {
        symbol: mintInfo.symbol || 'Unknown',
        decimals: mintInfo.decimals,
        timestamp: now
      });

      mintInfoResults.push([mintAddress, mintInfo]);
    }

    // Batch fetch prices
    const pricePromises: Promise<[string, {
      priceUsd: number | null;
      priceChange24h: number | null;
      volume24h: number | null;
    }]>[] = [];

    for (let i = 0; i < mintAddressesArray.length; i += BATCH_SIZE) {
      const batch = mintAddressesArray.slice(i, i + BATCH_SIZE);
      const batchPromises = batch.map(async mintAddress => {
        const cached = BATCH_TOKEN_PRICE_CACHE.get(mintAddress);
        if (cached && (now - cached.timestamp) < CACHE_DURATION) {
          return [mintAddress, cached.data] as [string, typeof cached.data];
        }
        const price = await getTokenPrice(mintAddress);
        BATCH_TOKEN_PRICE_CACHE.set(mintAddress, {
          data: price,
          timestamp: now
        });
        return [mintAddress, price] as [string, typeof price];
      });
      pricePromises.push(...batchPromises);
    }

    // Wait for price data
    const priceResults = await Promise.all(pricePromises);

    // Create lookup maps for fast access
    const mintInfoMap = new Map(mintInfoResults);
    const priceMap = new Map(priceResults);

    // Process token accounts with all data available
    const accountsWithMetadata = mintAddressesArray
      .map(mintAddress => {
        const tokenData = tokenDataMap.get(mintAddress);
        const mintInfo = mintInfoMap.get(mintAddress);
        const priceData = priceMap.get(mintAddress);
        
        if (!tokenData || !mintInfo) return null;
        
        const uiAmount = Number(tokenData.amount) / Math.pow(10, mintInfo.decimals);
        
        return {
          mint: mintAddress,
          symbol: mintInfo.symbol || 'Unknown',
          decimals: mintInfo.decimals,
          uiAmount,
          owner: publicKey.toBase58(),
          address: tokenData.pubkey.toBase58(),
          usdValue: priceData?.priceUsd ? priceData.priceUsd * uiAmount : 0
        };
      })
      .filter((account): account is TokenAccountInfo => account !== null)
      .sort((a, b) => (b.usdValue || 0) - (a.usdValue || 0));

    return {
      address,
      lamports: accountInfo.lamports,
      owner: accountInfo.owner,
      executable: accountInfo.executable,
      rentEpoch: accountInfo.rentEpoch,
      tokenAccounts: accountsWithMetadata,
      isSystemProgram: accountInfo.owner === SystemProgram.programId.toBase58()
    };
  } catch (error) {
    console.error('Error fetching token accounts:', error);
    throw error;
  }
}

interface MintInfo {
  symbol?: string;
  name?: string;
  decimals: number;
}

// Add type for token metadata
interface TokenMetadata {
  symbol: string;
  decimals: number;
  name?: string;
}

// Add type for token price data
interface TokenPriceData {
  priceUsd: number | null;
  priceChange24h: number | null;
  volume24h: number | null;
}

// Update the functions with proper type annotations
async function getMintInfo(mintAddress: string): Promise<TokenMetadata | null> {
  try {
    const connection = await getConnection();
    const mintPublicKey = new PublicKey(mintAddress);
    const metadataAddress = await getMetadataAddress(mintPublicKey);
    
    // Fetch both mint and metadata accounts in one batch
    const accounts = await getMultipleAccounts([mintAddress, metadataAddress.toBase58()]);
    const mintAccountInfo = accounts.get(mintAddress);
    const metadataAccountInfo = accounts.get(metadataAddress.toBase58());

    if (!mintAccountInfo?.data) {
      return null;
    }

    // Ensure data is a Buffer
    const mintData = Buffer.isBuffer(mintAccountInfo.data) ? 
      mintAccountInfo.data : 
      Buffer.from(mintAccountInfo.data as any, 'base64');

    const decimals = mintData[44]; // Decimals is at offset 44 in mint account data

    // Try to get metadata if it exists
    if (metadataAccountInfo?.data) {
      try {
        const metadata = decodeMetadata(
          Buffer.isBuffer(metadataAccountInfo.data) ? 
            metadataAccountInfo.data : 
            Buffer.from(metadataAccountInfo.data as any, 'base64')
        );
        return {
          symbol: metadata.data.symbol || 'Unknown',
          name: metadata.data.name,
          decimals
        };
      } catch (error) {
        console.error('Error decoding metadata:', error);
      }
    }

    // Return basic info if metadata is not available
    return { 
      symbol: `Token-${mintAddress.slice(0, 4)}`,
      decimals,
      name: `SPL Token (${mintAddress.slice(0, 4)}...${mintAddress.slice(-4)})`
    };
  } catch (error) {
    console.error('Error fetching mint info:', error);
    return null;
  }
}

async function getMetadataAddress(mint: PublicKey): Promise<PublicKey> {
  const METADATA_PROGRAM_ID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');
  
  const [address] = await PublicKey.findProgramAddress(
    [
      Buffer.from('metadata'),
      METADATA_PROGRAM_ID.toBuffer(),
      mint.toBuffer(),
    ],
    METADATA_PROGRAM_ID
  );
  
  return address;
}

interface MetadataData {
  name: string;
  symbol: string;
  uri: string;
  sellerFeeBasisPoints: number;
  creators: Array<{
    address: string;
    verified: boolean;
    share: number;
  }> | null;
}

interface Metadata {
  key: number;
  updateAuthority: string;
  mint: string;
  data: MetadataData;
  primarySaleHappened: boolean;
  isMutable: boolean;
  editionNonce: number | null;
}

function decodeMetadata(buffer: Buffer): Metadata {
  try {
    // Check if buffer is long enough for basic metadata
    if (buffer.length < 1) {
      throw new Error('Buffer too short for metadata');
    }

    const metadata: any = {
      key: buffer[0],
      updateAuthority: '',
      mint: '',
      data: {
        name: '',
        symbol: '',
        uri: '',
        sellerFeeBasisPoints: 0,
        creators: null
      },
      primarySaleHappened: false,
      isMutable: true,
      editionNonce: null
    };

    let offset = 1;

    // Read update authority - 32 bytes
    if (buffer.length >= offset + 32) {
      metadata.updateAuthority = buffer.slice(offset, offset + 32).toString('hex');
      offset += 32;
    }

    // Read mint address - 32 bytes
    if (buffer.length >= offset + 32) {
      metadata.mint = buffer.slice(offset, offset + 32).toString('hex');
      offset += 32;
    }

    // Read name
    if (buffer.length >= offset + 4) {
      const nameLength = buffer.readUInt32LE(offset);
      offset += 4;
      
      if (buffer.length >= offset + nameLength) {
        metadata.data.name = buffer.slice(offset, offset + nameLength).toString('utf8').replace(/\0/g, '');
        offset += nameLength;
      }
    }

    // Read symbol
    if (buffer.length >= offset + 4) {
      const symbolLength = buffer.readUInt32LE(offset);
      offset += 4;
      
      if (buffer.length >= offset + symbolLength) {
        metadata.data.symbol = buffer.slice(offset, offset + symbolLength).toString('utf8').replace(/\0/g, '');
        offset += symbolLength;
      }
    }

    // Read uri
    if (buffer.length >= offset + 4) {
      const uriLength = buffer.readUInt32LE(offset);
      offset += 4;
      
      if (buffer.length >= offset + uriLength) {
        metadata.data.uri = buffer.slice(offset, offset + uriLength).toString('utf8').replace(/\0/g, '');
        offset += uriLength;
      }
    }

    return metadata as Metadata;
  } catch (error) {
    console.error('Error decoding metadata:', error);
    // Return a default metadata object if decoding fails
    return {
      key: 0,
      updateAuthority: '',
      mint: '',
      data: {
        name: 'Unknown Token',
        symbol: 'UNKNOWN',
        uri: '',
        sellerFeeBasisPoints: 0,
        creators: null
      },
      primarySaleHappened: false,
      isMutable: true,
      editionNonce: null
    };
  }
}

// Update getTokenPrice with proper type annotations
export async function getTokenPrice(tokenAddress: string): Promise<TokenPriceData> {
  try {
    const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`);
    const data = await response.json() as any;

    if (data.pairs && Array.isArray(data.pairs) && data.pairs.length > 0) {
      // Get the most liquid pair
      const mostLiquidPair = data.pairs.reduce((prev: any, current: any) => {
        return (prev.liquidity?.usd || 0) > (current.liquidity?.usd || 0) ? prev : current;
      });

      return {
        priceUsd: mostLiquidPair.priceUsd ? parseFloat(mostLiquidPair.priceUsd) : null,
        priceChange24h: mostLiquidPair.priceChange?.h24 ? parseFloat(mostLiquidPair.priceChange.h24) : null,
        volume24h: mostLiquidPair.volume?.h24 || null,
      };
    }

    return {
      priceUsd: null,
      priceChange24h: null,
      volume24h: null,
    };
  } catch (error) {
    console.error('Error fetching token price:', error);
    return {
      priceUsd: null,
      priceChange24h: null,
      volume24h: null,
    };
  }
}

// Export the connection getter for direct access
export const connection = {
  get current() {
    if (!cachedConnection) {
      throw new Error('Connection not initialized. Call getConnection() first.');
    }
    return cachedConnection;
  }
}; 