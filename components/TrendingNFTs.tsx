'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface NFTCollection {
  address: string;
  name: string;
  floorPrice: number;
  volume24h: number;
  listings: number;
  sales24h: number;
}

const EXAMPLE_COLLECTIONS: NFTCollection[] = [
  {
    address: 'mad_lads11111111111111111111111111111111111111',
    name: 'Mad Lads',
    floorPrice: 89.5,
    volume24h: 12345,
    listings: 234,
    sales24h: 45
  },
  {
    address: 'famous_fox11111111111111111111111111111111111',
    name: 'Famous Fox Federation',
    floorPrice: 145.2,
    volume24h: 8765,
    listings: 167,
    sales24h: 32
  },
  {
    address: 'okay_bears1111111111111111111111111111111111111',
    name: 'Okay Bears',
    floorPrice: 234.8,
    volume24h: 6543,
    listings: 198,
    sales24h: 28
  }
];

export default function TrendingNFTs() {
  const [collections, setCollections] = useState<NFTCollection[]>(EXAMPLE_COLLECTIONS);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleCollectionClick = (address: string) => {
    router.push(`/collection/${address}`);
  };

  if (isLoading) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg">
        <div className="p-4 border-b border-gray-200">
          <h2 className="font-medium text-gray-900">Trending NFT Collections</h2>
        </div>
        <div className="p-6">
          <div className="text-center text-gray-500 animate-pulse">
            Loading collections...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg">
      <div className="p-4 border-b border-gray-200">
        <h2 className="font-medium text-gray-900">Trending NFT Collections</h2>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-5 gap-4 text-sm text-gray-500 mb-4">
          <div>Collection</div>
          <div className="text-right">Floor</div>
          <div className="text-right">Volume</div>
          <div className="text-right">Listed</div>
          <div className="text-right">Sales</div>
        </div>
        <div className="space-y-2">
          {collections.map((collection) => (
            <div
              key={`collection-${collection.address}`}
              onClick={() => handleCollectionClick(collection.address)}
              className="grid grid-cols-5 gap-4 text-sm p-3 rounded bg-white hover:bg-gray-100 transition-colors cursor-pointer border border-gray-100"
            >
              <div className="font-medium text-gray-900">
                {collection.name}
              </div>
              <div className="text-right text-gray-700">
                ◎{collection.floorPrice.toLocaleString()}
              </div>
              <div className="text-right text-gray-700">
                ◎{collection.volume24h.toLocaleString()}
              </div>
              <div className="text-right text-gray-700">
                {collection.listings.toLocaleString()}
              </div>
              <div className="text-right text-gray-700">
                {collection.sales24h.toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 