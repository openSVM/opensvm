'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSearchRoute } from '@/lib/utils';

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      const route = getSearchRoute(query.trim());
      router.push(route);
    }
  };

  return (
    <div className="relative">
      <form onSubmit={handleSubmit} className="flex w-full">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by address, transaction, block or token"
          className="w-full rounded-l-lg border border-r-0 border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 focus:border-[#00ffbd] focus:outline-none focus:ring-1 focus:ring-[#00ffbd]"
        />
        <button
          type="submit"
          className="rounded-r-lg bg-[#00ffbd] px-6 py-3 text-sm font-medium text-black hover:bg-[#00e6aa]"
        >
          Search
        </button>
      </form>
    </div>
  );
} 