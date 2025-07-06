'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { getConnection } from '@/lib/solana';
import { useSSEAlerts } from '@/lib/hooks/useSSEAlerts';
import { lamportsToSol } from '@/components/transaction-graph/utils';
import { FIFOQueue } from '@/lib/utils/fifo-queue';
import { TransactionTooltip } from './TransactionTooltip';
import { PumpStatistics } from './PumpStatistics';
import { EventFilterControls, EventFilters } from './EventFilterControls';
import { VirtualEventTable } from './VirtualEventTable';

export interface BlockchainEvent {
  type: 'transaction' | 'block' | 'account_change';
  timestamp: number;
  data: any;
  metadata?: any;
}

interface AnomalyAlert {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  event: BlockchainEvent;
  timestamp: number;
}

interface LiveMonitorProps {
  maxEvents?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export const LiveEventMonitor = React.memo(function LiveEventMonitor({ 
  maxEvents = 10000,
  autoRefresh = true, 
  refreshInterval = 5000
}: LiveMonitorProps) {
  const [eventQueue] = useState(() => new FIFOQueue<BlockchainEvent>(maxEvents));
  const [events, setEvents] = useState<BlockchainEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [lastSlot, setLastSlot] = useState<number | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [filters, setFilters] = useState<EventFilters>({
    showTransactions: true,
    showBlocks: true,
    showAccountChanges: true,
    showSuccessOnly: false,
    showFailedOnly: false,
    showSPLTransfers: true,
    showCustomPrograms: true,
    showSystemPrograms: false,
    showKnownPrograms: {
      raydium: true,
      meteora: true,
      aldrin: true,
      pumpswap: true
    },
    minFee: 0,
    maxFee: 1000000000,
    timeRange: 'all'
  });
  
  const connectionRef = useRef<any>(null);
  const eventCountRef = useRef(0);
  const clientId = useRef(`client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);

  // Use SSE for anomaly alerts
  const {
    alerts,
    systemStatus,
    isConnected: sseConnected,
    error: sseError,
    connect: connectSSE,
    disconnect: disconnectSSE,
    clearAlerts
  } = useSSEAlerts({
    clientId: clientId.current,
    autoConnect: true,
    maxAlerts: 50,
    onAlert: (alert) => {
      console.log('Received real-time anomaly alert:', alert);
    },
    onStatusUpdate: (status) => {
      console.log('System status update:', status);
    },
    onError: (error) => {
      console.error('SSE error:', error);
    }
  });

  // System programs to filter out
  const SYSTEM_PROGRAMS = new Set([
    'Vote111111111111111111111111111111111111111',
    '11111111111111111111111111111111',
    'ComputeBudget111111111111111111111111111111',
    'AddressLookupTab1e1111111111111111111111111',
    'Config1111111111111111111111111111111111111',
    'Stake11111111111111111111111111111111111111',
  ]);

  // Known programs to highlight
  const KNOWN_PROGRAMS = {
    raydium: ['675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8', '27haf8L6oxUeXrHrgEgsexjSY5hbVUWEmvv9Nyxg8vQv'],
    meteora: ['Eo7WjKq67rjJQSZxS6z3YkapzY3eMj6Xy8X5EQVn5UaB'],
    aldrin: ['AMM55ShdkoGRB5jVYPjWziwk8m5MpwyDgsMWHaMSQWH6'],
    pumpswap: ['6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P'],
  };

  // Connect to Solana blockchain
  const connectToSolana = useCallback(async () => {
    try {
      setConnectionError(null);
      connectionRef.current = await getConnection();
      setIsConnected(true);
      console.log('Connected to Solana RPC for real-time monitoring');
      
      const currentSlot = await connectionRef.current.getSlot();
      setLastSlot(currentSlot);
      
    } catch (error) {
      console.error('Failed to connect to Solana:', error);
      setConnectionError(error instanceof Error ? error.message : 'Connection failed');
      setIsConnected(false);
    }
  }, []);

  // Fetch real blockchain events
  const fetchRealtimeEvents = useCallback(async () => {
    if (!connectionRef.current || !isConnected) return;

    try {
      const currentSlot = await connectionRef.current.getSlot();
      
      if (lastSlot && currentSlot > lastSlot) {
        const newSlots = [];
        for (let slot = lastSlot + 1; slot <= Math.min(lastSlot + 5, currentSlot); slot++) {
          newSlots.push(slot);
        }
        
        const blockPromises = newSlots.map(async (slot) => {
          try {
            const block = await connectionRef.current.getBlock(slot, {
              maxSupportedTransactionVersion: 0,
              transactionDetails: 'full',
              rewards: false
            });
            return { slot, block };
          } catch (error) {
            return null;
          }
        });
        
        const blockResults = await Promise.all(blockPromises);
        
        for (const result of blockResults) {
          if (!result?.block) continue;
          
          const { slot, block } = result;
          
          // Add block event
          const blockEvent: BlockchainEvent = {
            type: 'block',
            timestamp: Date.now(),
            data: {
              slot,
              blockhash: block.blockhash,
              previousBlockhash: block.previousBlockhash,
              parentSlot: block.parentSlot,
              transactions: block.transactions?.length || 0
            }
          };
          
          addEvent(blockEvent);
          
          // Process transactions
          if (block.transactions) {
            for (const tx of block.transactions.slice(0, 10)) {
              if (!tx.transaction || !tx.meta) continue;
              
              const signature = tx.transaction.signatures[0];
              if (!signature) continue;
              
              const accountKeys = tx.transaction.message.accountKeys?.map(key => key.toString()) || [];
              
              const isVoteTransaction = accountKeys.some(key => key === 'Vote111111111111111111111111111111111111111');
              const isSystemOnly = accountKeys.every(key => SYSTEM_PROGRAMS.has(key) || key.startsWith('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'));
              
              if (isVoteTransaction || isSystemOnly) continue;
              
              const logs = tx.meta.logMessages || [];
              const isSplTransfer = logs.some(log => 
                log.includes('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') ||
                log.includes('Program log: Instruction: Transfer')
              );
              
              const hasCustomProgram = accountKeys.some(key => 
                !SYSTEM_PROGRAMS.has(key) && 
                !key.startsWith('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')
              );
              
              if (!isSplTransfer && !hasCustomProgram) continue;
              
              const transactionEvent: BlockchainEvent = {
                type: 'transaction',
                timestamp: Date.now(),
                data: {
                  signature,
                  slot,
                  fee: tx.meta.fee,
                  err: tx.meta.err,
                  logs: logs,
                  knownProgram: identifyKnownProgram(accountKeys),
                  transactionType: classifyTransaction(logs, accountKeys),
                  accountKeys: accountKeys.slice(0, 5)
                }
              };
              
              addEvent(transactionEvent);
              processEventForAnomalies(transactionEvent);
            }
          }
        }
        
        setLastSlot(currentSlot);
      }
    } catch (error) {
      console.error('Failed to fetch realtime events:', error);
    }
  }, [lastSlot, isConnected]);

  const identifyKnownProgram = useCallback((accountKeys: string[]): string | null => {
    for (const [programName, programIds] of Object.entries(KNOWN_PROGRAMS)) {
      if (programIds.some(id => accountKeys.includes(id))) {
        return programName;
      }
    }
    return null;
  }, []);

  const classifyTransaction = useCallback((logs: string[], accountKeys: string[]): string => {
    if (logs.some(log => 
      log.includes('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') ||
      log.includes('Program log: Instruction: Transfer')
    )) {
      return 'spl-transfer';
    }

    if (accountKeys.some(key => !SYSTEM_PROGRAMS.has(key))) {
      return 'custom-program';
    }

    return 'other';
  }, []);

  const addEvent = useCallback((event: BlockchainEvent) => {
    eventQueue.enqueue(event);
    setEvents(eventQueue.getAll());
    eventCountRef.current = eventQueue.size();
  }, [eventQueue]);

  const processEventForAnomalies = useCallback(async (event: BlockchainEvent) => {
    try {
      if (Math.random() > 0.1) return;
      
      const response = await fetch('/api/anomaly', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'analyze',
          event
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Event analyzed for anomalies:', result);
      }
    } catch (error) {
      console.error('Failed to analyze event for anomalies:', error);
    }
  }, []);

  const disconnect = useCallback(() => {
    if (connectionRef.current) {
      connectionRef.current = null;
    }
    setIsConnected(false);
    setConnectionError(null);
    disconnectSSE();
    console.log('Disconnected from Solana monitoring');
  }, [disconnectSSE]);

  // Effects
  useEffect(() => {
    connectToSolana();
    return () => {
      disconnect();
    };
  }, [connectToSolana, disconnect]);

  useEffect(() => {
    if (!isConnected || !autoRefresh) return;
    
    const interval = setInterval(() => {
      fetchRealtimeEvents();
    }, refreshInterval);
    
    fetchRealtimeEvents();
    
    return () => {
      clearInterval(interval);
    };
  }, [isConnected, autoRefresh, refreshInterval, fetchRealtimeEvents]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (autoRefresh) {
      interval = setInterval(() => {
        fetchAnomalyStats();
      }, 60000);
    }
    
    fetchAnomalyStats();
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  // Apply filters with memoization
  const filteredEvents = useMemo(() => {
    const now = Date.now();
    let timeThreshold = 0;
    
    switch (filters.timeRange) {
      case '1h': timeThreshold = now - (60 * 60 * 1000); break;
      case '6h': timeThreshold = now - (6 * 60 * 60 * 1000); break;
      case '24h': timeThreshold = now - (24 * 60 * 60 * 1000); break;
      default: timeThreshold = 0;
    }
    
    return events.filter(event => {
      if (timeThreshold > 0 && event.timestamp < timeThreshold) return false;
      
      if (!filters.showTransactions && event.type === 'transaction') return false;
      if (!filters.showBlocks && event.type === 'block') return false;
      if (!filters.showAccountChanges && event.type === 'account_change') return false;
      
      if (event.type === 'transaction' && event.data) {
        if (filters.showSuccessOnly && event.data.err) return false;
        if (filters.showFailedOnly && !event.data.err) return false;
        
        if (event.data.fee) {
          if (event.data.fee < filters.minFee || event.data.fee > filters.maxFee) return false;
        }
        
        const isSystemProgram = event.data.accountKeys?.some((key: string) => 
          SYSTEM_PROGRAMS.has(key)
        );
        const isSPLTransfer = event.data.transactionType === 'spl-transfer';
        const isCustomProgram = event.data.transactionType === 'custom-program';
        
        if (!filters.showSystemPrograms && isSystemProgram) return false;
        if (!filters.showSPLTransfers && isSPLTransfer) return false;
        if (!filters.showCustomPrograms && isCustomProgram) return false;
        
        if (event.data.knownProgram) {
          const program = event.data.knownProgram as keyof EventFilters['showKnownPrograms'];
          if (!filters.showKnownPrograms[program]) return false;
        }
      }
      
      return true;
    });
  }, [events, filters]);

  // Event counts for UI
  const eventCounts = useMemo(() => {
    const counts = {
      transactions: 0,
      blocks: 0,
      accountChanges: 0,
      total: filteredEvents.length
    };
    
    filteredEvents.forEach(event => {
      switch (event.type) {
        case 'transaction': counts.transactions++; break;
        case 'block': counts.blocks++; break;
        case 'account_change': counts.accountChanges++; break;
      }
    });
    
    return counts;
  }, [filteredEvents]);

  const fetchAnomalyStats = useCallback(async () => {
    try {
      const statsResponse = await fetch('/api/anomaly?action=stats');
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        if (statsData.success) {
          setStats(statsData.data);
        }
      }
    } catch (error) {
      console.error('Failed to fetch anomaly stats:', error);
    }
  }, []);

  const getSeverityColor = useCallback((severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-black';
      case 'low': return 'bg-blue-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  }, []);

  const handleEventClick = useCallback((event: BlockchainEvent) => {
    if (event.type === 'transaction' && event.data?.signature) {
      const url = `/tx/${event.data.signature}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }, []);

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(!isFullscreen);
  }, [isFullscreen]);

  const clearEvents = useCallback(() => {
    eventQueue.clear();
    setEvents([]);
    eventCountRef.current = 0;
  }, [eventQueue]);

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 bg-background z-50 flex flex-col">
        {/* Fullscreen Header */}
        <div className="flex items-center justify-between p-4 border-b bg-card">
          <h1 className="text-2xl font-bold text-foreground">Real-Time Blockchain Monitoring</h1>
          <button
            onClick={toggleFullscreen}
            className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
          >
            Exit Fullscreen
          </button>
        </div>
        
        {/* Fullscreen Content */}
        <div className="flex-1 p-4 overflow-hidden">
          <VirtualEventTable 
            events={filteredEvents}
            onEventClick={handleEventClick}
            height={window.innerHeight - 150}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Compact Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Real-Time Blockchain Monitoring</h1>
          <p className="text-sm text-muted-foreground">
            Live Solana events with AI-driven anomaly detection
          </p>
        </div>
        <button
          onClick={toggleFullscreen}
          className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
        >
          Fullscreen
        </button>
      </div>

      {/* Compact Status Bar */}
      <Card className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm font-medium">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${sseConnected ? 'bg-blue-500' : 'bg-gray-500'}`} />
              <span className="text-xs text-muted-foreground">
                SSE {sseConnected ? 'On' : 'Off'}
              </span>
            </div>
            <div className="text-sm text-muted-foreground">
              Events: {eventCountRef.current}/{maxEvents}
            </div>
            <div className="text-sm text-muted-foreground">
              Filtered: {eventCounts.total}
            </div>
            <div className="text-sm text-muted-foreground">
              Alerts: {alerts.length}
            </div>
            {lastSlot && (
              <div className="text-sm text-muted-foreground">
                Slot: {lastSlot.toLocaleString()}
              </div>
            )}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={fetchRealtimeEvents}
              className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
              disabled={!isConnected}
            >
              Refresh
            </button>
            <button
              onClick={clearAlerts}
              className="px-3 py-1 text-sm bg-purple-500 text-white rounded hover:bg-purple-600"
            >
              Clear Alerts
            </button>
            <button
              onClick={clearEvents}
              className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Clear Events
            </button>
          </div>
        </div>
      </Card>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
        {/* Left Sidebar - Compact */}
        <div className="xl:col-span-1 space-y-4">
          <PumpStatistics events={filteredEvents} />
          <EventFilterControls 
            filters={filters}
            onFiltersChange={setFilters}
            eventCounts={eventCounts}
          />
        </div>

        {/* Main Content - Optimized */}
        <div className="xl:col-span-4 space-y-4">
          {/* Live Events Table */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Live Events</h3>
              <div className="text-sm text-muted-foreground">
                {filteredEvents.length} events • Virtual table
              </div>
            </div>
            <VirtualEventTable 
              events={filteredEvents}
              onEventClick={handleEventClick}
              height={600}
            />
          </Card>

          {/* Anomaly Alerts - Compact */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                Anomaly Alerts
                {sseConnected && <span className="text-xs text-green-600 ml-2">(Live)</span>}
              </h3>
              <div className="text-sm text-muted-foreground">
                {alerts.length} alerts
              </div>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {alerts.map((alert) => (
                <div key={alert.id} className="p-2 border rounded">
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-1 text-xs rounded ${getSeverityColor(alert.severity)}`}>
                      {alert.severity.toUpperCase()}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(alert.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="text-sm font-medium mt-1">
                    {alert.type.replace(/_/g, ' ').toUpperCase()}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {alert.description}
                  </div>
                </div>
              ))}
              {alerts.length === 0 && (
                <div className="text-center text-muted-foreground py-4">
                  No anomalies detected
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
});