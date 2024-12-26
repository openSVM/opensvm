'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Text, Button } from 'rinlab';
import RecentTransactions from '@/components/RecentTransactions';

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  const handleSearch = () => {
    if (searchQuery) {
      router.push(`/account/${searchQuery}`);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between items-center">
            <div className="flex items-center">
              <span className="text-[18px] font-semibold text-black">OPENSVM</span>
              <div className="ml-4 flex items-center text-sm text-[#666]">
                <span className="text-[#00ffbd]">$198.35</span>
                <span className="ml-1 text-[#22c55e]">+3.15%</span>
                <span className="ml-4">Avg Fee: 0.00001304</span>
              </div>
              <nav className="ml-10 flex space-x-4">
                <a href="/" className="text-[#333] hover:text-[#00ffbd]">Home</a>
                <a href="/tokens" className="text-[#666] hover:text-[#333]">Tokens</a>
                <a href="/nfts" className="text-[#666] hover:text-[#333]">NFTs</a>
                <a href="/analytics" className="text-[#666] hover:text-[#333]">Analytics</a>
              </nav>
            </div>
            <Button variant="default" className="bg-[#00ffbd] hover:bg-[#00e6aa] text-black">
              Connect Wallet
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <Text variant="heading" className="text-4xl font-bold mb-4">
            Solana Block Explorer
          </Text>
          <Text variant="label" className="text-lg mb-8">
            Search for any Solana address, transaction, token, or NFT
          </Text>
          <div className="max-w-3xl mx-auto">
            <div className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Search transactions, blocks, programs and tokens"
                className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#00ffbd] focus:border-transparent"
              />
              <Button 
                variant="default" 
                onClick={handleSearch}
                className="bg-[#00ffbd] hover:bg-[#00e6aa] text-black px-8"
              >
                Search
              </Button>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          <RecentTransactions />
        </div>
      </main>
    </div>
  );
}
