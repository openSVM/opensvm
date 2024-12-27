'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Memecoin {
  address: string;
  name: string;
  symbol: string;
  price: number;
  change24h: number;
  volume24h: number;
}

const EXAMPLE_MEMECOINS: Memecoin[] = [
  {
    address: 'bonk1111111111111111111111111111111111111111',
    name: 'Bonk',
    symbol: 'BONK',
    price: 0.00000123,
    change24h: 15.4,
    volume24h: 1234567
  },
  {
    address: 'myro1111111111111111111111111111111111111111',
    name: 'Myro',
    symbol: 'MYRO',
    price: 0.00000789,
    change24h: -5.2,
    volume24h: 987654
  },
  {
    address: 'popcat11111111111111111111111111111111111111',
    name: 'Pop Cat',
    symbol: 'POPCAT',
    price: 0.00000456,
    change24h: 8.7,
    volume24h: 456789
  }
];

export default function TrendingMemecoins() {
  const [memecoins, setMemecoins] = useState<Memecoin[]>(EXAMPLE_MEMECOINS);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleMemecoinClick = (address: string) => {
    router.push(`/token/${address}`);
  };

  if (isLoading) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg">
        <div className="p-4 border-b border-gray-200">
          <h2 className="font-medium text-gray-900">Trending Memecoins</h2>
        </div>
        <div className="p-6">
          <div className="text-center text-gray-500 animate-pulse">
            Loading memecoins...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg">
      <div className="p-4 border-b border-gray-200">
        <h2 className="font-medium text-gray-900">Trending Memecoins</h2>
      </div>
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
              <div className="text-gray-700">◎{coin.price.toFixed(8)}</div>
              <div className={`text-right ${coin.change24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {coin.change24h.toFixed(2)}%
              </div>
              <div className="text-right text-gray-700">
                ◎{coin.volume24h.toLocaleString()}
              </div>
              <div className="text-right text-gray-700">
                ◎{(coin.price * coin.volume24h).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 