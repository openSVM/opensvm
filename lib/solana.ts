import { Connection, PublicKey, ParsedTransactionWithMeta, ParsedInstruction, PartiallyDecodedInstruction, AccountMeta, ParsedMessageAccount } from '@solana/web3.js';
import { getConnection as getProxyConnection } from './solana-connection';
import { buildTransactionGraph, storeGraph, findRelatedTransactions } from './server/qdrant';

export interface AccountData {
  lamports: number;
  owner: string;
  executable: boolean;
  tokenAccounts: TokenAccount[];
  isSystemProgram: boolean;
}

export interface TokenAccount {
  mint: string;
  owner: string;
  amount: number;
  decimals: number;
  uiAmount: number;
  symbol?: string;
  icon?: string;
  usdValue?: number;
  address?: string;
  name?: string;
  txCount?: number;
  volume?: number;
  isLoading?: boolean;
}

export interface BaseTransactionInfo {
  signature: string;
  timestamp: number;
  slot: number;
  success: boolean;
  type: 'sol' | 'token' | 'unknown';
  amount?: number;
  symbol?: string;
  mint?: string;
}

export interface ParsedInstructionWithAccounts extends Omit<ParsedInstruction, 'accounts'> {
  accounts: number[];
  data: string;
}

export interface PartiallyDecodedInstructionWithAccounts extends Omit<PartiallyDecodedInstruction, 'accounts'> {
  accounts: number[];
  data: string;
}

export type InstructionWithAccounts = ParsedInstructionWithAccounts | PartiallyDecodedInstructionWithAccounts;

export interface InnerInstructions {
  index: number;
  instructions: InstructionWithAccounts[];
}

export interface DetailedTransactionInfo extends BaseTransactionInfo {
  details?: {
    instructions: InstructionWithAccounts[];
    accounts: ParsedMessageAccount[];
    preBalances: number[];
    postBalances: number[];
    preTokenBalances?: any[];
    postTokenBalances?: any[];
    logs?: string[];
    innerInstructions?: InnerInstructions[];
    tokenChanges?: {
      mint: string;
      preAmount: number;
      postAmount: number;
      change: number;
    }[];
    solChanges?: {
      accountIndex: number;
      preBalance: number;
      postBalance: number;
      change: number;
    }[];
  };
  relatedTransactions?: any[];
}

export interface TransactionData {
  signature: string;
  timestamp: number;
  slot: number;
  success: boolean;
  details?: {
    accounts: {
      pubkey: { toString: () => string };
      signer: boolean;
      writable: boolean;
    }[];
    instructions: {
      program?: string;
      programId?: { toString: () => string };
      parsed?: any;
    }[];
    tokenChanges?: {
      mint: string;
      preAmount: number;
      postAmount: number;
      change: number;
    }[];
  };
}

const TOKEN_METADATA_PROGRAM_ID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');

async function findMetadataPda(mint: PublicKey): Promise<PublicKey> {
  const [pda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from('metadata'),
      TOKEN_METADATA_PROGRAM_ID.toBuffer(),
      mint.toBuffer(),
    ],
    TOKEN_METADATA_PROGRAM_ID
  );
  return pda;
}

export async function getTokenMetadataFromRPC(mint: string): Promise<{ symbol: string; name: string }> {
  const connection = await getProxyConnection();
  try {
    // First try to get metadata from Token Metadata program
    const metadataPDA = await findMetadataPda(new PublicKey(mint));
    const accountInfo = await connection.getAccountInfo(metadataPDA);
    
    if (accountInfo) {
      // Metadata exists, decode it
      const metadata: any = decodeMetadata(accountInfo.data);
      return {
        symbol: metadata.data.symbol,
        name: metadata.data.name
      };
    }

    // Fallback to mint account info if metadata doesn't exist
    const mintInfo = await connection.getParsedAccountInfo(new PublicKey(mint));
    if (!mintInfo.value) {
      throw new Error('Token account not found');
    }

    const data = (mintInfo.value.data as any).parsed;
    if (!data || !data.type || data.type !== 'mint') {
      throw new Error('Not a valid mint account');
    }

    return {
      symbol: data.info.symbol || mint.slice(0, 4),
      name: data.info.name || `Token ${mint.slice(0, 4)}`
    };
  } catch (err) {
    console.error('Error fetching token metadata from RPC:', err);
    // Return shortened mint as fallback
    return {
      symbol: mint.slice(0, 4),
      name: `Token ${mint.slice(0, 4)}`
    };
  }
}

