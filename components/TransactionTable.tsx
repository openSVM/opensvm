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
    if (hideSpamTx && tx.value === 0 && tx.fee < 0.000001) return false;
    return true;
  });

  return (
    <div>
      {/* Mobile View */}
      <div className="md:hidden">
        <div className="bg-background border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-background">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-foreground uppercase tracking-wider">Signature</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-foreground uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {transactions.map((tx, index) => (
                  <tr key={index} className="hover:bg-muted/50">
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <div className="flex items-center">
                          <span className="font-mono text-sm text-foreground">
                            {tx.signature.slice(0, 4)}...{tx.signature.slice(-4)}
                          </span>
                          <button 
                            className="ml-2 text-muted-foreground hover:text-foreground"
                            onClick={() => navigator.clipboard.writeText(tx.signature)}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                              <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                            </svg>
                          </button>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {new Date(tx.blockTime * 1000).toLocaleString()}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {tx.status === 'success' ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success/20 text-success">
                          Success
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-destructive/20 text-destructive">
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
              <tr className="bg-background">
                <th className="px-4 py-3 text-left text-xs font-medium text-foreground uppercase tracking-wider whitespace-nowrap">
                  Signature
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-foreground uppercase tracking-wider whitespace-nowrap">
                  Block
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-foreground uppercase tracking-wider whitespace-nowrap">
                  Time
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-foreground uppercase tracking-wider whitespace-nowrap">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-foreground uppercase tracking-wider whitespace-nowrap">
                  From
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-foreground uppercase tracking-wider whitespace-nowrap">
                  Value (SOL)
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-foreground uppercase tracking-wider whitespace-nowrap">
                  Fee (SOL)
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-foreground uppercase tracking-wider whitespace-nowrap">
                  Programs
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading && transactions.length === 0 ? (
                <tr>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="text-[13px] text-accent">Loading...</span>
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
                    className="hover:bg-muted/50 transition-colors"
                  >
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Link 
                        href={`/tx/${tx.signature}`}
                        className="text-[13px] text-accent hover:underline font-medium"
                      >
                        {tx.signature.slice(0, 8)}...{tx.signature.slice(-8)}
                      </Link>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Link 
                        href={`/block/${tx.slot}`}
                        className="text-[13px] text-foreground hover:text-accent"
                      >
                        {tx.slot}
                      </Link>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Text variant="default" className="text-[13px] text-muted-foreground">
                        {format(new Date(tx.blockTime * 1000), 'MMM dd, yyyy HH:mm:ss')}
                      </Text>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span 
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          tx.status === 'success' 
                            ? 'bg-success/20 text-success' 
                            : 'bg-destructive/20 text-destructive'
                        }`}
                      >
                        {tx.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Link 
                        href={`/account/${tx.from}`}
                        className="text-[13px] text-foreground hover:text-accent"
                      >
                        {tx.from.slice(0, 4)}...{tx.from.slice(-4)}
                      </Link>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Text variant="default" className="text-[13px] text-foreground">
                        {tx.value !== undefined ? tx.value.toFixed(4) : '-'}
                      </Text>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Text variant="default" className="text-[13px] text-foreground">
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
                              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-muted text-foreground hover:bg-muted/70"
                            >
                              {program.slice(0, 4)}...{program.slice(-4)}
                            </Link>
                          ))
                        ) : (
                          <span className="text-[13px] text-muted-foreground">-</span>
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
                className="px-4 py-2 text-sm font-medium text-foreground bg-background border border-border rounded-md hover:bg-muted/50 focus:outline-none"
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