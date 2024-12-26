'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import RecentBlocks from '@/components/RecentBlocks';

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery) return;

    // Determine the type of search query and redirect accordingly
    if (searchQuery.length === 88 || searchQuery.length === 87) {
      // Signature (transaction)
      router.push(`/tx/${searchQuery}`);
    } else if (searchQuery.length === 32 || searchQuery.length === 44) {
      // Public key (account/program)
      router.push(`/address/${searchQuery}`);
    } else if (!isNaN(Number(searchQuery))) {
      // Block number
      router.push(`/block/${searchQuery}`);
    } else {
      // Default to address search
      router.push(`/address/${searchQuery}`);
    }
  };

  return (
    <main className="container mx-auto p-4">
      <div className="flex flex-col items-center justify-center min-h-[40vh] text-center">
        <h1 className="text-4xl font-bold mb-4">Solana Block Explorer</h1>
        <p className="text-lg mb-8">Search for any Solana address, transaction, token, or NFT</p>
        
        <form onSubmit={handleSearch} className="w-full max-w-3xl flex gap-2">
          <Input
            type="text"
            placeholder="Search transactions, blocks, programs and tokens"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-secondary/50"
          />
          <Button type="submit" className="bg-[#00DC82] hover:bg-[#00DC82]/80">Search</Button>
        </form>
      </div>

      <div className="mt-8">
        <RecentBlocks />
      </div>
    </main>
  );
}
