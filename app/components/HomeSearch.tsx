'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';

export default function HomeSearch() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery) return;
    router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
  };

  return (
    <div className="max-w-2xl mx-auto mb-16">
      <form onSubmit={handleSearch} className="relative">
        <Input
          type="text"
          placeholder="Search transactions, blocks, programs and tokens..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-12 pl-12 pr-4 bg-muted/50 border-0"
        />
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={20} />
        <Button 
          type="submit"
          className="absolute right-2 top-1/2 transform -translate-y-1/2 px-6"
        >
          Search
        </Button>
      </form>
    </div>
  );
}