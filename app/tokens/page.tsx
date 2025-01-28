'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface Token {
  mint: string;
  name: string;
  symbol: string;
  price: number;
  change24h: number;
  volume24h: number;
  marketCap: number;
}

// Well-known token mints
const KNOWN_TOKENS: Token[] = [
  {
    mint: 'So11111111111111111111111111111111111111112',
    name: 'Solana',
    symbol: 'SOL',
    price: 198.35,
    change24h: 3.15,
    volume24h: 1234567890,
    marketCap: 85000000000
  },
  {
    mint: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
    name: 'Bonk',
    symbol: 'BONK',
    price: 0.000016,
    change24h: -2.5,
    volume24h: 45678901,
    marketCap: 950000000
  },
  {
    mint: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R',
    name: 'Raydium',
    symbol: 'RAY',
    price: 1.23,
    change24h: 5.7,
    volume24h: 7890123,
    marketCap: 250000000
  }
];

export default function TokensPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const router = useRouter();
  const [tokens, setTokens] = useState<Token[]>(KNOWN_TOKENS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTokens() {
      try {
        // TODO: Implement real token data fetching
        setTokens(KNOWN_TOKENS);
      } catch (error) {
        console.error('Error fetching tokens:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchTokens();
  }, []);

  const handleTokenClick = (mint: string) => {
    router.push(`/token/${mint}`);
  };

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Search Section */}
        <div className="max-w-3xl mx-auto mb-12">
          <Input
            type="text"
            placeholder="Search tokens by name or address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-background border border-border text-foreground placeholder:text-muted-foreground h-12 px-4 rounded-lg"
          />
        </div>

        {/* Tokens Table */}
        <div className="bg-background border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-background">
                  <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Name</th>
                  <th className="px-6 py-3 text-right text-sm font-medium text-muted-foreground">Price</th>
                  <th className="px-6 py-3 text-right text-sm font-medium text-muted-foreground">24h Change</th>
                  <th className="px-6 py-3 text-right text-sm font-medium text-muted-foreground">24h Volume</th>
                  <th className="px-6 py-3 text-right text-sm font-medium text-muted-foreground">Market Cap</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {tokens.map((token) => (
                  <tr 
                    key={token.mint} 
                    className="hover:bg-muted/50 cursor-pointer" 
                    onClick={() => handleTokenClick(token.mint)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div>
                          <div className="font-medium text-foreground">{token.name}</div>
                          <div className="text-sm text-muted-foreground">{token.symbol}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-foreground">
                      ${token.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                    </td>
                    <td className={`px-6 py-4 text-right text-sm ${token.change24h >= 0 ? 'text-success' : 'text-destructive'}`}>
                      {token.change24h >= 0 ? '+' : ''}{token.change24h}%
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-foreground">
                      ${token.volume24h.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-foreground">
                      ${token.marketCap.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}
