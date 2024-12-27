'use client';

import Link from 'next/link';
import { AIAssistant } from './AIAssistant';

export function Navbar() {
  return (
    <div className="flex items-center justify-between p-4 border-b border-gray-200">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <Link href="/" className="text-xl font-bold">
            OPENSVM
          </Link>
          <AIAssistant />
          <span className="text-xl">$198.35</span>
          <span className="text-green-500">+3.15%</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">Avg Fee: 9e-7</span>
          <div className="text-sm text-gray-500">
            plz donate som for RPC and servers:
            <span className="ml-1">openNjUKc3Z3AQfacwYLNiZMiTi488kLhA3EDTBqn2d</span>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <Link href="/" className="text-sm">Home</Link>
        <Link href="/tokens" className="text-sm">Tokens</Link>
        <Link href="/nfts" className="text-sm">NFTs</Link>
        <Link href="/analytics" className="text-sm">Analytics</Link>
        <button className="px-4 py-2 text-sm bg-green-500 text-white rounded-lg">
          Connect Wallet
        </button>
      </div>
    </div>
  );
} 