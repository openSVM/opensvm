'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { RecentBlocks } from '@/components/RecentBlocks';
import { TransactionsInBlock } from '@/components/TransactionsInBlock';
import { NetworkResponseChart } from '@/components/NetworkResponseChart';
import { connection } from '@/lib/solana';
import { SystemProgram } from '@solana/web3.js';
import { CyberpunkPerlin } from '@/components/CyberpunkPerlin';

interface NetworkStats {
  epoch: number;
  epochProgress: number;
  blockHeight: number;
  activeValidators: number;
  tps: number;
  successRate: number;
}

interface Block {
  slot: number;
  transactions?: {
    signature: string;
    type: string;
    timestamp: number | null;
  }[];
}

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState<NetworkStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBlock, setSelectedBlock] = useState<Block | null>(null);
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
      router.push(`/account/${searchQuery}`);
    } else if (!isNaN(Number(searchQuery))) {
      router.push(`/block/${searchQuery}`);
    } else {
      router.push(`/account/${searchQuery}`);
    }
  };

  const STATS_ITEMS = [
    { label: 'Blocks Processed', value: stats?.blockHeight.toLocaleString() ?? '...' },
    { label: 'Active Validators', value: stats?.activeValidators.toLocaleString() ?? '...' },
    { label: 'TPS', value: stats?.tps.toLocaleString() ?? '...' },
  ];

  return (
    <main className="min-h-screen bg-white">
      {/* Mobile View */}
      <div className="md:hidden">
        <div className="relative h-[25vh] w-full bg-white">
          <div className="absolute inset-0 flex flex-col items-center justify-center px-4">
            <h1 className="text-3xl font-bold text-gray-900 text-center mb-4">
              OpenSVM Explorer
            </h1>
            <form onSubmit={handleSearch} className="w-full">
              <div className="flex flex-col gap-2">
                <Input
                  placeholder="Search by address, signature, block..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-gray-200 text-gray-900 placeholder:text-gray-400 h-12 pl-4 rounded-lg focus:border-gray-400 focus:ring-gray-400"
                />
                <Button 
                  type="submit" 
                  className="w-full h-12 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-lg"
                >
                  Search
                </Button>
              </div>
            </form>
          </div>
        </div>

        <div className="px-4 py-6">
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-white border border-gray-200 rounded-lg p-4 col-span-2">
              <h3 className="text-sm font-medium text-gray-500">Current Epoch</h3>
              <p className="text-2xl font-medium text-gray-900">{stats?.epoch || '...'}</p>
              <div className="w-full bg-gray-100 h-1 mt-2 rounded-full overflow-hidden">
                <div 
                  className="bg-gray-900 h-1" 
                  style={{ width: `${stats?.epochProgress || 0}%` }}
                />
              </div>
              <p className="text-sm text-gray-500 mt-1">{stats?.epochProgress?.toFixed(2) || 0}% complete</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-500">TPS</h3>
              <p className="text-2xl font-medium text-gray-900">{stats?.tps || '...'}</p>
              <p className="text-sm text-gray-500">{stats?.successRate?.toFixed(1) || 0}% success</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-500">Validators</h3>
              <p className="text-2xl font-medium text-gray-900">{stats?.activeValidators || '...'}</p>
              <p className="text-sm text-gray-500">Active now</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4">Recent Blocks</h2>
              <RecentBlocks onBlockSelect={setSelectedBlock} />
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <TransactionsInBlock block={selectedBlock} />
            </div>
          </div>
        </div>
      </div>

      {/* Desktop View */}
      <div className="hidden md:block relative">
        <div className="container mx-auto px-4 py-8">
          {/* Hero Section */}
          <div className="max-w-3xl mx-auto mb-12">
            <div className="text-center mb-8">
              <h1 className="text-5xl font-bold text-gray-900 mb-4">
                OpenSVM Explorer
              </h1>
              <p className="text-gray-600 text-xl">
                Explore the Solana network in style
              </p>
            </div>
            
            <form onSubmit={handleSearch} className="relative">
              <Input
                type="text"
                placeholder="Search transactions, blocks, programs and tokens..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-gray-200 text-gray-900 placeholder:text-gray-400 h-12 pl-4 pr-24 rounded-lg focus:border-gray-400 focus:ring-gray-400"
              />
              <Button 
                type="submit" 
                className="absolute right-2 top-2 bg-gray-900 hover:bg-gray-800 text-white font-medium h-8 px-4 rounded-md"
              >
                Search
              </Button>
            </form>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {STATS_ITEMS.map((stat) => (
              <div 
                key={stat.label} 
                className="bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors shadow-sm"
              >
                <div className="text-2xl font-medium text-gray-900 mb-1">{stat.value}</div>
                <div className="text-gray-500 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Network Stats */}
          {stats && (
            <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <div className="text-sm text-gray-500 mb-1">Current Epoch</div>
                  <div className="text-xl text-gray-900">{stats.epoch}</div>
                  <div className="w-full bg-gray-100 h-1 mt-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-gray-900 h-1" 
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <RecentBlocks onBlockSelect={setSelectedBlock} />
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <TransactionsInBlock block={selectedBlock} />
            </div>
          </div>

          {/* Network Performance Section */}
          <div className="mt-6 bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Network Performance</h2>
            <div className="h-[300px]">
              <NetworkResponseChart />
            </div>
          </div>

          {/* Network Visualization Section */}
          <div className="mt-6 bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Network Visualization</h2>
            <div className="h-[500px] relative rounded-lg overflow-hidden border border-gray-200">
              <CyberpunkPerlin />
            </div>
            <p className="mt-4 text-gray-500 text-sm">
              An ASCII art visualization of the Solana network activity. The patterns represent network nodes and their connections, 
              with darker areas indicating higher activity. Use the controls to adjust the visualization.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
