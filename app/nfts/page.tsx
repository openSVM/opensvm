'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function NFTsPage() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <main className="container mx-auto p-4">
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="text-2xl font-bold mb-2">NFTs</h1>
          <p className="text-muted-foreground">Explore Solana NFT collections</p>
        </div>

        <div className="flex gap-4">
          <Input
            type="text"
            placeholder="Search by collection name or NFT address"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-xl bg-secondary/50"
          />
          <Button className="bg-[#00DC82] hover:bg-[#00DC82]/80">Search</Button>
        </div>

        <div className="rounded-lg border bg-card">
          <div className="p-6 border-b">
            <h2 className="font-semibold">Top Collections</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-4 gap-4 font-medium text-sm text-muted-foreground mb-4">
              <div>Collection</div>
              <div>Floor Price</div>
              <div>Volume 24h</div>
              <div>Total Volume</div>
            </div>
            <div className="text-center py-8 text-muted-foreground">
              Collection list coming soon...
            </div>
          </div>
        </div>
      </div>
    </main>
  );
} 