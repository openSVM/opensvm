'use client';

import { ConnectionProvider } from '@solana/wallet-adapter-react';
import { useSettings } from '@/lib/settings';
import { useEffect, useState } from 'react';
import { Connection } from '@solana/web3.js';
import { connectionPool, updateRpcEndpoint } from '@/lib/solana-connection';

export function SolanaProvider({ children }: { children: React.ReactNode }) {
  const { rpcEndpoint } = useSettings();
  const [endpoint, setEndpoint] = useState<string>('');
  
  useEffect(() => {
    // Update the connection pool when endpoint changes
    updateRpcEndpoint(rpcEndpoint.url);
    
    // Get connection from pool and extract endpoint
    const init = async () => {
      const conn = await connectionPool.getConnection();
      setEndpoint(conn.rpcEndpoint);
    };
    
    init();
  }, [rpcEndpoint.url]);

  if (!endpoint) {
    return null; // Or loading state
  }

  return (
    <ConnectionProvider endpoint={endpoint} config={{ commitment: 'confirmed' }}>
      {children}
    </ConnectionProvider>
  );
}
