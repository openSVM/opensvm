// @ts-nocheck

"use client";

import SearchBar from '@/components/SearchBar';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Home() {
  const router = useRouter();

  const handleSearch = (address: string) => {
    if (address) {
      router.push(`/account/${address}`);
    }
  };

  return (
    <main className="min-h-screen bg-[#f8f9fa]">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <Link href="/" className="text-xl font-bold text-[#333]">
                OPENSVM
              </Link>
              <div className="ml-4 flex items-center text-sm text-[#666]">
                <span className="text-[#00ffbd]">$198.35</span>
                <span className="ml-1 text-[#22c55e]">+3.15%</span>
                <span className="ml-4">Avg Fee: 0.00001304</span>
              </div>
              <nav className="ml-10 flex space-x-4">
                <Link href="/" className="text-[#333] hover:text-[#00ffbd]">
                  Home
                </Link>
                <Link href="/tokens" className="text-[#666] hover:text-[#333]">
                  Tokens
                </Link>
                <Link href="/nfts" className="text-[#666] hover:text-[#333]">
                  NFTs
                </Link>
                <Link href="/analytics" className="text-[#666] hover:text-[#333]">
                  Analytics
                </Link>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <button className="rounded-lg bg-[#00ffbd] px-4 py-2 text-sm font-medium text-black hover:bg-[#00e6aa]">
                Connect Wallet
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="mb-4 text-4xl font-bold text-[#333]">
            Solana Block Explorer
          </h1>
          <p className="text-lg text-[#666]">
            Search for any Solana address, transaction, token, or NFT
          </p>
        </div>
        <div className="max-w-3xl mx-auto">
          <SearchBar onSearch={handleSearch} />
        </div>
      </div>
    </main>
  );
}
