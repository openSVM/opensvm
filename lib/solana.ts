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