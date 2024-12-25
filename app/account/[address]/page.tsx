'use client';

import { useEffect, useState, use } from 'react';
import { getAccountInfo, getTransactionHistory } from '@/lib/solana';
import AccountOverview from '@/components/AccountOverview';
import TransactionsTable from '@/components/TransactionsTable';
import SearchBar from '@/components/SearchBar';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface AccountData {
  lamports: number;
  tokenAccounts?: any[];
  isSystemProgram: boolean;
}

export default function AccountPage({ params }: { params: Promise<{ address: string }> }) {
  const { address } = use(params);
  const [accountData, setAccountData] = useState<AccountData | null>(null);
  const [transactions, setTransactions] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('transactions');
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
        setTransactions([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [address]);

  const handleSearch = (address: string) => {
    if (address) {
      router.push(`/account/${address}`);
    }
  };

  return (
    <main className="min-h-screen bg-[#f8f9fa]">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <Link href="/" className="text-xl font-bold text-[#333]">
                OPENSVM
              </Link>
              <div className="ml-4 flex items-center text-sm text-[#666]">
                <span className="text-[#00ffbd]">$198.35</span>
                <span className="ml-1 text-[#22c55e]">+3.15%</span>
                <span className="ml-4">Avg Fee: 0.00001304</span>
              </div>
              <nav className="ml-10 flex space-x-4">
                <Link href="/" className="text-[#333] hover:text-[#00ffbd]">
                  Home
                </Link>
                <Link href="/tokens" className="text-[#666] hover:text-[#333]">
                  Tokens
                </Link>
                <Link href="/nfts" className="text-[#666] hover:text-[#333]">
                  NFTs
                </Link>
                <Link href="/analytics" className="text-[#666] hover:text-[#333]">
                  Analytics
                </Link>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <button className="rounded-lg bg-[#00ffbd] px-4 py-2 text-sm font-medium text-black hover:bg-[#00e6aa]">
                Connect Wallet
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-2">
        <div className="mb-2">
          <SearchBar onSearch={handleSearch} />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-lg text-[#666]">Loading...</div>
          </div>
        ) : error ? (
          <div className="rounded bg-red-50 p-4">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        ) : accountData ? (
          <>
            <div className="mb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <h1 className="text-[22px] font-semibold text-[#333]">Account</h1>
                  <div className="ml-4 flex items-center text-[#666]">
                    <span className="text-[13px]">{address}</span>
                    <button className="ml-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                        <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button className="rounded bg-[#00ffbd] px-3 py-1 text-[13px] font-medium text-black hover:bg-[#00e6aa]">
                    + Buy
                  </button>
                  <button className="rounded bg-white px-3 py-1 text-[13px] font-medium text-[#333] hover:bg-gray-50">
                    Exchange
                  </button>
                  <button className="rounded bg-white px-3 py-1 text-[13px] font-medium text-[#333] hover:bg-gray-50">
                    Play
                  </button>
                  <a href="https://pilot.buzz" target="_blank" rel="noopener noreferrer" className="rounded bg-white px-3 py-1 text-[13px] font-medium text-[#333] hover:bg-gray-50">
                    Create on-chain agents
                  </a>
                </div>
              </div>
            </div>

            <div className="mb-2 rounded bg-white p-2">
              <div className="flex items-center">
                <span className="text-[13px] font-medium text-[#333]">Featured:</span>
                <a href="https://pad404.com" target="_blank" rel="noopener noreferrer" className="ml-2 text-[13px] text-blue-500 hover:underline">
                  Unlock the Power of Solana with pad404
                </a>
              </div>
            </div>

            <AccountOverview
              address={address}
              solBalance={accountData.lamports / 1e9}
              tokenAccounts={accountData.tokenAccounts || []}
              isSystemProgram={accountData.isSystemProgram}
            />

            <div className="mt-2">
              <div className="flex space-x-4 border-b border-gray-200">
                <button 
                  onClick={() => setActiveTab('transactions')}
                  className={`px-3 py-2 text-[13px] font-medium ${
                    activeTab === 'transactions' 
                      ? 'border-b-2 border-[#00ffbd] text-[#333]' 
                      : 'text-[#666] hover:text-[#333]'
                  }`}
                >
                  Transactions
                </button>
                <button 
                  onClick={() => setActiveTab('transfers')}
                  className={`px-3 py-2 text-[13px] font-medium ${
                    activeTab === 'transfers' 
                      ? 'border-b-2 border-[#00ffbd] text-[#333]' 
                      : 'text-[#666] hover:text-[#333]'
                  }`}
                >
                  Transfers
                </button>
                <button 
                  onClick={() => setActiveTab('defi')}
                  className={`px-3 py-2 text-[13px] font-medium ${
                    activeTab === 'defi' 
                      ? 'border-b-2 border-[#00ffbd] text-[#333]' 
                      : 'text-[#666] hover:text-[#333]'
                  }`}
                >
                  DeFi Activities
                </button>
                <button 
                  onClick={() => setActiveTab('nft')}
                  className={`px-3 py-2 text-[13px] font-medium ${
                    activeTab === 'nft' 
                      ? 'border-b-2 border-[#00ffbd] text-[#333]' 
                      : 'text-[#666] hover:text-[#333]'
                  }`}
                >
                  NFT Activities
                </button>
                <button 
                  onClick={() => setActiveTab('balance')}
                  className={`px-3 py-2 text-[13px] font-medium ${
                    activeTab === 'balance' 
                      ? 'border-b-2 border-[#00ffbd] text-[#333]' 
                      : 'text-[#666] hover:text-[#333]'
                  }`}
                >
                  Balance Changes
                </button>
                <button 
                  onClick={() => setActiveTab('analytics')}
                  className={`px-3 py-2 text-[13px] font-medium ${
                    activeTab === 'analytics' 
                      ? 'border-b-2 border-[#00ffbd] text-[#333]' 
                      : 'text-[#666] hover:text-[#333]'
                  }`}
                >
                  Analytics
                </button>
                <button 
                  onClick={() => setActiveTab('portfolio')}
                  className={`px-3 py-2 text-[13px] font-medium ${
                    activeTab === 'portfolio' 
                      ? 'border-b-2 border-[#00ffbd] text-[#333]' 
                      : 'text-[#666] hover:text-[#333]'
                  }`}
                >
                  Portfolio
                </button>
                <button 
                  onClick={() => setActiveTab('stake')}
                  className={`px-3 py-2 text-[13px] font-medium ${
                    activeTab === 'stake' 
                      ? 'border-b-2 border-[#00ffbd] text-[#333]' 
                      : 'text-[#666] hover:text-[#333]'
                  }`}
                >
                  Stake Accounts
                </button>
                <button 
                  onClick={() => setActiveTab('domains')}
                  className={`px-3 py-2 text-[13px] font-medium ${
                    activeTab === 'domains' 
                      ? 'border-b-2 border-[#00ffbd] text-[#333]' 
                      : 'text-[#666] hover:text-[#333]'
                  }`}
                >
                  Domains
                </button>
              </div>

              {activeTab === 'transactions' ? (
                <TransactionsTable transactions={transactions} />
              ) : (
                <div className="mt-4 text-center text-[13px] text-[#666]">Coming soon...</div>
              )}
            </div>
          </>
        ) : null}
      </div>
    </main>
  );
} 