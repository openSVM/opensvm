'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { RecentBlocks } from '@/components/RecentBlocks';
import { TransactionsInBlock } from '@/components/RecentTransactions';
import { NetworkResponseChart } from '@/components/NetworkResponseChart';
import { connection } from '@/lib/solana';
import { SystemProgram } from '@solana/web3.js';

interface NetworkStats {
  epoch: number;
  epochProgress: number;
  blockHeight: number;
  activeValidators: number;
  tps: number;
  successRate: number;
}

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState<NetworkStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let validatorCache: { current: number; delinquent: number } | null = null;
    let lastValidatorUpdate = 0;
    const VALIDATOR_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

    async function fetchNetworkStats() {
      try {
        // Fetch epoch info and performance samples in parallel
        const [epochInfo, perfSamples] = await Promise.all([
          connection.getEpochInfo(),
          connection.getRecentPerformanceSamples(1) // Only fetch most recent sample
        ]);
        
        // Calculate TPS from performance sample
        const recentSample = perfSamples[0];
        const tps = recentSample ? Math.round(recentSample.numTransactions / recentSample.samplePeriodSecs) : 0;
        
        // Calculate success rate from recent transactions
        const signatures = await connection.getSignaturesForAddress(
          SystemProgram.programId,
          { limit: 100 } // Reduced from 1000 to 100 for better performance
        );
        const successRate = signatures.length > 0
          ? (signatures.filter(sig => !sig.err).length / signatures.length) * 100
          : 100;

        // Get validator count with caching
        let activeValidators = 0;
        const now = Date.now();
        if (!validatorCache || now - lastValidatorUpdate > VALIDATOR_CACHE_TTL) {
          const validators = await connection.getVoteAccounts();
          validatorCache = {
            current: validators.current.length,
            delinquent: validators.delinquent.length
          };
          lastValidatorUpdate = now;
        }
        activeValidators = validatorCache.current + validatorCache.delinquent;

        setStats({
          epoch: epochInfo.epoch,
          epochProgress: (epochInfo.slotIndex / epochInfo.slotsInEpoch) * 100,
          blockHeight: epochInfo.absoluteSlot,
          activeValidators,
          tps,
          successRate,
        });
      } catch (error) {
        console.error('Error fetching network stats:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchNetworkStats();
  }, []); // Only fetch once on mount

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

  const STATS_ITEMS = [
    { label: 'Blocks Processed', value: stats?.blockHeight.toLocaleString() ?? '...' },
    { label: 'Active Validators', value: stats?.activeValidators.toLocaleString() ?? '...' },
    { label: 'TPS', value: stats?.tps.toLocaleString() ?? '...' },
  ];

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
              className="w-full bg-white border border-gray-200 text-gray-900 placeholder:text-gray-400 h-12 pl-4 pr-24 rounded-lg"
            />
            <Button 
              type="submit" 
              className="absolute right-2 top-2 bg-black hover:bg-gray-800 text-white h-8 px-4 rounded-md"
            >
              Search
            </Button>
          </form>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
          {STATS_ITEMS.map((stat) => (
            <div key={stat.label} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="text-2xl font-medium text-gray-900 mb-1">{stat.value}</div>
              <div className="text-gray-500 text-sm">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Network Stats */}
        {stats && (
          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <div className="text-sm text-gray-500 mb-1">Current Epoch</div>
                <div className="text-xl text-gray-900">{stats.epoch}</div>
                <div className="w-full bg-gray-100 h-1 mt-2">
                  <div 
                    className="bg-black h-1" 
                    style={{ width: `${stats.epochProgress}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-1">Network Load</div>
                <div className="text-xl text-gray-900">{stats.epochProgress.toFixed(2)}%</div>
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-1">Block Height</div>
                <div className="text-xl text-gray-900">{stats.blockHeight.toLocaleString()}</div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <RecentBlocks />
          <TransactionsInBlock />
        </div>
      </div>
    </main>
  );
}
