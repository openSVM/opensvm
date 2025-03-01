'use client';

import { useState, useMemo } from 'react';
import { useTransfers } from '@/app/account/[address]/components/shared/hooks';
import type { Transfer } from '@/app/account/[address]/components/shared/types';
import { VTableWrapper } from '@/components/vtable';
import { Button } from '@/components/ui/button';
import { formatNumber } from '@/lib/utils';
import { Tooltip } from '@/components/ui/tooltip';

interface TransfersTableProps {
  address: string;
}

export function TransfersTable({ address }: TransfersTableProps) {
  const { transfers, loading, error, hasMore, loadMore, totalCount } = useTransfers(address);
  const [sortField, setSortField] = useState<keyof Transfer>('timestamp');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const handleSort = (field: string, direction: 'asc' | 'desc' | null) => {
    if (direction === null) {
      // Reset to default sort
      setSortField('timestamp');
      setSortDirection('desc');
      return;
    }
    
    setSortField(field as keyof Transfer);
    setSortDirection(direction);
  };

  const columns = useMemo(() => [
    {
      field: 'timestamp',
      title: 'Time',
      width: 180,
      sortable: true,
      render: (row: Transfer) => {
        const date = new Date(row.timestamp);
        return (
          <div className="whitespace-nowrap">
            <time dateTime={date.toISOString()}>{date.toLocaleDateString()} {date.toLocaleTimeString()}</time>
          </div>
        );
      }
    },
    {
      field: 'type',
      title: 'Type',
      width: 100,
      sortable: true,
      render: (row: Transfer) => (
        <div className="capitalize">{row.type}</div>
      )
    },
    {
      field: 'amount',
      title: 'Amount',
      width: 120,
      sortable: true,
      render: (row: Transfer) => (
        <div className="text-right font-mono">
          {formatNumber(row.amount)}
        </div>
      )
    },
    {
      field: 'token',
      title: 'Token',
      width: 100,
      sortable: true,
      render: (row: Transfer) => (
        <div>{row.tokenSymbol || row.token}</div>
      )
    },
    {
      field: 'usdValue',
      title: 'USD Value',
      width: 120,
      sortable: true,
      render: (row: Transfer) => (
        <div className="text-right font-mono">
          {row.usdValue ? `$${formatNumber(row.usdValue)}` : '-'}
        </div>
      )
    },
    {
      field: 'from',
      title: 'From',
      width: 200,
      sortable: true,
      render: (row: Transfer) => (
        <Tooltip content={row.from}>
          <div className="truncate font-mono text-xs">
            <a
              href={`/account/${row.from}`}
              className="hover:underline hover:text-blue-400 text-blue-500 transition-colors"
              title={row.from}
              aria-label={`View account ${row.from}`}
              rel="noopener"
            >
              {row.from}
            </a>
          </div>
        </Tooltip>
      )
    },
    {
      field: 'to',
      title: 'To',
      width: 200,
      sortable: true,
      render: (row: Transfer) => (
        <Tooltip content={row.to}>
          <div className="truncate font-mono text-xs">
            <a
              href={`/account/${row.to}`}
              className="hover:underline hover:text-blue-400 text-blue-500 transition-colors"
              title={row.to}
              aria-label={`View account ${row.to}`}
              rel="noopener"
            >
              {row.to}
            </a>
          </div>
        </Tooltip>
      )
    },
    {
      field: 'signature',
      title: 'Transaction',
      width: 200,
      sortable: false,
      render: (row: Transfer) => (
        <Tooltip content={row.signature}>
          <div className="truncate font-mono text-xs">
            <a
              href={`/tx/${row.signature}`}
              className="hover:underline hover:text-blue-400 text-blue-500 transition-colors"
              title={row.signature}
              aria-label={`View transaction ${row.signature}`}
              rel="noopener"
            >
              {row.signature}
            </a>
          </div>
        </Tooltip>
      )
    }
  ], []);

  const sortedTransfers = useMemo(() => {
    if (!transfers.length) return [];

    const sorted = [...transfers].sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];

      if (aValue === undefined || bValue === undefined) return 0;

      // Handle different types of values
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        if (sortField === 'timestamp') {
          // For timestamps, convert to Date objects for comparison
          const aDate = new Date(aValue).getTime();
          const bDate = new Date(bValue).getTime();
          return sortDirection === 'asc' ? aDate - bDate : bDate - aDate;
        }
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue) 
          : bValue.localeCompare(aValue);
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }

      return 0;
    });
    
    return sorted;
  }, [transfers, sortField, sortDirection]);

  if (error) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg" role="alert" aria-live="assertive">
        <p className="text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold" id="transfers-heading">
          Transfers
          {totalCount !== undefined && (
            <span className="ml-2 text-sm text-muted-foreground">
              ({totalCount.toLocaleString()})
            </span>
          )}
        </h2>
      </div>

      <div className="border border-border rounded-lg overflow-hidden h-[500px]" role="region" aria-labelledby="transfers-heading" aria-live="polite">
        <VTableWrapper
          columns={columns}
          data={sortedTransfers}
          loading={loading}
          onSort={handleSort}
          aria-busy={loading ? 'true' : 'false'}
        />
      </div>

      {hasMore && (
        <div className="flex justify-center mt-4">
          <Button
            onClick={loadMore}
            disabled={loading}
            variant="outline"
            className="w-full md:w-auto hover:bg-primary/10"
          >
            {loading ? 'Loading...' : 'Load More'}
          </Button>
        </div>
      )}
    </div>
  );
}
