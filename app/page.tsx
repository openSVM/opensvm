'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { RecentBlocks } from '@/components/RecentBlocks';
import { TopPrograms } from '@/components/TopPrograms';
import { TrendingTokens } from '@/components/TrendingTokens';
import { RecentTransactions } from '@/components/RecentTransactions';
import { NetworkResponseChart } from '@/components/NetworkResponseChart';

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement search functionality
  };

  return (
    <main className="container mx-auto p-6 space-y-6">
      {/* Search Section */}
      <form onSubmit={handleSearch} className="max-w-3xl mx-auto">
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Search by address, transaction, block, or token..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />
          <Button type="submit">Search</Button>
        </div>
      </form>

      {/* Network Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <NetworkResponseChart />
        <RecentBlocks />
        <TopPrograms />
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <RecentTransactions />
        <TrendingTokens />
      </div>
    </main>
  );
}
