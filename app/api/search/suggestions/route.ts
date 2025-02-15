export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { Connection, PublicKey } from '@solana/web3.js';
import { sanitizeSearchQuery } from '@/lib/utils';

const connection = new Connection(process.env.NEXT_PUBLIC_RPC_URL || 'https://api.mainnet-beta.solana.com');

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

    // Get recent signatures for address if it looks like an address
    const suggestions = [];
    
    try {
      // Search for recent transactions
      const pubkey = new PublicKey(sanitizedQuery);
      const signatures = await connection.getSignaturesForAddress(
        pubkey,
        { limit: 5 }
      );

      signatures.forEach(sig => {
        suggestions.push({
          type: 'transaction',
          value: sig.signature,
          label: `Transaction: ${sig.signature.slice(0, 20)}...`
        });
      });
    } catch (error) {
      // Not a valid address, ignore error
    }

    // Add token suggestions if available
    try {
      const tokenResponse = await fetch(`/api/check-token?address=${encodeURIComponent(sanitizedQuery)}`);
      if (tokenResponse.ok) {
        const tokenData = await tokenResponse.json();
        if (tokenData.isToken) {
          suggestions.push({
            type: 'token',
            value: sanitizedQuery,
            label: `Token: ${tokenData.symbol || sanitizedQuery}`
          });
        }
      }
    } catch (error) {
      console.error('Error checking token:', error);
    }

    // Add program suggestions if it's a program
    try {
      const programInfo = await connection.getAccountInfo(new PublicKey(sanitizedQuery));
      if (programInfo?.executable) {
        suggestions.push({
          type: 'program',
          value: sanitizedQuery,
          label: `Program: ${sanitizedQuery.slice(0, 20)}...`
        });
      }
    } catch (error) {
      // Not a valid program, ignore error
    }

    return NextResponse.json(suggestions);
  } catch (error) {
    console.error('Error in suggestions API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
