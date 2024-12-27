import { Connection, PublicKey, clusterApiUrl, ParsedTransactionWithMeta, BlockResponse, GetProgramAccountsFilter, SystemProgram } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, getMint } from '@solana/spl-token';

// Initialize connection to mainnet
export const connection = new Connection(clusterApiUrl('mainnet-beta'), 'confirmed');

// Fetch recent blocks
export async function getRecentBlocks(limit: number = 10): Promise<BlockResponse[]> {
  try {
    const slot = await connection.getSlot();
    const blocks = await Promise.all(
      Array.from({ length: limit }, (_, i) => 
        connection.getBlock(slot - i)
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
    const accountInfo = await connection.getAccountInfo(publicKey);
    
    if (!accountInfo) {
      return null;
    }

    return {
      address,
      lamports: accountInfo.lamports,
      owner: accountInfo.owner.toBase58(),
      executable: accountInfo.executable,
      rentEpoch: accountInfo.rentEpoch,
      data: accountInfo.data,
    };
  } catch (error) {
    console.error('Error fetching account info:', error);
    return null;
  }
}

// Get transaction history
export interface TransactionInfo {
  signature: string;
  slot: number;
  timestamp: number;
  status: 'success' | 'error';
  type: string;
  fee: number;
  signer: string;
  from: string;
  to: string;
  amount: number;
}

export async function getTransactionHistory(address: string, limit = 10): Promise<TransactionInfo[]> {
  try {
    const publicKey = new PublicKey(address);
    const signatures = await connection.getSignaturesForAddress(publicKey, { limit });

    const transactions = await Promise.all(
      signatures.map(async (sig) => {
        const tx = await connection.getParsedTransaction(sig.signature, {
          maxSupportedTransactionVersion: 0,
        });

        if (!tx) return null;

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
          signature: sig.signature,
          slot: sig.slot,
          timestamp: sig.blockTime || 0,
          status: sig.err ? 'error' : 'success',
          type,
          fee: (tx.meta?.fee || 0) / 1e9,
          signer: accountKeys[0].pubkey.toBase58(),
          from,
          to,
          amount,
        };
      })
    );

    return transactions.filter((tx): tx is TransactionInfo => tx !== null);
  } catch (error) {
    console.error('Error fetching transaction history:', error);
    return [];
  }
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
    const [mint, tokenAccounts] = await Promise.all([
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

    return {
      decimals: mint.decimals,
      supply: Number(totalSupply),
      holders: holders.size,
      metadata: null, // You can add metadata fetching if needed
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