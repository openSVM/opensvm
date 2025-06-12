import { NextRequest } from 'next/server';
import { getConnection } from '@/lib/solana-connection';
import { Connection, PublicKey } from '@solana/web3.js';
import { getStreamingAnomalyDetector } from '@/lib/streaming-anomaly-detector';
import { validateStreamRequest } from '@/lib/validation/stream-schemas';

// Input validation schemas
interface StreamRequestBody {
  action: string;
  clientId?: string;
  eventTypes?: string[];
  authToken?: string;
}

// Safe JSON parsing with validation
function parseAndValidateRequest(body: any): StreamRequestBody | null {
  try {
    if (!body || typeof body !== 'object') {
      return null;
    }
    
    const { action, clientId, eventTypes, authToken } = body;
    
    // Validate action
    if (!action || typeof action !== 'string') {
      return null;
    }
    
    // Validate clientId if provided
    if (clientId && typeof clientId !== 'string') {
      return null;
    }
    
    // Validate eventTypes if provided
    if (eventTypes && (!Array.isArray(eventTypes) || !eventTypes.every(type => typeof type === 'string'))) {
      return null;
    }
    
    // Validate authToken if provided
    if (authToken && typeof authToken !== 'string') {
      return null;
    }
    
    return { action, clientId, eventTypes, authToken };
  } catch (error) {
    console.error('Failed to parse request body:', error);
    return null;
  }
}

interface StreamClient {
  id: string;
  send: (data: any) => void;
  close: () => void;
  subscriptions: Set<string>;
  authenticated: boolean;
  connectionTime: number;
  lastActivity: number;
}

// Simple authentication and rate limiting
const CLIENT_AUTH_TOKENS = new Map<string, { token: string; clientId: string; createdAt: number }>();
const CLIENT_RATE_LIMITS = new Map<string, { count: number; windowStart: number }>();

function generateAuthToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

function validateAuthToken(clientId: string, token: string): boolean {
  const authData = CLIENT_AUTH_TOKENS.get(clientId);
  if (!authData) return false;
  
  // Token expires after 1 hour
  if (Date.now() - authData.createdAt > 3600000) {
    CLIENT_AUTH_TOKENS.delete(clientId);
    return false;
  }
  
  return authData.token === token;
}

function checkRateLimit(clientId: string): boolean {
  const now = Date.now();
  const windowSize = 60000; // 1 minute window
  const maxRequests = 100; // Max 100 requests per minute
  
  const rateLimitData = CLIENT_RATE_LIMITS.get(clientId) || { count: 0, windowStart: now };
  
  // Reset window if it's expired
  if (now - rateLimitData.windowStart > windowSize) {
    rateLimitData.count = 0;
    rateLimitData.windowStart = now;
  }
  
  rateLimitData.count++;
  CLIENT_RATE_LIMITS.set(clientId, rateLimitData);
  
  return rateLimitData.count <= maxRequests;
}

interface StreamClient {
  id: string;
  send: (data: any) => void;
  close: () => void;
  subscriptions: Set<string>;
  authenticated: boolean;
  connectionTime: number;
  lastActivity: number;
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

  public authenticateClient(clientId: string): string {
    const token = generateAuthToken();
    CLIENT_AUTH_TOKENS.set(clientId, {
      token,
      clientId,
      createdAt: Date.now()
    });
    
    const client = this.clients.get(clientId);
    if (client) {
      client.authenticated = true;
      client.lastActivity = Date.now();
    }
    
    return token;
  }

