'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Navbar() {
  return (
    <nav className="border-b">
      <div className="container mx-auto px-4 h-16 flex items-center">
        <div className="flex items-center gap-4 flex-1">
          <Link href="/" className="font-bold text-xl">OPENSVM</Link>
          <div className="text-[#00FFA3]">
            <span>$198.35</span>
            <span className="ml-1 text-sm">+3.15%</span>
          </div>
          <div className="text-sm text-muted-foreground">
            Avg Fee: 0.00001304
          </div>
          <div className="text-sm text-muted-foreground">
            plz donate som for RPC and servers: <span className="font-mono">openNjUKc3Z3AQfacwYLNizMiTi488kLhA3EDTBqn2d</span>
          </div>
        </div>

        <div className="flex items-center gap-8">
          <div className="flex items-center gap-6">
            <Link href="/" className="text-foreground hover:text-primary">Home</Link>
            <Link href="/tokens" className="text-muted-foreground hover:text-primary">Tokens</Link>
            <Link href="/nfts" className="text-muted-foreground hover:text-primary">NFTs</Link>
            <Link href="/analytics" className="text-muted-foreground hover:text-primary">Analytics</Link>
          </div>

          <Button className="bg-[#00DC82] hover:bg-[#00DC82]/90">Connect Wallet</Button>
        </div>
      </div>
    </nav>
  );
} 