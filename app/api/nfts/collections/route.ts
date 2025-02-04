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

// Simple in-memory cache
let collectionsCache: any = null;
let lastCacheTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Known collection addresses with metadata
const COLLECTIONS = [
  {
    address: 'DRiP2Pn2K6fuMLKQmt5rZWyHiUZ6WK3GChEySUpHSS4x',
    name: 'DRiP',
    symbol: 'DRIP',
    uri: 'https://arweave.net/1eH7bZS-6HZH4YOc8T_tGp2Rq-c17Rg0juS3T4qtOYA'
  },
  {
    address: 'SMBH3wF6baUj6JWtzYvqcKuj2XCKWDqQxzspY12xPND',
    name: 'Solana Monkey Business',
    symbol: 'SMB',
    uri: 'https://arweave.net/qebx_AgJUEH2u90ZFxPB-PjL1OBFi2b7FeHYjL7Kf8M'
  },
  {
    address: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
    name: 'Okay Bears',
    symbol: 'OKAY',
    uri: 'https://arweave.net/7QhZL8C-lAWmCEQnX2bkVph3zGEWZV1encl9VjGUUKs'
  },
  {
    address: 'J1S9H3QjnRtBbbuD4HjPV6RpRhwuk4zKbxsnCHuTgh9w',
    name: 'DeGods',
    symbol: 'DGOD',
    uri: 'https://metadata.degods.com/g/0.json'
  },
  {
    address: 'FEg3mmpcrcRsVTuc2n3oghHpRvAtEJJzFyEYXzqnhwcE',
    name: 'y00ts',
    symbol: 'y00t',
    uri: 'https://metadata.y00ts.com/y/0.json'
  },
  {
    address: 'BNFT6UJ4wGvH8PH4YoXMTgEgaXQQYVrz4qz6EzE5rYGd',
    name: 'SMB Gen2',
    symbol: 'SMB2',
    uri: 'https://arweave.net/smb2_metadata.json'
  }
];

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      console.warn(`Attempt ${attempt + 1} failed:`, error);
      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs * (attempt + 1)));
      }
    }
  }
  
  throw lastError;
}

async function fetchCollectionMetadata(uri: string): Promise<any> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);
  
  try {
    const response = await fetch(uri, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch metadata: ${response.status}`);
    }
    
    return response.json();
  } finally {
    clearTimeout(timeoutId);
  }
}

async function fetchCollections(connection: Connection): Promise<any[]> {
  try {
    console.log('Fetching NFT collections...');
    
    const collections = await Promise.all(
      COLLECTIONS.map(async (collection) => {
        try {
          // Get account info
          const accountInfo = await connection.getAccountInfo(new PublicKey(collection.address));
          if (!accountInfo) {
            console.log(`No account info found for ${collection.address}`);
            return null;
          }

          // Fetch metadata JSON
          let metadata;
          try {
            metadata = await retryOperation(() => fetchCollectionMetadata(collection.uri), 2, 1000);
          } catch (error) {
            console.error(`Failed to fetch metadata for ${collection.address}:`, error);
          }

          return {
            address: collection.address,
            name: collection.name,
            symbol: collection.symbol,
            image: metadata?.image || '/images/placeholder-nft.svg',
            description: metadata?.description,
            external_url: metadata?.external_url,
          };
        } catch (error) {
          console.error(`Error processing collection ${collection.address}:`, error);
          return null;
        }
      })
    );

    // Filter out null values and sort by name
    const validCollections = collections
      .filter(Boolean)
      .sort((a, b) => a.name.localeCompare(b.name));

    console.log(`Found ${validCollections.length} valid collections`);

    return validCollections;
  } catch (error) {
    console.error('Error fetching collections:', error);
    throw error;
  }
}

export async function GET(request: NextRequest) {
  const baseHeaders = {
    ...corsHeaders,
    'Content-Type': 'application/json',
  };

  console.log('NFT collections request started');
  const requestStartTime = Date.now();

  try {
    // Check cache first
    const now = Date.now();
    if (collectionsCache && (now - lastCacheTime) < CACHE_DURATION) {
      console.log('Returning cached collections');
      return NextResponse.json(collectionsCache, { headers: baseHeaders });
    }

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

    console.log('Getting Solana connection...');
    const connection = await getConnection();

    // Test connection health
    try {
      const blockHeight = await connection.getBlockHeight();
      console.log('Connection healthy, current block height:', blockHeight);
    } catch (error) {
      console.error('Connection health check failed:', error);
      throw new Error('Failed to connect to Solana network');
    }

    // Fetch collections
    const collections = await retryOperation(() => fetchCollections(connection));
    
    if (!collections || collections.length === 0) {
      throw new Error('No valid collections found');
    }

    console.log(`Found ${collections.length} valid collections`);

    // Update cache
    collectionsCache = collections;
    lastCacheTime = Date.now();

    const totalDuration = Date.now() - requestStartTime;
    console.log(`Total request duration: ${totalDuration}ms`);

    return NextResponse.json(collections, { headers: baseHeaders });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch NFT collections';
    console.error('Error fetching NFT collections:', error);
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
    
    return NextResponse.json(
      { error: errorMessage },
      { 
        status: 500,
        headers: baseHeaders
      }
    );
  }
}