  public removeClient(clientId: string): void {
    const client = this.clients.get(clientId);
    if (client) {
      client.subscriptions.clear();
      this.clients.delete(clientId);
      CLIENT_AUTH_TOKENS.delete(clientId);
      CLIENT_RATE_LIMITS.delete(clientId);
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
      // System programs to filter out
      const SYSTEM_PROGRAMS = new Set([
        'Vote111111111111111111111111111111111111111', // Vote program
        '11111111111111111111111111111111', // System program  
        'ComputeBudget111111111111111111111111111111', // Compute budget program
        'AddressLookupTab1e1111111111111111111111111', // Address lookup table program
        'Config1111111111111111111111111111111111111', // Config program
        'Stake11111111111111111111111111111111111111', // Stake program
      ]);

      // Known programs to highlight
      const KNOWN_PROGRAMS = {
        raydium: ['675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8', '27haf8L6oxUeXrHrgEgsexjSY5hbVUWEmvv9Nyxg8vQv'],
        meteora: ['Eo7WjKq67rjJQSZxS6z3YkapzY3eMj6Xy8X5EQVn5UaB'],
        aldrin: ['AMM55ShdkoGRB5jVYPjWziwk8m5MpwyDgsMWHaMSQWH6'],
        pumpswap: ['6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P'],
      };

      // Monitor for new transactions by subscribing to logs
      const logsSubscriptionId = this.connection.onLogs(
        'all',
        async (logs, context) => {
          if (logs.signature) {
            try {
              // Fetch transaction details to get fee information and analyze programs
              const txDetails = await this.connection!.getTransaction(logs.signature, {
                commitment: 'confirmed',
                maxSupportedTransactionVersion: 0
              });

              // Filter out vote transactions and system program transactions
              if (txDetails?.transaction?.message) {
                const accountKeys = txDetails.transaction.message.accountKeys?.map(key => key.toString()) || [];
                
                // Check if this is a vote transaction or system program transaction
                const isSystemTransaction = accountKeys.some(key => SYSTEM_PROGRAMS.has(key));
                const isVoteTransaction = logs.logs?.some(log => log.includes('Vote111111111111111111111111111111111111111'));
                
                // Skip system transactions and vote transactions
                if (isSystemTransaction || isVoteTransaction) {
                  return;
                }

                // Check for SPL token transfers (include these)
                const isSplTransfer = logs.logs?.some(log => 
                  log.includes('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') ||
                  log.includes('Program log: Instruction: Transfer')
                );

                // Check for custom program calls (include these)
                const hasCustomProgram = accountKeys.some(key => 
                  !SYSTEM_PROGRAMS.has(key) && 
                  !key.startsWith('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')
                );

                // Only include transactions that are SPL transfers or custom program calls
                if (!isSplTransfer && !hasCustomProgram) {
                  return;
                }
              }
              
              const event = {
                type: 'transaction' as const,
                timestamp: Date.now(),
                data: {
                  signature: logs.signature,
                  slot: context.slot,
                  logs: logs.logs,
                  err: logs.err,
                  fee: txDetails?.meta?.fee || null,
                  preBalances: txDetails?.meta?.preBalances || [],
                  postBalances: txDetails?.meta?.postBalances || [],
                  accountKeys: txDetails?.transaction?.message?.accountKeys?.map(key => key.toString()) || [],
                  knownProgram: this.identifyKnownProgram(txDetails?.transaction?.message?.accountKeys?.map(key => key.toString()) || []),
                  transactionType: this.classifyTransaction(logs.logs || [], txDetails?.transaction?.message?.accountKeys?.map(key => key.toString()) || [])
                }
              };
              this.broadcastEvent(event);
            } catch (fetchError) {
              // If we can't fetch transaction details, skip this transaction
              console.warn(`Failed to fetch transaction details for ${logs.signature}:`, fetchError);
              return;
            }
          }
        },
        'confirmed'
      );
      
      this.subscriptionIds.set('logs', logsSubscriptionId);
    } catch (error) {
      console.error('Failed to setup transaction monitoring:', error);
    }
  }

  private identifyKnownProgram(accountKeys: string[]): string | null {
    const KNOWN_PROGRAMS = {
      raydium: ['675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8', '27haf8L6oxUeXrHrgEgsexjSY5hbVUWEmvv9Nyxg8vQv'],
      meteora: ['Eo7WjKq67rjJQSZxS6z3YkapzY3eMj6Xy8X5EQVn5UaB'],
      aldrin: ['AMM55ShdkoGRB5jVYPjWziwk8m5MpwyDgsMWHaMSQWH6'],
      pumpswap: ['6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P'],
    };

    for (const [programName, programIds] of Object.entries(KNOWN_PROGRAMS)) {
      if (programIds.some(id => accountKeys.includes(id))) {
        return programName;
      }
    }

    // Check for program names that contain known identifiers
    for (const key of accountKeys) {
      if (key.toLowerCase().includes('raydium')) return 'raydium';
      if (key.toLowerCase().includes('meteora')) return 'meteora';
      if (key.toLowerCase().includes('aldrin')) return 'aldrin';
      if (key.toLowerCase().includes('pump')) return 'pumpswap';
    }

    return null;
  }

