'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AIChatSidebar } from './AIChatSidebar';

interface NavbarProps {
  children: React.ReactNode;
}

export function Navbar({ children }: NavbarProps) {
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);

  return (
    <>
      <header className="border-b border-gray-200">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Link href="/" className="text-xl font-bold">
                OPENSVM
              </Link>
              <button 
                onClick={() => setIsAIChatOpen(true)}
                className="ml-2 px-3 py-1.5 bg-[#44ccff] text-white text-sm font-medium rounded-lg glow-button transition-all duration-300 hover:bg-[#44ccff]/90"
              >
                [AI]
              </button>
            </div>

            <div className="flex items-center space-x-4">
              <Link href="/" className="text-sm hover:text-gray-600">Home</Link>
              <Link href="/tokens" className="text-sm hover:text-gray-600">Tokens</Link>
              <Link href="/nfts" className="text-sm hover:text-gray-600">NFTs</Link>
              <Link href="/analytics" className="text-sm hover:text-gray-600">Analytics</Link>
              <button className="px-4 py-2 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600">
                Connect Wallet
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-57px)]">
        <main className="flex-1 overflow-auto">
          {children}
        </main>
        {isAIChatOpen && (
          <AIChatSidebar 
            isOpen={isAIChatOpen}
            onClose={() => setIsAIChatOpen(false)}
          />
        )}
      </div>
    </>
  );
} 