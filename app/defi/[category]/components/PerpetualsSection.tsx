'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import LoadingSpinner from '@/components/LoadingSpinner';
import { formatNumber } from '@/lib/utils';
import { ExternalLink, TrendingUp, TrendingDown, Target, Shield, Zap, BarChart3, Search, Users, Clock } from 'lucide-react';

interface PerpetualData {
  name: string;
  protocol: string;
  volume24h: number;
  openInterest: number;
  totalTrades24h: number;
  avgFundingRate: number;
  maxLeverage: number;
  availableMarkets: number;
  chains: string[];
  category: string;
  description: string;
  website: string;
  change24h: number;
  uniqueTraders24h: number;
  liquidations24h: number;
  feeStructure: {
    maker: number;
    taker: number;
    funding: number;
  };
  nativeToken: string;
  isLive: boolean;
  features: string[];
  insurance: boolean;
  crossMargin: boolean;
  topMarkets: string[];
}

export default function PerpetualsSection() {
  const [perps, setPerps] = useState<PerpetualData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'volume24h' | 'openInterest' | 'totalTrades24h' | 'maxLeverage'>('volume24h');

  useEffect(() => {
    async function fetchPerpetualsData() {
      try {
        // In a real implementation, this would fetch from perpetuals-specific APIs
        // For now, we'll create realistic perpetuals data for Solana ecosystem
        const perpsList: PerpetualData[] = [
          {
            name: 'Drift Protocol',
            protocol: 'Drift',
            volume24h: 245000000,
            openInterest: 127000000,
            totalTrades24h: 67800,
            avgFundingRate: 0.0085,
            maxLeverage: 10,
            availableMarkets: 45,
            chains: ['Solana'],
            category: 'Decentralized Perpetuals',
            description: 'Leading perpetual futures exchange with cross-margin and advanced risk management',
            website: 'https://drift.trade',
            change24h: 12.5,
            uniqueTraders24h: 18900,
            liquidations24h: 145,
            feeStructure: {
              maker: -0.005,
              taker: 0.045,
              funding: 0.01
            },
            nativeToken: 'DRIFT',
            isLive: true,
            features: ['Cross-Margin', 'Auto-Deleveraging', 'JIT Liquidity', 'Portfolio Margin'],
            insurance: true,
            crossMargin: true,
            topMarkets: ['SOL-PERP', 'BTC-PERP', 'ETH-PERP', 'BONK-PERP', 'RAY-PERP']
          },
          {
            name: 'Mango Markets',
            protocol: 'Mango',
            volume24h: 189000000,
            openInterest: 98000000,
            totalTrades24h: 45600,
            avgFundingRate: 0.0125,
            maxLeverage: 20,
            availableMarkets: 67,
            chains: ['Solana'],
            category: 'Margin Trading Platform',
            description: 'Cross-margined trading with spot, perps, and borrowing/lending',
            website: 'https://mango.markets',
            change24h: -2.8,
            uniqueTraders24h: 12400,
            liquidations24h: 89,
            feeStructure: {
              maker: 0.02,
              taker: 0.06,
              funding: 0.012
            },
            nativeToken: 'MNGO',
            isLive: true,
            features: ['Cross-Collateral', 'Spot+Perps', 'Lending Integration', 'Risk Engine'],
            insurance: true,
            crossMargin: true,
            topMarkets: ['BTC-PERP', 'ETH-PERP', 'SOL-PERP', 'AVAX-PERP', 'SUI-PERP']
          },
          {
            name: 'Zeta Markets',
            protocol: 'Zeta',
            volume24h: 78000000,
            openInterest: 45000000,
            totalTrades24h: 23400,
            avgFundingRate: 0.0095,
            maxLeverage: 15,
            availableMarkets: 34,
            chains: ['Solana'],
            category: 'Derivatives Exchange',
            description: 'Options and perpetual futures with advanced Greeks analytics',
            website: 'https://zeta.markets',
            change24h: 8.7,
            uniqueTraders24h: 6700,
            liquidations24h: 34,
            feeStructure: {
              maker: 0.0,
              taker: 0.05,
              funding: 0.008
            },
            nativeToken: 'ZETA',
            isLive: true,
            features: ['Options+Perps', 'Greeks Analytics', 'Portfolio Margining', 'Risk Dashboard'],
            insurance: true,
            crossMargin: true,
            topMarkets: ['SOL-PERP', 'BTC-PERP', 'ETH-PERP', 'MATIC-PERP', 'ATOM-PERP']
          },
          {
            name: 'Cypher Protocol',
            protocol: 'Cypher',
            volume24h: 56000000,
            openInterest: 34000000,
            totalTrades24h: 18900,
            avgFundingRate: 0.0115,
            maxLeverage: 25,
            availableMarkets: 28,
            chains: ['Solana'],
            category: 'Cross-Margin Futures',
            description: 'High-leverage perpetual futures with shared collateral pools',
            website: 'https://cypher.trade',
            change24h: 15.2,
            uniqueTraders24h: 4500,
            liquidations24h: 67,
            feeStructure: {
              maker: 0.01,
              taker: 0.04,
              funding: 0.015
            },
            nativeToken: 'CYP',
            isLive: true,
            features: ['High Leverage', 'Shared Collateral', 'Fast Liquidation', 'Multi-Asset'],
            insurance: false,
            crossMargin: true,
            topMarkets: ['BTC-PERP', 'ETH-PERP', 'SOL-PERP', 'ARB-PERP', 'OP-PERP']
          },
          {
            name: 'Phoenix',
            protocol: 'Phoenix',
            volume24h: 134000000,
            openInterest: 67000000,
            totalTrades24h: 34500,
            avgFundingRate: 0.0075,
            maxLeverage: 50,
            availableMarkets: 52,
            chains: ['Solana'],
            category: 'High-Performance Perps',
            description: 'Ultra-fast perpetual futures with institutional-grade execution',
            website: 'https://phoenix.trade',
            change24h: 22.1,
            uniqueTraders24h: 8900,
            liquidations24h: 123,
            feeStructure: {
              maker: -0.01,
              taker: 0.035,
              funding: 0.006
            },
            nativeToken: 'PHX',
            isLive: true,
            features: ['Sub-second Execution', 'Maker Rebates', 'API Trading', 'Advanced Orders'],
            insurance: true,
            crossMargin: true,
            topMarkets: ['BTC-PERP', 'ETH-PERP', 'SOL-PERP', 'DOGE-PERP', 'WIF-PERP']
          },
          {
            name: 'Parcl Protocol',
            protocol: 'Parcl',
            volume24h: 23000000,
            openInterest: 12000000,
            totalTrades24h: 5600,
            avgFundingRate: 0.0145,
            maxLeverage: 5,
            availableMarkets: 18,
            chains: ['Solana'],
            category: 'Real Estate Perps',
            description: 'Perpetual futures for real estate markets and property indices',
            website: 'https://parcl.co',
            change24h: 6.3,
            uniqueTraders24h: 1200,
            liquidations24h: 8,
            feeStructure: {
              maker: 0.03,
              taker: 0.08,
              funding: 0.02
            },
            nativeToken: 'PRCL',
            isLive: true,
            features: ['Real Estate Exposure', 'City Indices', 'Property Data', 'Hedging Tools'],
            insurance: false,
            crossMargin: false,
            topMarkets: ['NYC-PERP', 'LA-PERP', 'SF-PERP', 'MIA-PERP', 'CHI-PERP']
          },
          {
            name: 'Symmetry',
            protocol: 'Symmetry',
            volume24h: 45000000,
            openInterest: 28000000,
            totalTrades24h: 12300,
            avgFundingRate: 0.0105,
            maxLeverage: 8,
            availableMarkets: 23,
            chains: ['Solana'],
            category: 'Structured Perps',
            description: 'Structured perpetual products with automated strategies',
            website: 'https://symmetry.fi',
            change24h: 9.8,
            uniqueTraders24h: 3400,
            liquidations24h: 23,
            feeStructure: {
              maker: 0.02,
              taker: 0.055,
              funding: 0.01
            },
            nativeToken: 'SYM',
            isLive: true,
            features: ['Structured Products', 'Auto Strategies', 'Basket Perps', 'Yield Enhancement'],
            insurance: true,
            crossMargin: false,
            topMarkets: ['DeFi-PERP', 'AI-PERP', 'GAMING-PERP', 'MEME-PERP', 'L1-PERP']
          },
          {
            name: 'Katana',
            protocol: 'Katana',
            volume24h: 67000000,
            openInterest: 41000000,
            totalTrades24h: 28900,
            avgFundingRate: 0.0088,
            maxLeverage: 30,
            availableMarkets: 38,
            chains: ['Solana'],
            category: 'Social Trading Perps',
            description: 'Perpetual futures with copy trading and social features',
            website: 'https://katana.trade',
            change24h: 5.4,
            uniqueTraders24h: 6800,
            liquidations24h: 78,
            feeStructure: {
              maker: 0.005,
              taker: 0.04,
              funding: 0.009
            },
            nativeToken: 'KATA',
            isLive: true,
            features: ['Copy Trading', 'Social Features', 'Strategy Sharing', 'Leaderboards'],
            insurance: true,
            crossMargin: true,
            topMarkets: ['BTC-PERP', 'ETH-PERP', 'SOL-PERP', 'JTO-PERP', 'JUP-PERP']
          }
        ];

        // Sort by volume by default
        perpsList.sort((a, b) => b.volume24h - a.volume24h);
        setPerps(perpsList);
      } catch (err) {
        console.error('Error fetching perpetuals data:', err);
        setError('Failed to load perpetuals data');
      } finally {
        setLoading(false);
      }
    }

    fetchPerpetualsData();
  }, []);

  const filteredPerps = perps
    .filter(perp => 
      perp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      perp.category.toLowerCase().includes(searchTerm.toLowerCase())
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
          <CardTitle>Perpetual Futures</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search perpetuals..."
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
                variant={sortBy === 'openInterest' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSortBy('openInterest')}
              >
                Open Interest
              </Button>
              <Button
                variant={sortBy === 'totalTrades24h' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSortBy('totalTrades24h')}
              >
                Trades
              </Button>
              <Button
                variant={sortBy === 'maxLeverage' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSortBy('maxLeverage')}
              >
                Leverage
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Perpetuals Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredPerps.map((perp) => (
          <Card key={perp.name} className="h-full">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                    {perp.nativeToken.substring(0, 3)}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{perp.name}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline">{perp.category}</Badge>
                      {perp.isLive && <Badge className="bg-green-500 text-white">Live</Badge>}
                      {perp.insurance && <Badge variant="secondary">Insured</Badge>}
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
                {perp.description}
              </p>
              
              {/* Key Trading Metrics */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted/50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <BarChart3 className="h-3 w-3" />
                    24h Volume
                  </div>
                  <p className="font-bold text-lg">${formatNumber(perp.volume24h)}</p>
                  <div className={`flex items-center gap-1 text-xs ${
                    perp.change24h >= 0 ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {perp.change24h >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {Math.abs(perp.change24h).toFixed(1)}%
                  </div>
                </div>
                
                <div className="bg-muted/50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <Target className="h-3 w-3" />
                    Open Interest
                  </div>
                  <p className="font-bold text-lg">${formatNumber(perp.openInterest)}</p>
                  <p className="text-xs text-muted-foreground">
                    {perp.availableMarkets} markets
                  </p>
                </div>
                
                <div className="bg-muted/50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <Zap className="h-3 w-3" />
                    Max Leverage
                  </div>
                  <p className="font-bold text-lg text-orange-500">{perp.maxLeverage}x</p>
                  <p className="text-xs text-muted-foreground">
                    Funding: {(perp.avgFundingRate * 100).toFixed(2)}%
                  </p>
                </div>
                
                <div className="bg-muted/50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <Users className="h-3 w-3" />
                    24h Trades
                  </div>
                  <p className="font-bold text-lg">{formatNumber(perp.totalTrades24h)}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatNumber(perp.uniqueTraders24h)} traders
                  </p>
                </div>
              </div>
              
              {/* Fee Structure */}
              <div className="border-t pt-3">
                <h4 className="font-medium text-sm mb-2">Fee Structure</h4>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="text-center">
                    <p className="text-muted-foreground">Maker</p>
                    <p className={`font-medium ${perp.feeStructure.maker < 0 ? 'text-green-500' : ''}`}>
                      {perp.feeStructure.maker > 0 ? '+' : ''}{(perp.feeStructure.maker * 100).toFixed(2)}%
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-muted-foreground">Taker</p>
                    <p className="font-medium">+{(perp.feeStructure.taker * 100).toFixed(2)}%</p>
                  </div>
                  <div className="text-center">
                    <p className="text-muted-foreground">Funding</p>
                    <p className="font-medium">{(perp.feeStructure.funding * 100).toFixed(2)}%</p>
                  </div>
                </div>
              </div>
              
              {/* Features */}
              <div>
                <h4 className="font-medium text-sm mb-2">Features</h4>
                <div className="flex flex-wrap gap-1">
                  {perp.features.map(feature => (
                    <Badge key={feature} variant="secondary" className="text-xs">
                      {feature}
                    </Badge>
                  ))}
                </div>
              </div>
              
              {/* Top Markets */}
              <div>
                <h4 className="font-medium text-sm mb-2">Top Markets</h4>
                <div className="flex flex-wrap gap-1">
                  {perp.topMarkets.slice(0, 3).map(market => (
                    <Badge key={market} variant="outline" className="text-xs">
                      {market}
                    </Badge>
                  ))}
                  {perp.topMarkets.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{perp.topMarkets.length - 3} more
                    </Badge>
                  )}
                </div>
              </div>
              
              {/* Risk Info */}
              <div className="border-t pt-3">
                <div className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2">
                    <Shield className={`h-4 w-4 ${perp.insurance ? 'text-green-500' : 'text-gray-400'}`} />
                    <span className="text-muted-foreground">Insurance Fund:</span>
                  </div>
                  <span className={`font-medium ${perp.insurance ? 'text-green-500' : 'text-gray-500'}`}>
                    {perp.insurance ? 'Active' : 'None'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm mt-1">
                  <span className="text-muted-foreground">24h Liquidations:</span>
                  <span className="font-medium">{perp.liquidations24h}</span>
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button size="sm" className="flex-1">
                  Trade Perps
                </Button>
                <Button size="sm" variant="outline" className="flex-1">
                  View Markets
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {filteredPerps.length === 0 && (
        <div className="text-center py-20">
          <p className="text-muted-foreground">No perpetual protocols found matching your search.</p>
        </div>
      )}
    </div>
  );
}