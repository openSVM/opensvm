'use client';

import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function HomeHero() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery) return;
    router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
  };

  return (
    <div className="text-center mb-12">
      <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-4">
        OpenSVM Explorer
      </h1>
      <p className="text-xl text-muted-foreground mb-8">
        The quieter you become, the more you are able to hear.
      </p>
      <form onSubmit={handleSearch} className="max-w-2xl mx-auto relative">
        <input
          type="text"
          placeholder="Search transactions, blocks, programs and tokens..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-12 pl-12 pr-4 bg-muted/50 border-0 rounded-lg"
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