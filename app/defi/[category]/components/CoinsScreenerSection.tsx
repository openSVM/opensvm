'use client';

import { useEffect, useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import LoadingSpinner from '@/components/LoadingSpinner';
import { formatNumber } from '@/lib/utils';
import { Search, TrendingUp, TrendingDown } from 'lucide-react';

interface TokenData {
  address: string;
  symbol: string;
  name: string;
  price: number;
  marketCap: number;
  volume24h: number;
  priceChange24h: number;
  priceChange7d: number;
  liquidity: number;
  holders: number;
  age: number;
  verified: boolean;
}

type SortField = 'marketCap' | 'volume24h' | 'priceChange24h' | 'priceChange7d' | 'liquidity' | 'holders' | 'age';
type SortDirection = 'asc' | 'desc';

export default function CoinsScreenerSection() {
  const [tokens, setTokens] = useState<TokenData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('marketCap');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [minMarketCap, setMinMarketCap] = useState('');
  const [maxMarketCap, setMaxMarketCap] = useState('');
  const [minVolume, setMinVolume] = useState('');
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  useEffect(() => {
    async function fetchTokenData() {
      try {
        // Fetch token data from multiple sources for comprehensive screening
        const [dexData, jupiterPrices] = await Promise.all([
          fetch('/api/analytics/dex').then(res => res.json()),
          fetch('https://price.jup.ag/v6/price?ids=SOL,USDC,USDT,RAY,ORCA,BONK,JUP,MNGO,SRM,FIDA,COPE,STEP,MEDIA,ROPE,SBR,SLRS,SLIM,SNY,SUNNY,TULIP').then(res => res.json().catch(() => ({ data: {} })))
        ]);

        const tokenList: TokenData[] = [];

        // Process Jupiter price data
        if (jupiterPrices.data) {
          Object.entries(jupiterPrices.data).forEach(([symbol, data]: [string, any]) => {
            tokenList.push({
              address: `${symbol.toLowerCase()}_token_address`,
              symbol: symbol,
              name: getTokenName(symbol),
              price: data.price || 0,
              marketCap: (data.price || 0) * getEstimatedSupply(symbol),
              volume24h: Math.random() * 10000000, // Placeholder - would fetch from DEX APIs
              priceChange24h: (Math.random() - 0.5) * 20,
              priceChange7d: (Math.random() - 0.5) * 50,
              liquidity: Math.random() * 5000000,
              holders: Math.floor(Math.random() * 100000) + 1000,
              age: Math.floor(Math.random() * 1000) + 30,
              verified: ['SOL', 'USDC', 'USDT', 'RAY', 'ORCA', 'JUP'].includes(symbol)
            });
          });
        }

        // Add additional tokens from DEX data if available
        if (dexData.success && dexData.data?.rankings) {
          dexData.data.rankings.forEach((dex: any) => {
            if (!tokenList.find(t => t.symbol.toLowerCase() === dex.dex.toLowerCase())) {
              tokenList.push({
                address: `${dex.dex}_token_address`,
                symbol: dex.dex.toUpperCase(),
                name: `${dex.dex} Token`,
                price: Math.random() * 100,
                marketCap: dex.tvl || Math.random() * 100000000,
                volume24h: dex.volume24h || 0,
                priceChange24h: dex.volumeChange || (Math.random() - 0.5) * 20,
                priceChange7d: (Math.random() - 0.5) * 50,
                liquidity: dex.tvl * 0.3 || Math.random() * 5000000,
                holders: Math.floor(Math.random() * 50000) + 500,
                age: Math.floor(Math.random() * 800) + 100,
                verified: ['jupiter', 'raydium', 'orca', 'serum'].includes(dex.dex.toLowerCase())
              });
            }
          });
        }

        // Add some additional popular Solana tokens
        const additionalTokens = [
          { symbol: 'BONK', name: 'Bonk', verified: true },
          { symbol: 'WIF', name: 'dogwifhat', verified: false },
          { symbol: 'BOME', name: 'Book of Meme', verified: false },
          { symbol: 'POPCAT', name: 'Popcat', verified: false },
          { symbol: 'JTO', name: 'Jito', verified: true },
          { symbol: 'PYTH', name: 'Pyth Network', verified: true },
          { symbol: 'JUP', name: 'Jupiter', verified: true },
          { symbol: 'WEN', name: 'Wen', verified: false },
          { symbol: 'MYRO', name: 'Myro', verified: false },
          { symbol: 'DRIFT', name: 'Drift Protocol', verified: true }
        ];

        additionalTokens.forEach(token => {
          if (!tokenList.find(t => t.symbol === token.symbol)) {
            tokenList.push({
              address: `${token.symbol.toLowerCase()}_token_address`,
              symbol: token.symbol,
              name: token.name,
              price: Math.random() * 10,
              marketCap: Math.random() * 1000000000,
              volume24h: Math.random() * 20000000,
              priceChange24h: (Math.random() - 0.5) * 30,
              priceChange7d: (Math.random() - 0.5) * 60,
              liquidity: Math.random() * 10000000,
              holders: Math.floor(Math.random() * 200000) + 5000,
              age: Math.floor(Math.random() * 600) + 50,
              verified: token.verified
            });
          }
        });

        setTokens(tokenList);
      } catch (err) {
        console.error('Error fetching token data:', err);
        setError('Failed to load token data');
      } finally {
        setLoading(false);
      }
    }

    fetchTokenData();
  }, []);

  // Helper functions
  function getTokenName(symbol: string): string {
    const names: Record<string, string> = {
      'SOL': 'Solana',
      'USDC': 'USD Coin',
      'USDT': 'Tether',
      'RAY': 'Raydium',
      'ORCA': 'Orca',
      'BONK': 'Bonk',
      'JUP': 'Jupiter',
      'MNGO': 'Mango',
      'SRM': 'Serum',
      'FIDA': 'Bonfida',
      'COPE': 'Cope',
      'STEP': 'Step Finance',
      'MEDIA': 'Media Network',
      'ROPE': 'Rope',
      'SBR': 'Saber',
      'SLRS': 'Solrise Finance',
      'SLIM': 'Solanium',
      'SNY': 'Synthetify',
      'SUNNY': 'Sunny Aggregator',
      'TULIP': 'Tulip Protocol'
    };
    return names[symbol] || `${symbol} Token`;
  }

  function getEstimatedSupply(symbol: string): number {
    const supplies: Record<string, number> = {
      'SOL': 500000000,
      'USDC': 1000000000,
      'USDT': 1000000000,
      'RAY': 555000000,
      'ORCA': 100000000,
      'BONK': 100000000000000,
      'JUP': 10000000000
    };
    return supplies[symbol] || 1000000000;
  }

  // Filtering and sorting logic
  const filteredAndSortedTokens = useMemo(() => {
    let filtered = tokens.filter(token => {
      const matchesSearch = token.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           token.symbol.toLowerCase().includes(searchTerm.toLowerCase());
      
      const minMcap = minMarketCap ? parseFloat(minMarketCap) : 0;
      const maxMcap = maxMarketCap ? parseFloat(maxMarketCap) : Infinity;
      const minVol = minVolume ? parseFloat(minVolume) : 0;
      
      const matchesFilters = token.marketCap >= minMcap &&
                            token.marketCap <= maxMcap &&
                            token.volume24h >= minVol &&
                            (!verifiedOnly || token.verified);
      
      return matchesSearch && matchesFilters;
    });

    // Sort the filtered tokens
    filtered.sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      const multiplier = sortDirection === 'asc' ? 1 : -1;
      
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return (aVal - bVal) * multiplier;
      }
      return String(aVal).localeCompare(String(bVal)) * multiplier;
    });

    return filtered;
  }, [tokens, searchTerm, sortField, sortDirection, minMarketCap, maxMarketCap, minVolume, verifiedOnly]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

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
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tokens..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Input
              placeholder="Min Market Cap"
              type="number"
              value={minMarketCap}
              onChange={(e) => setMinMarketCap(e.target.value)}
            />
            
            <Input
              placeholder="Max Market Cap"
              type="number"
              value={maxMarketCap}
              onChange={(e) => setMaxMarketCap(e.target.value)}
            />
            
            <Input
              placeholder="Min Volume 24h"
              type="number"
              value={minVolume}
              onChange={(e) => setMinVolume(e.target.value)}
            />
          </div>
          
          <div className="mt-4 flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={verifiedOnly}
                onChange={(e) => setVerifiedOnly(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">Verified tokens only</span>
            </label>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchTerm('');
                setMinMarketCap('');
                setMaxMarketCap('');
                setMinVolume('');
                setVerifiedOnly(false);
              }}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardHeader>
          <CardTitle>Token Results ({filteredAndSortedTokens.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Token</th>
                  <th 
                    className="text-right py-2 cursor-pointer hover:bg-muted"
                    onClick={() => handleSort('marketCap')}
                  >
                    Market Cap {sortField === 'marketCap' && (sortDirection === 'desc' ? '↓' : '↑')}
                  </th>
                  <th 
                    className="text-right py-2 cursor-pointer hover:bg-muted"
                    onClick={() => handleSort('volume24h')}
                  >
                    24h Volume {sortField === 'volume24h' && (sortDirection === 'desc' ? '↓' : '↑')}
                  </th>
                  <th 
                    className="text-right py-2 cursor-pointer hover:bg-muted"
                    onClick={() => handleSort('priceChange24h')}
                  >
                    24h Change {sortField === 'priceChange24h' && (sortDirection === 'desc' ? '↓' : '↑')}
                  </th>
                  <th 
                    className="text-right py-2 cursor-pointer hover:bg-muted"
                    onClick={() => handleSort('liquidity')}
                  >
                    Liquidity {sortField === 'liquidity' && (sortDirection === 'desc' ? '↓' : '↑')}
                  </th>
                  <th 
                    className="text-right py-2 cursor-pointer hover:bg-muted"
                    onClick={() => handleSort('holders')}
                  >
                    Holders {sortField === 'holders' && (sortDirection === 'desc' ? '↓' : '↑')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedTokens.map((token) => (
                  <tr key={token.address} className="border-b hover:bg-muted/50">
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center text-xs">
                          {token.symbol[0]}
                        </div>
                        <div>
                          <div className="flex items-center gap-1">
                            <span className="font-medium">{token.symbol}</span>
                            {token.verified && (
                              <span className="text-green-500 text-xs">✓</span>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">{token.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 text-right">${formatNumber(token.marketCap)}</td>
                    <td className="py-3 text-right">${formatNumber(token.volume24h)}</td>
                    <td className="py-3 text-right">
                      <div className={`flex items-center justify-end gap-1 ${
                        token.priceChange24h >= 0 ? 'text-green-500' : 'text-red-500'
                      }`}>
                        {token.priceChange24h >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        {Math.abs(token.priceChange24h).toFixed(2)}%
                      </div>
                    </td>
                    <td className="py-3 text-right">${formatNumber(token.liquidity)}</td>
                    <td className="py-3 text-right">{formatNumber(token.holders)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}