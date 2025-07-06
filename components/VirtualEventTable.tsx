/**
 * Virtual Event Table Component
 * High-performance table using @visactor/vtable for displaying blockchain events
 * Integrated with OpenSVM theme system for consistent styling
 */

'use client';

import React, { useEffect, useRef, useMemo, useCallback } from 'react';
import { ListTable } from '@visactor/vtable';
import { BlockchainEvent } from './LiveEventMonitor';
import { lamportsToSol } from '@/components/transaction-graph/utils';

interface VirtualEventTableProps {
  events: BlockchainEvent[];
  onEventClick: (event: BlockchainEvent) => void;
  height?: number;
}

export const VirtualEventTable = React.memo(function VirtualEventTable({ 
  events, 
  onEventClick, 
  height = 400 
}: VirtualEventTableProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const tableInstanceRef = useRef<ListTable | null>(null);

  // Get theme colors from CSS variables
  const getThemeColors = useCallback(() => {
    const computedStyle = getComputedStyle(document.documentElement);
    return {
      background: `hsl(${computedStyle.getPropertyValue('--background')})`,
      foreground: `hsl(${computedStyle.getPropertyValue('--foreground')})`,
      card: `hsl(${computedStyle.getPropertyValue('--card')})`,
      cardForeground: `hsl(${computedStyle.getPropertyValue('--card-foreground')})`,
      primary: `hsl(${computedStyle.getPropertyValue('--primary')})`,
      primaryForeground: `hsl(${computedStyle.getPropertyValue('--primary-foreground')})`,
      secondary: `hsl(${computedStyle.getPropertyValue('--secondary')})`,
      secondaryForeground: `hsl(${computedStyle.getPropertyValue('--secondary-foreground')})`,
      muted: `hsl(${computedStyle.getPropertyValue('--muted')})`,
      mutedForeground: `hsl(${computedStyle.getPropertyValue('--muted-foreground')})`,
      accent: `hsl(${computedStyle.getPropertyValue('--accent')})`,
      accentForeground: `hsl(${computedStyle.getPropertyValue('--accent-foreground')})`,
      border: `hsl(${computedStyle.getPropertyValue('--border')})`,
      input: `hsl(${computedStyle.getPropertyValue('--input')})`,
      ring: `hsl(${computedStyle.getPropertyValue('--ring')})`,
    };
  }, []);

  // Transform events to table data format with memoization
  const tableData = useMemo(() => {
    return events.map((event, index) => ({
      id: index,
      type: event.type,
      timestamp: new Date(event.timestamp).toLocaleTimeString(),
      signature: event.type === 'transaction' ? event.data?.signature?.substring(0, 12) + '...' : '-',
      fee: event.type === 'transaction' && event.data?.fee 
        ? lamportsToSol(event.data.fee).toFixed(6) + ' SOL'
        : '-',
      status: event.type === 'transaction' 
        ? (event.data?.err ? '❌ Failed' : '✅ Success')
        : event.type === 'block' ? '📦 Block' : '🔄 Change',
      program: event.data?.knownProgram || (event.data?.transactionType === 'spl-transfer' ? 'SPL' : 'Custom'),
      slot: event.data?.slot || '-',
      logs: event.data?.logs?.length || 0,
      rawEvent: event // Store raw event for click handling
    }));
  }, [events]);

  // Table columns configuration with theme-aware styling
  const getColumnsConfig = useCallback(() => {
    const theme = getThemeColors();
    
    return [
      {
        field: 'type',
        title: 'Type',
        width: 80,
        style: {
          color: (args: any) => {
            switch (args.value) {
              case 'transaction': return theme.primary;
              case 'block': return theme.accent;
              case 'account_change': return theme.secondary;
              default: return theme.foreground;
            }
          },
          fontWeight: 'bold',
          fontFamily: 'Berkeley Mono, monospace'
        }
      },
      {
        field: 'timestamp',
        title: 'Time',
        width: 90,
        style: {
          fontSize: 12,
          color: theme.mutedForeground,
          fontFamily: 'Berkeley Mono, monospace'
        }
      },
      {
        field: 'signature',
        title: 'Signature',
        width: 120,
        style: {
          fontFamily: 'Berkeley Mono, monospace',
          fontSize: 11,
          color: theme.foreground
        }
      },
      {
        field: 'status',
        title: 'Status',
        width: 90,
        style: {
          fontSize: 12,
          fontFamily: 'Berkeley Mono, monospace'
        }
      },
      {
        field: 'fee',
        title: 'Fee',
        width: 100,
        style: {
          fontFamily: 'Berkeley Mono, monospace',
          fontSize: 11,
          textAlign: 'right',
          color: theme.foreground
        }
      },
      {
        field: 'program',
        title: 'Program',
        width: 80,
        style: {
          fontSize: 11,
          fontFamily: 'Berkeley Mono, monospace',
          color: (args: any) => {
            switch (args.value) {
              case 'raydium': return '#7c3aed';
              case 'meteora': return '#2563eb';
              case 'aldrin': return '#ea580c';
              case 'pumpswap': return '#ec4899';
              case 'SPL': return theme.primary;
              default: return theme.foreground;
            }
          },
          fontWeight: (args: any) => {
            return ['raydium', 'meteora', 'aldrin', 'pumpswap'].includes(args.value) ? 'bold' : 'normal';
          }
        }
      },
      {
        field: 'slot',
        title: 'Slot',
        width: 100,
        style: {
          fontFamily: 'Berkeley Mono, monospace',
          fontSize: 11,
          textAlign: 'right',
          color: theme.mutedForeground
        }
      },
      {
        field: 'logs',
        title: 'Logs',
        width: 60,
        style: {
          fontSize: 11,
          textAlign: 'center',
          color: theme.mutedForeground,
          fontFamily: 'Berkeley Mono, monospace'
        }
      }
    ];
  }, [getThemeColors]);

  // Initialize and manage table instance with theme integration
  useEffect(() => {
    if (!containerRef.current) return;

    // Clean up existing table
    if (tableInstanceRef.current) {
      tableInstanceRef.current.release();
      tableInstanceRef.current = null;
    }

    try {
      const theme = getThemeColors();
      const columns = getColumnsConfig();

      const table = new ListTable(containerRef.current, {
        records: tableData,
        columns,
        height,
        theme: {
          headerStyle: {
            bgColor: theme.card,
            color: theme.cardForeground,
            fontSize: 12,
            fontWeight: 'bold',
            borderColor: theme.border,
            fontFamily: 'Berkeley Mono, monospace'
          },
          bodyStyle: {
            bgColor: theme.background,
            hoverColor: theme.accent,
            borderColor: theme.border,
            fontFamily: 'Berkeley Mono, monospace'
          },
          selectionStyle: {
            cellBgColor: theme.primary,
            cellBorderColor: theme.ring
          }
        },
        hover: {
          highlightMode: 'row'
        },
        select: {
          highlightMode: 'row'
        },
        scroll: {
          enable: true,
          mode: 'virtual'
        },
        frozenColCount: 0,
        allowFrozenColCount: 0,
        widthMode: 'standard',
        heightMode: 'autoHeight',
        autoFillHeight: true
      });

      // Handle click events
      table.on('click', (event: any) => {
        const { row, col } = event.target;
        if (row >= 0 && tableData[row]?.rawEvent) {
          onEventClick(tableData[row].rawEvent);
        }
      });

      tableInstanceRef.current = table;
    } catch (error) {
      console.error('Failed to initialize virtual table:', error);
    }

    return () => {
      if (tableInstanceRef.current) {
        tableInstanceRef.current.release();
        tableInstanceRef.current = null;
      }
    };
  }, [tableData, height, onEventClick, getThemeColors, getColumnsConfig]);

  // Update table data when events change (optimized)
  useEffect(() => {
    if (tableInstanceRef.current && tableData) {
      try {
        tableInstanceRef.current.setRecords(tableData);
      } catch (error) {
        console.error('Failed to update table data:', error);
      }
    }
  }, [tableData]);

  return (
    <div className="w-full">
      <div 
        ref={containerRef} 
        style={{ height: `${height}px` }}
        className="border rounded-lg overflow-hidden bg-card"
      />
      <div className="text-xs text-muted-foreground mt-2 px-2 font-mono">
        Showing {tableData.length} events • Click row to view details • Virtual scrolling enabled
      </div>
    </div>
  );
});