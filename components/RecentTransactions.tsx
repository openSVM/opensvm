'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { connection } from '@/lib/solana';

interface Transaction {
  signature: string;
}

export function TransactionsInBlock() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  if (isLoading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6 animate-pulse">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Transactions in Block</h2>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-100 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Transactions in Block</h2>
        <div className="flex items-center justify-center h-48 text-gray-500">
          Click on any block in the Recent Blocks section
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Transactions in Block</h2>
      <div className="space-y-4">
        {transactions.map((tx) => (
          <Link
            key={tx.signature}
            href={`/tx/${tx.signature}`}
            className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center space-x-4">
              <div className="text-sm font-mono">
                <div className="text-gray-900">
                  {tx.signature.slice(0, 8)}...{tx.signature.slice(-8)}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
} 