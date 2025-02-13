import { Connection, PublicKey, ParsedTransactionWithMeta, ParsedInstruction, PartiallyDecodedInstruction, AccountMeta, ParsedMessageAccount } from '@solana/web3.js';
import { getConnection as getProxyConnection } from './solana-connection';

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

export interface ParsedInstructionWithAccounts {
  program: string;
  programId: string;
  parsed: any;
  accounts: number[];
  data: string;
  computeUnits?: number;
  computeUnitsConsumed?: number;
}

export interface PartiallyDecodedInstructionWithAccounts {
  programId: string;
  accounts: number[];
  data: string;
  computeUnits?: number;
  computeUnitsConsumed?: number;
}

export type InstructionWithAccounts = ParsedInstructionWithAccounts | PartiallyDecodedInstructionWithAccounts;

export interface InnerInstructions {
  index: number;
  instructions: InstructionWithAccounts[];
}

export interface DetailedTransactionInfo extends BaseTransactionInfo {
  details?: {
    instructions: InstructionWithAccounts[];
    accounts: {
      pubkey: string;
      signer: boolean;
      writable: boolean;
    }[];
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

function findAccountIndex(accounts: ParsedMessageAccount[], pubkey: string): number {
  try {
    if (!accounts || !pubkey) return -1;
    return accounts.findIndex(acc => {
      try {
        return acc?.pubkey?.toString() === pubkey;
      } catch (error) {
        console.warn('Error comparing account pubkeys:', error);
        return false;
      }
    });
  } catch (error) {
    console.warn('Error finding account index:', error);
    return -1;
  }
}

function convertInstruction(ix: ParsedInstruction | PartiallyDecodedInstruction, allAccounts: ParsedMessageAccount[]): InstructionWithAccounts {
  try {
    if (!ix) {
      throw new Error('Invalid instruction');
    }

    if ('parsed' in ix) {
      // Handle ParsedInstruction
      let accounts: number[] = [];

      // Extract accounts from parsed.info if available
      if (ix.parsed?.info) {
        accounts = Object.values(ix.parsed.info)
          .filter(v => typeof v === 'string' && v.length > 0)
          .map(acc => findAccountIndex(allAccounts, acc as string))
          .filter(index => index !== -1);
      }

      // Add program ID account if not already included
      const programIdIndex = findAccountIndex(allAccounts, ix.programId?.toString() || '');
      if (programIdIndex !== -1 && !accounts.includes(programIdIndex)) {
        accounts.unshift(programIdIndex);
      }

      return {
        program: ix.program || '',
        programId: ix.programId?.toString() || '',
        parsed: ix.parsed || {},
        accounts,
        data: JSON.stringify(ix.parsed || {}),
        computeUnits: undefined,
        computeUnitsConsumed: undefined
      } as ParsedInstructionWithAccounts;
    } else {
      // Handle PartiallyDecodedInstruction
      const accounts = (ix.accounts || [])
        .filter(acc => acc)
        .map(acc => {
          try {
            return findAccountIndex(allAccounts, acc.toString());
          } catch (error) {
            console.warn('Error converting account index:', error);
            return -1;
          }
        })
        .filter(index => index !== -1);

      return {
        programId: ix.programId?.toString() || '',
        accounts,
        data: ix.data || '',
        computeUnits: undefined,
        computeUnitsConsumed: undefined
      } as PartiallyDecodedInstructionWithAccounts;
    }
  } catch (error) {
    console.error('Error converting instruction:', error);
    return {
      program: '',
      programId: '',
      parsed: {},
      accounts: [],
      data: '',
      computeUnits: undefined,
      computeUnitsConsumed: undefined
    } as ParsedInstructionWithAccounts;
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
        instructions: [],
        accounts: [],
        preBalances: [],
        postBalances: [],
        preTokenBalances: [],
        postTokenBalances: [],
        logs: [],
        innerInstructions: [],
        tokenChanges: [],
        solChanges: []
      }
    };

    // Safely extract transaction details
    if (tx.transaction?.message) {
      const instructions = (tx.transaction.message.instructions || [])
        .map(ix => convertInstruction(ix, tx.transaction.message.accountKeys || []));

      info.details.instructions = instructions.filter(ix => {
        if ('program' in ix) {
          return ix.program || ix.programId;
        }
        return ix.programId;
      });

      info.details.accounts = (tx.transaction.message.accountKeys || [])
        .map(acc => ({
          pubkey: acc?.pubkey?.toString() || '',
          signer: acc?.signer || false,
          writable: acc?.writable || false
        }))
        .filter(acc => acc.pubkey);
    }

    if (tx.meta) {
      info.details.preBalances = tx.meta.preBalances || [];
      info.details.postBalances = tx.meta.postBalances || [];
      info.details.preTokenBalances = tx.meta.preTokenBalances || [];
      info.details.postTokenBalances = tx.meta.postTokenBalances || [];
      info.details.logs = tx.meta.logMessages || [];

      if (tx.meta.innerInstructions && tx.transaction?.message) {
        info.details.innerInstructions = tx.meta.innerInstructions
          .map(inner => ({
            index: inner.index,
            instructions: (inner.instructions || [])
              .map(ix => convertInstruction(ix, tx.transaction.message.accountKeys || []))
              .filter(ix => {
                if ('program' in ix) {
                  return ix.program || ix.programId;
                }
                return ix.programId;
              })
          }))
          .filter(inner => inner.instructions.length > 0);
      }

      // Try to determine transaction type and extract relevant details
      if (tx.meta.preTokenBalances?.length && tx.meta.postTokenBalances?.length) {
        info.type = 'token';
        info.details.tokenChanges = tx.meta.postTokenBalances
          .map(post => {
            const pre = tx.meta?.preTokenBalances?.find(p => p.accountIndex === post.accountIndex);
            return {
              mint: post.mint || '',
              preAmount: pre?.uiTokenAmount?.uiAmount || 0,
              postAmount: post.uiTokenAmount?.uiAmount || 0,
              change: (post.uiTokenAmount?.uiAmount || 0) - (pre?.uiTokenAmount?.uiAmount || 0)
            };
          })
          .filter(change => change.mint && (change.preAmount !== 0 || change.postAmount !== 0));
      } else if (tx.meta.preBalances?.length && tx.meta.postBalances?.length) {
        info.type = 'sol';
        info.details.solChanges = tx.meta.postBalances
          .map((post, i) => ({
            accountIndex: i,
            preBalance: tx.meta?.preBalances?.[i] || 0,
            postBalance: post || 0,
            change: (post || 0) - (tx.meta?.preBalances?.[i] || 0)
          }))
          .filter(change => change.change !== 0);
      }
    }

    return info;
  } catch (error) {
    console.error('Error fetching transaction details:', error);
    if (error instanceof Error) {
      if (error.message.includes('429') || error.message.includes('Too many requests')) {
        throw new Error('Rate limit exceeded. Please try again in a few moments.');
      }
      if (error.message.includes('403') || error.message.includes('Forbidden')) {
        throw new Error('Access denied. Please check your permissions.');
      }
      if (error.message.includes('404') || error.message.includes('not found')) {
        throw new Error('Transaction not found. Please check the signature and try again.');
      }
      if (error.message.includes('500') || error.message.includes('Internal')) {
        throw new Error('Server error. Please try again later.');
      }
    }
    throw new Error('Failed to fetch transaction details. Please try again.');
  }
}

export async function getRPCLatency(connection: Connection, publicKey: PublicKey): Promise<number> {
  const start = Date.now();
  try {
    await connection.getBalance(publicKey);
    return Date.now() - start;
  } catch (error) {
    console.warn('Error measuring RPC latency:', error);
    return -1;
  }
}
