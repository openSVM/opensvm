'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSearchRoute } from '@/lib/utils';

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;
    
    try {
      setIsLoading(true);
      const route = await getSearchRoute(query.trim());
      router.push(route);
    } catch (error) {
      console.error('Error getting search route:', error);
      // On error, use the search page
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative flex w-full">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by address, transaction, block or token"
        className="w-full rounded-l-lg border border-r-0 border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 focus:border-[#00ffbd] focus:outline-none focus:ring-1 focus:ring-[#00ffbd]"
      />
      <button
        type="submit"
        disabled={isLoading}
        className={`rounded-r-lg bg-[#00ffbd] px-6 py-3 text-sm font-medium text-black hover:bg-[#00e6aa] flex items-center justify-center ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {isLoading ? 'Searching...' : 'Search'}
      </button>
    </form>
  );
}
