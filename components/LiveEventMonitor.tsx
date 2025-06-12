'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  refreshInterval = 5000 
}: LiveMonitorProps) {
  const [events, setEvents] = useState<BlockchainEvent[]>([]);
  const [alerts, setAlerts] = useState<AnomalyAlert[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const eventCountRef = useRef(0);

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
      
      setIsConnected(true);
    } catch (error) {
      console.error('Failed to fetch anomaly data:', error);
      setIsConnected(false);
    }
  };

  // Simulate real-time events for demo purposes
  useEffect(() => {
    const simulateEvent = () => {
      const eventTypes = ['transaction', 'block'] as const;
      const randomType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
      
      const event: BlockchainEvent = {
        type: randomType,
        timestamp: Date.now(),
        data: {
          signature: randomType === 'transaction' ? generateMockSignature() : undefined,
          slot: randomType === 'block' ? Math.floor(Math.random() * 1000000) + 250000000 : undefined,
          fee: randomType === 'transaction' ? Math.floor(Math.random() * 10000) + 5000 : undefined,
          success: Math.random() > 0.1 // 90% success rate
        }
      };
      
      setEvents(prev => {
        const newEvents = [event, ...prev].slice(0, maxEvents);
        eventCountRef.current++;
        return newEvents;
      });
      
      // Simulate anomaly detection
      if (Math.random() < 0.05) { // 5% chance of anomaly
        simulateAnomaly(event);
      }
    };
    
    const interval = setInterval(simulateEvent, 2000 + Math.random() * 3000); // Random interval 2-5s
    
    return () => clearInterval(interval);
  }, [maxEvents]);

  const simulateAnomaly = (event: BlockchainEvent) => {
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
      description: 'Detected suspicious blockchain activity',
      event,
      timestamp: Date.now()
    };
    
    setAlerts(prev => [alert, ...prev].slice(0, 20));
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

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'transaction': return 'bg-green-100 text-green-800';
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
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            <div className="text-sm text-muted-foreground">
              Events: {eventCountRef.current}
            </div>
            <div className="text-sm text-muted-foreground">
              Alerts: {alerts.length}
            </div>
          </div>
          <button
            onClick={fetchAnomalyData}
            className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Refresh
          </button>
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
                  <span className={`px-2 py-1 text-xs rounded ${getEventTypeColor(event.type)}`}>
                    {event.type}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {event.type === 'transaction' && event.data.signature && 
                    `${event.data.signature.substring(0, 8)}...`
                  }
                  {event.type === 'block' && event.data.slot && 
                    `Slot: ${event.data.slot}`
                  }
                </div>
              </div>
            ))}
            {events.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                No events yet...
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