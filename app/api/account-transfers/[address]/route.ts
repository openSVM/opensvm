import { NextRequest, NextResponse } from 'next/server';
import { PublicKey } from '@solana/web3.js';
import { getConnection } from '@/lib/solana-connection';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;
export const revalidate = 0;
export const fetchCache = 'force-no-store';

// Constants
const MAX_BATCH_SIZE = 10;
const CACHE_TTL = 300_000;
const TX_TIMEOUT = 5000;
const PRICE_CACHE_TTL = 60_000;

// In-memory cache
const cache = new Map<string, any>();

// Cache cleanup interval
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, value] of cache.entries()) {
      if (now > value.expiry) {
        cache.delete(key);
      }
    }
  }, 60_000);
}

// More permissive schema for optional parameters
const QuerySchema = z.object({
  before: z.string().nullish(),
  limit: z.preprocess(
    (val) => Number(val) || 20,
    z.number().min(1).max(100)
  ),
  sortBy: z.enum(['date', 'tokenAmount', 'usdValue', 'currentUsdValue']).default('date'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  filterType: z.enum(['IN', 'OUT', 'ALL']).default('ALL'),
  minAmount: z.string().nullish(),
  maxAmount: z.string().nullish(),
  tokenSymbol: z.string().nullish()
}).transform((data) => ({
  ...data,
  before: data.before || undefined,
  minAmount: data.minAmount || undefined,
  maxAmount: data.maxAmount || undefined,
  tokenSymbol: data.tokenSymbol || undefined
}));

interface Transfer {
  txId: string;
  date: string;
  from: string;
  to: string;
  tokenSymbol: string;
  tokenAmount: string;
  usdValue: string;
  currentUsdValue: string;
  transferType: 'IN' | 'OUT';
}

async function getCachedData<T>(key: string): Promise<T | null> {
  try {
    const cached = cache.get(key);
    if (!cached) return null;
    
    if (Date.now() > cached.expiry) {
      cache.delete(key);
      return null;
    }
    
    return cached.data;
  } catch (err) {
    console.error('Cache error:', err);
    return null;
  }
}

async function setCacheData<T>(key: string, data: T, ttl: number = CACHE_TTL): Promise<void> {
  try {
    cache.set(key, {
      data,
      expiry: Date.now() + ttl
    });
  } catch (err) {
    console.error('Cache error:', err);
  }
}

async function getPriceData(symbol: string): Promise<number> {
  try {
    const cacheKey = `price:${symbol}`;
    const cached = await getCachedData<number>(cacheKey);
    
    if (cached !== null) {
      return cached;
    }

    try {
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd`,
        { next: { revalidate: 60 } }
      );
      const data = await response.json();
      const price = data?.solana?.usd || 0;

      if (price > 0) {
        await setCacheData(cacheKey, price, PRICE_CACHE_TTL);
      }
      return price;
    } catch (err) {
      console.error('Price API error:', err);
      return 0;
    }
  } catch (err) {
    console.error('Price fetch error:', err);
    return 0;
  }
}

async function fetchTransactionWithTimeout(
  connection: any,
  signature: string,
  timeout: number
): Promise<any> {
  return Promise.race([
    connection.getTransaction(signature, {
      maxSupportedTransactionVersion: 0,
      commitment: 'confirmed'
    }),
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Transaction fetch timeout')), timeout)
    )
  ]);
}

async function fetchTransactionBatch(
  connection: any,
  signatures: string[],
  address: string
): Promise<Transfer[]> {
  const transfers: Transfer[] = [];
  const startTime = Date.now();

  await Promise.all(
    signatures.map(async (signature) => {
      let retries = 3;
      while (retries > 0) {
        try {
          const tx = await fetchTransactionWithTimeout(connection, signature, TX_TIMEOUT);
          if (!tx?.meta) return;

          const preBalances = tx.meta.preBalances || [];
          const postBalances = tx.meta.postBalances || [];
          const accountKeys = tx.transaction.message.getAccountKeys();
          const blockTime = tx.blockTime! * 1000;

          const solPrice = await getPriceData('SOL');

          preBalances.forEach((_, index) => {
            const preBalance = preBalances[index] || 0;
            const postBalance = postBalances[index] || 0;
            const delta = postBalance - preBalance;
            const account = accountKeys.get(index)?.toString();
            const firstAccount = accountKeys.get(0)?.toString();

            if (delta === 0 || !account) return;

            const amount = Math.abs(delta / 1e9);
            const usdValue = amount * solPrice;

            transfers.push({
              txId: signature,
              date: new Date(blockTime).toISOString(),
              from: delta < 0 ? account : (delta > 0 ? firstAccount : ''),
              to: delta > 0 ? account : (delta < 0 ? firstAccount : ''),
              tokenSymbol: 'SOL',
              tokenAmount: amount.toString(),
              usdValue: usdValue.toString(),
              currentUsdValue: usdValue.toString(),
              transferType: delta < 0 ? 'OUT' : 'IN',
            });
          });

          break;
        } catch (err) {
          console.error(`Transaction error (${retries} retries left):`, err);
          retries--;
          if (retries > 0) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      }
    })
  );

  console.log(`Processed ${transfers.length} transfers in ${Date.now() - startTime}ms`);
  return transfers;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ address: string }> }
) {
  const startTime = Date.now();

  try {
    const params = await context.params;
    const { address: rawAddress } = await params;
    const address = decodeURIComponent(String(rawAddress));
    console.log(`Starting transfer fetch for ${address}`);

    const searchParams = request.nextUrl.searchParams;
    
    // Build query parameters with defaults
    const queryParams = {
      before: searchParams.get('before') || undefined,
      limit: searchParams.get('limit') || 20,
      sortBy: searchParams.get('sortBy') || 'date',
      sortOrder: searchParams.get('sortOrder') || 'desc',
      filterType: searchParams.get('filterType') || 'ALL',
      minAmount: searchParams.get('minAmount') || undefined,
      maxAmount: searchParams.get('maxAmount') || undefined,
      tokenSymbol: searchParams.get('tokenSymbol') || undefined,
    };

    // Validate query parameters
    const query = QuerySchema.parse(queryParams);

    // Validate address
    const pubkey = new PublicKey(address);
    
    // Check cache first
    const cacheKey = `transfers:${address}:${JSON.stringify(query)}`;
    const cached = await getCachedData<Transfer[]>(cacheKey);
    
    if (cached) {
      console.log(`Cache hit for ${address}, returning ${cached.length} transfers in ${Date.now() - startTime}ms`);
      return NextResponse.json({
        transfers: cached,
        hasMore: false,
        cached: true
      });
    }

    // Get connection from pool
    const connection = await getConnection();

    // Fetch signatures
    console.log(`Fetching signatures for ${address}`);
    const signatures = await connection.getSignaturesForAddress(
      pubkey,
      {
        before: query.before,
        limit: query.limit
      }
    );

    if (signatures.length === 0) {
      return NextResponse.json({
        transfers: [],
        hasMore: false
      });
    }

    console.log(`Found ${signatures.length} signatures, processing in batches of ${MAX_BATCH_SIZE}`);

    // Process transactions in batches
    const transfers: Transfer[] = [];
    for (let i = 0; i < signatures.length; i += MAX_BATCH_SIZE) {
      const batchStartTime = Date.now();
      const batch = signatures.slice(i, i + MAX_BATCH_SIZE);
      console.log(`Processing batch ${Math.floor(i / MAX_BATCH_SIZE) + 1}/${Math.ceil(signatures.length / MAX_BATCH_SIZE)}`);
      
      const batchTransfers = await fetchTransactionBatch(
        connection,
        batch.map(s => s.signature),
        address
      );
      transfers.push(...batchTransfers);
      
      console.log(`Batch processed in ${Date.now() - batchStartTime}ms`);
    }

    console.log(`Total transfers found: ${transfers.length}`);

    // Apply filters
    let filteredTransfers = transfers;
    
    if (query.filterType !== 'ALL') {
      filteredTransfers = filteredTransfers.filter(t => t.transferType === query.filterType);
    }

    if (query.minAmount) {
      const minAmount = parseFloat(query.minAmount);
      if (!isNaN(minAmount)) {
        filteredTransfers = filteredTransfers.filter(
          t => parseFloat(t.tokenAmount) >= minAmount
        );
      }
    }

    if (query.maxAmount) {
      const maxAmount = parseFloat(query.maxAmount);
      if (!isNaN(maxAmount)) {
        filteredTransfers = filteredTransfers.filter(
          t => parseFloat(t.tokenAmount) <= maxAmount
        );
      }
    }

    if (query.tokenSymbol) {
      filteredTransfers = filteredTransfers.filter(
        t => t.tokenSymbol.toLowerCase() === query.tokenSymbol!.toLowerCase()
      );
    }

    // Apply sorting
    filteredTransfers.sort((a, b) => {
      const aValue = a[query.sortBy as keyof Transfer];
      const bValue = b[query.sortBy as keyof Transfer];
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        if (query.sortBy === 'date') {
          return query.sortOrder === 'desc'
            ? new Date(bValue).getTime() - new Date(aValue).getTime()
            : new Date(aValue).getTime() - new Date(bValue).getTime();
        }
        
        const aNum = parseFloat(aValue);
        const bNum = parseFloat(bValue);
        
        if (!isNaN(aNum) && !isNaN(bNum)) {
          return query.sortOrder === 'desc' ? bNum - aNum : aNum - bNum;
        }
        
        return query.sortOrder === 'desc'
          ? bValue.localeCompare(aValue)
          : aValue.localeCompare(bValue);
      }
      
      return 0;
    });

    // Cache the results
    await setCacheData(cacheKey, filteredTransfers);

    console.log(`Request completed in ${Date.now() - startTime}ms`);
    return NextResponse.json({
      transfers: filteredTransfers,
      hasMore: signatures.length === query.limit,
      cached: false
    });

  } catch (error) {
    console.error('API Error:', error);
    const errorTime = Date.now() - startTime;
    console.error(`Request failed after ${errorTime}ms`);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch transfers' },
      { status: 500 }
    );
  }
}
