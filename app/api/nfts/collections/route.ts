import { NextRequest, NextResponse } from 'next/server';
import { Connection, PublicKey } from '@solana/web3.js';
import { getConnection } from '@/lib/solana-connection';
import { rateLimit } from '@/lib/rate-limit';

const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500,
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
  const baseHeaders = {
    ...corsHeaders,
    'Content-Type': 'application/json',
  };

  try {
    // Apply rate limiting
    try {
      await limiter.check(request, 10, 'NFT_COLLECTIONS');
    } catch {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { 
          status: 429,
          headers: baseHeaders
        }
      );
    }

    const connection = await getConnection();

    // Get recent NFT collections (using token metadata program)
    const metadataProgramId = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');
    const collections = await connection.getProgramAccounts(metadataProgramId, {
      filters: [
        {
          dataSize: 679, // Size of collection metadata
        },
      ],
      commitment: 'confirmed',
    });

    // Process collections
    const processedCollections = await Promise.all(
      collections.slice(0, 20).map(async ({ pubkey, account }) => {
        try {
          // Basic metadata structure based on token metadata standard
          const metadata = {
            name: '',
            symbol: '',
            uri: ''
          };

          // Read metadata fields from account data
          let offset = 1; // Skip version byte
          const nameLength = account.data[offset];
          offset += 1;
          metadata.name = new TextDecoder().decode(account.data.slice(offset, offset + nameLength));
          
          offset += nameLength;
          const symbolLength = account.data[offset];
          offset += 1;
          metadata.symbol = new TextDecoder().decode(account.data.slice(offset, offset + symbolLength));
          
          offset += symbolLength;
          const uriLength = account.data[offset];
          offset += 1;
          metadata.uri = new TextDecoder().decode(account.data.slice(offset, offset + uriLength));

          return {
            address: pubkey.toString(),
            name: metadata.name.replace(/\0/g, ''),
            symbol: metadata.symbol.replace(/\0/g, ''),
            image: metadata.uri,
          };
        } catch (error) {
          console.error('Error processing collection metadata:', error);
        }
        return null;
      })
    );

    // Filter out null values and return
    const validCollections = processedCollections.filter(Boolean);

    return NextResponse.json(validCollections, { headers: baseHeaders });
  } catch (error) {
    console.error('Error fetching NFT collections:', error);
    return NextResponse.json(
      { error: 'Failed to fetch NFT collections' },
      { 
        status: 500,
        headers: baseHeaders
      }
    );
  }
}
