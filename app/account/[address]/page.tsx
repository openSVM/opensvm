'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardContent, Text, Stack } from 'rinlab';
import { useParams } from 'next/navigation';
import { getAccountInfo, getTransactionHistory } from '@/lib/solana';
import type { TransactionInfo } from '@/lib/solana';

interface AccountInfo {
  address: string;
  balance: number;
  executable: boolean;
  owner: string;
}

export default function AccountPage() {
  const params = useParams();
  const address = params.address as string;
  const [accountInfo, setAccountInfo] = useState<AccountInfo | null>(null);
  const [transactions, setTransactions] = useState<TransactionInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadAccountData() {
      try {
        const [info, txHistory] = await Promise.all([
          getAccountInfo(address),
          getTransactionHistory(address)
        ]);

        if (!info) {
          throw new Error('Account not found');
        }

        setAccountInfo(info);
        setTransactions(txHistory);
        setIsLoading(false);
      } catch (err) {
        setError('Failed to load account details');
        console.error('Error loading account:', err);
        setIsLoading(false);
      }
    }

    loadAccountData();
  }, [address]);

  if (error) {
    return (
      <Card>
        <CardHeader>
          <Text variant="heading">Account Details</Text>
        </CardHeader>
        <CardContent>
          <Text variant="error" className="text-center">{error}</Text>
        </CardContent>
      </Card>
    );
  }

  if (isLoading || !accountInfo) {
    return (
      <Card>
        <CardHeader>
          <Text variant="heading">Account Details</Text>
        </CardHeader>
        <CardContent>
          <Text variant="default" className="text-center">Loading account details...</Text>
        </CardContent>
      </Card>
    );
  }

  return (
    <Stack gap={6}>
      <Card>
        <CardHeader>
          <Text variant="heading">Account Overview</Text>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Text variant="label" className="text-sm text-gray-500">Address</Text>
              <Text variant="default" className="font-mono break-all">{accountInfo.address}</Text>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Text variant="label" className="text-sm text-gray-500">Balance</Text>
                <Text variant="default">{accountInfo.balance.toFixed(9)} SOL</Text>
              </div>
              
              <div>
                <Text variant="label" className="text-sm text-gray-500">Owner</Text>
                <Text variant="default" className="font-mono">{accountInfo.owner}</Text>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <Text variant="heading">Recent Transactions</Text>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <Text variant="default" className="text-center">No transactions found</Text>
          ) : (
            <div className="space-y-4">
              {transactions.map((tx) => (
                <div key={tx.signature} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <Text variant="label" className="text-xs text-gray-500">Signature</Text>
                      <Text variant="default" className="font-mono text-sm">{tx.signature}</Text>
                    </div>
                    <div className="text-right">
                      <Text variant="label" className="text-xs text-gray-500">Amount</Text>
                      <Text variant="default">{tx.amount.toFixed(9)} SOL</Text>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </Stack>
  );
} 