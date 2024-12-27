'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';

interface NFTCollection {
  name: string;
  floorPrice: number;
  volume24h: number;
  listings: number;
  sales24h: number;
  holders: number;
}

const EXAMPLE_COLLECTIONS: NFTCollection[] = [
  {
    name: 'DeGods',
    floorPrice: 343.5,
    volume24h: 12567.89,
    listings: 154,
    sales24h: 23,
    holders: 7890
  },
  {
    name: 'Okay Bears',
    floorPrice: 89.2,
    volume24h: 5678.12,
    listings: 234,
    sales24h: 15,
    holders: 5432
  },
  {
    name: 'Mad Lads',
    floorPrice: 145.7,
    volume24h: 8901.34,
    listings: 187,
    sales24h: 19,
    holders: 6543
  },
  // Add more example collections as needed
];

export default function NFTsPage() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <main className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        {/* Search Section */}
        <div className="max-w-3xl mx-auto mb-12">
          <Input
            type="text"
            placeholder="Search NFT collections..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 text-gray-900 placeholder:text-gray-400 h-12 px-4 rounded-lg"
          />
        </div>

        {/* NFT Collections Table */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Collection</th>
                  <th className="px-6 py-3 text-right text-sm font-medium text-gray-500">Floor Price</th>
                  <th className="px-6 py-3 text-right text-sm font-medium text-gray-500">24h Volume</th>
                  <th className="px-6 py-3 text-right text-sm font-medium text-gray-500">Listings</th>
                  <th className="px-6 py-3 text-right text-sm font-medium text-gray-500">24h Sales</th>
                  <th className="px-6 py-3 text-right text-sm font-medium text-gray-500">Holders</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {EXAMPLE_COLLECTIONS.map((collection) => (
                  <tr key={collection.name} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="font-medium text-gray-900">{collection.name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-gray-900">
                      ◎{collection.floorPrice.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-gray-900">
                      ◎{collection.volume24h.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-gray-900">
                      {collection.listings.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-gray-900">
                      {collection.sales24h.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-gray-900">
                      {collection.holders.toLocaleString()}
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