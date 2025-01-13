'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface NFTCollection {
  address: string;
  name: string;
  symbol: string;
  image?: string;
}

export default function NFTsPage() {
  const [collections, setCollections] = useState<NFTCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCollections() {
      try {
        const response = await fetch('/api/nfts/collections');
        if (!response.ok) {
          throw new Error('Failed to fetch collections');
        }
        const data = await response.json();
        setCollections(data);
      } catch (err) {
        console.error('Error fetching NFT collections:', err);
        setError('Failed to load NFT collections. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    fetchCollections();
  }, []);

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">NFT Collections</h1>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">NFT Collections</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          // Loading skeletons
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-3/4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-32 w-full mb-4" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))
        ) : collections.length > 0 ? (
          // Display collections
          collections.map((collection) => (
            <Card key={collection.address}>
              <CardHeader>
                <h3 className="text-lg font-semibold">{collection.name}</h3>
                <p className="text-sm text-gray-500">{collection.symbol}</p>
              </CardHeader>
              <CardContent>
                {collection.image && (
                  <div className="relative h-32 w-full mb-4 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                    <img
                      src={collection.image}
                      alt={collection.name}
                      className="object-cover w-full h-full"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/images/placeholder-nft.svg';
                      }}
                    />
                  </div>
                )}
                <p className="text-sm font-mono truncate">{collection.address}</p>
              </CardContent>
            </Card>
          ))
        ) : (
          <p className="col-span-full text-center text-gray-500">No NFT collections found</p>
        )}
      </div>
    </div>
  );
}
