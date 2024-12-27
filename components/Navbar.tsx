'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Navbar() {
  return (
    <div className="border-b border-gray-200 bg-white/50 backdrop-blur-xl">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="text-gray-900">
            <span className="text-lg font-medium">OPENSVM</span>
          </div>
          <div className="text-gray-600">
            $198.35
            <span className="ml-2 text-[#00DC82]">+3.15%</span>
          </div>
          <div className="text-gray-500 text-sm">
            Avg Fee: 9e-7
          </div>
          <div className="text-gray-500 text-sm">
            plz donate som for RPC and servers: openNjUKc3Z3AQfacwYLNizMiTi488kLhA3EDTBqn2d
          </div>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/" className="text-gray-600 hover:text-gray-900">Home</Link>
          <Link href="/tokens" className="text-gray-600 hover:text-gray-900">Tokens</Link>
          <Link href="/nfts" className="text-gray-600 hover:text-gray-900">NFTs</Link>
          <Link href="/analytics" className="text-gray-600 hover:text-gray-900">Analytics</Link>
          <Button className="bg-[#00DC82] hover:bg-[#00DC82]/90 text-black">Connect Wallet</Button>
        </div>
      </div>
    </div>
  );
} 