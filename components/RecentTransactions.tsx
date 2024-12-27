'use client';

import { useEffect, useState } from 'react';
import { Connection, PublicKey, ParsedTransactionWithMeta } from '@solana/web3.js';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

interface Transaction {
  signature: string;
  slot: number;
  blockTime: number | null;
  success: boolean;
  programId: string;
}

export function RecentTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');

    async function fetchTransactions() {
      try {
        const signatures = await connection.getSignaturesForAddress(
          new PublicKey('11111111111111111111111111111111'), // System Program
          { limit: 10 }
        );

        const txs = await Promise.all(
          signatures.map(async (sig) => {
            const tx = await connection.getParsedTransaction(sig.signature, {
              maxSupportedTransactionVersion: 0,
            });
            return {
              signature: sig.signature,
              slot: sig.slot,
              blockTime: sig.blockTime,
              success: sig.err === null,
              programId: tx?.transaction.message.instructions[0]?.programId.toString() || 'Unknown',
            };
          })
        );

        setTransactions(txs);
      } catch (error) {
        console.error('Error fetching transactions:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchTransactions();
    const interval = setInterval(fetchTransactions, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="rounded-lg bg-black/20 backdrop-blur-sm p-6 animate-pulse">
        <h2 className="text-xl font-semibold mb-4">Recent Transactions</h2>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-700/50 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-black/20 backdrop-blur-sm p-6">
      <h2 className="text-xl font-semibold mb-4">Recent Transactions</h2>
      <div className="space-y-4">
        {transactions.map((tx) => (
          <Link
            key={tx.signature}
            href={`/tx/${tx.signature}`}
            className="flex items-center justify-between p-3 rounded-lg bg-black/30 hover:bg-black/40 transition-colors"
          >
            <div className="flex items-center space-x-4">
              <div className="text-sm font-mono">
                <div className="text-gray-300">
                  {tx.signature.slice(0, 8)}...{tx.signature.slice(-8)}
                </div>
                <div className="text-gray-500 text-xs">
                  Program: {tx.programId.slice(0, 8)}...
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className={`text-sm ${tx.success ? 'text-green-400' : 'text-red-400'}`}>
                {tx.success ? 'Success' : 'Failed'}
              </div>
              <div className="text-gray-400 text-xs">
                {tx.blockTime
                  ? formatDistanceToNow(tx.blockTime * 1000, { addSuffix: true })
                  : 'Processing...'}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
} 