import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { usePathname } from 'next/navigation';
import { AIChatDialog } from './AIChatDialog';

export function AIAssistant() {
  const [isHovered, setIsHovered] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const pathname = usePathname();

  // Update context based on current page
  useEffect(() => {
    const pageContext = {
      '/': 'Viewing home page with network statistics and recent activity',
      '/tokens': 'Browsing token list and market data',
      '/nfts': 'Exploring NFT collections and trading activity',
      '/analytics': 'Analyzing network metrics and program usage',
    }[pathname] || 'Exploring Solana blockchain data';

    setMessage(pageContext);
  }, [pathname]);

  // Handle global errors
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      setMessage(`Error: ${event.message}. How can I help?`);
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  return (
    <>
      <div className="relative">
        <button
          type="button"
          className="text-sm font-mono text-[#44ccff] bg-[#44ccff]/5 relative px-3 py-1.5 rounded-md
            before:content-[''] before:absolute before:inset-0 before:bg-[#44ccff]/10 before:opacity-100
            after:content-[''] after:absolute after:inset-0 after:bg-[#44ccff]/5 after:animate-scanline
            shadow-[0_0_15px_rgba(68,204,255,0.5)] hover:shadow-[0_0_20px_rgba(68,204,255,0.7)]
            border border-[#44ccff]/50"
          onClick={() => setIsChatOpen(true)}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          [AI]
        </button>

        {isHovered && message && !isChatOpen && (
          <div className="absolute right-0 top-full mt-2 w-64 rounded-lg bg-black/90 p-4 text-sm text-[#44ccff] shadow-lg backdrop-blur-sm border border-[#44ccff]/30">
            <p>{message}</p>
            <p className="mt-2 text-xs text-[#44ccff]/60">Click to chat with AI Assistant</p>
          </div>
        )}
      </div>

      <AIChatDialog
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        initialContext={message || undefined}
      />
    </>
  );
} 