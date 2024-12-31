'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Transaction {
  signature: string;
  type: string;
  timestamp: number | null;
}

interface Block {
  slot: number;
  transactions?: Transaction[];
}

interface Props {
  block: Block | null;
}

export function TransactionsInBlock({ block }: Props) {
  if (!block || !block.transactions) {
    return (
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Transactions in Block
        </h2>
        <div className="text-gray-500 text-center py-8">
          Select a block to view its transactions
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">
          Transactions in Block
        </h2>
        <Link
          href={`/block/${block.slot}`}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          View Block Details →
        </Link>
      </div>
      <div className="space-y-3">
        {block.transactions.map((tx) => (
          <Link
            key={tx.signature}
            href={`/tx/${tx.signature}`}
            className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <div className="flex flex-col">
              <div className="text-sm font-mono text-gray-900 truncate max-w-[200px]">
                {tx.signature}
              </div>
              <div className="text-xs text-gray-500">
                {tx.type}
              </div>
            </div>
            <div className="text-xs text-gray-500">
              {tx.timestamp ? new Date(tx.timestamp * 1000).toLocaleString() : 'Pending'}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
} 