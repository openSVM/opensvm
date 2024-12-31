'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { AIChatSidebar } from './ai/AIChatSidebar';
import { Menu, X } from 'lucide-react';

interface NavbarProps {
  children: React.ReactNode;
}

export function Navbar({ children }: NavbarProps) {
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(400);
  const [isResizing, setIsResizing] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleWidthChange = useCallback((width: number) => {
    setSidebarWidth(width);
  }, []);

  const handleResizeStart = useCallback(() => {
    setIsResizing(true);
  }, []);

  const handleResizeEnd = useCallback(() => {
    setIsResizing(false);
  }, []);

  return (
    <>
      <header 
        className="border-b border-gray-200 fixed top-0 left-0 right-0 bg-white z-[100]"
        style={{ 
          width: isAIChatOpen ? `calc(100% - ${sidebarWidth}px)` : '100%',
          transition: !isResizing ? 'all 300ms ease-in-out' : 'none',
          marginRight: isAIChatOpen ? `${sidebarWidth}px` : 0
        }}
      >
        <div className="px-4 py-3">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Link href="/" className="text-xl font-bold flex items-center text-black">
                  OPENSVM
                  <button
                    onClick={() => setIsAIChatOpen(true)}
                    className="ml-2 px-2 py-1 bg-[#44ccff]/10 text-[#44ccff] text-sm font-medium rounded hover:bg-[#44ccff]/20"
                  >
                    [AI]
                  </button>
                </Link>
              </div>

              {/* Desktop Menu */}
              <div className="hidden md:flex items-center space-x-6">
                <Link href="/" className="text-sm font-medium hover:text-gray-600">Home</Link>
                <Link href="/tokens" className="text-sm font-medium hover:text-gray-600">Tokens</Link>
                <Link href="/nfts" className="text-sm font-medium hover:text-gray-600">NFTs</Link>
                <Link href="/analytics" className="text-sm font-medium hover:text-gray-600">Analytics</Link>
                <button className="px-4 py-2 text-sm font-medium bg-[#00e599] text-white rounded-lg hover:bg-[#00e599]/90">
                  Connect Wallet
                </button>
              </div>

              {/* Mobile Menu Button */}
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:hidden p-2 hover:bg-gray-100 rounded-lg"
              >
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>

            {/* Mobile Menu */}
            <div className={`md:hidden transition-all duration-300 ease-in-out ${isMenuOpen ? 'max-h-64 opacity-100' : 'max-h-0 opacity-0'} overflow-hidden`}>
              <div className="py-2 space-y-2">
                <Link href="/" className="block px-4 py-2 text-sm hover:bg-gray-100 rounded-lg">Home</Link>
                <Link href="/tokens" className="block px-4 py-2 text-sm hover:bg-gray-100 rounded-lg">Tokens</Link>
                <Link href="/nfts" className="block px-4 py-2 text-sm hover:bg-gray-100 rounded-lg">NFTs</Link>
                <Link href="/analytics" className="block px-4 py-2 text-sm hover:bg-gray-100 rounded-lg">Analytics</Link>
                <button className="w-full text-left px-4 py-2 text-sm bg-[#00e599] text-white rounded-lg hover:bg-[#00e599]/90">
                  Connect Wallet
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex min-h-screen pt-[57px]">
        <main 
          style={{ 
            width: isAIChatOpen ? `calc(100% - ${sidebarWidth}px)` : '100%',
            transition: !isResizing ? 'all 300ms ease-in-out' : 'none',
            marginRight: isAIChatOpen ? `${sidebarWidth}px` : 0
          }}
          className="flex-1 overflow-x-hidden overflow-y-auto relative"
        >
          {children}
        </main>
        <AIChatSidebar 
          isOpen={isAIChatOpen}
          onClose={() => setIsAIChatOpen(false)}
          onWidthChange={handleWidthChange}
          onResizeStart={handleResizeStart}
          onResizeEnd={handleResizeEnd}
          initialWidth={sidebarWidth}
        />
      </div>
    </>
  );
} 