'use client';

import { useEffect, useState } from 'react';
import { getAccountInfo, getTransactionHistory } from '@/lib/solana';
import AccountOverview from '@/components/AccountOverview';
import TransactionList from '@/components/TransactionList';
import TransactionFlowChart from '@/components/TransactionFlowChart';
import SearchBar from '@/components/SearchBar';
import { useRouter } from 'next/navigation';
import { Stack } from 'rinlab';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

interface AccountData {
  lamports: number;
  tokenAccounts?: any[];
  isSystemProgram: boolean;
}

interface PageProps {
  params: {
    address: string;
  };
}

export default function AccountPage({ params }: PageProps) {
  const { address } = params;
  const [accountData, setAccountData] = useState<AccountData | null>(null);
  const [transactions, setTransactions] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError('');

      try {
        const [account, txs] = await Promise.all([
          getAccountInfo(address),
          getTransactionHistory(address)
        ]);

        setAccountData(account);
        setTransactions(txs);
      } catch (err) {
        setError('Failed to fetch account data. Please check the address and try again.');
        setAccountData(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [address]);

  const calculateFlowData = () => {
    const days = Array.from({ length: 7 }, (_, i) => subDays(new Date(), i));
    
    return days.reverse().map(day => {
      const dayStart = startOfDay(day);
      const dayEnd = endOfDay(day);
      
      const dayTransactions = transactions.filter(tx => 
        tx.timestamp && tx.timestamp >= dayStart && tx.timestamp <= dayEnd
      );
      
      const inflow = dayTransactions.reduce((sum, tx) => 
        tx.status === 'Success' ? sum + tx.fee : sum, 0
      );
      
      const outflow = dayTransactions.reduce((sum, tx) => 
        tx.status === 'Failed' ? sum + tx.fee : sum, 0
      );
      
      return {
        timestamp: format(day, 'MMM d'),
        inflow,
        outflow
      };
    });
  };

  const handleSearch = (address: string) => {
    router.push(`/account/${address}`);
  };

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <SearchBar onSearch={handleSearch} />
        <div className="mt-8 text-center text-red-500">{error}</div>
      </div>
    );
  }

  if (isLoading || !accountData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <SearchBar onSearch={handleSearch} />
        <div className="mt-8 text-center">Loading...</div>
      </div>
    );
  }

  const flowData = calculateFlowData();

  return (
    <div className="container mx-auto px-4 py-8">
      <SearchBar onSearch={handleSearch} />
      <Stack gap={4} className="mt-8">
        <AccountOverview 
          address={address}
          solBalance={accountData.lamports / 1e9}
          tokenAccounts={accountData.tokenAccounts || []}
          isSystemProgram={accountData.isSystemProgram}
        />
        <div className="grid grid-cols-2 gap-4">
          <TransactionFlowChart data={flowData} />
          <TransactionList transactions={transactions} />
        </div>
      </Stack>
    </div>
  );
} 