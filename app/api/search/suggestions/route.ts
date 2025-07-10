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

// Simple in-memory storage for search history (in production, use a database)
const globalSearchHistory: { query: string; timestamp: number }[] = [];
const userSearchHistory = new Map<string, { query: string; timestamp: number }[]>();

// Get recent searches (user's last 5 + global last 5)
async function getRecentSearches() {
  const suggestions: any[] = [];
  
  // Add recent global searches
  const recentGlobal = globalSearchHistory
    .slice(-5)
    .reverse()
    .map(search => ({
      type: 'recent_global',
      value: search.query,
      label: `"${search.query}" (recent search)`,
      metadata: { isRecent: true, scope: 'global' }
    }));
  
  suggestions.push(...recentGlobal);
  
  return suggestions;
}

// Store search query
async function storeSearchQuery(query: string) {
  const timestamp = Date.now();
  
  // Store in global history
  globalSearchHistory.push({ query, timestamp });
  if (globalSearchHistory.length > 100) {
    globalSearchHistory.shift(); // Keep only last 100
  }
}

// Fuzzy address search - partial matching from any position
async function searchAddresses(query: string) {
  const suggestions: any[] = [];
  
  // If it looks like an address (starts with alphanumeric and decent length)
  if (query.length >= 4 && /^[A-Za-z0-9]/.test(query)) {
    try {
      // Try exact match first
      if (isValidSolanaAddress(query)) {
        const result = await checkAccount(query);
        if (result) suggestions.push(result);
      }
      
      // Try partial address matches - simulate database search
      // In production, this would query your database for addresses containing the query
      const partialMatches = await findPartialAddressMatches(query);
      suggestions.push(...partialMatches);
      
    } catch (error) {
      // Ignore errors
    }
  }
  
  return suggestions;
}

// Find partial address matches (mock implementation)
async function findPartialAddressMatches(query: string) {
  // This would be a database query in production
  // For now, return some mock results if query looks like an address pattern
  const suggestions: any[] = [];
  
  if (query.length >= 6) {
    // Mock some common address patterns
    const mockAddresses = [
      '11111111111111111111111111111112', // System program
      'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA', // Token program
      'So11111111111111111111111111111111111111112', // WSOL
    ];
    
    for (const addr of mockAddresses) {
      if (addr.toLowerCase().includes(query.toLowerCase())) {
        try {
          const result = await checkAccount(addr);
          if (result) suggestions.push(result);
        } catch (error) {
          // Ignore
        }
      }
    }
  }
  
  return suggestions;
}

// Enhanced transaction search
async function searchTransactions(query: string) {
  const suggestions: any[] = [];
  
  // Check if it looks like a transaction signature
  if (query.length >= 8 && /^[A-Za-z0-9]/.test(query)) {
    try {
      // Try exact match first
      if (isValidTransactionSignature(query)) {
        const result = await checkTransaction(query);
        if (result) suggestions.push(result);
      }
      
      // In production, search for partial transaction signature matches in database
      
    } catch (error) {
      // Ignore errors
    }
  }
  
  return suggestions;
}

// Enhanced token search (symbol, name, address)
async function searchTokens(query: string) {
  const suggestions: any[] = [];
  
  try {
    // Search by exact address
    if (isValidSolanaAddress(query)) {
      const result = await checkToken(query);
      if (result) suggestions.push(result);
    }
    
    // Search by symbol/name (mock implementation)
    const tokenMatches = await findTokensByNameOrSymbol(query);
    suggestions.push(...tokenMatches);
    
  } catch (error) {
    // Ignore errors
  }
  
  return suggestions;
}

// Find tokens by name or symbol (mock implementation)
async function findTokensByNameOrSymbol(query: string) {
  const suggestions: any[] = [];
  
  // Mock popular tokens for demonstration
  const popularTokens = [
    { symbol: 'SOL', name: 'Solana', address: 'So11111111111111111111111111111111111111112' },
    { symbol: 'USDC', name: 'USD Coin', address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' },
    { symbol: 'RAY', name: 'Raydium', address: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R' },
    { symbol: 'ORCA', name: 'Orca', address: 'orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE' },
  ];
  
  const queryLower = query.toLowerCase();
  
  for (const token of popularTokens) {
    if (token.symbol.toLowerCase().includes(queryLower) ||
        token.name.toLowerCase().includes(queryLower)) {
      try {
        const result = await checkToken(token.address);
        if (result) {
          // Override label to show symbol
          result.label = `${token.symbol} - ${token.name}`;
          suggestions.push(result);
        }
      } catch (error) {
        // Ignore
      }
    }
  }
  
  return suggestions;
}

// Enhanced program search
async function searchPrograms(query: string) {
  const suggestions: any[] = [];
  
  try {
    // Search by exact address
    if (isValidSolanaAddress(query)) {
      const result = await checkProgram(query);
      if (result) suggestions.push(result);
    }
    
    // Search by program name (mock implementation)
    const programMatches = await findProgramsByName(query);
    suggestions.push(...programMatches);
    
  } catch (error) {
    // Ignore errors
  }
  
  return suggestions;
}

// Find programs by name (mock implementation)
async function findProgramsByName(query: string) {
  const suggestions: any[] = [];
  
  // Mock popular programs
  const popularPrograms = [
    { name: 'System Program', address: '11111111111111111111111111111112' },
    { name: 'Token Program', address: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' },
    { name: 'Associated Token Program', address: 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL' },
    { name: 'Serum DEX', address: '9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin' },
  ];
  
  const queryLower = query.toLowerCase();
  
  for (const program of popularPrograms) {
    if (program.name.toLowerCase().includes(queryLower)) {
      try {
        const result = await checkProgram(program.address);
        if (result) {
          // Override label to show program name
          result.label = `${program.name}`;
          suggestions.push(result);
        }
      } catch (error) {
        // Ignore
      }
    }
  }
  
  return suggestions;
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

    // If query is very short, show recent searches
    if (sanitizedQuery.length <= 2) {
      const recentSearches = await getRecentSearches();
      suggestions.push(...recentSearches);
    } else {
      // Enhanced search with fuzzy matching
      const checks = await Promise.allSettled([
        // Fuzzy address matching (partial match from any position)
        searchAddresses(sanitizedQuery),
        // Fuzzy transaction signature matching
        searchTransactions(sanitizedQuery),
        // Enhanced token search (name, symbol, address)
        searchTokens(sanitizedQuery),
        // Enhanced program search
        searchPrograms(sanitizedQuery),
      ]);

      // Process results
      checks.forEach((result) => {
        if (result.status === 'fulfilled' && result.value) {
          if (Array.isArray(result.value)) {
            suggestions.push(...result.value);
          } else {
            suggestions.push(result.value);
          }
        }
      });
    }

    // Remove duplicates based on value
    const uniqueSuggestions = suggestions.filter((suggestion, index, self) =>
      index === self.findIndex(s => s.value === suggestion.value)
    );

    // Store this query for future suggestions
    await storeSearchQuery(sanitizedQuery);

    return NextResponse.json(uniqueSuggestions.slice(0, 10)); // Limit to 10 suggestions
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
