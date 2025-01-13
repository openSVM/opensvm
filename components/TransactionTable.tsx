'use client';

import { useState } from 'react';
import { type TransactionInfo } from '@/lib/solana';
import Link from 'next/link';

interface TransactionTableProps {
  transactions: TransactionInfo[];
  isLoading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
}

export default function TransactionTable({ transactions, isLoading, hasMore, onLoadMore }: TransactionTableProps) {
  const [page, setPage] = useState(0);
  const rowsPerPage = 100;

  const start = page * rowsPerPage;
  const end = start + rowsPerPage;
  const currentTransactions = transactions.slice(start, end);
  const totalPages = Math.ceil(transactions.length / rowsPerPage);

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead>
          <tr>
            <th className="px-6 py-3 text-left text-sm font-medium uppercase">
              Signature
            </th>
            <th className="px-6 py-3 text-left text-sm font-medium uppercase">
              Type
            </th>
            <th className="px-6 py-3 text-left text-sm font-medium uppercase">
              Amount
            </th>
            <th className="px-6 py-3 text-left text-sm font-medium uppercase">
              Status
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-700">
          {currentTransactions.map((tx) => (
            <tr key={tx.signature}>
              <td className="px-6 py-4 whitespace-nowrap">
                <Link 
                  href={`/tx/${tx.signature}`}
                  className="text-blue-500 hover:text-blue-400"
                >
                  {tx.signature.slice(0, 8)}...{tx.signature.slice(-8)}
                </Link>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="capitalize">{tx.type}</span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {tx.amount !== undefined ? (
                  <span>
                    {tx.amount} {tx.type === 'sol' ? 'SOL' : tx.symbol || ''}
                  </span>
                ) : (
                  '-'
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 py-1 text-xs font-medium rounded ${
                  tx.success
                    ? 'bg-green-900/20 text-green-500'
                    : 'bg-red-900/20 text-red-500'
                }`}>
                  {tx.success ? 'Success' : 'Failed'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="px-6 py-4 flex items-center justify-between">
        <p className="text-sm text-gray-400">
          Showing {start + 1} to {Math.min(end, transactions.length)} of {transactions.length} results
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-4 py-2 text-sm font-medium rounded bg-gray-900 text-gray-300 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="px-4 py-2 text-sm font-medium rounded bg-gray-900 text-gray-300 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>

      {hasMore && (
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onLoadMore}
            disabled={isLoading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}
    </div>
  );
}