// Metadata decoder
function decodeMetadata(buffer: Buffer): any {
  // Skip discriminator
  let offset = 1;

  // Read update authority
  offset += 32;

  // Read mint
  offset += 32;

  // Read name length and string
  const nameLength = buffer[offset];
  offset += 1;
  const name = buffer.slice(offset, offset + nameLength).toString();
  offset += nameLength;

  // Read symbol length and string
  const symbolLength = buffer[offset];
  offset += 1;
  const symbol = buffer.slice(offset, offset + symbolLength).toString();

  return {
    data: {
      name: name.replace(/\0/g, ''),
      symbol: symbol.replace(/\0/g, '')
    }
  };
}

export async function getTokenAccountsCustom(address: string): Promise<AccountData> {
  const connection = await getProxyConnection();
  const pubkey = new PublicKey(address);
  const accountInfo = await connection.getAccountInfo(pubkey);
  
  if (!accountInfo) {
    throw new Error('Account not found');
  }

  let tokenAccounts = [];
  try {
    const tokenAccountsResponse = await connection.getParsedTokenAccountsByOwner(pubkey, {
      programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')
    });

    // Fetch metadata for all tokens in parallel
    const metadataPromises = tokenAccountsResponse.value.map(ta => 
      getTokenMetadataFromRPC(ta.account.data.parsed.info.mint)
        .catch(() => ({ symbol: '', name: '' }))
    );
    const metadataResults = await Promise.all(metadataPromises);

    tokenAccounts = tokenAccountsResponse.value.map((ta, index) => ({
      mint: ta.account.data.parsed.info.mint,
      owner: ta.account.data.parsed.info.owner,
      amount: ta.account.data.parsed.info.tokenAmount.amount,
      decimals: ta.account.data.parsed.info.tokenAmount.decimals,
      uiAmount: ta.account.data.parsed.info.tokenAmount.uiAmount,
      address: ta.pubkey.toBase58(),
      symbol: metadataResults[index].symbol,
      name: metadataResults[index].name,
      usdValue: 0 // Default to 0 since we don't have price data yet
    }));
  } catch (err) {
    console.error('Error loading token accounts:', err);
    // Continue with empty token accounts
  }

  const isSystemProgram = accountInfo.owner.equals(new PublicKey('11111111111111111111111111111111'));
  const isTokenProgram = accountInfo.owner.equals(new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'));

  return {
    lamports: accountInfo.lamports,
    owner: accountInfo.owner.toBase58(),
    executable: accountInfo.executable,
    tokenAccounts,
    isSystemProgram
  };
}

export function validateSolanaAddress(address: string): PublicKey {
  if (!address) {
    throw new Error('Address is required');
  }

  try {
    // Clean up the address
    let cleanAddress = address;
    try {
      cleanAddress = decodeURIComponent(address);
    } catch (e) {
      // Address was likely already decoded
    }
    cleanAddress = cleanAddress.trim();

    // Try to create PublicKey directly
    try {
      return new PublicKey(cleanAddress);
    } catch (e) {
      // If direct creation fails, try with the original address
      try {
        return new PublicKey(address);
      } catch (e2) {
        // If both attempts fail, check if it's a valid base58 string
        if (!/^[1-9A-HJ-NP-Za-km-z]+$/.test(cleanAddress)) {
          throw new Error('Invalid base58 characters in address');
        }
        // Check length
        if (cleanAddress.length < 32 || cleanAddress.length > 44) {
          throw new Error('Invalid address length');
        }
        // If we get here, it's a valid base58 string but not a valid PublicKey
        throw new Error('Invalid Solana address format');
      }
    }
  } catch (err) {
    console.error('Address validation error:', err);
    throw new Error(`Invalid Solana address: ${err.message}`);
  }
}

export async function getConnection(): Promise<Connection> {
  return getProxyConnection();
}

function convertToAccountMeta(account: ParsedMessageAccount): AccountMeta {
  return {
    pubkey: account.pubkey,
    isSigner: account.signer,
    isWritable: account.writable
  };
}

function findAccountIndex(accounts: ParsedMessageAccount[], pubkey: string): number {
  return accounts.findIndex(acc => acc.pubkey.toString() === pubkey);
}

function convertInstruction(ix: ParsedInstruction | PartiallyDecodedInstruction, allAccounts: ParsedMessageAccount[]): InstructionWithAccounts {
  if ('parsed' in ix) {
    // Handle ParsedInstruction
    const accounts = ix.parsed.info ? 
      Object.values(ix.parsed.info)
        .filter(v => typeof v === 'string')
        .map(acc => findAccountIndex(allAccounts, acc as string))
        .filter(index => index !== -1) : 
      [];

    return {
      ...ix,
      accounts,
      data: JSON.stringify(ix.parsed)
    };
  } else {
    // Handle PartiallyDecodedInstruction
    const accounts = ix.accounts
      .map(acc => findAccountIndex(allAccounts, acc.toString()))
      .filter(index => index !== -1);

    return {
      ...ix,
      accounts,
      data: ix.data
    };
  }
}

export async function getTransactionDetails(signature: string): Promise<DetailedTransactionInfo> {
  const connection = await getProxyConnection();
  
  try {
    const tx = await connection.getParsedTransaction(signature, {
      maxSupportedTransactionVersion: 0,
      commitment: 'confirmed'
    });

    if (!tx) {
      throw new Error('Transaction not found');
    }

    const timestamp = tx.blockTime ? new Date(tx.blockTime * 1000) : new Date();
    const success = tx.meta?.err === null;

    // Extract basic transaction info
    const info: DetailedTransactionInfo = {
      signature,
      timestamp: timestamp.getTime(),
      slot: tx.slot,
      success,
      type: 'unknown',
      details: {
        instructions: tx.transaction.message.instructions.map(ix => 
          convertInstruction(ix, tx.transaction.message.accountKeys)
        ),
        accounts: tx.transaction.message.accountKeys,
        preBalances: tx.meta?.preBalances || [],
        postBalances: tx.meta?.postBalances || [],
        preTokenBalances: tx.meta?.preTokenBalances || [],
        postTokenBalances: tx.meta?.postTokenBalances || [],
        logs: tx.meta?.logMessages || [],
        innerInstructions: tx.meta?.innerInstructions?.map(inner => ({
          index: inner.index,
          instructions: inner.instructions.map(ix => 
            convertInstruction(ix, tx.transaction.message.accountKeys)
          )
        }))
      }
    };

    // Try to determine transaction type and extract relevant details
    if (tx.meta?.preTokenBalances && tx.meta.postTokenBalances) {
      info.type = 'token';
      // Extract token transfer details if available
      const tokenChanges = tx.meta.postTokenBalances.map(post => {
        const pre = tx.meta?.preTokenBalances?.find(p => p.accountIndex === post.accountIndex);
        return {
          mint: post.mint,
          preAmount: pre?.uiTokenAmount.uiAmount || 0,
          postAmount: post.uiTokenAmount.uiAmount || 0,
          change: (post.uiTokenAmount.uiAmount || 0) - (pre?.uiTokenAmount.uiAmount || 0)
        };
      });
      info.details.tokenChanges = tokenChanges;
    } else if (tx.meta?.preBalances && tx.meta.postBalances) {
      info.type = 'sol';
      // Extract SOL transfer details
      const solChanges = tx.meta.postBalances.map((post, i) => ({
        accountIndex: i,
        preBalance: tx.meta?.preBalances?.[i] || 0,
        postBalance: post,
        change: post - (tx.meta?.preBalances?.[i] || 0)
      }));
      info.details.solChanges = solChanges;
    }

    // Build and store knowledge graph
    const transactionData: TransactionData = {
      signature,
      timestamp: timestamp.getTime(),
      slot: tx.slot,
      success,
      details: {
        accounts: tx.transaction.message.accountKeys.map(key => ({
          pubkey: key.pubkey,
          signer: key.signer,
          writable: key.writable
        })),
        instructions: tx.transaction.message.instructions.map(ix => 
          convertInstruction(ix, tx.transaction.message.accountKeys)
        ),
        tokenChanges: info.details?.tokenChanges || []
      }
    };

    const graph = await buildTransactionGraph([transactionData]);
    await storeGraph(graph);

    // Find related transactions
    const relatedTransactions = await findRelatedTransactions(signature);
    if (relatedTransactions?.length > 0) {
      info.relatedTransactions = relatedTransactions;
    }

    return info;
  } catch (error) {
    console.error('Error fetching transaction details:', error);
    throw error;
  }
}

export async function getRPCLatency(connection: Connection, publicKey: PublicKey): Promise<number> {
  const start = Date.now();
  await connection.getBalance(publicKey);
  return Date.now() - start;
}
