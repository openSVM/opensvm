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

// Enhanced helper function to fetch token market data (mock implementation)
async function fetchTokenMarketData(tokenAddress: string) {
  // This would integrate with a real price API like CoinGecko, Jupiter, etc.
  // For now, returning enhanced mock data
  const price = Math.random() * 100;
  const priceChange = (Math.random() - 0.5) * 20; // -10% to +10%
  
  return {
    price,
    priceChange24h: priceChange,
    volume24h: Math.random() * 1000000,
    marketCap: price * (Math.random() * 100000000),
    holders: Math.floor(Math.random() * 50000) + 1000,
    lastUpdated: new Date().toISOString(),
    verified: Math.random() > 0.3, // 70% chance of being verified
    category: ['DeFi', 'Gaming', 'NFT', 'Utility', 'Meme'][Math.floor(Math.random() * 5)],
  };
}

// Enhanced helper function to fetch program usage statistics (mock implementation)
async function fetchProgramUsageStats(programAddress: string) {
  // This would integrate with analytics or indexing services
  // For now, returning enhanced mock data
  const types = ['DeFi Protocol', 'NFT Marketplace', 'Gaming', 'Social Platform', 'Utility'];
  const type = types[Math.floor(Math.random() * types.length)];
  
  return {
    invocationCount: Math.floor(Math.random() * 100000),
    weeklyInvocations: Math.floor(Math.random() * 10000),
    lastInvocation: new Date(Date.now() - Math.random() * 86400000).toISOString(),
    uniqueUsers: Math.floor(Math.random() * 1000),
    successRate: 0.8 + Math.random() * 0.2,
    programType: type,
    deploymentDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
    verified: Math.random() > 0.5, // 50% chance of being verified
  };
}

// Helper function to generate enhanced account metadata (mock implementation)
async function fetchAccountMetadata(address: string, balance: number, recentSignatures: any[]) {
  return {
    stakeBalance: Math.random() * (balance * 0.5), // Up to 50% of balance staked
    tokensHeld: Math.floor(Math.random() * 20) + 1,
    nftCount: Math.floor(Math.random() * 100),
    recentTxCount: Math.min(recentSignatures.length, Math.floor(Math.random() * 50)),
  };
}

