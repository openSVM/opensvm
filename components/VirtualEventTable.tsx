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

  // Ultra-optimized data transformation with aggressive limits and caching
  const tableData = useMemo(() => {
    // Much more aggressive performance limits
    const maxEventsToShow = 1000; // Reduced from 5000
    const eventsToProcess = events.length > maxEventsToShow 
      ? events.slice(-maxEventsToShow)
      : events;
    
    // Use lightweight data transformation
    return eventsToProcess.map((event, index) => {
      const isTransaction = event.type === 'transaction';
      const data = event.data || {};
      
      return {
        id: index,
        type: event.type,
        timestamp: new Date(event.timestamp).toLocaleTimeString('en-US', { 
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        }),
        signature: isTransaction && data.signature 
          ? data.signature.substring(0, 8) + '...' // Further shortened
          : '-',
        fee: isTransaction && data.fee 
          ? lamportsToSol(data.fee).toFixed(4) + ' SOL' // Reduced precision
          : '-',
        status: isTransaction 
          ? (data.err ? '❌' : '✅') // Simplified icons
          : event.type === 'block' ? '📦' : '🔄',
        program: data.knownProgram || (data.transactionType === 'spl-transfer' ? 'SPL' : 'Custom'),
        slot: data.slot?.toString() || '-',
        logs: data.logs?.length || 0,
        rawEvent: event // Store raw event for click handling
      };
    });
  }, [events]);

  // Ultra-optimized columns with reduced styling complexity
  const columnsConfig = useMemo(() => {
    const theme = getThemeColors();
    
    return [
      {
        field: 'type',
        title: 'Type',
        width: 60, // Reduced width
        style: {
          color: theme.foreground,
          fontWeight: 'bold',
          fontSize: 11,
          fontFamily: 'monospace'
        }
      },
      {
        field: 'timestamp',
        title: 'Time',
        width: 80, // Reduced width
        style: {
          fontSize: 10,
          color: theme.mutedForeground,
          fontFamily: 'monospace'
        }
      },
      {
        field: 'signature',
        title: 'Sig',
        width: 80, // Reduced width
        style: {
          fontFamily: 'monospace',
          fontSize: 10,
          color: theme.foreground
        }
      },
      {
        field: 'status',
        title: 'Status',
        width: 60, // Reduced width
        style: {
          fontSize: 11,
          fontFamily: 'monospace',
          textAlign: 'center'
        }
      },
      {
        field: 'fee',
        title: 'Fee',
        width: 90, // Reduced width
        style: {
          fontFamily: 'monospace',
          fontSize: 10,
          textAlign: 'right',
          color: theme.foreground
        }
      },
      {
        field: 'program',
        title: 'Program',
        width: 70, // Reduced width
        style: {
          fontSize: 10,
          fontFamily: 'monospace',
          color: theme.foreground
        }
      },
      {
        field: 'slot',
        title: 'Slot',
        width: 80, // Reduced width
        style: {
          fontFamily: 'monospace',
          fontSize: 10,
          textAlign: 'right',
          color: theme.mutedForeground
        }
      },
      {
        field: 'logs',
        title: 'Logs',
        width: 50, // Reduced width
        style: {
          fontSize: 10,
          textAlign: 'center',
          color: theme.mutedForeground,
          fontFamily: 'monospace'
        }
      }
    ];
  }, [getThemeColors]);

  // Ultra-optimized table initialization with minimal options
  const initializeTable = useCallback(() => {
    if (!containerRef.current) return;

    // Clean up existing table with proper error handling and DOM checks
    if (tableInstanceRef.current) {
      try {
        const existingTable = tableInstanceRef.current;
        tableInstanceRef.current = null; // Clear reference first to prevent race conditions
        
        // Check if the table container still exists in DOM before release
        if (containerRef.current && containerRef.current.isConnected) {
          existingTable.release();
        }
      } catch (error) {
        // Silently handle cleanup errors to prevent console spam
        if (error instanceof Error && !error.message.includes('removeChild')) {
          console.warn('Error releasing existing table:', error);
        }
      }
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
            fontSize: 11,
            fontWeight: 'bold',
            borderColor: theme.border,
            fontFamily: 'monospace'
          },
          bodyStyle: {
            bgColor: theme.background,
            hoverColor: theme.accent,
            borderColor: theme.border,
            fontFamily: 'monospace'
          }
        },
        hover: {
          highlightMode: 'row'
        },
        scroll: {
          enable: true,
          mode: 'virtual'
        },
        widthMode: 'standard',
        heightMode: 'autoHeight',
        autoFillHeight: true,
        rowHeight: 24, // Reduced from 28
        defaultHeaderRowHeight: 28, // Reduced from 32
        // Disable expensive features for better performance
        allowFrozenColCount: 0,
        frozenColCount: 0,
        select: false, // Disable selection for better performance
        animationAppear: false, // Disable animations
        animationEnter: false
      });

      // Ultra-lightweight click handler
      table.on('click', (event: any) => {
        try {
          const { row } = event.target;
          if (row >= 0 && row < tableData.length && tableData[row]?.rawEvent) {
            onEventClick(tableData[row].rawEvent);
          }
        } catch (e) {
          // Silently handle click errors
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
    
    // Use requestAnimationFrame to ensure DOM is ready
    const initTimer = requestAnimationFrame(() => {
      initializeTable();
    });
    
    return () => {
      cancelAnimationFrame(initTimer);
      
      // Safe cleanup with error handling and DOM checks
      if (tableInstanceRef.current) {
        try {
          const table = tableInstanceRef.current;
          tableInstanceRef.current = null; // Clear reference first to prevent race conditions
          
          // Only release if container still exists in DOM
          if (containerRef.current && containerRef.current.isConnected) {
            table.release();
          }
        } catch (error) {
          // Silently handle DOM manipulation errors
          if (error instanceof Error && !error.message.includes('removeChild')) {
            console.warn('Error releasing table on cleanup:', error);
          }
        }
      }
    };
  }, [initializeTable]);

  // Ultra-throttled table data updates for maximum performance
  const updateTableDataThrottled = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout | null = null;
      let lastUpdateTime = 0;
      
      return () => {
        const now = Date.now();
        
        // Prevent updates if too frequent
        if (now - lastUpdateTime < 300) {
          if (timeoutId) {
            clearTimeout(timeoutId);
          }
          
          timeoutId = setTimeout(() => {
            if (tableInstanceRef.current && isTableReady) {
              try {
                tableInstanceRef.current.setRecords(tableData);
                lastUpdateTime = Date.now();
              } catch (error) {
                // Silently handle update errors
              }
            }
          }, 300 - (now - lastUpdateTime));
          return;
        }
        
        if (tableInstanceRef.current && isTableReady) {
          try {
            tableInstanceRef.current.setRecords(tableData);
            lastUpdateTime = now;
          } catch (error) {
            // Silently handle update errors
          }
        }
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
          Showing {Math.min(tableData.length, 1000)} of {events.length} events
        </span>
        <span>
          Click row • Virtual • 
          {isTableReady ? ' Ready' : ' Loading...'}
        </span>
      </div>
    </div>
  );
});