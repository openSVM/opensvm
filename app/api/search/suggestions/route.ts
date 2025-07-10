export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { Connection, PublicKey } from '@solana/web3.js';
import { sanitizeSearchQuery } from '@/lib/utils';

const connection = new Connection(process.env.NEXT_PUBLIC_RPC_URL || 'https://api.mainnet-beta.solana.com');

// Helper functions for validation
function isValidSolanaAddress(query: string): boolean {
  try {
    new PublicKey(query);
    return true;
  } catch {
    return false;
  }
}

function isValidTransactionSignature(query: string): boolean {
  return query.length === 64 || query.length === 88;
}

// Helper function to calculate transaction amount
function calculateTransactionAmount(tx: any): number {
  if (!tx.meta) return 0;
  
  const preBalances = tx.meta.preBalances || [];
  const postBalances = tx.meta.postBalances || [];
  
  if (preBalances.length > 0 && postBalances.length > 0) {
    const balanceChange = Math.abs((postBalances[0] - preBalances[0]) / 1e9);
    return balanceChange;
  }
  
  return 0;
}

// Helper function to fetch token market data (mock implementation)
async function fetchTokenMarketData(tokenAddress: string) {
  // This would integrate with a real price API like CoinGecko, Jupiter, etc.
  // For now, returning mock data
  return {
    price: Math.random() * 100,
    volume24h: Math.random() * 1000000,
    lastUpdated: new Date().toISOString(),
  };
}

// Helper function to fetch program usage statistics (mock implementation)
async function fetchProgramUsageStats(programAddress: string) {
  // This would integrate with analytics or indexing services
  // For now, returning mock data
  return {
    invocationCount: Math.floor(Math.random() * 10000),
    lastInvocation: new Date(Date.now() - Math.random() * 86400000).toISOString(),
    uniqueUsers: Math.floor(Math.random() * 1000),
    successRate: 0.8 + Math.random() * 0.2,
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query) {
      return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
    }

    const sanitizedQuery = sanitizeSearchQuery(query);
    if (!sanitizedQuery) {
      return NextResponse.json({ error: 'Invalid query' }, { status: 400 });
    }

    const suggestions: any[] = [];

    // Run all checks in parallel for better performance
    const checks = await Promise.allSettled([
      // Check if it's a valid Solana address
      isValidSolanaAddress(sanitizedQuery) ? checkAccount(sanitizedQuery) : null,
      // Check if it's a transaction signature
      isValidTransactionSignature(sanitizedQuery) ? checkTransaction(sanitizedQuery) : null,
      // Check if it's a token
      checkToken(sanitizedQuery),
      // Check if it's a program
      isValidSolanaAddress(sanitizedQuery) ? checkProgram(sanitizedQuery) : null,
    ]);

    // Process results
    checks.forEach((result) => {
      if (result.status === 'fulfilled' && result.value) {
        suggestions.push(result.value);
      }
    });

    // Remove duplicates based on value
    const uniqueSuggestions = suggestions.filter((suggestion, index, self) => 
      index === self.findIndex(s => s.value === suggestion.value)
    );

    return NextResponse.json(uniqueSuggestions);
  } catch (error) {
    console.error('Error in suggestions API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function checkAccount(address: string) {
  try {
    const pubkey = new PublicKey(address);
    const accountInfo = await connection.getAccountInfo(pubkey);
    
    if (accountInfo && !accountInfo.executable) {
      const balance = accountInfo.lamports / 1e9;
      const recentSignatures = await connection.getSignaturesForAddress(pubkey, { limit: 10 });
      const lastActivity = recentSignatures[0]?.blockTime
        ? new Date(recentSignatures[0].blockTime * 1000).toISOString()
        : undefined;

      return {
        type: 'address',
        value: address,
        label: `Account: ${address.slice(0, 8)}...${address.slice(-8)}`,
        balance,
        lastUpdate: lastActivity,
        actionCount: recentSignatures.length,
        metadata: {
          hasData: accountInfo.data.length > 0,
          owner: accountInfo.owner.toString(),
        }
      };
    }
  } catch (error) {
    // Ignore errors
  }
  return null;
}

async function checkTransaction(signature: string) {
  try {
    const tx = await connection.getTransaction(signature, {
      maxSupportedTransactionVersion: 0,
    });
    
    if (tx) {
      const timestamp = tx.blockTime ? new Date(tx.blockTime * 1000).toISOString() : undefined;
      const amount = calculateTransactionAmount(tx);
      
      return {
        type: 'transaction',
        value: signature,
        label: `Transaction: ${signature.slice(0, 8)}...${signature.slice(-8)}`,
        status: tx.meta?.err ? 'failed' : 'success',
        lastUpdate: timestamp,
        amount,
        metadata: {
          slot: tx.slot,
          fee: tx.meta?.fee ? tx.meta.fee / 1e9 : 0,
          computeUnitsConsumed: tx.meta?.computeUnitsConsumed,
        }
      };
    }
  } catch (error) {
    // Ignore errors
  }
  return null;
}

async function checkToken(address: string) {
  try {
    if (!isValidSolanaAddress(address)) return null;
    
    // Check if it's a token mint
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/check-token?address=${encodeURIComponent(address)}`);
    if (response.ok) {
      const tokenData = await response.json();
      if (tokenData.isToken) {
        // Fetch market data
        const marketData = await fetchTokenMarketData(address);
        
        return {
          type: 'token',
          value: address,
          label: `Token: ${tokenData.symbol || address.slice(0, 8)}...`,
          price: marketData.price,
          volume: marketData.volume24h,
          lastUpdate: marketData.lastUpdated,
          metadata: {
            symbol: tokenData.symbol,
            name: tokenData.name,
            decimals: tokenData.decimals,
            totalSupply: tokenData.totalSupply,
          }
        };
      }
    }
  } catch (error) {
    // Ignore errors
  }
  return null;
}

async function checkProgram(address: string) {
  try {
    const pubkey = new PublicKey(address);
    const programInfo = await connection.getAccountInfo(pubkey);
    
    if (programInfo?.executable) {
      // Fetch usage statistics
      const usageStats = await fetchProgramUsageStats(address);
      
      return {
        type: 'program',
        value: address,
        label: `Program: ${address.slice(0, 8)}...${address.slice(-8)}`,
        usageCount: usageStats.invocationCount,
        lastUpdate: usageStats.lastInvocation,
        metadata: {
          uniqueUsers: usageStats.uniqueUsers,
          successRate: usageStats.successRate,
          dataSize: programInfo.data.length,
        }
      };
    }
  } catch (error) {
    // Ignore errors
  }
  return null;
}
