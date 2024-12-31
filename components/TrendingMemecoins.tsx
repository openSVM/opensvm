'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getTokenPrice } from '@/lib/solana';

interface Memecoin {
  address: string;
  name: string;
  symbol: string;
  price: number;
  priceUsd: number | null;
  change24h: number;
  volume24h: number;
  marketCap: number;
  decimals: number;
}

const EXAMPLE_MEMECOINS: Memecoin[] = [
  {
    address: 'bonk1111111111111111111111111111111111111111',
    name: 'Bonk',
    symbol: 'BONK',
    price: 0.00000123,
    priceUsd: null,
    change24h: 15.4,
    volume24h: 1234567,
    marketCap: 0,
    decimals: 5
  },
  {
    address: 'myro1111111111111111111111111111111111111111',
    name: 'Myro',
    symbol: 'MYRO',
    price: 0.00000789,
    priceUsd: null,
    change24h: -5.2,
    volume24h: 987654,
    marketCap: 0,
    decimals: 9
  },
  {
    address: 'popcat11111111111111111111111111111111111111',
    name: 'Pop Cat',
    symbol: 'POPCAT',
    price: 0.00000456,
    priceUsd: null,
    change24h: 8.7,
    volume24h: 456789,
    marketCap: 0,
    decimals: 9
  }
];

export default function TrendingMemecoins() {
  const router = useRouter();
  const [memecoins, setMemecoins] = useState<Memecoin[]>(EXAMPLE_MEMECOINS);

  const fetchPrices = useCallback(async () => {
    const updatedMemecoins = await Promise.all(
      memecoins.map(async (coin) => {
        const priceData = await getTokenPrice(coin.address);
        const supply = coin.volume24h / (coin.price * Math.pow(10, coin.decimals));
        return {
          ...coin,
          priceUsd: priceData.priceUsd,
          change24h: priceData.priceChange24h || coin.change24h,
          volume24h: priceData.volume24h || coin.volume24h,
          marketCap: priceData.priceUsd ? priceData.priceUsd * supply : 0
        };
      })
    );
    setMemecoins(updatedMemecoins);
  }, [memecoins]);

  useEffect(() => {
    fetchPrices();
  }, [fetchPrices]);

  const handleMemecoinClick = (address: string) => {
    router.push(`/token/${address}`);
  };

  return (
    <div className="rounded-lg bg-white shadow-sm">
      <div className="p-6">
        <div className="grid grid-cols-5 gap-4 text-sm text-gray-500 mb-4">
          <div>Token</div>
          <div>Price</div>
          <div className="text-right">24h Change</div>
          <div className="text-right">Volume</div>
          <div className="text-right">Market Cap</div>
        </div>
        <div className="space-y-2">
          {memecoins.map((coin) => (
            <div
              key={`memecoin-${coin.address}`}
              onClick={() => handleMemecoinClick(coin.address)}
              className="grid grid-cols-5 gap-4 text-sm p-3 rounded bg-white hover:bg-gray-100 transition-colors cursor-pointer border border-gray-100"
            >
              <div>
                <span className="font-medium text-gray-900">{coin.name}</span>
                <span className="ml-2 text-xs text-gray-500">
                  {coin.symbol}
                </span>
              </div>
              <div className="text-gray-700">
                ${coin.priceUsd?.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 8
                }) || (coin.price / Math.pow(10, coin.decimals)).toFixed(8)}
              </div>
              <div className={`text-right ${coin.change24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {coin.change24h.toFixed(2)}%
              </div>
              <div className="text-right text-gray-700">
                ${coin.volume24h.toLocaleString()}
              </div>
              <div className="text-right text-gray-700">
                ${coin.marketCap.toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 