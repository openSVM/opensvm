/**
 * Virtual Event Table Component
 * High-performance table using @visactor/vtable for displaying blockchain events
 * Integrated with OpenSVM theme system for consistent styling
 * Optimized for performance with proper caching and minimal re-renders
 */

'use client';

import React, { useEffect, useRef, useMemo, useCallback, useState } from 'react';
import { ListTable } from '@visactor/vtable';
import { BlockchainEvent } from './LiveEventMonitor';
import { lamportsToSol } from '@/components/transaction-graph/utils';

interface VirtualEventTableProps {
  events: BlockchainEvent[];
  onEventClick: (event: BlockchainEvent) => void;
  height?: number;
}

// Theme cache to avoid repeated calculations
const themeCache = new Map<string, any>();

export const VirtualEventTable = React.memo(function VirtualEventTable({ 
  events, 
  onEventClick, 
  height = 400 
}: VirtualEventTableProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const tableInstanceRef = useRef<ListTable | null>(null);
  const [isTableReady, setIsTableReady] = useState(false);
  const themeStateRef = useRef<string>('');

  // Get theme colors from CSS variables with caching
  const getThemeColors = useCallback(() => {
    const currentTheme = document.documentElement.className;
    
    if (themeCache.has(currentTheme)) {
      return themeCache.get(currentTheme);
    }
    
    const computedStyle = getComputedStyle(document.documentElement);
    const colors = {
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
    
    themeCache.set(currentTheme, colors);
    return colors;
  }, []);

  // Transform events to table data format with memoization and performance optimization
  const tableData = useMemo(() => {
    // Limit data processing for performance
    const maxEventsToShow = 5000;
    const eventsToProcess = events.length > maxEventsToShow 
      ? events.slice(-maxEventsToShow)
      : events;
    
    return eventsToProcess.map((event, index) => ({
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

  // Stable columns configuration with memoization
  const columnsConfig = useMemo(() => {
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

  // Initialize table with proper cleanup and error handling
  const initializeTable = useCallback(() => {
    if (!containerRef.current) return;

    // Clean up existing table
    if (tableInstanceRef.current) {
      try {
        tableInstanceRef.current.release();
      } catch (e) {
        console.warn('Error releasing table:', e);
      }
      tableInstanceRef.current = null;
    }

    try {
      const theme = getThemeColors();
      
      const table = new ListTable(containerRef.current, {
        records: tableData,
        columns: columnsConfig,
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
        autoFillHeight: true,
        rowHeight: 28, // Fixed row height for better performance
        defaultHeaderRowHeight: 32
      });

      // Handle click events
      table.on('click', (event: any) => {
        try {
          const { row } = event.target;
          if (row >= 0 && tableData[row]?.rawEvent) {
            onEventClick(tableData[row].rawEvent);
          }
        } catch (e) {
          console.warn('Error handling table click:', e);
        }
      });

      tableInstanceRef.current = table;
      setIsTableReady(true);
    } catch (error) {
      console.error('Failed to initialize virtual table:', error);
      setIsTableReady(false);
    }
  }, [tableData, columnsConfig, height, onEventClick, getThemeColors]);

  // Initialize table on mount and key changes
  useEffect(() => {
    const currentTheme = document.documentElement.className;
    if (currentTheme !== themeStateRef.current) {
      themeStateRef.current = currentTheme;
      // Clear theme cache when theme changes
      themeCache.clear();
    }
    
    initializeTable();
    
    return () => {
      if (tableInstanceRef.current) {
        try {
          tableInstanceRef.current.release();
        } catch (e) {
          console.warn('Error releasing table on cleanup:', e);
        }
        tableInstanceRef.current = null;
      }
    };
  }, [initializeTable]);

  // Throttled table data updates for better performance
  const updateTableDataThrottled = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout | null = null;
      
      return () => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        
        timeoutId = setTimeout(() => {
          if (tableInstanceRef.current && isTableReady) {
            try {
              tableInstanceRef.current.setRecords(tableData);
            } catch (error) {
              console.error('Failed to update table data:', error);
            }
          }
        }, 100); // Throttle updates to every 100ms
      };
    })(),
    [tableData, isTableReady]
  );

  // Update table data when events change (throttled)
  useEffect(() => {
    if (isTableReady) {
      updateTableDataThrottled();
    }
  }, [tableData, isTableReady, updateTableDataThrottled]);

  return (
    <div className="w-full">
      <div 
        ref={containerRef} 
        style={{ height: `${height}px` }}
        className="border rounded-lg overflow-hidden bg-card relative"
      >
        {!isTableReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-card/50 backdrop-blur-sm">
            <div className="text-sm text-muted-foreground">Loading table...</div>
          </div>
        )}
      </div>
      <div className="text-xs text-muted-foreground mt-2 px-2 font-mono flex justify-between">
        <span>
          Showing {Math.min(tableData.length, 5000)} of {events.length} events
        </span>
        <span>
          Click row to view details • Virtual scrolling • 
          {isTableReady ? ' Ready' : ' Loading...'}
        </span>
      </div>
    </div>
  );
});