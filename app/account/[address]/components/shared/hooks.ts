import { useState, useEffect } from 'react';
import { Transfer } from './types';

interface TransferResponse {
  data: Transfer[];
  hasMore: boolean;
  total?: number;
  error?: string;
}

interface UseTransfersResult {
  transfers: Transfer[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => void;
  totalCount?: number;
}

const CACHE_PREFIX = 'transfers-cache';
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

interface CacheEntry {
  transfers: Transfer[];
  timestamp: number;
  hasMore: boolean;
  page: number;
}

function getCacheKey(address: string): string {
  return `${CACHE_PREFIX}-${address}`;
}

function getFromCache(address: string): CacheEntry | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const cacheKey = getCacheKey(address);
    const cached = localStorage.getItem(cacheKey);
    if (!cached) return null;

    const entry: CacheEntry = JSON.parse(cached);
    const now = Date.now();
    
    if (now - entry.timestamp > CACHE_EXPIRY) {
      localStorage.removeItem(cacheKey);
      return null;
    }
    
    return entry;
  } catch (err) {
    console.error('Error reading from cache:', err);
    return null;
  }
}

function saveToCache(address: string, transfers: Transfer[], hasMore: boolean, page: number): void {
  if (typeof window === 'undefined') return;
  
  try {
    const cacheKey = getCacheKey(address);
    const entry: CacheEntry = {
      transfers,
      hasMore,
      page,
      timestamp: Date.now()
    };
    localStorage.setItem(cacheKey, JSON.stringify(entry));
  } catch (err) {
    console.error('Error saving to cache:', err);
  }
}

export function useTransfers(address: string): UseTransfersResult {
  const cachedData = getFromCache(address);
  const [transfers, setTransfers] = useState<Transfer[]>(cachedData?.transfers || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(cachedData?.hasMore ?? true);
  const [page, setPage] = useState(cachedData?.page || 0);
  const [totalCount, setTotalCount] = useState<number>();

  const fetchTransfers = async (pageToFetch: number) => {
    if (loading || !hasMore) return;
    
    const controller = new AbortController();
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/account-transfers/${encodeURIComponent(address)}?offset=${pageToFetch * 1000}`, {
        signal: controller.signal
      });
      
      const result: TransferResponse = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch transfers');
      }
      
      if (!result.data || !Array.isArray(result.data)) {
        throw new Error('Invalid response format');
      }
      
      if (result.data.length === 0) {
        setHasMore(false);
        saveToCache(address, transfers, false, pageToFetch);
      } else {
        const newTransfers = [...transfers, ...result.data];
        setTransfers(newTransfers);
        const newPage = pageToFetch + 1;
        setPage(newPage);
        saveToCache(address, newTransfers, true, newPage);
        if (result.total) {
          setTotalCount(result.total);
        }
      }
      
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }

      console.error('Error fetching transfers:', err);
      
      setError(err instanceof Error ? err.message : 'Failed to fetch transfers');
      
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    const shouldFetch = !cachedData || Date.now() - cachedData.timestamp > CACHE_EXPIRY;
    
    if (shouldFetch) {
      // Only reset state if we don't have valid cached data
      if (!cachedData) {
        setTransfers([]);
        setPage(0);
        setHasMore(true);
      }
      fetchTransfers(0);
    }
// eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address]);

  const loadMore = () => {
    if (!loading && hasMore) {
      fetchTransfers(page);
    }
  };

  return {
    transfers,
    loading,
    error,
    hasMore,
    loadMore,
    totalCount
  };
}
