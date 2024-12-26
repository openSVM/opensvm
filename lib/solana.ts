import { Connection, PublicKey } from '@solana/web3.js';

const SOLANA_RPC_URL = 'https://solana-mainnet.core.chainstack.com/263c9f53f4e4cdb897c0edc4a64cd007';
const SOLANA_WS_URL = 'wss://solana-mainnet.core.chainstack.com/263c9f53f4e4cdb897c0edc4a64cd007';

const connection = new Connection(SOLANA_RPC_URL, {
  wsEndpoint: SOLANA_WS_URL,
  commitment: 'confirmed',
});

export { connection };

export type TransactionInfo = {
  signature: string;
  timestamp: Date | null;
  status: 'Success' | 'Failed';
  fee: number;
  type: string;
  from: string;
  to: string;
  amount: number;
};

export type DetailedTransactionInfo = TransactionInfo & {
  slot: number;
  blockTime: Date | null;
  recentBlockhash: string;
  instructions: {
    programId: string;
    data: string;
  }[];
  logs: string[];
  computeUnits: number;
};

export async function getTransactionDetails(signature: string): Promise<DetailedTransactionInfo | null> {
  try {
    const tx = await connection.getTransaction(signature, {
      maxSupportedTransactionVersion: 0,
    });

    if (!tx || !tx.transaction || !tx.transaction.message) {
      console.error('Transaction data is incomplete');
      return null;
    }

    const accountKeys = tx.transaction.message.accountKeys || [];
    const preBalances = tx.meta?.preBalances || [];
    const postBalances = tx.meta?.postBalances || [];
    const instructions = tx.transaction.message.instructions || [];

    // Calculate amount by finding the largest balance change
    let amount = 0;
    let from = 'Unknown';
    let to = 'Unknown';

    if (accountKeys.length > 0) {
      from = accountKeys[0].toBase58();
      
      // Find the largest balance decrease (sender)
      for (let i = 0; i < preBalances.length; i++) {
        const balanceChange = (postBalances[i] || 0) - (preBalances[i] || 0);
        if (balanceChange < 0 && Math.abs(balanceChange) > Math.abs(amount)) {
          amount = balanceChange;
          from = accountKeys[i]?.toBase58() || 'Unknown';
        }
      }

      // Find the largest balance increase (receiver)
      for (let i = 0; i < postBalances.length; i++) {
        const balanceChange = (postBalances[i] || 0) - (preBalances[i] || 0);
        if (balanceChange > 0 && balanceChange > Math.abs(amount)) {
          to = accountKeys[i]?.toBase58() || 'Unknown';
        }
      }

      // If no receiver found, use the first non-sender account
      if (to === 'Unknown' && accountKeys.length > 1) {
        to = accountKeys.find(key => key?.toBase58() !== from)?.toBase58() || 'Unknown';
      }
    }

    // Convert lamports to SOL
    amount = Math.abs(amount) / 1e9;

    return {
      signature,
      timestamp: tx.blockTime ? new Date(tx.blockTime * 1000) : null,
      status: tx.meta?.err ? 'Failed' : 'Success',
      fee: (tx.meta?.fee || 0) / 1e9,
      type: determineTransactionType(tx),
      from,
      to,
      amount,
      slot: tx.slot || 0,
      blockTime: tx.blockTime ? new Date(tx.blockTime * 1000) : null,
      recentBlockhash: tx.transaction.message.recentBlockhash || '',
      instructions: instructions.map(ix => ({
        programId: accountKeys[ix.programIdIndex]?.toBase58() || 'Unknown',
        data: ix.data || '',
      })),
      logs: tx.meta?.logMessages || [],
      computeUnits: tx.meta?.computeUnitsConsumed || 0,
    };
  } catch (error) {
    console.error('Error fetching transaction details:', error);
    return null;
  }
}

function determineTransactionType(tx: any): string {
  try {
    if (!tx?.transaction?.message?.instructions?.[0]) {
      return 'Unknown';
    }

    const instruction = tx.transaction.message.instructions[0];
    const accountKeys = tx.transaction.message.accountKeys || [];
    const programId = accountKeys[instruction.programIdIndex]?.toBase58();
    
    if (!programId) {
      return 'Unknown';
    }

    // Common program IDs
    const SYSTEM_PROGRAM = '11111111111111111111111111111111';
    const TOKEN_PROGRAM = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
    const ASSOCIATED_TOKEN = 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL';
    const METADATA_PROGRAM = 'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s';
    const MEMO_PROGRAM = 'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr';
    
    switch (programId) {
      case SYSTEM_PROGRAM:
        return 'System Transfer';
      case TOKEN_PROGRAM:
        return 'Token Transfer';
      case ASSOCIATED_TOKEN:
        return 'Token Account';
      case METADATA_PROGRAM:
        return 'NFT';
      case MEMO_PROGRAM:
        return 'Memo';
      default:
        return 'Program Call';
    }
  } catch (error) {
    return 'Unknown';
  }
}

export async function subscribeToTransactions(callback: (transaction: TransactionInfo) => void) {
  const subscriptionId = connection.onLogs(
    'all',
    (logs) => {
      try {
        const transaction: TransactionInfo = {
          signature: logs.signature,
          timestamp: new Date(),
          status: logs.err ? 'Failed' : 'Success',
          fee: 0.000005,
          type: 'Transfer',
          from: 'Unknown',
          to: 'Unknown',
          amount: 0,
        };

        callback(transaction);
      } catch (error) {
        console.error('Error processing transaction:', error);
      }
    }
  );

  return () => {
    connection.removeOnLogsListener(subscriptionId);
  };
}

export async function getInitialTransactions(): Promise<TransactionInfo[]> {
  try {
    const signatures = await connection.getSignaturesForAddress(
      new PublicKey('11111111111111111111111111111111'),
      { limit: 10 }
    );

    return signatures.map(sig => ({
      signature: sig.signature,
      timestamp: sig.blockTime ? new Date(sig.blockTime * 1000) : new Date(),
      status: sig.err ? 'Failed' : 'Success',
      fee: 0.000005,
      type: 'Transfer',
      from: 'Unknown',
      to: 'Unknown',
      amount: 0
    }));
  } catch (error) {
    console.error('Error fetching initial transactions:', error);
    return [];
  }
} 