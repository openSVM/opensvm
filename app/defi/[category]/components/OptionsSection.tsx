'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import LoadingSpinner from '@/components/LoadingSpinner';
import { formatNumber } from '@/lib/utils';
import { ExternalLink, TrendingUp, TrendingDown, Target, Clock, Zap, BarChart3, Search, Users, Calculator } from 'lucide-react';

interface OptionData {
  name: string;
  protocol: string;
  volume24h: number;
  openInterest: number;
  totalContracts: number;
  activeExpiries: number;
  chains: string[];
  category: string;
  description: string;
  website: string;
  change24h: number;
  uniqueTraders24h: number;
  avgPremium: number;
  impliedVolatility: number;
  feeStructure: {
    trading: number;
    exercise: number;
    settlement: number;
  };
  nativeToken: string;
  isLive: boolean;
  features: string[];
  supportedAssets: string[];
  maxExpiry: string;
  minStrike: number;
  maxStrike: number;
  settlementType: 'Cash' | 'Physical' | 'Both';
}

export default function OptionsSection() {
  const [options, setOptions] = useState<OptionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'volume24h' | 'openInterest' | 'totalContracts' | 'impliedVolatility'>('volume24h');

  useEffect(() => {
    async function fetchOptionsData() {
      try {
        // In a real implementation, this would fetch from options-specific APIs
        // For now, we'll create realistic options data for Solana ecosystem
        const optionsList: OptionData[] = [
          {
            name: 'Zeta Markets',
            protocol: 'Zeta',
            volume24h: 45000000,
            openInterest: 78000000,
            totalContracts: 12400,
            activeExpiries: 8,
            chains: ['Solana'],
            category: 'European Options',
            description: 'Leading options platform with sophisticated Greeks analytics and portfolio management',
            website: 'https://zeta.markets',
            change24h: 12.3,
            uniqueTraders24h: 3400,
            avgPremium: 0.045,
            impliedVolatility: 85.2,
            feeStructure: {
              trading: 0.05,
              exercise: 0.02,
              settlement: 0.01
            },
            nativeToken: 'ZETA',
            isLive: true,
            features: ['European Style', 'Greeks Analytics', 'Portfolio Margin', 'Auto-Exercise'],
            supportedAssets: ['SOL', 'BTC', 'ETH', 'BONK', 'JUP'],
            maxExpiry: '3 months',
            minStrike: 0.1,
            maxStrike: 1000,
            settlementType: 'Cash'
          },
          {
            name: 'PsyOptions',
            protocol: 'PsyOptions',
            volume24h: 23000000,
            openInterest: 34000000,
            totalContracts: 6700,
            activeExpiries: 12,
            chains: ['Solana'],
            category: 'American Options',
            description: 'Decentralized options protocol with American-style exercise and yield strategies',
            website: 'https://psyoptions.io',
            change24h: 8.7,
            uniqueTraders24h: 1800,
            avgPremium: 0.067,
            impliedVolatility: 92.1,
            feeStructure: {
              trading: 0.08,
              exercise: 0.03,
              settlement: 0.015
            },
            nativeToken: 'PSY',
            isLive: true,
            features: ['American Style', 'Early Exercise', 'Yield Strategies', 'Covered Calls'],
            supportedAssets: ['SOL', 'RAY', 'SRM', 'ORCA', 'MNGO'],
            maxExpiry: '6 months',
            minStrike: 0.05,
            maxStrike: 500,
            settlementType: 'Physical'
          },
          {
            name: 'Katana Options',
            protocol: 'Katana',
            volume24h: 34000000,
            openInterest: 45000000,
            totalContracts: 8900,
            activeExpiries: 6,
            chains: ['Solana'],
            category: 'Exotic Options',
            description: 'Advanced options with exotic payoffs and structured products',
            website: 'https://katana.trade/options',
            change24h: 15.8,
            uniqueTraders24h: 2300,
            avgPremium: 0.089,
            impliedVolatility: 78.9,
            feeStructure: {
              trading: 0.12,
              exercise: 0.05,
              settlement: 0.02
            },
            nativeToken: 'KATA',
            isLive: true,
            features: ['Exotic Payoffs', 'Barrier Options', 'Binary Options', 'Structured Products'],
            supportedAssets: ['SOL', 'BTC', 'ETH', 'AVAX', 'NEAR'],
            maxExpiry: '1 year',
            minStrike: 1,
            maxStrike: 10000,
            settlementType: 'Both'
          },
          {
            name: 'Solrise Options',
            protocol: 'Solrise',
            volume24h: 12000000,
            openInterest: 18000000,
            totalContracts: 3400,
            activeExpiries: 4,
            chains: ['Solana'],
            category: 'Vault Options',
            description: 'Options strategies integrated with automated vaults and yield generation',
            website: 'https://solrise.finance/options',
            change24h: 6.2,
            uniqueTraders24h: 890,
            avgPremium: 0.034,
            impliedVolatility: 65.4,
            feeStructure: {
              trading: 0.06,
              exercise: 0.025,
              settlement: 0.01
            },
            nativeToken: 'SLRS',
            isLive: true,
            features: ['Vault Integration', 'Automated Strategies', 'Yield Generation', 'Risk Management'],
            supportedAssets: ['SOL', 'USDC', 'RAY', 'SRM', 'FTT'],
            maxExpiry: '2 months',
            minStrike: 0.5,
            maxStrike: 200,
            settlementType: 'Cash'
          },
          {
            name: 'Friktion',
            protocol: 'Friktion',
            volume24h: 18000000,
            openInterest: 28000000,
            totalContracts: 5600,
            activeExpiries: 5,
            chains: ['Solana'],
            category: 'Structured Options',
            description: 'Institutional-grade structured options products and portfolio strategies',
            website: 'https://friktion.fi',
            change24h: 4.1,
            uniqueTraders24h: 1200,
            avgPremium: 0.056,
            impliedVolatility: 71.8,
            feeStructure: {
              trading: 0.075,
              exercise: 0.035,
              settlement: 0.015
            },
            nativeToken: 'FRIK',
            isLive: true,
            features: ['Structured Products', 'Institutional Tools', 'Portfolio Strategies', 'Risk Analytics'],
            supportedAssets: ['SOL', 'BTC', 'ETH', 'USDC', 'USDT'],
            maxExpiry: '4 months',
            minStrike: 0.1,
            maxStrike: 2000,
            settlementType: 'Cash'
          },
          {
            name: 'Symmetry Options',
            protocol: 'Symmetry',
            volume24h: 8900000,
            openInterest: 14000000,
            totalContracts: 2800,
            activeExpiries: 3,
            chains: ['Solana'],
            category: 'Basket Options',
            description: 'Options on baskets of assets with sector and thematic exposure',
            website: 'https://symmetry.fi/options',
            change24h: 11.4,
            uniqueTraders24h: 650,
            avgPremium: 0.078,
            impliedVolatility: 89.3,
            feeStructure: {
              trading: 0.09,
              exercise: 0.04,
              settlement: 0.02
            },
            nativeToken: 'SYM',
            isLive: true,
            features: ['Basket Options', 'Sector Exposure', 'Thematic Trading', 'Index Options'],
            supportedAssets: ['DeFi Basket', 'Gaming Basket', 'Meme Basket', 'L1 Basket', 'AI Basket'],
            maxExpiry: '3 months',
            minStrike: 10,
            maxStrike: 1000,
            settlementType: 'Cash'
          },
          {
            name: 'Hedge Protocol',
            protocol: 'Hedge',
            volume24h: 15000000,
            openInterest: 22000000,
            totalContracts: 4200,
            activeExpiries: 7,
            chains: ['Solana'],
            category: 'Hedging Options',
            description: 'Specialized options for portfolio hedging and risk management',
            website: 'https://hedge.so',
            change24h: -2.3,
            uniqueTraders24h: 980,
            avgPremium: 0.042,
            impliedVolatility: 76.5,
            feeStructure: {
              trading: 0.04,
              exercise: 0.02,
              settlement: 0.008
            },
            nativeToken: 'HEDGE',
            isLive: true,
            features: ['Portfolio Hedging', 'Tail Risk Protection', 'Delta Hedging', 'Volatility Trading'],
            supportedAssets: ['SOL', 'BTC', 'ETH', 'Portfolio', 'VIX'],
            maxExpiry: '6 months',
            minStrike: 0.01,
            maxStrike: 5000,
            settlementType: 'Both'
          },
          {
            name: 'Thetanuts',
            protocol: 'Thetanuts',
            volume24h: 6700000,
            openInterest: 11000000,
            totalContracts: 1900,
            activeExpiries: 4,
            chains: ['Solana'],
            category: 'Covered Call Vaults',
            description: 'Automated covered call and put writing strategies for yield generation',
            website: 'https://thetanuts.finance',
            change24h: 7.8,
            uniqueTraders24h: 540,
            avgPremium: 0.029,
            impliedVolatility: 58.7,
            feeStructure: {
              trading: 0.05,
              exercise: 0.02,
              settlement: 0.01
            },
            nativeToken: 'NUTS',
            isLive: true,
            features: ['Covered Calls', 'Put Writing', 'Automated Strategies', 'Yield Optimization'],
            supportedAssets: ['SOL', 'USDC', 'BTC', 'ETH', 'RAY'],
            maxExpiry: '1 month',
            minStrike: 1,
            maxStrike: 300,
            settlementType: 'Physical'
          }
        ];

        // Sort by volume by default
        optionsList.sort((a, b) => b.volume24h - a.volume24h);
        setOptions(optionsList);
      } catch (err) {
        console.error('Error fetching options data:', err);
        setError('Failed to load options data');
      } finally {
        setLoading(false);
      }
    }

    fetchOptionsData();
  }, []);

  const filteredOptions = options
    .filter(option => 
      option.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      option.category.toLowerCase().includes(searchTerm.toLowerCase())
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
          <CardTitle>Options Trading</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search options platforms..."
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
                variant={sortBy === 'totalContracts' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSortBy('totalContracts')}
              >
                Contracts
              </Button>
              <Button
                variant={sortBy === 'impliedVolatility' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSortBy('impliedVolatility')}
              >
                IV
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Options Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredOptions.map((option) => (
          <Card key={option.name} className="h-full">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                    {option.nativeToken.substring(0, 3)}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{option.name}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline">{option.category}</Badge>
                      {option.isLive && <Badge className="bg-green-500 text-white">Live</Badge>}
                      <Badge variant="secondary">{option.settlementType}</Badge>
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
                {option.description}
              </p>
              
              {/* Key Trading Metrics */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted/50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <BarChart3 className="h-3 w-3" />
                    24h Volume
                  </div>
                  <p className="font-bold text-lg">${formatNumber(option.volume24h)}</p>
                  <div className={`flex items-center gap-1 text-xs ${
                    option.change24h >= 0 ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {option.change24h >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {Math.abs(option.change24h).toFixed(1)}%
                  </div>
                </div>
                
                <div className="bg-muted/50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <Target className="h-3 w-3" />
                    Open Interest
                  </div>
                  <p className="font-bold text-lg">${formatNumber(option.openInterest)}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatNumber(option.totalContracts)} contracts
                  </p>
                </div>
                
                <div className="bg-muted/50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <Zap className="h-3 w-3" />
                    Implied Vol
                  </div>
                  <p className="font-bold text-lg text-purple-500">{option.impliedVolatility.toFixed(1)}%</p>
                  <p className="text-xs text-muted-foreground">
                    Avg Premium: {(option.avgPremium * 100).toFixed(2)}%
                  </p>
                </div>
                
                <div className="bg-muted/50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <Users className="h-3 w-3" />
                    Expiries
                  </div>
                  <p className="font-bold text-lg">{option.activeExpiries}</p>
                  <p className="text-xs text-muted-foreground">
                    Max: {option.maxExpiry}
                  </p>
                </div>
              </div>
              
              {/* Fee Structure */}
              <div className="border-t pt-3">
                <h4 className="font-medium text-sm mb-2">Fee Structure</h4>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="text-center">
                    <p className="text-muted-foreground">Trading</p>
                    <p className="font-medium">{(option.feeStructure.trading * 100).toFixed(2)}%</p>
                  </div>
                  <div className="text-center">
                    <p className="text-muted-foreground">Exercise</p>
                    <p className="font-medium">{(option.feeStructure.exercise * 100).toFixed(2)}%</p>
                  </div>
                  <div className="text-center">
                    <p className="text-muted-foreground">Settlement</p>
                    <p className="font-medium">{(option.feeStructure.settlement * 100).toFixed(2)}%</p>
                  </div>
                </div>
              </div>
              
              {/* Features */}
              <div>
                <h4 className="font-medium text-sm mb-2">Features</h4>
                <div className="flex flex-wrap gap-1">
                  {option.features.map(feature => (
                    <Badge key={feature} variant="secondary" className="text-xs">
                      {feature}
                    </Badge>
                  ))}
                </div>
              </div>
              
              {/* Supported Assets */}
              <div>
                <h4 className="font-medium text-sm mb-2">Supported Assets</h4>
                <div className="flex flex-wrap gap-1">
                  {option.supportedAssets.slice(0, 4).map(asset => (
                    <Badge key={asset} variant="outline" className="text-xs">
                      {asset}
                    </Badge>
                  ))}
                  {option.supportedAssets.length > 4 && (
                    <Badge variant="outline" className="text-xs">
                      +{option.supportedAssets.length - 4} more
                    </Badge>
                  )}
                </div>
              </div>
              
              {/* Strike Range */}
              <div className="border-t pt-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Strike Range:</span>
                  <span className="font-medium">${option.minStrike} - ${formatNumber(option.maxStrike)}</span>
                </div>
                <div className="flex justify-between items-center text-sm mt-1">
                  <span className="text-muted-foreground">24h Traders:</span>
                  <span className="font-medium">{formatNumber(option.uniqueTraders24h)}</span>
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button size="sm" className="flex-1">
                  <Calculator className="h-3 w-3 mr-1" />
                  Trade Options
                </Button>
                <Button size="sm" variant="outline" className="flex-1">
                  View Chain
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {filteredOptions.length === 0 && (
        <div className="text-center py-20">
          <p className="text-muted-foreground">No options platforms found matching your search.</p>
        </div>
      )}
    </div>
  );
}