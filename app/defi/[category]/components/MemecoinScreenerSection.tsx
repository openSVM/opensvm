'use client';

import { useEffect, useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import LoadingSpinner from '@/components/LoadingSpinner';
import { formatNumber } from '@/lib/utils';
import { Search, TrendingUp, TrendingDown, AlertTriangle, Clock } from 'lucide-react';

interface MemecoinData {
  address: string;
  symbol: string;
  name: string;
  price: number;
  marketCap: number;
  volume24h: number;
  priceChange24h: number;
  liquidityUSD: number;
  holders: number;
  createdAt: number;
  platform: string;
  isBonded: boolean;
  bondingProgress: number;
  socialScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'extreme';
  tags: string[];
}

type SortField = 'marketCap' | 'volume24h' | 'priceChange24h' | 'liquidityUSD' | 'holders' | 'createdAt' | 'socialScore';
type SortDirection = 'asc' | 'desc';

export default function MemecoinScreenerSection() {
  const [memecoins, setMemecoins] = useState<MemecoinData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [unbondedOnly, setUnbondedOnly] = useState(true);
  const [minLiquidity, setMinLiquidity] = useState('');
  const [maxAge, setMaxAge] = useState('7'); // Default to last 7 days

  useEffect(() => {
    async function fetchMemecoinData() {
      try {
        // This would typically fetch from pump.fun API, moonshot, etc.
        // For now, we'll simulate memecoin data focusing on unbonded tokens
        const platforms = ['pump.fun', 'moonshot', 'madlaunchpad', 'memefi', 'bonkpad', 'meteora'];
        const memecoinList: MemecoinData[] = [];

        // Generate realistic memecoin data
        const memeNames = [
          'DogeCoin Solana', 'PepeCoin SOL', 'Shiba Solana', 'FlokiSOL', 'SafeMoon Solana',
          'BabyDoge SOL', 'KishuSOL', 'AkitaSOL', 'HogeSOL', 'DogeKing SOL',
          'ShibaFloki', 'DogeMoon', 'SafeShiba', 'BabyFloki', 'MegaShiba',
          'UltraDoge', 'SuperShiba', 'GigaFloki', 'HyperDoge', 'MetaShiba',
          'QuantumDoge', 'LaserDoge', 'TurboDoge', 'NitroShiba', 'RocketFloki',
          'DiamondPaws', 'GoldenDoge', 'SilverShiba', 'PlatinumFloki', 'TitanDoge',
          'CosmicShiba', 'GalacticDoge', 'StellarFloki', 'NebulaShiba', 'VoidDoge',
          'FrostShiba', 'FireDoge', 'ThunderFloki', 'LightningShiba', 'StormDoge',
          'MysticShiba', 'ShadowDoge', 'PhantomFloki', 'GhostShiba', 'SpiritDoge',
          'DragonShiba', 'PhoenixDoge', 'GriffinFloki', 'UnicornShiba', 'PegasusDoge'
        ];

        const memeTags = [
          ['dog', 'meme', 'community'],
          ['frog', 'viral', 'trending'],
          ['animal', 'cute', 'hodl'],
          ['anime', 'japanese', 'kawaii'],
          ['space', 'moon', 'mars'],
          ['defi', 'yield', 'staking'],
          ['gaming', 'nft', 'metaverse'],
          ['ai', 'tech', 'future'],
          ['charity', 'donation', 'good'],
          ['burn', 'deflationary', 'scarce']
        ];

        for (let i = 0; i < 200; i++) {
          const platform = platforms[Math.floor(Math.random() * platforms.length)];
          const name = memeNames[Math.floor(Math.random() * memeNames.length)];
          const symbol = name.replace(/\s+/g, '').substring(0, 6).toUpperCase() + Math.floor(Math.random() * 999);
          const createdHoursAgo = Math.random() * 24 * parseInt(maxAge || '7');
          const createdAt = Date.now() - createdHoursAgo * 60 * 60 * 1000;
          
          // Most new memecoins are unbonded
          const isBonded = Math.random() < 0.15; // Only 15% are bonded
          const bondingProgress = isBonded ? 100 : Math.random() * 85;
          
          // Price and market metrics for new/small tokens
          const price = Math.random() * 0.001;
          const supply = Math.random() * 1000000000000;
          const marketCap = price * supply;
          const liquidityUSD = Math.random() * 100000;
          
          const socialScore = Math.random() * 100;
          const volume24h = liquidityUSD * (Math.random() * 10);
          
          // Risk calculation based on various factors
          let riskLevel: 'low' | 'medium' | 'high' | 'extreme' = 'medium';
          if (liquidityUSD < 5000 || createdHoursAgo < 1) {
            riskLevel = 'extreme';
          } else if (liquidityUSD < 20000 || createdHoursAgo < 6) {
            riskLevel = 'high';
          } else if (liquidityUSD > 50000 && socialScore > 60) {
            riskLevel = 'low';
          }

          memecoinList.push({
            address: `${symbol.toLowerCase()}_memecoin_${i}`,
            symbol,
            name,
            price,
            marketCap,
            volume24h,
            priceChange24h: (Math.random() - 0.3) * 200, // Can be very volatile
            liquidityUSD,
            holders: Math.floor(Math.random() * 10000) + 50,
            createdAt,
            platform,
            isBonded,
            bondingProgress,
            socialScore,
            riskLevel,
            tags: memeTags[Math.floor(Math.random() * memeTags.length)]
          });
        }

        // Sort by creation time (newest first) by default
        memecoinList.sort((a, b) => b.createdAt - a.createdAt);
        
        setMemecoins(memecoinList);
      } catch (err) {
        console.error('Error fetching memecoin data:', err);
        setError('Failed to load memecoin data');
      } finally {
        setLoading(false);
      }
    }

    fetchMemecoinData();
  }, [maxAge]);

  // Filtering and sorting logic
  const filteredAndSortedMemecoins = useMemo(() => {
    let filtered = memecoins.filter(coin => {
      const matchesSearch = coin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           coin.symbol.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesPlatform = platformFilter === 'all' || coin.platform === platformFilter;
      const matchesBonded = !unbondedOnly || !coin.isBonded;
      const matchesLiquidity = !minLiquidity || coin.liquidityUSD >= parseFloat(minLiquidity);
      
      // Age filter
      const ageInDays = (Date.now() - coin.createdAt) / (1000 * 60 * 60 * 24);
      const matchesAge = !maxAge || ageInDays <= parseFloat(maxAge);
      
      return matchesSearch && matchesPlatform && matchesBonded && matchesLiquidity && matchesAge;
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
  }, [memecoins, searchTerm, sortField, sortDirection, platformFilter, unbondedOnly, minLiquidity, maxAge]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      case 'high': return 'bg-orange-500';
      case 'extreme': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getTimeAgo = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
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

  const platforms = ['all', ...Array.from(new Set(memecoins.map(m => m.platform)))];

  return (
    <div className="space-y-6">
      {/* Warning Banner */}
      <Card className="border-yellow-500/50 bg-yellow-500/10">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-yellow-600">
            <AlertTriangle className="h-5 w-5" />
            <div>
              <p className="font-medium">High Risk Investment Warning</p>
              <p className="text-sm">Unbonded memecoins carry extremely high risk. Many are scams or will lose 99%+ of value. Never invest more than you can afford to lose.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Memecoin Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search memecoins..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <select
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {platforms.map(platform => (
                <option key={platform} value={platform}>
                  {platform === 'all' ? 'All Platforms' : platform}
                </option>
              ))}
            </select>
            
            <Input
              placeholder="Min Liquidity USD"
              type="number"
              value={minLiquidity}
              onChange={(e) => setMinLiquidity(e.target.value)}
            />
            
            <select
              value={maxAge}
              onChange={(e) => setMaxAge(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="1">Last 24 hours</option>
              <option value="3">Last 3 days</option>
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
            </select>
          </div>
          
          <div className="mt-4 flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={unbondedOnly}
                onChange={(e) => setUnbondedOnly(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">Unbonded only (not on major exchanges)</span>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardHeader>
          <CardTitle>
            Memecoin Results ({filteredAndSortedMemecoins.length})
            {unbondedOnly && <Badge variant="outline" className="ml-2">Unbonded Only</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Token</th>
                  <th className="text-left py-2">Platform</th>
                  <th 
                    className="text-right py-2 cursor-pointer hover:bg-muted"
                    onClick={() => handleSort('liquidityUSD')}
                  >
                    Liquidity {sortField === 'liquidityUSD' && (sortDirection === 'desc' ? '↓' : '↑')}
                  </th>
                  <th 
                    className="text-right py-2 cursor-pointer hover:bg-muted"
                    onClick={() => handleSort('priceChange24h')}
                  >
                    24h Change {sortField === 'priceChange24h' && (sortDirection === 'desc' ? '↓' : '↑')}
                  </th>
                  <th 
                    className="text-right py-2 cursor-pointer hover:bg-muted"
                    onClick={() => handleSort('socialScore')}
                  >
                    Social Score {sortField === 'socialScore' && (sortDirection === 'desc' ? '↓' : '↑')}
                  </th>
                  <th className="text-center py-2">Risk</th>
                  <th 
                    className="text-right py-2 cursor-pointer hover:bg-muted"
                    onClick={() => handleSort('createdAt')}
                  >
                    Age {sortField === 'createdAt' && (sortDirection === 'desc' ? '↓' : '↑')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedMemecoins.map((coin) => (
                  <tr key={coin.address} className="border-b hover:bg-muted/50">
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-xs font-bold text-white">
                          {coin.symbol.substring(0, 2)}
                        </div>
                        <div>
                          <div className="flex items-center gap-1">
                            <span className="font-medium">{coin.symbol}</span>
                            {!coin.isBonded && <Badge variant="outline" className="text-xs">Unbonded</Badge>}
                          </div>
                          <div className="text-sm text-muted-foreground">{coin.name}</div>
                          <div className="flex gap-1 mt-1">
                            {coin.tags.map(tag => (
                              <Badge key={tag} variant="secondary" className="text-xs px-1 py-0">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3">
                      <Badge variant="outline">{coin.platform}</Badge>
                    </td>
                    <td className="py-3 text-right">${formatNumber(coin.liquidityUSD)}</td>
                    <td className="py-3 text-right">
                      <div className={`flex items-center justify-end gap-1 ${
                        coin.priceChange24h >= 0 ? 'text-green-500' : 'text-red-500'
                      }`}>
                        {coin.priceChange24h >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        {Math.abs(coin.priceChange24h).toFixed(1)}%
                      </div>
                    </td>
                    <td className="py-3 text-right">{coin.socialScore.toFixed(0)}/100</td>
                    <td className="py-3 text-center">
                      <Badge className={`${getRiskColor(coin.riskLevel)} text-white`}>
                        {coin.riskLevel.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-1 text-sm">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        {getTimeAgo(coin.createdAt)}
                      </div>
                    </td>
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