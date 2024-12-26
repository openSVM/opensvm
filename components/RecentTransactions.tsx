'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardContent, Text, Stack } from 'rinlab';
import { format } from 'date-fns';
import Link from 'next/link';
import { getInitialTransactions, subscribeToTransactions, type TransactionInfo } from '@/lib/solana';

const MAX_TRANSACTIONS = 10;

export default function RecentTransactions() {
  const [transactions, setTransactions] = useState<TransactionInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    // Load initial data and set up subscription
    getInitialTransactions()
      .then(initialTxs => {
        setTransactions(initialTxs);
        setIsLoading(false);
        
        // Set up WebSocket subscription for new transactions
        return subscribeToTransactions((newTx) => {
          setTransactions(prevTxs => [newTx, ...prevTxs.slice(0, MAX_TRANSACTIONS - 1)]);
        });
      })
      .then(unsubscribeFunc => {
        unsubscribe = unsubscribeFunc;
      })
      .catch(err => {
        setError('Failed to load transactions');
        console.error('Error setting up transactions:', err);
        setIsLoading(false);
      });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  if (error) {
    return (
      <Card>
        <CardHeader>
          <Text variant="heading">Recent Transactions</Text>
        </CardHeader>
        <CardContent>
          <Text variant="error" className="text-center">{error}</Text>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Text variant="heading">Recent Transactions</Text>
        </CardHeader>
        <CardContent>
          <Text variant="default" className="text-center">Loading transactions...</Text>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <Text variant="heading">Recent Transactions</Text>
          <a href="/transactions" className="text-[#00ffbd] hover:text-[#00e6aa] text-sm">
            View all
          </a>
        </div>
      </CardHeader>
      <CardContent>
        <Stack gap={2}>
          {transactions.map((tx) => (
            <div key={tx.signature} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100">
              <div className="flex items-center gap-4">
                <Link 
                  href={`/tx/${tx.signature}`}
                  className="text-xs font-mono text-[#00ffbd] hover:text-[#00e6aa] truncate max-w-[120px]"
                >
                  {tx.signature}
                </Link>
                <div className="flex flex-col">
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${tx.status === 'success' ? 'bg-green-400' : 'bg-red-400'}`} />
                    <Text variant="default" className="font-medium">
                      {tx.type}
                    </Text>
                    <Text variant="label" className="text-xs">
                      {tx.timestamp ? format(tx.timestamp, 'HH:mm:ss') : 'Pending'}
                    </Text>
                  </div>
                  <div className="flex items-center mt-1 space-x-1">
                    <Text variant="label" className="text-xs font-mono">
                      {tx.from.slice(0, 4)}...{tx.from.slice(-4)}
                    </Text>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    <Text variant="label" className="text-xs font-mono">
                      {tx.to.slice(0, 4)}...{tx.to.slice(-4)}
                    </Text>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <Text variant="default" className="font-medium">
                  {tx.amount.toFixed(4)} SOL
                </Text>
                <Text variant="label" className="text-xs">
                  Fee: {tx.fee.toFixed(6)} SOL
                </Text>
              </div>
            </div>
          ))}
        </Stack>
      </CardContent>
    </Card>
  );
} 