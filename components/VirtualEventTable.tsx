/**
 * Virtual Event Table Component
 * High-performance table using @visactor/vtable for displaying blockchain events
 */

'use client';

import React, { useEffect, useRef, useMemo } from 'react';
import { ListTable } from '@visactor/vtable';
import { BlockchainEvent } from './LiveEventMonitor';
import { lamportsToSol } from '@/components/transaction-graph/utils';

interface VirtualEventTableProps {
  events: BlockchainEvent[];
  onEventClick: (event: BlockchainEvent) => void;
  height?: number;
}

export function VirtualEventTable({ events, onEventClick, height = 400 }: VirtualEventTableProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const tableInstanceRef = useRef<ListTable | null>(null);

  // Transform events to table data format
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

  // Table columns configuration
  const columns = [
    {
      field: 'type',
      title: 'Type',
      width: 80,
      style: {
        color: (args: any) => {
          switch (args.value) {
            case 'transaction': return '#059669';
            case 'block': return '#2563eb';
            case 'account_change': return '#7c3aed';
            default: return '#374151';
          }
        },
        fontWeight: 'bold'
      }
    },
    {
      field: 'timestamp',
      title: 'Time',
      width: 90,
      style: {
        fontSize: 12,
        color: '#6b7280'
      }
    },
    {
      field: 'signature',
      title: 'Signature',
      width: 120,
      style: {
        fontFamily: 'monospace',
        fontSize: 11,
        color: '#374151'
      }
    },
    {
      field: 'status',
      title: 'Status',
      width: 90,
      style: {
        fontSize: 12
      }
    },
    {
      field: 'fee',
      title: 'Fee',
      width: 100,
      style: {
        fontFamily: 'monospace',
        fontSize: 11,
        textAlign: 'right'
      }
    },
    {
      field: 'program',
      title: 'Program',
      width: 80,
      style: {
        fontSize: 11,
        color: (args: any) => {
          switch (args.value) {
            case 'raydium': return '#7c3aed';
            case 'meteora': return '#2563eb';
            case 'aldrin': return '#ea580c';
            case 'pumpswap': return '#ec4899';
            case 'SPL': return '#059669';
            default: return '#374151';
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
        fontFamily: 'monospace',
        fontSize: 11,
        textAlign: 'right',
        color: '#6b7280'
      }
    },
    {
      field: 'logs',
      title: 'Logs',
      width: 60,
      style: {
        fontSize: 11,
        textAlign: 'center',
        color: '#6b7280'
      }
    }
  ];

  // Initialize and manage table instance
  useEffect(() => {
    if (!containerRef.current) return;

    // Clean up existing table
    if (tableInstanceRef.current) {
      tableInstanceRef.current.release();
      tableInstanceRef.current = null;
    }

    try {
      const table = new ListTable(containerRef.current, {
        records: tableData,
        columns,
        height,
        theme: {
          headerStyle: {
            bgColor: '#f8fafc',
            color: '#374151',
            fontSize: 12,
            fontWeight: 'bold',
            borderColor: '#e5e7eb'
          },
          bodyStyle: {
            bgColor: '#ffffff',
            hoverColor: '#f1f5f9',
            borderColor: '#e5e7eb'
          },
          selectionStyle: {
            cellBgColor: '#dbeafe',
            cellBorderColor: '#3b82f6'
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
  }, [tableData, height, onEventClick]);

  // Update table data when events change
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
        className="border rounded-lg overflow-hidden bg-white"
      />
      <div className="text-xs text-gray-500 mt-2 px-2">
        Showing {tableData.length} events • Click row to view details • Virtual scrolling enabled
      </div>
    </div>
  );
}