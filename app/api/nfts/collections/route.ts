import { NextRequest, NextResponse } from 'next/server';
import { Connection, PublicKey } from '@solana/web3.js';
import { getConnection } from '@/lib/solana-connection';
import { rateLimiter, RateLimitError } from '@/lib/rate-limit';

// Rate limit configuration for NFT collections
const NFT_RATE_LIMIT = {
  limit: 1000,         // 10 requests
  windowMs: 60000,   // per minute
  maxRetries: 2,     // Allow 2 retries
  initialRetryDelay: 10,
  maxRetryDelay: 5000
};

// Metadata fetch configuration
const METADATA_FETCH_CONFIG = {
  maxRetries: 300,
  initialDelay: 10,
  maxDelay: 5000,
  timeout: 5000
};

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

async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  config: {
    maxRetries: number;
    initialDelay: number;
    maxDelay: number;
    timeout?: number;
  }
): Promise<T> {
  let lastError: any;
  let delay = config.initialDelay;
  
  for (let attempt = 1; attempt <= config.maxRetries; attempt++) {
    try {
      if (config.timeout) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), config.timeout);
        
        try {
          return await operation();
        } finally {
          clearTimeout(timeoutId);
        }
      } else {
        return await operation();
      }
    } catch (error) {
      lastError = error;
      console.warn(`Attempt ${attempt}/${config.maxRetries} failed:`, error);
      
      if (attempt === config.maxRetries) break;
      
      // Add jitter to prevent thundering herd
      const jitter = Math.random() * 200;
      await new Promise(resolve => setTimeout(resolve, delay + jitter));
      
      // Exponential backoff
      delay = Math.min(delay * 2, config.maxDelay);
    }
  }
  
  throw lastError;
}

async function fetchCollectionMetadata(uri: string): Promise<any> {
  return retryWithBackoff(
    async () => {
      const response = await fetch(uri, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'OpenSVM/1.0'
        }
      });
      
      if (!response.ok) {
        // Handle rate limits specially
        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After');
          if (retryAfter) {
            await new Promise(resolve => 
              setTimeout(resolve, parseInt(retryAfter) * 1000)
            );
          }
        }
        throw new Error(`Failed to fetch metadata: ${response.status}`);
      }
      
      return response.json();
    },
    METADATA_FETCH_CONFIG
  );
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
            metadata = await fetchCollectionMetadata(collection.uri);
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

    // Apply rate limiting with retries
    try {
      await rateLimiter.rateLimit('NFT_COLLECTIONS', NFT_RATE_LIMIT);
    } catch (error) {
      if (error instanceof RateLimitError) {
        return NextResponse.json(
          { 
            error: 'Too many requests. Please try again later.',
            retryAfter: Math.ceil(error.retryAfter / 1000)
          },
          { 
            status: 429,
            headers: {
              ...baseHeaders,
              'Retry-After': Math.ceil(error.retryAfter / 1000).toString()
            }
          }
        );
      }
      throw error;
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

    // Fetch collections with improved retry logic
    const collections = await retryWithBackoff(
      () => fetchCollections(connection),
      {
        maxRetries: 3,
        initialDelay: 1000,
        maxDelay: 5000
      }
    );
    
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
