'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SettingsMenu } from './SettingsMenu';
import { WalletButton } from './WalletButton';
import { AIChatSidebar } from './ai/AIChatSidebar';

interface NavbarInteractiveProps {
  children?: React.ReactNode;
}

export function NavbarInteractive({ children }: NavbarInteractiveProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(400);
  const [isResizing, setIsResizing] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (query) {
      router.push(`/search?q=${encodeURIComponent(query)}`);
    }
  };

  const handleWidthChange = (newWidth: number) => {
    setSidebarWidth(newWidth);
  };

  const handleResizeStart = () => {
    setIsResizing(true);
    document.body.style.cursor = 'col-resize';
  };

  const handleResizeEnd = () => {
    setIsResizing(false);
    document.body.style.cursor = 'default';
  };

  return (
    <div className="flex w-full items-center">
      {/* Logo area */}
      <div className="flex items-center gap-2">
        <span className="font-bold text-lg">OPENSVM</span>
        <span className="text-sm">[AI]</span>
      </div>
      
      {/* Interactive search form */}
      <form onSubmit={handleSearch} className="flex-1 max-w-xl mx-4">
        <div className="relative">
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
            <svg 
              width="18" 
              height="18" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              className="opacity-70"
            >
              <path d="M19 19l-4.35-4.35M11 5a6 6 0 100 12 6 6 0 000-12z" />
            </svg>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-background/50 border border-border hover:border-foreground/20 focus:border-foreground/40 pl-10 h-9 transition-colors rounded-md"
            placeholder="Search accounts, tokens, or programs..."
          />
        </div>
      </form>

      {/* Interactive navigation */}
      <div className="flex items-center gap-2">
        {/* Updated dropdown to support testing */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="gap-1 px-2"
              data-testid="nav-dropdown-explore"
            >
              Explore
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="animate-duration-300">
            <DropdownMenuItem 
              onClick={(e) => {
                e.stopPropagation();
                router.push('/networks');
              }}
            >
              Networks
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={(e) => {
                e.stopPropagation();
                router.push('/blocks');
              }}
            >
              Blocks
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={(e) => {
                e.stopPropagation();
                router.push('/programs');
              }}
            >
              Programs
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Tokens Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="gap-1 px-2"
              data-testid="nav-dropdown-tokens"
            >
              Tokens
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="animate-duration-300">
            <DropdownMenuItem 
              onClick={(e) => {
                e.stopPropagation();
                router.push('/tokens');
              }}
            >
              All Tokens
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={(e) => {
                e.stopPropagation();
                router.push('/tokens/gainers');
              }}
            >
              Top Gainers
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={(e) => {
                e.stopPropagation();
                router.push('/tokens/new');
              }}
            >
              New Listings
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* NFTs Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="gap-1 px-2"
              data-testid="nav-dropdown-nfts"
            >
              NFTs
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="animate-duration-300">
            <DropdownMenuItem 
              onClick={(e) => {
                e.stopPropagation();
                router.push('/nfts');
              }}
            >
              Collections
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={(e) => {
                e.stopPropagation();
                router.push('/nfts/trending');
              }}
            >
              Trending
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={(e) => {
                e.stopPropagation();
                router.push('/nfts/new');
              }}
            >
              New Mints
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        {/* Analytics Dropdown (added to match test) */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="gap-1 px-2"
              data-testid="nav-dropdown-analytics"
            >
              Analytics
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="animate-duration-300">
            <DropdownMenuItem 
              onClick={(e) => {
                e.stopPropagation();
                router.push('/analytics');
              }}
            >
              Dashboard
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={(e) => {
                e.stopPropagation();
                router.push('/analytics/trends');
              }}
            >
              Trends
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <SettingsMenu />
        <WalletButton />
        <Button 
          size="sm"
          className="bg-[#00DC82] text-black hover:bg-[#00DC82]/90 ml-2"
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
          onWidthChange={handleWidthChange}
          onResizeStart={handleResizeStart}
          onResizeEnd={handleResizeEnd}
          initialWidth={sidebarWidth}
        />
      )}
      
      {/* Render children */}
      {children}
    </div>
  );
}
