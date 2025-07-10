'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import LoadingSpinner from '@/components/LoadingSpinner';
import { formatNumber } from '@/lib/utils';
import { ExternalLink, TrendingUp, TrendingDown, BookOpen, Clock, Zap, BarChart3, Search, Users } from 'lucide-react';

interface CLOBData {
  name: string;
  protocol: string;
  volume24h: number;
  trades24h: number;
  avgSpread: number;
  liquidity: number;
  pairs: number;
  orderBookDepth: number;
  avgLatency: number;
  feeStructure: {
    maker: number;
    taker: number;
  };
  chains: string[];
  category: string;
  description: string;
  website: string;
  change24h: number;
  activeOrders: number;
  uniqueTraders24h: number;
  nativeToken: string;
  isLive: boolean;
  features: string[];
}

export default function CLOBsSection() {
  const [clobs, setClobs] = useState<CLOBData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'volume24h' | 'liquidity' | 'trades24h' | 'avgSpread'>('volume24h');

  useEffect(() => {
    async function fetchCLOBData() {
      try {
        // In a real implementation, this would fetch from CLOB-specific APIs
        // For now, we'll create realistic CLOB data for Solana ecosystem
        const clobList: CLOBData[] = [
          {
            name: 'OpenBook (Serum V2)',
            protocol: 'OpenBook',
            volume24h: 125000000,
            trades24h: 45600,
            avgSpread: 0.05,
            liquidity: 45000000,
            pairs: 156,
            orderBookDepth: 2500000,
            avgLatency: 12,
            feeStructure: {
              maker: 0.0,
              taker: 0.04
            },
            chains: ['Solana'],
            category: 'Central Limit Order Book',
            description: 'Solana\'s premier CLOB DEX with institutional-grade order matching',
            website: 'https://openbookdex.com',
            change24h: 8.3,
            activeOrders: 12400,
            uniqueTraders24h: 8900,
            nativeToken: 'BOOK',
            isLive: true,
            features: ['Limit Orders', 'Market Orders', 'Stop Loss', 'Institutional APIs']
          },
          {
            name: 'Phoenix',
            protocol: 'Phoenix',
            volume24h: 78000000,
            trades24h: 23400,
            avgSpread: 0.08,
            liquidity: 28000000,
            pairs: 89,
            orderBookDepth: 1800000,
            avgLatency: 8,
            feeStructure: {
              maker: -0.01,
              taker: 0.03
            },
            chains: ['Solana'],
            category: 'High-Performance CLOB',
            description: 'Ultra-fast CLOB with maker rebates and advanced order types',
            website: 'https://phoenix.trade',
            change24h: 15.7,
            activeOrders: 8700,
            uniqueTraders24h: 5600,
            nativeToken: 'PHX',
            isLive: true,
            features: ['Maker Rebates', 'Advanced Orders', 'Sub-second Execution', 'API Trading']
          },
          {
            name: 'Mango Markets',
            protocol: 'Mango',
            volume24h: 89000000,
            trades24h: 34500,
            avgSpread: 0.12,
            liquidity: 67000000,
            pairs: 234,
            orderBookDepth: 3200000,
            avgLatency: 15,
            feeStructure: {
              maker: 0.02,
              taker: 0.06
            },
            chains: ['Solana'],
            category: 'Margin Trading CLOB',
            description: 'Decentralized trading platform with leverage and perpetuals',
            website: 'https://mango.markets',
            change24h: -3.2,
            activeOrders: 15600,
            uniqueTraders24h: 11200,
            nativeToken: 'MNGO',
            isLive: true,
            features: ['Margin Trading', 'Perpetuals', 'Cross-collateral', 'Portfolio Margin']
          },
          {
            name: 'Zeta Markets',
            protocol: 'Zeta',
            volume24h: 45000000,
            trades24h: 12800,
            avgSpread: 0.15,
            liquidity: 34000000,
            pairs: 67,
            orderBookDepth: 1200000,
            avgLatency: 18,
            feeStructure: {
              maker: 0.0,
              taker: 0.05
            },
            chains: ['Solana'],
            category: 'Options & Perps CLOB',
            description: 'Derivatives trading platform for options and perpetual swaps',
            website: 'https://zeta.markets',
            change24h: 6.8,
            activeOrders: 4200,
            uniqueTraders24h: 2800,
            nativeToken: 'ZETA',
            isLive: true,
            features: ['Options Trading', 'Perpetual Swaps', 'Risk Management', 'Portfolio View']
          },
          {
            name: 'Drift Protocol',
            protocol: 'Drift',
            volume24h: 156000000,
            trades24h: 56700,
            avgSpread: 0.06,
            liquidity: 78000000,
            pairs: 145,
            orderBookDepth: 4500000,
            avgLatency: 10,
            feeStructure: {
              maker: -0.005,
              taker: 0.045
            },
            chains: ['Solana'],
            category: 'Hybrid CLOB/AMM',
            description: 'Hybrid protocol combining CLOB efficiency with AMM liquidity',
            website: 'https://drift.trade',
            change24h: 12.1,
            activeOrders: 18900,
            uniqueTraders24h: 14500,
            nativeToken: 'DRIFT',
            isLive: true,
            features: ['Hybrid Model', 'JIT Liquidity', 'Perp Trading', 'Cross-margin']
          },
          {
            name: 'GooseFX',
            protocol: 'GooseFX',
            volume24h: 23000000,
            trades24h: 8900,
            avgSpread: 0.18,
            liquidity: 18000000,
            pairs: 45,
            orderBookDepth: 890000,
            avgLatency: 22,
            feeStructure: {
              maker: 0.03,
              taker: 0.07
            },
            chains: ['Solana'],
            category: 'Multi-Asset CLOB',
            description: 'Full-stack DeFi platform with CLOB, NFTs, and synthetics',
            website: 'https://goosefx.io',
            change24h: 4.3,
            activeOrders: 2800,
            uniqueTraders24h: 1900,
            nativeToken: 'GOFX',
            isLive: true,
            features: ['Multi-Asset Trading', 'Synthetic Assets', 'NFT Integration', 'SSL Pools']
          },
          {
            name: 'Cypher Protocol',
            protocol: 'Cypher',
            volume24h: 34000000,
            trades24h: 11200,
            avgSpread: 0.14,
            liquidity: 25000000,
            pairs: 78,
            orderBookDepth: 1100000,
            avgLatency: 16,
            feeStructure: {
              maker: 0.01,
              taker: 0.04
            },
            chains: ['Solana'],
            category: 'Cross-Margin CLOB',
            description: 'Cross-margined futures and spot trading with shared collateral',
            website: 'https://cypher.trade',
            change24h: -1.8,
            activeOrders: 3600,
            uniqueTraders24h: 2300,
            nativeToken: 'CYP',
            isLive: true,
            features: ['Cross-Margin', 'Shared Collateral', 'Futures Trading', 'Risk Engine']
          },
          {
            name: 'Ellipsis Labs',
            protocol: 'Ellipsis',
            volume24h: 67000000,
            trades24h: 28900,
            avgSpread: 0.07,
            liquidity: 42000000,
            pairs: 112,
            orderBookDepth: 2100000,
            avgLatency: 9,
            feeStructure: {
              maker: -0.02,
              taker: 0.035
            },
            chains: ['Solana'],
            category: 'Institutional CLOB',
            description: 'Institutional-grade CLOB with advanced order management',
            website: 'https://ellipsis.trade',
            change24h: 9.7,
            activeOrders: 7800,
            uniqueTraders24h: 4200,
            nativeToken: 'ELP',
            isLive: true,
            features: ['Institutional Tools', 'Advanced Orders', 'Market Making', 'Low Latency']
          }
        ];

        // Sort by volume by default
        clobList.sort((a, b) => b.volume24h - a.volume24h);
        setClobs(clobList);
      } catch (err) {
        console.error('Error fetching CLOB data:', err);
        setError('Failed to load CLOB data');
      } finally {
        setLoading(false);
      }
    }

    fetchCLOBData();
  }, []);

  const filteredClobs = clobs
    .filter(clob => 
      clob.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      clob.category.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => b[sortBy] - a[sortBy]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-red-500 mb-4">{error}</p>
        <Button onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Central Limit Order Books (CLOBs)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search CLOBs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={sortBy === 'volume24h' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSortBy('volume24h')}
              >
                Volume
              </Button>
              <Button
                variant={sortBy === 'liquidity' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSortBy('liquidity')}
              >
                Liquidity
              </Button>
              <Button
                variant={sortBy === 'trades24h' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSortBy('trades24h')}
              >
                Trades
              </Button>
              <Button
                variant={sortBy === 'avgSpread' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSortBy('avgSpread')}
              >
                Spread
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CLOB Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredClobs.map((clob) => (
          <Card key={clob.name} className="h-full">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                    {clob.nativeToken.substring(0, 3)}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{clob.name}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline">{clob.category}</Badge>
                      {clob.isLive && <Badge className="bg-green-500 text-white">Live</Badge>}
                    </div>
                  </div>
                </div>
                <Button size="sm" variant="ghost">
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground line-clamp-2">
                {clob.description}
              </p>
              
              {/* Key Trading Metrics */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted/50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <BarChart3 className="h-3 w-3" />
                    24h Volume
                  </div>
                  <p className="font-bold text-lg">${formatNumber(clob.volume24h)}</p>
                  <div className={`flex items-center gap-1 text-xs ${
                    clob.change24h >= 0 ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {clob.change24h >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {Math.abs(clob.change24h).toFixed(1)}%
                  </div>
                </div>
                
                <div className="bg-muted/50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <BookOpen className="h-3 w-3" />
                    Liquidity
                  </div>
                  <p className="font-bold text-lg">${formatNumber(clob.liquidity)}</p>
                  <p className="text-xs text-muted-foreground">
                    Depth: ${formatNumber(clob.orderBookDepth)}
                  </p>
                </div>
                
                <div className="bg-muted/50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <Zap className="h-3 w-3" />
                    Avg Spread
                  </div>
                  <p className="font-bold text-lg text-blue-500">{clob.avgSpread.toFixed(2)}%</p>
                  <p className="text-xs text-muted-foreground">
                    Latency: {clob.avgLatency}ms
                  </p>
                </div>
                
                <div className="bg-muted/50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <Users className="h-3 w-3" />
                    24h Trades
                  </div>
                  <p className="font-bold text-lg">{formatNumber(clob.trades24h)}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatNumber(clob.uniqueTraders24h)} traders
                  </p>
                </div>
              </div>
              
              {/* Fee Structure */}
              <div className="border-t pt-3">
                <h4 className="font-medium text-sm mb-2">Fee Structure</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Maker:</span>
                    <span className={`font-medium ${clob.feeStructure.maker < 0 ? 'text-green-500' : ''}`}>
                      {clob.feeStructure.maker > 0 ? '+' : ''}{(clob.feeStructure.maker * 100).toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Taker:</span>
                    <span className="font-medium">+{(clob.feeStructure.taker * 100).toFixed(2)}%</span>
                  </div>
                </div>
              </div>
              
              {/* Features */}
              <div>
                <h4 className="font-medium text-sm mb-2">Features</h4>
                <div className="flex flex-wrap gap-1">
                  {clob.features.map(feature => (
                    <Badge key={feature} variant="secondary" className="text-xs">
                      {feature}
                    </Badge>
                  ))}
                </div>
              </div>
              
              {/* Trading Activity */}
              <div className="border-t pt-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Active Orders:</span>
                  <span className="font-medium">{formatNumber(clob.activeOrders)}</span>
                </div>
                <div className="flex justify-between items-center text-sm mt-1">
                  <span className="text-muted-foreground">Trading Pairs:</span>
                  <span className="font-medium">{clob.pairs}</span>
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button size="sm" className="flex-1">
                  Start Trading
                </Button>
                <Button size="sm" variant="outline" className="flex-1">
                  View Markets
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {filteredClobs.length === 0 && (
        <div className="text-center py-20">
          <p className="text-muted-foreground">No CLOB protocols found matching your search.</p>
        </div>
      )}
    </div>
  );
}