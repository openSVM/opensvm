"use client";

import { useState } from 'react';
import { getAccountInfo, getTransactionHistory } from '@/lib/solana';
import Navbar from '@/components/Navbar';
import AccountOverview from '@/components/AccountOverview';
import TransactionsTable from '@/components/TransactionsTable';

interface AccountData {
  lamports: number;
  tokenAccounts?: any[];
  isSystemProgram: boolean;
}

export default function Home() {
  const [address, setAddress] = useState('');
  const [accountData, setAccountData] = useState<AccountData | null>(null);
  const [transactions, setTransactions] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) return;

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
      setTransactions([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <form onSubmit={handleSearch} className="flex flex-col space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
            <div className="flex-1">
              <label htmlFor="search" className="sr-only">
                Search by Address / Txn Hash / Block / Token
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="search"
                  id="search"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="block w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-4 pr-10 text-[13px] placeholder-gray-500 focus:border-[#00ffbd] focus:outline-none focus:ring-1 focus:ring-[#00ffbd]"
                  placeholder="Search by Address / Txn Hash / Block / Token"
                />
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center justify-center rounded-lg bg-[#00ffbd] px-6 py-2.5 text-[13px] font-medium text-black hover:bg-[#00e6aa] focus:outline-none focus:ring-2 focus:ring-[#00ffbd] focus:ring-offset-2 disabled:opacity-50"
            >
              {isLoading ? 'Searching...' : 'Search'}
            </button>
          </form>
        </div>

        {error && (
          <div className="mb-8 rounded-lg bg-red-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-[13px] text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {accountData && (
          <>
            <AccountOverview
              address={address}
              solBalance={accountData.lamports / 1e9}
              tokenAccounts={accountData.tokenAccounts || []}
              isSystemProgram={accountData.isSystemProgram}
            />
            <TransactionsTable transactions={transactions} />
          </>
        )}
      </main>
    </div>
  );
}
