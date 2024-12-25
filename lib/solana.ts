import { Connection, PublicKey, ParsedTransactionWithMeta, ConfirmedSignatureInfo } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';

const SOLANA_RPC_URL = 'https://solana-mainnet.core.chainstack.com/263c9f53f4e4cdb897c0edc4a64cd007';
const SOLANA_WS_URL = 'wss://solana-mainnet.core.chainstack.com/263c9f53f4e4cdb897c0edc4a64cd007';

export interface AccountData {
  address: string;
  lamports: number;
  isSystemProgram: boolean;
  tokenAccounts: any[];
}

export interface Transaction {
  signature: string;
  slot: number;
  timestamp: number;
  success: boolean;
  fee: number;
}

export const connection = new Connection(SOLANA_RPC_URL, {
  wsEndpoint: SOLANA_WS_URL,
  commitment: 'confirmed'
});

export async function getAccountInfo(address: string): Promise<AccountData> {
  try {
    const pubkey = new PublicKey(address);
    const accountInfo = await connection.getAccountInfo(pubkey);
    const lamports = await connection.getBalance(pubkey);
    const tokenAccounts = await connection.getTokenAccountsByOwner(pubkey, {
      programId: TOKEN_PROGRAM_ID
    });

    return {
      address,
      lamports,
      isSystemProgram: accountInfo?.owner.equals(PublicKey.default) ?? false,
      tokenAccounts: tokenAccounts.value
    };
  } catch (error) {
    console.error('Error fetching account info:', error);
    throw error;
  }
}

export async function getTransactionHistory(address: string, limit: number = 20): Promise<Transaction[]> {
  try {
    const pubkey = new PublicKey(address);
    const signatures = await connection.getSignaturesForAddress(pubkey, { limit });
    
    const transactions = await Promise.all(
      signatures.map(async (sig) => {
        const tx = await connection.getParsedTransaction(sig.signature, {
          maxSupportedTransactionVersion: 0
        });
        
        return {
          signature: sig.signature,
          slot: sig.slot,
          timestamp: sig.blockTime || 0,
          success: sig.err === null,
          fee: tx?.meta?.fee || 0
        };
      })
    );

    return transactions;
  } catch (error) {
    console.error('Error fetching transaction history:', error);
    throw error;
  }
}

export async function getTransaction(signature: string): Promise<ParsedTransactionWithMeta | null> {
  try {
    const transaction = await connection.getParsedTransaction(signature, {
      maxSupportedTransactionVersion: 0
    });
    return transaction;
  } catch (error) {
    console.error('Error fetching transaction:', error);
    throw error;
  }
}

export async function getRecentBlockhash(): Promise<string> {
  try {
    const { blockhash } = await connection.getLatestBlockhash();
    return blockhash;
  } catch (error) {
    console.error('Error fetching recent blockhash:', error);
    throw error;
  }
}

export async function getBlockTime(slot: number): Promise<number | null> {
  try {
    const timestamp = await connection.getBlockTime(slot);
    return timestamp;
  } catch (error) {
    console.error('Error fetching block time:', error);
    throw error;
  }
} 