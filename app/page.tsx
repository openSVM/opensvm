'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import { getConnection } from '@/lib/solana';
import { AIChatSidebar } from '@/components/ai/AIChatSidebar';
import { RecentBlocks } from '@/components/RecentBlocks';
import { TransactionsInBlock } from '@/components/TransactionsInBlock';
import { NetworkResponseChart } from '@/components/NetworkResponseChart';

interface Block {
  slot: number;
  transactions?: {
    signature: string;
    type: string;
    timestamp: number | null;
  }[];
}

interface NetworkStats {
  epoch: number;
  epochProgress: number;
  blockHeight: number;
  activeValidators: number | null;
  tps: number;
  successRate: number;
}

export default function HomePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState<NetworkStats | null>(null);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [selectedBlock, setSelectedBlock] = useState<Block | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(400);
  const [isResizing, setIsResizing] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function fetchData() {
      try {
        setIsLoading(true);
        const connection = await getConnection();
        
        // Get current slot and blocks in one batch
        const slot = await connection.getSlot();
        const startSlot = Math.max(0, slot - 9);
        const slots = await connection.getBlocks(startSlot, slot);
        
        if (!mounted) return;

        // Update blocks
        const blockData = slots.map(slot => ({ slot }));
        setBlocks(blockData);

        // Get epoch info and other stats
        const epochInfo = await connection.getEpochInfo();
        const validators = await connection.getVoteAccounts();
        const perfSamples = await connection.getRecentPerformanceSamples(1);
        
        if (!mounted) return;

        const tps = perfSamples[0] ? Math.round(perfSamples[0].numTransactions / perfSamples[0].samplePeriodSecs) : 0;
        
        setStats({
          epoch: epochInfo.epoch,
          epochProgress: (epochInfo.slotIndex / epochInfo.slotsInEpoch) * 100,
          blockHeight: epochInfo.absoluteSlot,
          activeValidators: validators.current.length + validators.delinquent.length,
          tps,
          successRate: 100,
        });
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    fetchData();
    // Refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery) return;
    router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
  };

  const handleBlockSelect = async (block: Block) => {
    try {
      const connection = await getConnection();
      const blockInfo = await connection.getBlock(block.slot, {
        maxSupportedTransactionVersion: 0
      });
      
      if (blockInfo) {
        const blockWithTx = {
          ...block,
          transactions: blockInfo.transactions.map(tx => ({
            signature: tx.transaction.signatures[0],
            type: 'Transaction',
            timestamp: blockInfo.blockTime
          }))
        };
        setSelectedBlock(blockWithTx);
      }
    } catch (err) {
      console.error('Error fetching block transactions:', err);
    }
  };

  return (
    <div className="relative">
      <main 
        className="min-h-screen bg-background"
        style={{ 
          width: isAIChatOpen ? `calc(100% - ${sidebarWidth}px)` : '100%',
          transition: !isResizing ? 'all 300ms ease-in-out' : 'none',
          marginRight: isAIChatOpen ? `${sidebarWidth}px` : 0
        }}
      >
        {/* Hero Section */}
        <div className="container mx-auto px-4 py-12">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-4">
              OpenSVM Explorer
            </h1>
            <p className="text-xl text-muted-foreground">
              The quieter you become, the more you are able to hear.
            </p>
          </div>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-16">
            <form onSubmit={handleSearch} className="relative">
              <Input
                type="text"
                placeholder="Search transactions, blocks, programs and tokens..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-12 pl-12 pr-4 bg-muted/50 border-0"
              />
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={20} />
              <Button 
                type="submit"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 px-6"
              >
                Search
              </Button>
            </form>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-background border border-border rounded-lg p-6">
              <div className="text-3xl font-mono text-foreground mb-2">
                {stats?.blockHeight?.toLocaleString() ?? '...'}
              </div>
              <div className="text-sm text-muted-foreground">
                Blocks Processed
              </div>
            </div>
            <div className="bg-background border border-border rounded-lg p-6">
              <div className="text-3xl font-mono text-foreground mb-2">
                {stats?.activeValidators?.toLocaleString() ?? '...'}
              </div>
              <div className="text-sm text-muted-foreground">
                Active Validators
              </div>
            </div>
            <div className="bg-background border border-border rounded-lg p-6">
              <div className="text-3xl font-mono text-foreground mb-2">
                {stats?.tps?.toLocaleString() ?? '...'}
              </div>
              <div className="text-sm text-muted-foreground">
                TPS
              </div>
            </div>
          </div>

          {/* Network Stats */}
          <div className="bg-background border border-border rounded-lg p-6 mb-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <div className="text-sm text-muted-foreground mb-2">Current Epoch</div>
                <div className="text-2xl font-mono text-foreground">{stats?.epoch ?? '...'}</div>
                <div className="w-full bg-muted h-1 mt-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-primary h-1" 
                    style={{ width: `${stats?.epochProgress ?? 0}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-2">Network Load</div>
                <div className="text-2xl font-mono text-foreground">
                  {stats?.epochProgress?.toFixed(2) ?? '0'}%
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-2">Block Height</div>
                <div className="text-2xl font-mono text-foreground">
                  {stats?.blockHeight?.toLocaleString() ?? '...'}
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-background border border-border rounded-lg p-6">
              <RecentBlocks 
                blocks={blocks}
                onBlockSelect={handleBlockSelect}
                isLoading={isLoading}
              />
            </div>
            <div className="bg-background border border-border rounded-lg p-6">
              <TransactionsInBlock block={selectedBlock} />
            </div>
          </div>

          {/* Network Performance Section */}
          <div className="mt-6">
            <div className="bg-background border border-border rounded-lg p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Network Performance</h2>
              <div className="h-[360px] md:h-[340px]">
                <NetworkResponseChart />
              </div>
            </div>
          </div>

          {/* AI Assistant Button */}
          <div className="fixed bottom-6 right-6">
            <Button
              className="bg-[#00DC82] text-black hover:bg-[#00DC82]/90 h-12 px-6 rounded-full shadow-lg"
              onClick={() => setIsAIChatOpen(true)}
            >
              AI Assistant
            </Button>
          </div>
        </div>
      </main>

      {/* AI Chat Sidebar */}
      <AIChatSidebar 
        isOpen={isAIChatOpen}
        onClose={() => setIsAIChatOpen(false)}
        onWidthChange={setSidebarWidth}
        onResizeStart={() => setIsResizing(true)}
        onResizeEnd={() => setIsResizing(false)}
        initialWidth={sidebarWidth}
      />
    </div>
  );
}
