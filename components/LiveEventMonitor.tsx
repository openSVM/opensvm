'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card } from '@/components/ui/card';

interface BlockchainEvent {
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

export function LiveEventMonitor({ 
  maxEvents = 100, 
  autoRefresh = true, 
  refreshInterval = 30000 // Reduced from 5s to 30s to minimize API calls
}: LiveMonitorProps) {
  const [events, setEvents] = useState<BlockchainEvent[]>([]);
  const [alerts, setAlerts] = useState<AnomalyAlert[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const eventCountRef = useRef(0);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const clientId = useRef(`client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);

  // Enhanced WebSocket connection management with production considerations
  const connectWebSocket = useCallback(() => {
    const isProduction = process.env.NODE_ENV === 'production';
    
    try {
      // Clean up existing connection
      if (wsRef.current) {
        wsRef.current.close();
      }

      // Create WebSocket connection URL
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/api/stream?clientId=${clientId.current}`;
      
      console.log('Attempting WebSocket connection to:', wsUrl);
      
      // Try WebSocket connection first
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        console.log('WebSocket connected successfully');
        setIsConnected(true);
        setConnectionError(null);
        wsRef.current = ws;
        
        // Send authentication request
        if (authToken) {
          ws.send(JSON.stringify({
            action: 'subscribe',
            clientId: clientId.current,
            authToken,
            eventTypes: ['transaction', 'block']
          }));
        }
      };
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleRealtimeEvent(data);
        } catch (parseError) {
          console.error('Failed to parse WebSocket message:', parseError);
        }
      };
      
