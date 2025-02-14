"use client";

import { useCallback, useEffect, useState, useRef, useMemo } from 'react';
import { VTableWrapper } from './vtable';
import { useSearchParams, useRouter } from 'next/navigation';
import debounce from 'lodash/debounce';

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

interface Props {
  address: string;
}

interface QueryParams {
  before?: string;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filterType?: 'IN' | 'OUT' | 'ALL';
  minAmount?: number;
  maxAmount?: number;
  tokenSymbol?: string;
}

const PAGE_SIZE = 20;

export function TransfersTable({ address }: Props) {
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const isFetchingRef = useRef(false);
  const initialLoadRef = useRef(false);
  const addressRef = useRef(address);
  const searchParams = useSearchParams();
  const router = useRouter();
  const abortControllerRef = useRef<AbortController | null>(null);

  // Cache transfers in memory
  const transfersCache = useRef<Record<string, Transfer[]>>({});

  const currentParams = useMemo((): QueryParams => ({
    before: searchParams.get('before') || undefined,
    limit: PAGE_SIZE,
    sortBy: searchParams.get('sortBy') || 'date',
    sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc',
    filterType: (searchParams.get('filterType') as 'IN' | 'OUT' | 'ALL') || 'ALL',
    minAmount: searchParams.get('minAmount') ? Number(searchParams.get('minAmount')) : undefined,
    maxAmount: searchParams.get('maxAmount') ? Number(searchParams.get('maxAmount')) : undefined,
    tokenSymbol: searchParams.get('tokenSymbol') || undefined,
  }), [searchParams]);

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
    } catch (err) {
      return dateStr;
    }
  };

  const formatAmount = (amount: string) => {
    try {
      const num = parseFloat(amount);
      if (Math.abs(num) < 0.00001) {
        return num.toExponential(4);
      }
      return num.toLocaleString(undefined, {
        minimumFractionDigits: 4,
        maximumFractionDigits: 6
      });
    } catch (err) {
      return amount;
    }
  };

  const formatAddress = (addr: string) => {
    if (!addr) return '-';
    if (addr === address) return '(Current Account)';
    return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
  };

  const updateQueryParams = useCallback((newParams: Partial<QueryParams>) => {
    const params = new URLSearchParams(searchParams.toString());
    
    Object.entries(newParams).forEach(([key, value]) => {
      if (value === undefined) {
        params.delete(key);
      } else {
        params.set(key, String(value));
      }
    });

    router.push(`?${params.toString()}`);
  }, [searchParams, router]);

  const fetchTransfers = useCallback(async () => {
    if (isFetchingRef.current) return;

    try {
      // Cancel any ongoing requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      setLoading(true);
      isFetchingRef.current = true;

      // Build query params with only string values
      const queryParams: Record<string, string> = {
        limit: String(currentParams.limit),
        ...(currentParams.before && { before: currentParams.before }),
        ...(currentParams.sortBy && { sortBy: currentParams.sortBy }),
        ...(currentParams.sortOrder && { sortOrder: currentParams.sortOrder }),
        ...(currentParams.filterType && { filterType: currentParams.filterType })
      };

      if (currentParams.minAmount !== undefined) {
        queryParams.minAmount = String(currentParams.minAmount);
      }
      if (currentParams.maxAmount !== undefined) {
        queryParams.maxAmount = String(currentParams.maxAmount);
      }
      if (currentParams.tokenSymbol) {
        queryParams.tokenSymbol = currentParams.tokenSymbol;
      }

      const queryString = new URLSearchParams(queryParams).toString();
      const cacheKey = `${address}:${queryString}`;
      
      // Check cache first
      if (transfersCache.current[cacheKey]) {
        setTransfers(transfersCache.current[cacheKey]);
        setLoading(false);
        return;
      }

      const response = await fetch(
        `/api/account-transfers/${addressRef.current}?${queryString}`,
        { 
          signal: abortControllerRef.current.signal,
          cache: 'no-store' 
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (Array.isArray(data.transfers)) {
        // Update cache
        transfersCache.current[cacheKey] = data.transfers;
        
        setTransfers(data.transfers);
        setHasMore(data.hasMore || false);
      } else {
        console.error('Invalid transfers data format:', data);
        setError('Invalid data format received from server');
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // Ignore abort errors
        return;
      }
      console.error('Error fetching transfers:', err);
      setError('Failed to load transfers');
    } finally {
      isFetchingRef.current = false;
      setLoading(false);
    }
  }, [address, currentParams]);

  // Debounced fetch for filter changes
  const debouncedFetch = useMemo(
    () => debounce(fetchTransfers, 300),
    [fetchTransfers]
  );

  const handleSort = useCallback((column: string) => {
    const newSortOrder = 
      currentParams.sortBy === column && currentParams.sortOrder === 'desc' 
        ? 'asc' 
        : 'desc';
    
    updateQueryParams({
      sortBy: column,
      sortOrder: newSortOrder,
      before: undefined // Reset pagination when sorting changes
    });
  }, [currentParams.sortBy, currentParams.sortOrder, updateQueryParams]);

  const handleFilterChange = useCallback((type: 'IN' | 'OUT' | 'ALL') => {
    updateQueryParams({
      filterType: type,
      before: undefined // Reset pagination when filter changes
    });
  }, [updateQueryParams]);

  const handleLoadMore = useCallback(() => {
    if (!loading && hasMore && !isFetchingRef.current && transfers.length > 0) {
      const lastTransfer = transfers[transfers.length - 1];
      updateQueryParams({
        before: lastTransfer.txId
      });
    }
  }, [loading, hasMore, transfers, updateQueryParams]);

  const tableColumns = [
    {
      field: 'txId',
      key: 'txId',
      header: 'Tx ID',
      title: 'Tx ID',
      width: 120,
      sortable: true,
      onSort: () => handleSort('txId'),
      render: (row: Transfer) => (
        <a
          href={`/tx/${row.txId}`}
          className="text-blue-500 hover:text-blue-600"
          target="_blank"
          rel="noopener noreferrer"
        >
          {row.txId.slice(0, 8)}...
        </a>
      ),
    },
    {
      field: 'date',
      key: 'date',
      header: 'Date',
      title: 'Date',
      width: 180,
      sortable: true,
      onSort: () => handleSort('date'),
      render: (row: Transfer) => formatDate(row.date),
    },
    {
      field: 'from',
      key: 'from',
      header: 'From',
      title: 'From',
      width: 150,
      sortable: false,
      render: (row: Transfer) => (
        row.from ? (
          <a
            href={`/account/${row.from}`}
            className="text-blue-500 hover:text-blue-600"
            target="_blank"
            rel="noopener noreferrer"
          >
            {formatAddress(row.from)}
          </a>
        ) : '-'
      ),
    },
    {
      field: 'to',
      key: 'to',
      header: 'To',
      title: 'To',
      width: 150,
      sortable: false,
      render: (row: Transfer) => (
        row.to ? (
          <a
            href={`/account/${row.to}`}
            className="text-blue-500 hover:text-blue-600"
            target="_blank"
            rel="noopener noreferrer"
          >
            {formatAddress(row.to)}
          </a>
        ) : '-'
      ),
    },
    {
      field: 'tokenSymbol',
      key: 'tokenSymbol',
      header: 'Token',
      title: 'Token',
      width: 80,
      sortable: false,
      align: 'center' as const,
    },
    {
      field: 'tokenAmount',
      key: 'tokenAmount',
      header: 'Amount',
      title: 'Amount',
      width: 140,
      sortable: true,
      onSort: () => handleSort('tokenAmount'),
      align: 'right' as const,
      render: (row: Transfer) => formatAmount(row.tokenAmount),
    },
    {
      field: 'usdValue',
      key: 'usdValue',
      header: 'USD Value',
      title: 'USD Value',
      width: 120,
      sortable: true,
      onSort: () => handleSort('usdValue'),
      align: 'right' as const,
      render: (row: Transfer) => row.usdValue !== '0' ? `$${formatAmount(row.usdValue)}` : '-',
    },
    {
      field: 'currentUsdValue',
      key: 'currentUsdValue',
      header: 'Current USD',
      title: 'Current USD',
      width: 120,
      sortable: true,
      onSort: () => handleSort('currentUsdValue'),
      align: 'right' as const,
      render: (row: Transfer) => row.currentUsdValue !== '0' ? `$${formatAmount(row.currentUsdValue)}` : '-',
    },
    {
      field: 'transferType',
      key: 'transferType',
      header: 'Type',
      title: 'Type',
      width: 80,
      sortable: true,
      onSort: () => handleSort('transferType'),
      align: 'center' as const,
      render: (row: Transfer) => (
        <span
          className={
            row.transferType === 'IN'
              ? 'text-green-500 font-medium'
              : 'text-red-500 font-medium'
          }
        >
          {row.transferType === 'IN' ? '⬇️ IN' : '⬆️ OUT'}
        </span>
      ),
    },
  ];

  // Reset data when address changes
  useEffect(() => {
    if (addressRef.current !== address) {
      addressRef.current = address;
      setTransfers([]);
      setHasMore(true);
      initialLoadRef.current = false;
      transfersCache.current = {}; // Clear cache
      updateQueryParams({
        before: undefined,
        sortBy: 'date',
        sortOrder: 'desc',
        filterType: 'ALL'
      });
    }
  }, [address, updateQueryParams]);

  // Fetch when params change
  useEffect(() => {
    if (!initialLoadRef.current) {
      initialLoadRef.current = true;
      fetchTransfers();
    } else {
      debouncedFetch();
    }

    return () => {
      debouncedFetch.cancel();
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchTransfers, debouncedFetch]);

  return (
    <div className="w-full h-full">
      <div className="mb-4 flex gap-2">
        <button
          onClick={() => handleFilterChange('ALL')}
          className={`px-3 py-1 rounded ${
            currentParams.filterType === 'ALL'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-gray-700'
          }`}
        >
          All
        </button>
        <button
          onClick={() => handleFilterChange('IN')}
          className={`px-3 py-1 rounded ${
            currentParams.filterType === 'IN'
              ? 'bg-green-500 text-white'
              : 'bg-gray-200 text-gray-700'
          }`}
        >
          Incoming
        </button>
        <button
          onClick={() => handleFilterChange('OUT')}
          className={`px-3 py-1 rounded ${
            currentParams.filterType === 'OUT'
              ? 'bg-red-500 text-white'
              : 'bg-gray-200 text-gray-700'
          }`}
        >
          Outgoing
        </button>
      </div>
      
      <div className="vtable-container">
        {loading && !transfers.length ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="text-red-500">{error}</div>
        ) : (
          <VTableWrapper
            columns={tableColumns}
            onSort={handleSort}
            data={transfers}
            loading={loading}
            error={error}
            onLoadMore={handleLoadMore}
            hasMore={hasMore}
          />
        )}
      </div>
    </div>
  );
}