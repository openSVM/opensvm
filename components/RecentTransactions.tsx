'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getInitialTransactions, subscribeToTransactions, type TransactionInfo } from '@/lib/solana';

export default function RecentTransactions() {
  const [transactions, setTransactions] = useState<TransactionInfo[]>([]);

  useEffect(() => {
    let mounted = true;

    async function init() {
      // Get initial transactions
      const initialTransactions = await getInitialTransactions(10);
      if (mounted) {
        setTransactions(initialTransactions);
      }

      // Subscribe to new transactions
      const unsubscribe = subscribeToTransactions((tx) => {
        if (mounted) {
          setTransactions(prev => [tx, ...prev].slice(0, 10));
        }
      });

      return () => {
        mounted = false;
        unsubscribe();
      };
    }

    init();
  }, []);

  return (
    <div className="rounded-lg border bg-card">
      <div className="flex items-center justify-between p-6">
        <h2 className="text-lg font-semibold">Recent Transactions</h2>
        <Link href="/transactions" className="text-sm text-[#00DC82]">View all</Link>
      </div>

      <div className="space-y-4 p-6 pt-0">
        {transactions.map((tx) => (
          <Link
            key={tx.signature}
            href={`/tx/${tx.signature}`}
            className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 hover:bg-secondary/80 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${tx.status === 'success' ? 'bg-[#00DC82]' : 'bg-red-500'}`} />
              <div>
                <div className="text-sm font-medium">{tx.type}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {tx.from.slice(0, 4)}...{tx.from.slice(-4)} → {tx.to.slice(0, 4)}...{tx.to.slice(-4)}
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className="text-sm font-medium">{tx.amount.toFixed(4)} SOL</div>
              <div className="text-xs text-muted-foreground mt-1">Fee: {tx.fee.toFixed(6)} SOL</div>
            </div>
          </Link>
        ))}

        {transactions.length === 0 && (
          <div className="text-center text-sm text-muted-foreground py-8">
            Loading transactions...
          </div>
        )}
      </div>
    </div>
  );
} 