  private classifyTransaction(logs: string[], accountKeys: string[]): string {
    // Check for SPL token transfer
    if (logs.some(log => 
      log.includes('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') ||
      log.includes('Program log: Instruction: Transfer')
    )) {
      return 'spl-transfer';
    }

    // Check for custom program calls
    const SYSTEM_PROGRAMS = new Set([
      'Vote111111111111111111111111111111111111111',
      '11111111111111111111111111111111',
      'ComputeBudget111111111111111111111111111111',
      'AddressLookupTab1e1111111111111111111111111',
      'Config1111111111111111111111111111111111111',
      'Stake11111111111111111111111111111111111111',
    ]);

    if (accountKeys.some(key => !SYSTEM_PROGRAMS.has(key))) {
      return 'custom-program';
    }

    return 'other';
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

  public subscribeToEvents(clientId: string, eventTypes: string[], authToken?: string): boolean {
    const client = this.clients.get(clientId);
    if (!client) {
      return false;
    }
    
    // Check authentication
    if (!client.authenticated || (authToken && !validateAuthToken(clientId, authToken))) {
      console.warn(`Unauthorized subscription attempt from client ${clientId}`);
      return false;
    }
    
    // Check rate limit
    if (!checkRateLimit(clientId)) {
      console.warn(`Rate limit exceeded for client ${clientId}`);
      return false;
    }
    
    client.lastActivity = Date.now();
    eventTypes.forEach(type => client.subscriptions.add(type));
    return true;
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
    // Safe JSON parsing
    let requestBody;
    try {
      requestBody = await request.json();
    } catch (jsonError) {
      console.error('Invalid JSON in request:', jsonError);
      return Response.json({ error: 'Invalid JSON format' }, { status: 400 });
    }
    
    // Validate request structure with Zod
    const validationResult = validateStreamRequest(requestBody);
    if (!validationResult.success) {
      return Response.json({ 
        error: 'Invalid request format', 
        details: validationResult.errors 
      }, { status: 400 });
    }
    
    const { action, clientId, eventTypes, authToken } = validationResult.data;
    const manager = EventStreamManager.getInstance();
    
    // Validate input
    if (!clientId && action !== 'status') {
      return Response.json({ error: 'Client ID is required' }, { status: 400 });
    }
    
    // Check rate limit first (skip for authentication requests)
    if (clientId && action !== 'authenticate' && !checkRateLimit(clientId)) {
      return Response.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }
    
    switch (action) {
      case 'authenticate':
        if (!clientId) {
          return Response.json({ error: 'Client ID is required for authentication' }, { status: 400 });
        }
        const token = manager.authenticateClient(clientId);
        return Response.json({ 
          success: true, 
          authToken: token,
          message: 'Client authenticated',
          expiresIn: 3600 // 1 hour
        });
        
      case 'subscribe':
        if (!eventTypes || !Array.isArray(eventTypes) || eventTypes.length === 0) {
          return Response.json({ error: 'Valid event types array is required' }, { status: 400 });
        }
        
        // Validate event types
        const validEventTypes = ['transaction', 'block', 'account_change', 'all'];
        const invalidTypes = eventTypes.filter(type => !validEventTypes.includes(type));
        if (invalidTypes.length > 0) {
          return Response.json({ 
            error: `Invalid event types: ${invalidTypes.join(', ')}. Valid types: ${validEventTypes.join(', ')}` 
          }, { status: 400 });
        }
        
        const success = manager.subscribeToEvents(clientId!, eventTypes, authToken);
        if (success) {
          return Response.json({ success: true, message: 'Subscribed to events' });
        } else {
          return Response.json({ error: 'Authentication required or failed' }, { status: 401 });
        }
        
      case 'unsubscribe':
        manager.removeClient(clientId!);
        return Response.json({ success: true, message: 'Unsubscribed from events' });
        
      case 'start_monitoring':
        // Create authenticated mock client for testing
        const mockClient = {
          id: clientId!,
          send: (data: any) => console.log('Mock send:', data),
          close: () => console.log('Mock close'),
          subscriptions: new Set(['transaction', 'block']),
          authenticated: false,
          connectionTime: Date.now(),
          lastActivity: Date.now()
        };
        
        await manager.addClient(mockClient);
        
        // Auto-authenticate for start_monitoring to maintain compatibility
        const autoToken = manager.authenticateClient(clientId!);
        
        return Response.json({ 
          success: true, 
          message: 'Started monitoring',
          authToken: autoToken
        });
        
      default:
        return Response.json({ 
          error: `Invalid action: ${action}. Valid actions: authenticate, subscribe, unsubscribe, start_monitoring` 
        }, { status: 400 });
    }
  } catch (error) {
    console.error('Stream API error:', error);
    return Response.json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}