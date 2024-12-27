'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import RecentBlocks from '@/components/RecentBlocks';
import TopPrograms from '@/components/TopPrograms';
import TrendingMemecoins from '@/components/TrendingMemecoins';
import TrendingNFTs from '@/components/TrendingNFTs';

interface NetworkStats {
  solPrice: number;
  priceChange: number;
  avgFee: number;
  epoch: number;
  epochProgress: number;
  blockHeight: number;
  totalTransactions: string;
  currentStake: string;
}

const EXAMPLE_STATS: NetworkStats = {
  solPrice: 198.35,
  priceChange: 3.15,
  avgFee: 9e-7,
  epoch: 717,
  epochProgress: 75.74,
  blockHeight: 288406300,
  totalTransactions: "353,060,842,003",
  currentStake: "389,287,378.76"
};

const STATS_ITEMS = [
  { label: 'Blocks Processed', value: '288,406,300' },
  { label: 'Active Validators', value: '1,967' },
  { label: 'TPS', value: '4,819' },
  { label: 'Success Rate', value: '99.98%' },
];

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState<NetworkStats>(EXAMPLE_STATS);
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery) return;

    if (searchQuery.length === 88 || searchQuery.length === 87) {
      router.push(`/tx/${searchQuery}`);
    } else if (searchQuery.length === 32 || searchQuery.length === 44) {
      router.push(`/address/${searchQuery}`);
    } else if (!isNaN(Number(searchQuery))) {
      router.push(`/block/${searchQuery}`);
    } else {
      router.push(`/address/${searchQuery}`);
    }
  };

  return (
    <main className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        {/* Search Section */}
        <div className="max-w-3xl mx-auto mb-12">
          <form onSubmit={handleSearch} className="relative">
            <Input
              type="text"
              placeholder="Search transactions, blocks, programs and tokens..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 text-gray-900 placeholder:text-gray-400 h-12 pl-4 pr-24 rounded-lg"
            />
            <Button 
              type="submit" 
              className="absolute right-2 top-2 bg-gray-900 hover:bg-gray-800 text-white h-8 px-4 rounded-md"
            >
              Search
            </Button>
          </form>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
          {STATS_ITEMS.map((stat) => (
            <div key={stat.label} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="text-2xl font-medium text-gray-900 mb-1">{stat.value}</div>
              <div className="text-gray-500 text-sm">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Network Stats */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="text-sm text-gray-500 mb-1">Current Epoch</div>
              <div className="text-xl text-gray-900">{stats.epoch}</div>
              <div className="w-full bg-gray-200 h-1 mt-2">
                <div 
                  className="bg-gray-900 h-1" 
                  style={{ width: `${stats.epochProgress}%` }}
                />
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-1">Network Load</div>
              <div className="text-xl text-gray-900">{stats.epochProgress}%</div>
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-1">Block Height</div>
              <div className="text-xl text-gray-900">{stats.blockHeight.toLocaleString()}</div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 gap-8">
          <RecentBlocks />
          <TopPrograms />
          <TrendingMemecoins />
          <TrendingNFTs />
        </div>
      </div>
    </main>
  );
}
