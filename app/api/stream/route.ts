import { NextRequest } from 'next/server';
import { getConnection } from '@/lib/solana-connection';
import { Connection, PublicKey } from '@solana/web3.js';
import { getStreamingAnomalyDetector } from '@/lib/streaming-anomaly-detector';

interface StreamClient {
  id: string;
  send: (data: any) => void;
  close: () => void;
  subscriptions: Set<string>;
}

interface BlockchainEvent {
  type: 'transaction' | 'block' | 'account_change';
  timestamp: number;
  data: any;
  metadata?: any;
}

class EventStreamManager {
  private static instance: EventStreamManager;
  private clients: Map<string, StreamClient> = new Map();
  private connection: Connection | null = null;
  private subscriptionIds: Map<string, number> = new Map();
  private isMonitoring = false;

  public static getInstance(): EventStreamManager {
    if (!EventStreamManager.instance) {
      EventStreamManager.instance = new EventStreamManager();
    }
    return EventStreamManager.instance;
  }

  public async addClient(client: StreamClient): Promise<void> {
    this.clients.set(client.id, client);
    console.log(`Client ${client.id} connected. Total clients: ${this.clients.size}`);
    
    if (!this.isMonitoring) {
      await this.startMonitoring();
    }
  }

  public removeClient(clientId: string): void {
    const client = this.clients.get(clientId);
    if (client) {
      client.subscriptions.clear();
      this.clients.delete(clientId);
      console.log(`Client ${clientId} disconnected. Total clients: ${this.clients.size}`);
      
      if (this.clients.size === 0) {
        this.stopMonitoring();
      }
    }
  }

  private async startMonitoring(): Promise<void> {
    if (this.isMonitoring) return;
    
    try {
      this.connection = await getConnection();
      this.isMonitoring = true;
      
      // Start the anomaly detector
      const anomalyDetector = getStreamingAnomalyDetector();
      if (!anomalyDetector.isRunning()) {
        await anomalyDetector.start();
      }
      
      // Subscribe to slot changes (new blocks)
      const slotSubscriptionId = this.connection.onSlotChange((slotInfo) => {
        const event = {
          type: 'block' as const,
          timestamp: Date.now(),
          data: {
            slot: slotInfo.slot,
            parent: slotInfo.parent,
            root: slotInfo.root
          }
        };
        this.broadcastEvent(event);
      });
      
      this.subscriptionIds.set('slots', slotSubscriptionId);
      
      // Subscribe to signature notifications for transaction monitoring
      this.setupTransactionMonitoring();
      
      console.log('Started blockchain event monitoring with anomaly detection');
    } catch (error) {
      console.error('Failed to start monitoring:', error);
      this.isMonitoring = false;
    }
  }

  private async setupTransactionMonitoring(): Promise<void> {
    if (!this.connection) return;
    
    try {
      // Monitor for new transactions by subscribing to logs
      const logsSubscriptionId = this.connection.onLogs(
        'all',
        (logs, context) => {
          if (logs.signature) {
            const event = {
              type: 'transaction' as const,
              timestamp: Date.now(),
              data: {
                signature: logs.signature,
                slot: context.slot,
                logs: logs.logs,
                err: logs.err
              }
            };
            this.broadcastEvent(event);
          }
        },
        'confirmed'
      );
      
      this.subscriptionIds.set('logs', logsSubscriptionId);
    } catch (error) {
      console.error('Failed to setup transaction monitoring:', error);
    }
  }

  private stopMonitoring(): void {
    if (!this.isMonitoring || !this.connection) return;
    
    // Remove all subscriptions
    for (const [type, subscriptionId] of this.subscriptionIds) {
      try {
        if (type === 'slots') {
          this.connection.removeSlotChangeListener(subscriptionId);
        } else if (type === 'logs') {
          this.connection.removeOnLogsListener(subscriptionId);
        }
      } catch (error) {
        console.error(`Failed to remove ${type} subscription:`, error);
      }
    }
    
    this.subscriptionIds.clear();
    this.isMonitoring = false;
    this.connection = null;
    
    console.log('Stopped blockchain event monitoring');
  }

  private broadcastEvent(event: BlockchainEvent): void {
    const eventData = JSON.stringify(event);
    let successCount = 0;
    let failureCount = 0;
    
    for (const [clientId, client] of this.clients) {
      try {
        // Check if client is subscribed to this event type
        if (client.subscriptions.has(event.type) || client.subscriptions.has('all')) {
          client.send(eventData);
          successCount++;
        }
      } catch (error) {
        console.error(`Failed to send event to client ${clientId}:`, error);
        failureCount++;
        // Remove failed clients
        this.removeClient(clientId);
      }
    }
    
    if (failureCount > 0) {
      console.warn(`Event broadcast: ${successCount} successful, ${failureCount} failed`);
    }
  }

  public subscribeToEvents(clientId: string, eventTypes: string[]): void {
    const client = this.clients.get(clientId);
    if (client) {
      eventTypes.forEach(type => client.subscriptions.add(type));
    }
  }

  public getStatus(): any {
    const anomalyDetector = getStreamingAnomalyDetector();
    return {
      isMonitoring: this.isMonitoring,
      clientCount: this.clients.size,
      subscriptions: Array.from(this.subscriptionIds.keys()),
      anomalyDetector: anomalyDetector.getStats()
    };
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const action = searchParams.get('action');
  
  // Handle status request
  if (action === 'status') {
    const manager = EventStreamManager.getInstance();
    return Response.json({
      success: true,
      data: manager.getStatus()
    });
  }
  
  const clientId = searchParams.get('clientId') || `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Check if this is a WebSocket upgrade request
  const upgrade = request.headers.get('upgrade');
  if (upgrade !== 'websocket') {
    return new Response('Expected WebSocket connection', { status: 400 });
  }

  // For development/testing, return a simple response
  // In production, this would handle the WebSocket upgrade
  return new Response(JSON.stringify({
    message: 'WebSocket endpoint ready',
    clientId,
    supportedEvents: ['transaction', 'block', 'account_change'],
    usage: 'Connect using WebSocket with clientId parameter'
  }), {
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

// For now, we'll also provide a simple polling endpoint
export async function POST(request: NextRequest) {
  try {
    const { action, clientId, eventTypes } = await request.json();
    const manager = EventStreamManager.getInstance();
    
    switch (action) {
      case 'subscribe':
        if (eventTypes && Array.isArray(eventTypes)) {
          manager.subscribeToEvents(clientId, eventTypes);
          return Response.json({ success: true, message: 'Subscribed to events' });
        }
        return Response.json({ error: 'Invalid event types' }, { status: 400 });
        
      case 'unsubscribe':
        manager.removeClient(clientId);
        return Response.json({ success: true, message: 'Unsubscribed from events' });
        
      case 'start_monitoring':
        // Mock client for testing
        const mockClient = {
          id: clientId || 'test_client',
          send: (data: any) => console.log('Mock send:', data),
          close: () => console.log('Mock close'),
          subscriptions: new Set(['transaction', 'block'])
        };
        
        await manager.addClient(mockClient);
        return Response.json({ success: true, message: 'Started monitoring' });
        
      default:
        return Response.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Stream API error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}