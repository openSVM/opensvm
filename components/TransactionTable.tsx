import { format } from 'date-fns';
import { Text } from 'rinlab';
import Link from 'next/link';
import { TransactionInfo } from '@/lib/solana';
import { Switch } from '@/components/ui/switch';
import { useState } from 'react';

interface TransactionTableProps {
  transactions: TransactionInfo[];
  isLoading: boolean;
  onLoadMore: () => void;
  hasMore: boolean;
}

export default function TransactionTable({ 
  transactions, 
  isLoading, 
  onLoadMore,
  hasMore 
}: TransactionTableProps) {
  const [hideFailedTx, setHideFailedTx] = useState(false);
  const [hideSpamTx, setHideSpamTx] = useState(false);

  const filteredTransactions = transactions.filter(tx => {
    if (hideFailedTx && tx.status === 'error') return false;
    // For spam detection, we could add more sophisticated logic here
    // For now, let's consider transactions with very low value and high frequency as potential spam
    if (hideSpamTx && tx.value === 0 && tx.fee < 0.000001) return false;
    return true;
  });

  return (
    <div>
      {/* Mobile View */}
      <div className="md:hidden">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Signature</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {transactions.map((tx, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <div className="flex items-center">
                          <span className="font-mono text-sm">
                            {tx.signature.slice(0, 4)}...{tx.signature.slice(-4)}
                          </span>
                          <button 
                            className="ml-2 text-gray-400 hover:text-gray-600"
                            onClick={() => navigator.clipboard.writeText(tx.signature)}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                              <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                            </svg>
                          </button>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {new Date(tx.blockTime * 1000).toLocaleString()}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {tx.status === 'success' ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Success
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Failed
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Desktop View */}
      <div className="hidden md:block">
        <div className="flex justify-end space-x-4 mb-4">
          <Switch
            label="Hide failed"
            checked={hideFailedTx}
            onChange={setHideFailedTx}
          />
          <Switch
            label="Hide possible spam and scam"
            checked={hideSpamTx}
            onChange={setHideSpamTx}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  Signature
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  Block
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  Time
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  From
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  Value (SOL)
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  Fee (SOL)
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  Programs
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading && transactions.length === 0 ? (
                <tr>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="text-[13px] text-[#00ffbd]">Loading...</span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="text-[13px]">-</span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="text-[13px]">-</span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="text-[13px]">-</span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="text-[13px]">-</span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="text-[13px]">-</span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="text-[13px]">-</span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="text-[13px]">-</span>
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => (
                  <tr 
                    key={tx.signature} 
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Link 
                        href={`/tx/${tx.signature}`}
                        className="text-[13px] text-[#00ffbd] hover:underline font-medium"
                      >
                        {tx.signature.slice(0, 8)}...{tx.signature.slice(-8)}
                      </Link>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Link 
                        href={`/block/${tx.slot}`}
                        className="text-[13px] text-gray-900 hover:text-[#00ffbd]"
                      >
                        {tx.slot}
                      </Link>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Text variant="default" className="text-[13px] text-gray-500">
                        {format(new Date(tx.blockTime * 1000), 'MMM dd, yyyy HH:mm:ss')}
                      </Text>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span 
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          tx.status === 'success' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {tx.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Link 
                        href={`/account/${tx.from}`}
                        className="text-[13px] text-gray-900 hover:text-[#00ffbd]"
                      >
                        {tx.from.slice(0, 4)}...{tx.from.slice(-4)}
                      </Link>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Text variant="default" className="text-[13px]">
                        {tx.value !== undefined ? tx.value.toFixed(4) : '-'}
                      </Text>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Text variant="default" className="text-[13px]">
                        {tx.fee !== undefined ? tx.fee.toFixed(6) : '-'}
                      </Text>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-2">
                        {tx.programs && tx.programs.length > 0 ? (
                          tx.programs.map((program, i) => (
                            <Link
                              key={i}
                              href={`/account/${program}`}
                              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 hover:bg-gray-200"
                            >
                              {program.slice(0, 4)}...{program.slice(-4)}
                            </Link>
                          ))
                        ) : (
                          <span className="text-[13px] text-gray-500">-</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {hasMore && (
            <div className="mt-4 flex justify-center">
              <button
                onClick={onLoadMore}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00ffbd]"
              >
                Load More
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 