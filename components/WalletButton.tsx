'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';

interface WalletButtonProps {}

export const WalletButton: React.FC<WalletButtonProps> = () => {
  const { connected, connecting, disconnect, select, wallets, publicKey } = useWallet();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleConnect = async () => {
    // Find Phantom wallet from available wallets
    const phantomWallet = wallets.find(wallet => wallet.adapter.name === 'Phantom');
    
    if (phantomWallet) {
      try {
        // Select and connect to Phantom wallet
        select(phantomWallet.adapter.name);
        await phantomWallet.adapter.connect();
      } catch (error) {
        console.error('Failed to connect to Phantom wallet:', error);
      }
    }
  };

  if (!mounted) {
    return (
      <Button variant="outline" className="min-w-[180px] h-9">
        Connect Wallet
      </Button>
    );
  }

  if (connecting) {
    return (
      <Button variant="outline" className="min-w-[180px] h-9" disabled>
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
        Connecting...
      </Button>
    );
  }

  if (connected && publicKey) {
    return (
      <Button 
        variant="outline" 
        className="min-w-[180px] h-9 text-destructive hover:text-destructive-foreground hover:bg-destructive"
        onClick={() => disconnect()}
      >
        Disconnect
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      className="min-w-[180px] h-9 bg-primary text-primary-foreground hover:bg-primary/90"
      onClick={handleConnect}
    >
      Connect Wallet
    </Button>
  );
};