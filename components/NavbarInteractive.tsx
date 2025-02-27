'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Lazy load components
const SettingsMenu = dynamic(
  () => import('./SettingsMenu').then(mod => ({ default: mod.SettingsMenu })),
  { 
    loading: () => null,
    ssr: false
  }
);

const WalletButton = dynamic(
  () => import('./WalletButton').then(mod => ({ default: mod.WalletButton })),
  {
    loading: () => null,
    ssr: false
  }
);

// Lazy load AI Chat with more aggressive code splitting
const AIChatSidebar = dynamic(
  () => import('./ai/AIChatSidebar').then(mod => ({ default: mod.AIChatSidebar })),
  { 
    loading: () => null,
    ssr: false
  }
);

export function NavbarInteractive() {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const [showInteractiveElements, setShowInteractiveElements] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Delay loading interactive elements
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowInteractiveElements(true);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;
    router.push(`/search?q=${encodeURIComponent(query)}`);
  };

  // Handle outside clicks for menu
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!showInteractiveElements) {
    return null;
  }

  return (
    <>
      {/* Interactive search form */}
      <form onSubmit={handleSearch} className="flex-1 max-w-xl px-4">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-background border border-border hover:border-foreground/20 focus:border-foreground/40 pl-10 h-9 transition-colors rounded-md"
          placeholder="Search accounts, tokens, or programs..."
        />
      </form>

      {/* Interactive navigation */}
      <div className="hidden sm:flex items-center gap-4">
        {/* Explore Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2">
              Explore
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => router.push('/networks')}>Networks</DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push('/blocks')}>Blocks</DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push('/programs')}>Programs</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Tokens Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2">
              Tokens
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => router.push('/tokens')}>All Tokens</DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push('/tokens/gainers')}>Top Gainers</DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push('/tokens/new')}>New Listings</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* NFTs Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2">
              NFTs
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => router.push('/nfts')}>Collections</DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push('/nfts/trending')}>Trending</DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push('/nfts/new')}>New Mints</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <WalletButton />
        <SettingsMenu />
        <Button 
          className="bg-[#00DC82] text-black hover:bg-[#00DC82]/90"
          onClick={() => setIsAIChatOpen(true)}
        >
          AI Assistant
        </Button>
      </div>

      {/* AI Chat Sidebar - Only load when opened */}
      {isAIChatOpen && (
        <AIChatSidebar
          isOpen={isAIChatOpen}
          onClose={() => setIsAIChatOpen(false)}
          onWidthChange={() => {}}
          onResizeStart={() => {}}
          onResizeEnd={() => {}}
          initialWidth={400}
        />
      )}
    </>
  );
}