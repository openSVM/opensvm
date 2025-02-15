'use client';

import { useState } from 'react';

interface Token {
  address: string;
  name: string;
  symbol: string;
  volume24h: number;
  price: number;
  priceUsd: number | null;
  change24h: number;
  decimals: number;
}

const EXAMPLE_TOKENS: Token[] = [
  {
    address: 'So11111111111111111111111111111111111111112',
    name: 'Wrapped SOL',
    symbol: 'wSOL',
    volume24h: 123456789,
    price: 100.50,
    priceUsd: 100.50,
    change24h: 2.5,
    decimals: 9
  },
  {
    address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    name: 'USD Coin',
    symbol: 'USDC',
    volume24h: 98765432,
    price: 1.00,
    priceUsd: 1.00,
    change24h: 0.1,
    decimals: 6
  },
  {
    address: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
    name: 'USDT',
    symbol: 'USDT',
    volume24h: 87654321,
    price: 1.00,
    priceUsd: 1.00,
    change24h: -0.1,
    decimals: 6
  },
  {
    address: 'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So',
    name: 'Marinade Staked SOL',
    symbol: 'mSOL',
    volume24h: 7654321,
    price: 102.75,
    priceUsd: 102.75,
    change24h: 3.2,
    decimals: 9
  },
  {
    address: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
    name: 'Raydium',
    symbol: 'RAY',
    volume24h: 6543210,
    price: 0.75,
    priceUsd: 0.75,
    change24h: -1.5,
    decimals: 6
  }
];

export function TrendingTokens() {
  const [tokens] = useState<Token[]>(EXAMPLE_TOKENS);

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
              <div className="text-sm">
                <div className="text-gray-300 font-medium">
                  {token.name} <span className="text-gray-500">({token.symbol})</span>
                </div>
                <div className="text-gray-500 text-xs font-mono truncate w-48">
                  {token.address}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-gray-300">
                ${token.priceUsd?.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 8
                })}
              </div>
              <div className={`text-sm ${token.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {token.change24h >= 0 ? '+' : ''}{token.change24h.toFixed(2)}%
              </div>
              <div className="text-gray-500 text-xs">
                ${token.volume24h.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}