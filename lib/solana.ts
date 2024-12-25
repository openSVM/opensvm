import { Connection, PublicKey } from '@solana/web3.js';

const SOLANA_RPC_URL = 'https://solana-mainnet.core.chainstack.com/263c9f53f4e4cdb897c0edc4a64cd007';
const SOLANA_WS_URL = 'wss://solana-mainnet.core.chainstack.com/263c9f53f4e4cdb897c0edc4a64cd007';

const connection = new Connection(SOLANA_RPC_URL, {
  wsEndpoint: SOLANA_WS_URL,
  commitment: 'confirmed'
});

export { connection };

export async function getAccountInfo(address: string) {
  try {
    const publicKey = new PublicKey(address);
    const accountInfo = await connection.getAccountInfo(publicKey);

    if (!accountInfo) {
      throw new Error('Account not found');
    }

    return {
      lamports: accountInfo.lamports,
      isSystemProgram: accountInfo.owner.equals(PublicKey.default),
    };
  } catch (error) {
    console.error('Error fetching account info:', error);
    throw error;
  }
}

export async function getTransactionHistory(address: string) {
  try {
    const publicKey = new PublicKey(address);
    const signatures = await connection.getSignaturesForAddress(publicKey, {
      limit: 20,
    });

    const transactions = await Promise.all(
      signatures.map(async (sig) => {
        const tx = await connection.getTransaction(sig.signature, {
          maxSupportedTransactionVersion: 0,
        });
        return {
          signature: sig.signature,
          timestamp: sig.blockTime ? new Date(sig.blockTime * 1000) : null,
          status: sig.err ? 'Failed' : 'Success',
          fee: tx?.meta?.fee || 0,
        };
      })
    );

    return transactions;
  } catch (error) {
    console.error('Error fetching transaction history:', error);
    throw error;
  }
} 