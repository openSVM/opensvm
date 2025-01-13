import { NextRequest, NextResponse } from 'next/server';
import { PublicKey } from '@solana/web3.js';
import { rateLimit } from '@/lib/rate-limit';
import { getConnection } from '@/lib/solana-connection';
import { sanitizeSearchQuery, isValidSolanaAddress, formatNumber } from '@/lib/utils';

const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500, // Max 500 users per interval
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(request: NextRequest) {
  // Add CORS headers to all responses
  const baseHeaders = {
    ...corsHeaders,
    'Content-Type': 'application/json',
  };
  try {
    // Apply rate limiting
    try {
      await limiter.check(request, 10, 'SEARCH_ACCOUNT'); // 10 requests per minute per IP
    } catch {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { 
          status: 429,
          headers: baseHeaders
        }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const rawQuery = searchParams.get('q');
    const query = sanitizeSearchQuery(rawQuery || '');

    if (!query) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { 
          status: 400,
          headers: baseHeaders
        }
      );
    }

    // Get connection from pool
    const connection = getConnection();
    
    // First validate the query format
    if (query.length > 30 && !isValidSolanaAddress(query)) {
      return NextResponse.json(
        { error: 'Invalid Solana address format' },
        { 
          status: 400,
          headers: baseHeaders
        }
      );
    }

    // Check if query is a valid public key
    let accounts = [];
    try {
      // Additional validation before creating PublicKey
      if (query.length >= 32) {
        const pubkey = new PublicKey(query);
        const [account, balance] = await Promise.all([
          connection.getAccountInfo(pubkey),
          connection.getBalance(pubkey)
        ]);
        
        if (account) {
          accounts.push({
            address: pubkey.toString(),
            balance: formatNumber(balance / 1e9), // Convert lamports to SOL and format
            executable: account.executable,
            owner: account.owner.toString()
          });
        }
      }
    } catch (e) {
      // Not a valid public key, could implement fuzzy search here
      console.log('Not a valid public key:', e);
    }

    return NextResponse.json(accounts, { headers: baseHeaders });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Failed to perform search' },
      { 
        status: 500,
        headers: baseHeaders
      }
    );
  }
}