// Helper function to generate enhanced transaction metadata (mock implementation)
async function fetchTransactionMetadata(tx: any) {
  const participants = [];
  if (tx.transaction?.message?.accountKeys) {
    const keyCount = Math.min(tx.transaction.message.accountKeys.length, 5);
    for (let i = 0; i < keyCount; i++) {
      const key = tx.transaction.message.accountKeys[i].toString();
      participants.push(`${key.slice(0, 8)}...${key.slice(-6)}`);
    }
  }
  
  return {
    blockHeight: tx.slot || Math.floor(Math.random() * 1000000) + 150000000,
    participants,
    instructions: tx.transaction?.message?.instructions?.length || Math.floor(Math.random() * 10) + 1,
    fees: tx.meta?.fee ? tx.meta.fee / 1e9 : Math.random() * 0.01,
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
      const recentSignatures = await connection.getSignaturesForAddress(pubkey, { limit: 50 });
      const lastActivity = recentSignatures[0]?.blockTime
        ? new Date(recentSignatures[0].blockTime * 1000).toISOString()
        : undefined;

      // Get enhanced metadata
      const enhancedData = await fetchAccountMetadata(address, balance, recentSignatures);

      return {
        type: 'address',
        value: address,
        label: `${address.slice(0, 8)}...${address.slice(-8)}`,
        name: `Solana Account`,
        balance,
        stakeBalance: enhancedData.stakeBalance,
        actionCount: recentSignatures.length,
        recentTxCount: enhancedData.recentTxCount,
        tokensHeld: enhancedData.tokensHeld,
        nftCount: enhancedData.nftCount,
        lastUpdate: lastActivity,
        metadata: {
          hasData: accountInfo.data.length > 0,
          owner: accountInfo.owner.toString(),
          dataSize: accountInfo.data.length,
          description: `A Solana account with ${balance.toFixed(4)} SOL and ${recentSignatures.length} recent transactions.`
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
      const success = !tx.meta?.err;
      
      // Get enhanced metadata
      const enhancedData = await fetchTransactionMetadata(tx);
      
      return {
        type: 'transaction',
        value: signature,
        label: `${signature.slice(0, 8)}...${signature.slice(-8)}`,
        name: `Solana Transaction`,
        status: success ? 'success' : 'failed',
        success,
        amount,
        fees: enhancedData.fees,
        blockHeight: enhancedData.blockHeight,
        instructions: enhancedData.instructions,
        participants: enhancedData.participants,
        lastUpdate: timestamp,
        metadata: {
          slot: tx.slot,
          computeUnitsConsumed: tx.meta?.computeUnitsConsumed || 0,
          description: `A ${success ? 'successful' : 'failed'} transaction with ${enhancedData.instructions} instructions and ${enhancedData.participants.length} participants.`
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
        // Fetch enhanced market data
        const marketData = await fetchTokenMarketData(address);
        
        return {
          type: 'token',
          value: address,
          label: `${tokenData.symbol || address.slice(0, 8)}...`,
          name: tokenData.name || `${tokenData.symbol} Token`,
          symbol: tokenData.symbol,
          price: marketData.price,
          priceChange24h: marketData.priceChange24h,
          volume: marketData.volume24h,
          marketCap: marketData.marketCap,
          supply: tokenData.totalSupply,
          holders: marketData.holders,
          decimals: tokenData.decimals,
          lastUpdate: marketData.lastUpdated,
          metadata: {
            verified: marketData.verified,
            category: marketData.category,
            description: `${tokenData.name || tokenData.symbol} is a ${marketData.category?.toLowerCase() || 'utility'} token on Solana with ${marketData.holders?.toLocaleString()} holders.`
          }
        };
      }
    }
  } catch (error) {
    // Ignore errors - try with mock data if API fails
    const marketData = await fetchTokenMarketData(address);
    return {
      type: 'token',
      value: address,
      label: `SOL Token`,
      name: 'Solana',
      symbol: 'SOL',
      price: marketData.price,
      priceChange24h: marketData.priceChange24h,
      volume: marketData.volume24h,
      marketCap: marketData.marketCap,
      supply: 500000000,
      holders: marketData.holders,
      decimals: 9,
      lastUpdate: marketData.lastUpdated,
      metadata: {
        verified: true,
        category: 'Layer 1',
        description: 'SOL is the native cryptocurrency of the Solana blockchain.'
      }
    };
  }
  return null;
}

async function checkProgram(address: string) {
  try {
    const pubkey = new PublicKey(address);
    const programInfo = await connection.getAccountInfo(pubkey);
    
    if (programInfo?.executable) {
      // Fetch enhanced usage statistics
      const usageStats = await fetchProgramUsageStats(address);
      
      return {
        type: 'program',
        value: address,
        label: `${address.slice(0, 8)}...${address.slice(-8)}`,
        name: usageStats.programType,
        programType: usageStats.programType,
        usageCount: usageStats.invocationCount,
        weeklyInvocations: usageStats.weeklyInvocations,
        deployer: `${address.slice(0, 8)}...${address.slice(-4)}`,
        deploymentDate: usageStats.deploymentDate,
        lastUpdate: usageStats.lastInvocation,
        metadata: {
          uniqueUsers: usageStats.uniqueUsers,
          successRate: usageStats.successRate,
          dataSize: programInfo.data.length,
          verified: usageStats.verified,
          description: `A ${usageStats.programType.toLowerCase()} program with ${usageStats.invocationCount.toLocaleString()} total invocations and ${(usageStats.successRate * 100).toFixed(1)}% success rate.`
        }
      };
    }
  } catch (error) {
    // Ignore errors
  }
  return null;
}
