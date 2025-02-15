import { NextRequest, NextResponse } from 'next/server';
import { memoryCache } from '@/lib/cache';
import { queryFlipside } from '@/lib/flipside';

const CACHE_TTL = 300; // 5 minutes
const CACHE_ERROR_TTL = 60; // 1 minute
const QUERY_TIMEOUT = 5000; // 5 seconds
const API_TIMEOUT = 10000; // 10 seconds

interface TokenStats {
  mint: string;
  txCount: number;
  volume: number;
  lastUpdated: number;
}

type TokenTransfers = {
  mint: string;
  total_tx_count: number;
  total_volume: number;
}

// Background refresh function
async function refreshTokenStats(account: string, mint: string, cacheKey: string) {
  try {
    const stats = await getTokenStats(account, mint);
    memoryCache.set(cacheKey, stats, CACHE_TTL);
  } catch (error) {
    console.error('Error refreshing token stats:', error);
  }
}

async function getTokenStats(account: string, mint: string): Promise<TokenStats> {
  const cacheKey = `token-stats-${account}-${mint}`;
  const cachedData = memoryCache.get<TokenStats>(cacheKey);
  if (cachedData !== null) {
    return cachedData;
  }

  // Add timeout to prevent hanging
  const timeoutPromise = new Promise<TokenStats>((_, reject) => {
    setTimeout(() => reject(new Error('Flipside query timeout')), QUERY_TIMEOUT);
  });

  const query = `
    WITH transfer_windows AS (
      -- Recent transfers (last hour, minute granularity)
      SELECT 
        DATE_TRUNC('minute', block_timestamp) as ts,
        COUNT(DISTINCT tx_id) as tx_count,
        SUM(CASE 
          WHEN amount > 0 AND amount < 1e12 
          THEN amount / POW(10, 6) -- USDC has 6 decimals
          ELSE 0 
        END) as volume
      FROM solana.core.fact_transfers
      WHERE block_timestamp >= DATEADD('hour', -1, CURRENT_TIMESTAMP())
      AND mint = '${mint}'
      AND (tx_to = '${account}' OR tx_from = '${account}')
      GROUP BY 1
      
      UNION ALL
      
      -- Historical transfers (last 24 hours, hour granularity)
      SELECT 
        DATE_TRUNC('hour', block_timestamp) as ts,
        COUNT(DISTINCT tx_id) as tx_count,
        SUM(CASE 
          WHEN amount > 0 AND amount < 1e12 
          THEN amount / POW(10, 6) -- USDC has 6 decimals
          ELSE 0 
        END) as volume
      FROM solana.core.fact_transfers
      WHERE block_timestamp >= DATEADD('hour', -24, CURRENT_TIMESTAMP())
      AND block_timestamp < DATEADD('hour', -1, CURRENT_TIMESTAMP())
      AND mint = '${mint}'
      AND (tx_to = '${account}' OR tx_from = '${account}')
      GROUP BY 1
    ),
    aggregated_stats AS (
      SELECT 
        SUM(tx_count) as total_tx_count,
        SUM(volume) as total_volume
      FROM transfer_windows
    )
    SELECT 
      '${mint}' as mint,
      COALESCE(total_tx_count, 0) as total_tx_count,
      COALESCE(total_volume, 0) as total_volume
    FROM aggregated_stats
  `;

  try {
    // Race between query and timeout
    const results = await Promise.race([
      queryFlipside<TokenTransfers>(query),
      timeoutPromise
    ]);

    if (Array.isArray(results) && results.length > 0) {
      const stats = {
        mint: results[0]?.mint || mint,
        txCount: Number(results[0]?.total_tx_count) || 0,
        volume: Number(results[0]?.total_volume) || 0,
        lastUpdated: Date.now()
      };
      memoryCache.set(cacheKey, stats, CACHE_TTL);
      return stats;
    }

    // If query fails or returns no results, try getting cached data
    const cachedStats = memoryCache.get<TokenStats>(cacheKey);
    if (cachedStats !== null) {
      return cachedStats;
    }

    return {
      mint,
      txCount: 0,
      volume: 0,
      lastUpdated: Date.now()
    };
  } catch (error) {
    console.error('Error querying Flipside:', error);
    // Return empty data and cache it to prevent repeated timeouts
    const emptyStats = {
      mint,
      txCount: 0,
      volume: 0,
      lastUpdated: Date.now()
    };
    memoryCache.set(cacheKey, emptyStats, CACHE_ERROR_TTL);
    return emptyStats;
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ account: string; mint: string }> }
) {
  try {
    const params = await context.params;
    const { account, mint } = await params;

    // Add overall API timeout
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('API timeout')), API_TIMEOUT);
    });

    const cacheKey = `token-stats-${account}-${mint}`;
    const cachedStats = memoryCache.get<TokenStats>(cacheKey);
    
    // Return cached data and refresh in background if stale
    if (cachedStats) {
      const age = Date.now() - cachedStats.lastUpdated;
      if (age > CACHE_TTL * 1000) {
        // Refresh in background if cache is stale
        refreshTokenStats(account, mint, cacheKey).catch(console.error);
      }
      return NextResponse.json(cachedStats, {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60'
        }
      });
    }

    // Race between data fetching and timeout
    const stats = await Promise.race([
      getTokenStats(account, mint),
      timeoutPromise
    ]) as TokenStats;

    memoryCache.set(cacheKey, stats, CACHE_TTL);

    return NextResponse.json(stats, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60'
      }
    });
  } catch (error) {
    console.error('Error fetching token stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch token stats' },
      { status: 500 }
    );
  }
}
