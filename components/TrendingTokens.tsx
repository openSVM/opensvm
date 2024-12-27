'use client';

import { useEffect, useState } from 'react';
import { getTrendingTokens } from '@/lib/solana';

interface Token {
  address: string;
  volume24h: number;
  price: number;
  change24h: number;
}

export function TrendingTokens() {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchTokens() {
      try {
        const fetchedTokens = await getTrendingTokens(10);
        setTokens(fetchedTokens);
      } catch (error) {
        console.error('Error fetching tokens:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchTokens();
    const interval = setInterval(fetchTokens, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="rounded-lg bg-black/20 backdrop-blur-sm p-6 animate-pulse">
        <h2 className="text-xl font-semibold mb-4">Trending Tokens</h2>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-700/50 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-black/20 backdrop-blur-sm p-6">
      <h2 className="text-xl font-semibold mb-4">Trending Tokens</h2>
      <div className="space-y-4">
        {tokens.map((token) => (
          <div
            key={token.address}
            className="flex items-center justify-between p-3 rounded-lg bg-black/30"
          >
            <div className="flex items-center space-x-4">
              <div className="text-sm font-mono">
                <div className="text-gray-300 truncate w-48">
                  {token.address}
                </div>
                <div className="text-gray-500 text-xs">
                  ◎{token.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className={`text-sm ${token.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {token.change24h >= 0 ? '+' : ''}{token.change24h.toFixed(2)}%
              </div>
              <div className="text-gray-500 text-xs">
                ◎{token.volume24h.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 