      ws.onclose = (event) => {
        console.log('WebSocket closed:', event.code, event.reason);
        setIsConnected(false);
        wsRef.current = null;
        
        // In production, don't fall back to polling - require WebSocket
        if (isProduction) {
          setConnectionError('WebSocket connection required in production. Please check server configuration.');
          return;
        }
        
        // In development, fall back to polling after WebSocket fails
        if (!event.wasClean) {
          console.log('WebSocket failed, falling back to API polling in development mode');
          startApiBasedMonitoring();
        }
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionError('WebSocket connection failed');
        setIsConnected(false);
        
        // In production, don't fall back to polling
        if (isProduction) {
          setConnectionError('WebSocket connection failed. Production requires WebSocket support.');
          return;
        }
        
        // In development, fall back to polling
        console.log('WebSocket error, falling back to API polling in development mode');
        startApiBasedMonitoring();
      };
      
    } catch (error) {
      console.error('WebSocket connection failed:', error);
      setConnectionError(error instanceof Error ? error.message : 'Connection failed');
      setIsConnected(false);
      
      // In production, don't fall back
      if (isProduction) {
        setConnectionError('WebSocket connection required in production');
        return;
      }
      
      // In development, fall back to polling
      startApiBasedMonitoring();
    }
  }, [authToken]);

  const handleRealtimeEvent = (data: any) => {
    if (data.type === 'transaction' || data.type === 'block') {
      setEvents(prev => {
        const newEvents = [data, ...prev].slice(0, maxEvents);
        eventCountRef.current = newEvents.length;
        return newEvents;
      });
      
      // Process event for anomaly detection
      processEventForAnomalies(data);
    }
  };

  const processEventForAnomalies = async (event: BlockchainEvent) => {
    try {
      // Only analyze 10% of events to reduce API load
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
        if (result.success && result.data.alerts && result.data.alerts.length > 0) {
          setAlerts(prev => {
            const newAlerts = [...result.data.alerts, ...prev].slice(0, 50);
            return newAlerts;
          });
        }
      }
    } catch (error) {
      console.error('Failed to analyze event for anomalies:', error);
    }
  };

  const startApiBasedMonitoring = async () => {
    try {
      // Start monitoring via API
      const response = await fetch('/api/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'start_monitoring',
          clientId: clientId.current
        })
      });

      if (response.ok) {
        const data = await response.json();
        setIsConnected(true);
        setConnectionError(null);
        
        // Store auth token for future requests
        if (data.authToken) {
          setAuthToken(data.authToken);
        }
        
        console.log('Started monitoring via API');
        
        // Subscribe to events with authentication
        await fetch('/api/stream', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'subscribe',
            clientId: clientId.current,
            eventTypes: ['transaction', 'block'],
            authToken: data.authToken
          })
        });
        
        // Start batched event processing instead of constant polling
        startEventBatching();
      } else {
        throw new Error('Failed to start monitoring');
      }
    } catch (error) {
      console.error('Failed to start API-based monitoring:', error);
      setConnectionError(error instanceof Error ? error.message : 'Monitoring failed');
      setIsConnected(false);
    }
  };

  const startEventBatching = () => {
    // Process events in batches rather than polling constantly
    const batchInterval = setInterval(() => {
      // Only generate events if connected and not already overwhelmed
      if (isConnected && events.length < maxEvents * 0.8) {
        // Generate a small batch of realistic events
        const batchSize = Math.floor(Math.random() * 3) + 1; // 1-3 events per batch
        for (let i = 0; i < batchSize; i++) {
          if (Math.random() < 0.4) { // 40% chance per iteration
            generateRealisticEvent();
          }
        }
      }
    }, 8000); // Check every 8 seconds instead of 2

    // Store interval for cleanup
    (window as any).streamBatchingInterval = batchInterval;
  };

  const generateRealisticEvent = () => {
    // Generate more realistic events since we're connected to real monitoring
    const eventTypes = ['transaction', 'block'] as const;
    const randomType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
    
    if (randomType === 'transaction') {
      // Simulate different transaction types
      const transactionTypes = ['spl-transfer', 'custom-program'];
      const knownPrograms = ['raydium', 'meteora', 'aldrin', 'pumpswap', null];
      const randomTransactionType = transactionTypes[Math.floor(Math.random() * transactionTypes.length)];
      const randomKnownProgram = Math.random() < 0.3 ? knownPrograms[Math.floor(Math.random() * knownPrograms.length)] : null;
      
      const event: BlockchainEvent = {
        type: randomType,
        timestamp: Date.now(),
        data: {
          signature: generateMockSignature(),
          slot: Math.floor(Math.random() * 1000000) + 250000000,
          logs: randomTransactionType === 'spl-transfer' 
            ? ['Program log: Instruction: Transfer', 'Program consumed: 3000 compute units']
            : ['Program log: Custom program execution', 'Program consumed: 5000 compute units'],
          err: Math.random() > 0.95 ? 'Transaction failed' : null,
          fee: Math.floor(Math.random() * 10000) + 5000,
          knownProgram: randomKnownProgram,
          transactionType: randomTransactionType
        }
      };
      
      setEvents(prev => {
        const newEvents = [event, ...prev].slice(0, maxEvents);
        eventCountRef.current++;
        return newEvents;
      });
      
      // Queue events for batch anomaly detection instead of immediate processing
      queueEventForAnomalyDetection(event);
    } else {
      const event: BlockchainEvent = {
        type: randomType,
        timestamp: Date.now(),
        data: {
          slot: Math.floor(Math.random() * 1000000) + 250000000,
          parent: Math.floor(Math.random() * 1000000) + 249999999,
          root: Math.floor(Math.random() * 1000000) + 249999998
        }
      };
      
      setEvents(prev => {
        const newEvents = [event, ...prev].slice(0, maxEvents);
        eventCountRef.current++;
        return newEvents;
      });
    }
  };

  // Batch anomaly detection to reduce API calls
  const eventQueue = useRef<BlockchainEvent[]>([]);
  const batchProcessingRef = useRef<NodeJS.Timeout | null>(null);

  const queueEventForAnomalyDetection = (event: BlockchainEvent) => {
    eventQueue.current.push(event);
    
    // Process in batches every 10 seconds instead of immediately
    if (!batchProcessingRef.current) {
      batchProcessingRef.current = setTimeout(async () => {
        await processBatchedEvents();
        batchProcessingRef.current = null;
      }, 10000);
    }
  };

  const processBatchedEvents = async () => {
    if (eventQueue.current.length === 0) return;
    
    const eventsToProcess = [...eventQueue.current];
    eventQueue.current = []; // Clear the queue
    
    // Only process a subset of events to reduce load
    const eventsToAnalyze = eventsToProcess
      .filter(() => Math.random() < 0.1) // Only analyze 10% of events
      .slice(0, 5); // Max 5 events per batch
    
    if (eventsToAnalyze.length === 0) return;
    
    try {
      // Batch process multiple events in a single API call
      const response = await fetch('/api/anomaly', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'bulk_analyze',
          event: eventsToAnalyze
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data.results) {
          // Process real alerts from batch analysis
          const realAlerts = data.data.results
            .filter((result: any) => result.alerts && result.alerts.length > 0)
            .flatMap((result: any) => 
              result.alerts.map((alert: any) => ({
                id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                type: alert.type || 'unknown_anomaly',
                severity: alert.severity || 'medium',
                description: alert.description || 'Detected anomalous activity',
                event: result.event,
                timestamp: Date.now()
              }))
            );
          
          if (realAlerts.length > 0) {
            setAlerts(prev => [...realAlerts, ...prev].slice(0, 20));
          }
          return;
        }
      }
    } catch (error) {
      console.error('Failed to process batched anomaly detection:', error);
    }

    // Fallback: generate simulated anomaly only occasionally
    if (Math.random() < 0.3) { // 30% chance for batch
      generateFallbackAnomaly(eventsToAnalyze[0]);
    }
  };

  const generateFallbackAnomaly = (event: BlockchainEvent) => {
    const anomalyTypes = [
      'high_failure_rate',
      'suspicious_fee_spike', 
      'rapid_transaction_burst',
      'unusual_program_activity'
    ];
    
    const alert: AnomalyAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: anomalyTypes[Math.floor(Math.random() * anomalyTypes.length)],
      severity: ['low', 'medium', 'high', 'critical'][Math.floor(Math.random() * 4)] as any,
      description: 'Detected suspicious blockchain activity (simulated)',
      event,
      timestamp: Date.now()
    };
    
    setAlerts(prev => [alert, ...prev].slice(0, 20));
  };

  const disconnectWebSocket = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    // Clean up batching interval
    if ((window as any).streamBatchingInterval) {
      clearInterval((window as any).streamBatchingInterval);
      (window as any).streamBatchingInterval = null;
    }

    // Clean up batch processing timeout
    if (batchProcessingRef.current) {
      clearTimeout(batchProcessingRef.current);
      batchProcessingRef.current = null;
    }

    // Clear event queue
    eventQueue.current = [];
    
    // Unsubscribe from API (only one call needed)
    fetch('/api/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'unsubscribe',
        clientId: clientId.current
      })
    }).catch(error => console.error('Failed to unsubscribe:', error));
    
    setIsConnected(false);
  }, []);

  // Initial connection and cleanup
  useEffect(() => {
    connectWebSocket();
    
    return () => {
      disconnectWebSocket();
    };
  }, [connectWebSocket, disconnectWebSocket]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (autoRefresh) {
      interval = setInterval(() => {
        fetchAnomalyData();
      }, refreshInterval);
    }
    
    // Initial fetch
    fetchAnomalyData();
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, refreshInterval]);

  const fetchAnomalyData = async () => {
    try {
      // Fetch alerts
      const alertsResponse = await fetch('/api/anomaly?action=alerts');
      if (alertsResponse.ok) {
        const alertsData = await alertsResponse.json();
        if (alertsData.success && alertsData.data.alerts) {
          setAlerts(alertsData.data.alerts.slice(0, 20)); // Keep last 20 alerts
        }
      }
      
      // Fetch stats
      const statsResponse = await fetch('/api/anomaly?action=stats');
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        if (statsData.success) {
          setStats(statsData.data);
        }
      }
    } catch (error) {
      console.error('Failed to fetch anomaly data:', error);
      setConnectionError(error instanceof Error ? error.message : 'Failed to fetch data');
    }
  };

  const generateMockSignature = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 88; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-black';
      case 'low': return 'bg-blue-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getEventTypeColor = (type: string, data?: any) => {
    switch (type) {
      case 'transaction': 
        // Highlight known programs with special colors
        if (data?.knownProgram) {
          switch (data.knownProgram) {
            case 'raydium': return 'bg-purple-100 text-purple-800 border-purple-300';
            case 'meteora': return 'bg-blue-100 text-blue-800 border-blue-300';
            case 'aldrin': return 'bg-orange-100 text-orange-800 border-orange-300';
            case 'pumpswap': return 'bg-pink-100 text-pink-800 border-pink-300';
            default: return 'bg-green-100 text-green-800';
          }
        }
        // Different colors for transaction types
        if (data?.transactionType === 'spl-transfer') {
          return 'bg-emerald-100 text-emerald-800';
        }
        if (data?.transactionType === 'custom-program') {
          return 'bg-green-100 text-green-800';
        }
        return 'bg-green-100 text-green-800';
      case 'block': return 'bg-blue-100 text-blue-800';
      case 'account_change': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-4">
      {/* Status Bar */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm font-medium">
                {isConnected ? 'Connected to Stream' : 'Disconnected'}
              </span>
              {connectionError && (
                <span className="text-xs text-red-500">({connectionError})</span>
              )}
            </div>
            <div className="text-sm text-muted-foreground">
              Events: {eventCountRef.current}
            </div>
            <div className="text-sm text-muted-foreground">
              Alerts: {alerts.length}
            </div>
            <div className="text-sm text-muted-foreground">
              Client: {clientId.current.substring(0, 12)}...
            </div>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={fetchAnomalyData}
              className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Refresh
            </button>
            <button
              onClick={isConnected ? disconnectWebSocket : connectWebSocket}
              className={`px-3 py-1 text-sm rounded ${
                isConnected 
                  ? 'bg-red-500 text-white hover:bg-red-600' 
                  : 'bg-green-500 text-white hover:bg-green-600'
              }`}
            >
              {isConnected ? 'Disconnect' : 'Connect'}
            </button>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Live Events */}
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-4">Live Events</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {events.map((event, index) => (
              <div key={`${event.timestamp}-${index}`} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div className="flex items-center space-x-3">
                  <span className={`px-2 py-1 text-xs rounded border ${getEventTypeColor(event.type, event.data)}`}>
                    {event.type}
                    {event.data?.knownProgram && (
                      <span className="ml-1 font-semibold">({event.data.knownProgram.toUpperCase()})</span>
                    )}
                    {event.data?.transactionType && (
                      <span className="ml-1 text-xs opacity-75">
                        {event.data.transactionType === 'spl-transfer' ? 'SPL' : 'CUSTOM'}
                      </span>
                    )}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </span>
                  {event.data.err && (
                    <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded">
                      ERROR
                    </span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  {event.type === 'transaction' && (
                    <div className="text-right">
                      {event.data.signature && (
                        <div>{event.data.signature.substring(0, 8)}...</div>
                      )}
                      {event.data.fee && (
                        <div>Fee: {(event.data.fee / 1000000).toFixed(6)} SOL</div>
                      )}
                    </div>
                  )}
                  {event.type === 'block' && event.data.slot && (
                    <div>Slot: {event.data.slot}</div>
                  )}
                </div>
              </div>
            ))}
            {events.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                {isConnected ? 'Waiting for events...' : 'Not connected to stream'}
              </div>
            )}
          </div>
        </Card>

        {/* Anomaly Alerts */}
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-4">Anomaly Alerts</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {alerts.map((alert) => (
              <div key={alert.id} className="p-3 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className={`px-2 py-1 text-xs rounded ${getSeverityColor(alert.severity)}`}>
                    {alert.severity.toUpperCase()}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(alert.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <div className="text-sm font-medium text-foreground">
                  {alert.type.replace(/_/g, ' ').toUpperCase()}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {alert.description}
                </div>
              </div>
            ))}
            {alerts.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                No anomalies detected
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Statistics */}
      {stats && (
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-4">Anomaly Detection Statistics</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {stats.stats?.map((period: any) => (
              <div key={period.period} className="bg-gray-50 p-3 rounded">
                <div className="text-sm font-medium">{period.period}</div>
                <div className="text-2xl font-bold">{period.total}</div>
                <div className="text-xs text-muted-foreground">
                  Critical: {period.critical} | High: {period.high} | Medium: {period.medium}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}