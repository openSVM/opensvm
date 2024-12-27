'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

const EXAMPLE_TOKENS = [
  { symbol: 'BONK', name: 'Bonk', price: 0.00001234, change: 15.2, volume: '1.2M', score: 89 },
  { symbol: 'SAMO', name: 'Samoyedcoin', price: 0.0145, change: 8.5, volume: '890K', score: 75 },
  { symbol: 'MEME', name: 'Memecoin', price: 0.00234, change: -5.2, volume: '450K', score: 45 },
  { symbol: 'PEPE', name: 'Pepe', price: 0.000089, change: 22.1, volume: '2.1M', score: 92 },
  { symbol: 'DOGE', name: 'Dogecoin', price: 0.0789, change: -2.4, volume: '950K', score: 62 },
];

const TOP_TOKENS = [
  { symbol: 'SOL', name: 'Solana', price: 198.35, change: 3.15, marketCap: '84.5B' },
  { symbol: 'RAY', name: 'Raydium', price: 2.45, change: 1.8, marketCap: '425M' },
  { symbol: 'BONK', name: 'Bonk', price: 0.00001234, change: 15.2, marketCap: '285M' },
  { symbol: 'ORCA', name: 'Orca', price: 1.85, change: -0.5, marketCap: '198M' },
  { symbol: 'SAMO', name: 'Samoyedcoin', price: 0.0145, change: 8.5, marketCap: '145M' },
];

export default function TokensPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [timeframe, setTimeframe] = useState('5m');

  return (
    <main className="container mx-auto p-4">
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="text-2xl font-bold mb-2">Tokens</h1>
          <p className="text-muted-foreground">Browse and search Solana tokens</p>
        </div>

        <div className="flex gap-4">
          <Input
            type="text"
            placeholder="Search by token name, symbol, or address"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-xl bg-secondary/50"
          />
          <Button className="bg-[#00DC82] hover:bg-[#00DC82]/80">Search</Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Top Tokens */}
          <div className="rounded-lg border bg-card">
            <div className="p-6 border-b">
              <h2 className="font-semibold">Top Tokens</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-4 gap-4 font-medium text-sm text-muted-foreground mb-4">
                <div>Token</div>
                <div>Price</div>
                <div>24h Change</div>
                <div>Market Cap</div>
              </div>
              <div className="space-y-2">
                {TOP_TOKENS.map((token) => (
                  <div key={token.symbol} className="grid grid-cols-4 gap-4 text-sm p-3 rounded bg-secondary/50 hover:bg-secondary/80 transition-colors">
                    <div className="font-medium">{token.symbol}</div>
                    <div>${token.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 })}</div>
                    <div className={token.change >= 0 ? 'text-[#00DC82]' : 'text-red-500'}>
                      {token.change >= 0 ? '+' : ''}{token.change}%
                    </div>
                    <div>${token.marketCap}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Pump/Fun Screener */}
          <div className="rounded-lg border bg-card">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="font-semibold">Pump Screener</h2>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Timeframe:</span>
                <Tabs value={timeframe} onValueChange={setTimeframe} className="h-8">
                  <TabsList className="bg-secondary/50">
                    <TabsTrigger value="5m" className="text-xs">5m</TabsTrigger>
                    <TabsTrigger value="15m" className="text-xs">15m</TabsTrigger>
                    <TabsTrigger value="1h" className="text-xs">1h</TabsTrigger>
                    <TabsTrigger value="4h" className="text-xs">4h</TabsTrigger>
                    <TabsTrigger value="1d" className="text-xs">1d</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-5 gap-4 font-medium text-sm text-muted-foreground mb-4">
                <div>Token</div>
                <div>Price</div>
                <div>Change</div>
                <div>Volume</div>
                <div>Score</div>
              </div>
              <div className="space-y-2">
                {EXAMPLE_TOKENS.map((token) => (
                  <div key={token.symbol} className="grid grid-cols-5 gap-4 text-sm p-3 rounded bg-secondary/50 hover:bg-secondary/80 transition-colors">
                    <div className="font-medium">{token.symbol}</div>
                    <div>${token.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 })}</div>
                    <div className={token.change >= 0 ? 'text-[#00DC82]' : 'text-red-500'}>
                      {token.change >= 0 ? '+' : ''}{token.change}%
                    </div>
                    <div>${token.volume}</div>
                    <div className="font-medium text-[#00DC82]">{token.score}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Additional Screener Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-lg border bg-card p-6">
            <div className="text-sm text-muted-foreground mb-2">Total Pumps</div>
            <div className="text-2xl font-bold">24</div>
            <div className="text-[#00DC82] text-sm mt-1">Last 24h</div>
          </div>

          <div className="rounded-lg border bg-card p-6">
            <div className="text-sm text-muted-foreground mb-2">Avg Pump Size</div>
            <div className="text-2xl font-bold">+18.5%</div>
            <div className="text-[#00DC82] text-sm mt-1">Last 24h</div>
          </div>

          <div className="rounded-lg border bg-card p-6">
            <div className="text-sm text-muted-foreground mb-2">Total Volume</div>
            <div className="text-2xl font-bold">$12.4M</div>
            <div className="text-[#00DC82] text-sm mt-1">Last 24h</div>
          </div>

          <div className="rounded-lg border bg-card p-6">
            <div className="text-sm text-muted-foreground mb-2">Active Tokens</div>
            <div className="text-2xl font-bold">1,245</div>
            <div className="text-sm text-muted-foreground mt-1">+123 new today</div>
          </div>
        </div>
      </div>
    </main>
  );
} 