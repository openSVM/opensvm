import { Connection, PublicKey, clusterApiUrl, ParsedTransactionWithMeta, BlockResponse, GetProgramAccountsFilter, SystemProgram } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, getMint } from '@solana/spl-token';

// Initialize connection to Chainstack RPC
export const connection = new Connection('https://solana-mainnet.core.chainstack.com/263c9f53f4e4cdb897c0edc4a64cd007', {
  commitment: 'confirmed',
  wsEndpoint: 'wss://solana-mainnet.core.chainstack.com/263c9f53f4e4cdb897c0edc4a64cd007',
});

// Fetch recent blocks
export async function getRecentBlocks(limit: number = 10): Promise<BlockResponse[]> {
  try {
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

// Fetch network stats
export async function getNetworkStats() {
  try {
    const [slot, blockTime, supply, epochInfo] = await Promise.all([
      connection.getSlot(),
      connection.getBlockTime(await connection.getSlot()),
      connection.getSupply(),
      connection.getEpochInfo(),
    ]);

    return {
      currentSlot: slot,
      blockTime,
      totalSupply: supply.value.total,
      epochProgress: (epochInfo.slotIndex / epochInfo.slotsInEpoch) * 100,
      currentEpoch: epochInfo.epoch,
    };
  } catch (error) {
    console.error('Error fetching network stats:', error);
    return null;
  }
}

// Get RPC latency
export async function getRPCLatency(): Promise<number> {
  const start = performance.now();
  try {
    await connection.getLatestBlockhash();
    return Math.round(performance.now() - start);
  } catch (error) {
    console.error('Error measuring RPC latency:', error);
    return 0;
  }
}

// Get account info
export async function getAccountInfo(address: string) {
  try {
    const publicKey = new PublicKey(address);
    const accountInfo = await connection.getParsedAccountInfo(publicKey, {
      commitment: 'finalized'
    });
    
    if (!accountInfo.value) {
      return null;
    }

    return {
      address,
      lamports: accountInfo.value.lamports,
      owner: accountInfo.value.owner.toBase58(),
      executable: accountInfo.value.executable,
      rentEpoch: accountInfo.value.rentEpoch,
      data: accountInfo.value.data
    };
  } catch (error) {
    console.error('Error fetching account info:', error);
    return null;
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

export async function getTransactionHistory(
  address: string, 
  options: TransactionHistoryOptions = {}
): Promise<TransactionInfo[]> {
  try {
    const publicKey = new PublicKey(address);
    const { limit = 10, before, until, type = 'all' } = options;

    const signatures = await connection.getSignaturesForAddress(
      publicKey,
      { 
        limit,
        before: before ? before : undefined, // Keep as string since that's what the API expects
        until: until ? until : undefined,
      }
    );

    const transactions = await Promise.all(
      signatures.map(async (sig) => {
        try {
          const tx = await connection.getParsedTransaction(sig.signature, {
            maxSupportedTransactionVersion: 0,
          });

          if (!tx || !tx.meta) return null;

          const blockTime = tx.blockTime || 0;
          const slot = tx.slot;
          const fee = tx.meta.fee / 1e9;
          const status = tx.meta.err ? 'error' : 'success';

          // Get the first signer as the 'from' address
          const from = tx.transaction.message.accountKeys.find(key => key.signer)?.pubkey.toBase58() || '';

          // Initialize transaction info
          const txInfo: TransactionInfo = {
            signature: sig.signature,
            slot,
            blockTime,
            status,
            fee,
            value: 0,
            from,
            instructions: [],
            programs: []
          };

          // Process instructions
          if (tx.transaction.message.instructions) {
            tx.transaction.message.instructions.forEach((inst: any) => {
              if (!inst) return;

              let programId = '';
              if ('programId' in inst) {
                programId = inst.programId.toBase58();
              } else if ('program' in inst) {
                programId = inst.program;
              }

              if (!programId) return;

              // Add program to the list if not already included
              if (!txInfo.programs.includes(programId)) {
                txInfo.programs.push(programId);
              }

              // Add instruction info
              txInfo.instructions.push({
                program: programId,
                data: inst.data || ''
              });

              // Handle SOL transfers
              if (inst.program === 'system' && inst.parsed?.type === 'transfer') {
                txInfo.value = (inst.parsed.info.lamports || 0) / 1e9;
              }
            });
          }

          return txInfo;
        } catch (err) {
          console.error(`Error processing transaction ${sig.signature}:`, err);
          return null;
        }
      })
    );

    return transactions.filter((tx): tx is TransactionInfo => tx !== null);
  } catch (error) {
    console.error('Error fetching transaction history:', error);
    return [];
  }
}

async function getTokenSymbol(mint: string): Promise<string | undefined> {
  try {
    const tokenInfo = await connection.getParsedAccountInfo(new PublicKey(mint));
    if (tokenInfo.value?.data && 'parsed' in tokenInfo.value.data) {
      return tokenInfo.value.data.parsed.info.symbol;
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
  amount: number;
  type: string;
  computeUnits: number;
  accounts: string[];
  instructions: {
    programId: string;
    data: string;
  }[];
  logs: string[];
}

export async function getTransactionDetails(signature: string): Promise<DetailedTransactionInfo | null> {
  try {
    const tx = await connection.getParsedTransaction(signature, {
      maxSupportedTransactionVersion: 0,
    });

    if (!tx) {
      return null;
    }

    // Extract from and to addresses from the first transfer instruction
    const accountKeys = tx.transaction.message.accountKeys;
    let from = accountKeys[0].pubkey.toBase58();
    let to = from;
    let amount = 0;
    let type = 'Unknown';

    // Try to determine transaction type and extract transfer details
    if (tx.meta && tx.transaction.message.instructions.length > 0) {
      const instruction = tx.transaction.message.instructions[0];
      
      if ('program' in instruction) {
        if (instruction.program === 'system') {
          type = 'System Transfer';
          if (instruction.parsed.type === 'transfer') {
            amount = instruction.parsed.info.lamports / 1e9;
            from = instruction.parsed.info.source;
            to = instruction.parsed.info.destination;
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

    return {
      signature,
      slot: tx.slot,
      blockTime: tx.blockTime,
      status: tx.meta?.err ? 'error' : 'success',
      fee: (tx.meta?.fee || 0) / 1e9,
      from,
      to,
      amount,
      type,
      computeUnits: tx.meta?.computeUnitsConsumed || 0,
      accounts: accountKeys.map(key => key.pubkey.toBase58()),
      instructions: tx.transaction.message.instructions.map(ix => ({
        programId: 'program' in ix ? ix.program : ix.programId.toString(),
        data: 'data' in ix ? ix.data : '',
      })),
      logs: tx.meta?.logMessages || [],
    };
  } catch (error) {
    console.error('Error fetching transaction details:', error);
    return null;
  }
}

// Get token info
export async function getTokenInfo(mintAddress: string) {
  try {
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
    const block = await connection.getBlock(slot);

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

export async function getTokenAccounts(address: string): Promise<TokenAccountInfo[]> {
  try {
    const publicKey = new PublicKey(address);
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(publicKey, {
      programId: TOKEN_PROGRAM_ID,
    });

    const accountsWithMetadata = await Promise.all(
      tokenAccounts.value.map(async (account) => {
        const parsedInfo = account.account.data.parsed.info;
        const mintInfo = await getMintInfo(parsedInfo.mint);
        const uiAmount = parsedInfo.tokenAmount.uiAmount || 0;
        const priceData = await getTokenPrice(parsedInfo.mint);

        const result: TokenAccountInfo = {
          mint: parsedInfo.mint,
          symbol: mintInfo?.symbol || '',
          decimals: parsedInfo.tokenAmount.decimals,
          uiAmount,
          owner: parsedInfo.owner,
          address: account.pubkey.toBase58(),
          usdValue: priceData.priceUsd ? priceData.priceUsd * uiAmount : 0
        };

        return result;
      })
    );

    // Filter out accounts with 0 balance and sort by USD value
    return accountsWithMetadata
      .filter(account => account.uiAmount > 0)
      .sort((a, b) => (b.usdValue || 0) - (a.usdValue || 0));
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

async function getMintInfo(mintAddress: string): Promise<MintInfo | null> {
  try {
    const mintPublicKey = new PublicKey(mintAddress);
    const mintAccountInfo = await connection.getParsedAccountInfo(mintPublicKey);

    if (!mintAccountInfo.value?.data || !('parsed' in mintAccountInfo.value.data)) {
      return null;
    }

    const { decimals } = mintAccountInfo.value.data.parsed.info;

    // Try to get metadata if it exists
    try {
      const metadataAddress = await getMetadataAddress(mintPublicKey);
      const metadataAccountInfo = await connection.getAccountInfo(metadataAddress);
      
      if (metadataAccountInfo && metadataAccountInfo.data) {
        const metadata = decodeMetadata(metadataAccountInfo.data);
        return {
          symbol: metadata.data.symbol || undefined,
          name: metadata.data.name || undefined,
          decimals
        };
      }
    } catch (error) {
      console.error('Error fetching metadata:', error);
      // Continue without metadata
    }

    // Return basic info if metadata is not available
    return { 
      decimals,
      symbol: `SPL Token`,
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

// Fetch token price from DexScreener
export async function getTokenPrice(tokenAddress: string): Promise<{
  priceUsd: number | null;
  priceChange24h: number | null;
  volume24h: number | null;
}> {
  try {
    const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`);
    const data = await response.json();

    if (data.pairs && data.pairs.length > 0) {
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