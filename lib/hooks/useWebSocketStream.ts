/**
 * React Hook for WebSocket-based blockchain event streaming
 * 
 * Provides real-time blockchain events via WebSocket connection
 * Replaces polling with push-based event streaming
 */

import { useState, useEffect, useRef, useCallback } from 'react';

export interface BlockchainEvent {
  type: 'transaction' | 'block' | 'account_change';
  timestamp: number;
  data: any;
  metadata?: any;
}

interface UseWebSocketStreamOptions {
  clientId?: string;
  autoConnect?: boolean;
  maxEvents?: number;
  eventTypes?: string[];
  onEvent?: (event: BlockchainEvent) => void;
  onError?: (error: Error) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

interface UseWebSocketStreamReturn {
  events: BlockchainEvent[];
  isConnected: boolean;
  error: string | null;
  connect: () => void;
  disconnect: () => void;
  clearEvents: () => void;
  connectionStatus: string;
}

export function useWebSocketStream(options: UseWebSocketStreamOptions = {}): UseWebSocketStreamReturn {
  const {
    clientId = `ws_client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    autoConnect = true,
    maxEvents = 10000,
    eventTypes = ['transaction', 'block'],
    onEvent,
    onError,
    onConnect,
    onDisconnect
  } = options;

  const [events, setEvents] = useState<BlockchainEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');

  const wsRef = useRef<WebSocket | null>(null);
  const authTokenRef = useRef<string | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const isMountedRef = useRef(true);

  // First authenticate with the streaming API
  const authenticate = useCallback(async (): Promise<string | null> => {
    try {
      const response = await fetch('/api/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'authenticate',
          clientId
        })
      });

      if (!response.ok) {
        throw new Error(`Authentication failed: ${response.status}`);
      }

      const data = await response.json();
      if (data.success && data.data.authToken) {
        authTokenRef.current = data.data.authToken;
        return data.data.authToken;
      }

      throw new Error('Authentication failed: No token received');
    } catch (error) {
      console.error('[WebSocket] Authentication error:', error);
      setError(error instanceof Error ? error.message : 'Authentication failed');
      return null;
    }
  }, [clientId]);

  // Subscribe to events via REST API
  const subscribeToEvents = useCallback(async (token: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'subscribe',
          clientId,
          eventTypes,
          authToken: token
        })
      });

      if (!response.ok) {
        throw new Error(`Subscription failed: ${response.status}`);
      }

      const data = await response.json();
      return data.success;
    } catch (error) {
      console.error('[WebSocket] Subscription error:', error);
      return false;
    }
  }, [clientId, eventTypes]);

  // Start monitoring (creates mock client for the streaming manager)
  const startMonitoring = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch('/api/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'start_monitoring',
          clientId
        })
      });

      if (!response.ok) {
        throw new Error(`Start monitoring failed: ${response.status}`);
      }

      const data = await response.json();
      if (data.success && data.data.authToken) {
        authTokenRef.current = data.data.authToken;
        return true;
      }

      return false;
    } catch (error) {
      console.error('[WebSocket] Start monitoring error:', error);
      return false;
    }
  }, [clientId]);

  // Create a mock WebSocket connection using Server-Sent Events
  // This bridges the gap until full WebSocket support is implemented
  const createMockWebSocket = useCallback(() => {
    if (!isMountedRef.current) return;

    try {
      setConnectionStatus('connecting');
      console.log(`[WebSocket] Creating mock WebSocket connection for ${clientId}`);

      // Use EventSource for receiving events (one-way from server)
      const eventSource = new EventSource(`/api/sse-alerts?clientId=${encodeURIComponent(clientId)}&action=connect`);
      
      // Mock WebSocket interface
      const mockWebSocket = {
        readyState: WebSocket.CONNECTING,
        url: `/api/stream?clientId=${clientId}`,
        onopen: null as ((event: Event) => void) | null,
        onmessage: null as ((event: MessageEvent) => void) | null,
        onerror: null as ((event: Event) => void) | null,
        onclose: null as ((event: CloseEvent) => void) | null,
        close: () => {
          try {
            eventSource.close();
            if (mockWebSocket.onclose) {
              mockWebSocket.onclose(new CloseEvent('close'));
            }
          } catch (error) {
            console.warn('[WebSocket] Error closing EventSource:', error);
          }
        },
        send: (data: string) => {
          // For now, just log what would be sent
          console.log('[WebSocket] Mock send:', data);
        }
      };

      eventSource.onopen = () => {
        console.log(`[WebSocket] Mock connection established for ${clientId}`);
        mockWebSocket.readyState = WebSocket.OPEN;
        if (isMountedRef.current) {
          setIsConnected(true);
          setError(null);
          setConnectionStatus('connected');
          onConnect?.();
        }
        reconnectAttempts.current = 0;
      };

      eventSource.onerror = (event) => {
        console.error('[WebSocket] Mock connection error:', event);
        mockWebSocket.readyState = WebSocket.CLOSED;
        if (isMountedRef.current) {
          setIsConnected(false);
          setConnectionStatus('error');
          
          const errorMsg = 'WebSocket connection failed';
          setError(errorMsg);
          onError?.(new Error(errorMsg));
        }

        // Attempt to reconnect
        if (reconnectAttempts.current < maxReconnectAttempts && isMountedRef.current) {
          const delay = Math.pow(2, reconnectAttempts.current) * 1000;
          console.log(`[WebSocket] Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current + 1}/${maxReconnectAttempts})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            if (isMountedRef.current) {
              reconnectAttempts.current++;
              connect();
            }
          }, delay);
        }
      };

      // Listen for blockchain events
      eventSource.addEventListener('blockchain_event', (event) => {
        try {
          const blockchainEvent: BlockchainEvent = JSON.parse(event.data);
          console.log('[WebSocket] Received blockchain event:', blockchainEvent);
          
          if (isMountedRef.current) {
            setEvents(prev => {
              const newEvents = [blockchainEvent, ...prev].slice(0, maxEvents);
              return newEvents;
            });
          }
          
          onEvent?.(blockchainEvent);
        } catch (parseError) {
          console.error('[WebSocket] Failed to parse blockchain event:', parseError);
        }
      });

      // Listen for transaction events specifically
      eventSource.addEventListener('transaction', (event) => {
        try {
          const transactionData = JSON.parse(event.data);
          const blockchainEvent: BlockchainEvent = {
            type: 'transaction',
            timestamp: Date.now(),
            data: transactionData
          };
          
          console.log('[WebSocket] Received transaction event:', blockchainEvent);
          
          if (isMountedRef.current) {
            setEvents(prev => {
              const newEvents = [blockchainEvent, ...prev].slice(0, maxEvents);
              return newEvents;
            });
          }
          
          onEvent?.(blockchainEvent);
        } catch (parseError) {
          console.error('[WebSocket] Failed to parse transaction event:', parseError);
        }
      });

      // Listen for block events
      eventSource.addEventListener('block', (event) => {
        try {
          const blockData = JSON.parse(event.data);
          const blockchainEvent: BlockchainEvent = {
            type: 'block',
            timestamp: Date.now(),
            data: blockData
          };
          
          console.log('[WebSocket] Received block event:', blockchainEvent);
          
          if (isMountedRef.current) {
            setEvents(prev => {
              const newEvents = [blockchainEvent, ...prev].slice(0, maxEvents);
              return newEvents;
            });
          }
          
          onEvent?.(blockchainEvent);
        } catch (parseError) {
          console.error('[WebSocket] Failed to parse block event:', parseError);
        }
      });

      // Store the mock WebSocket
      wsRef.current = mockWebSocket as any;

    } catch (connectError) {
      console.error('[WebSocket] Failed to create mock connection:', connectError);
      setError('Failed to create WebSocket connection');
      setConnectionStatus('error');
      onError?.(connectError as Error);
    }
  }, [clientId, maxEvents, onEvent, onError, onConnect]);

  const connect = useCallback(async () => {
    if (!isMountedRef.current) return;

    // Close existing connection
    if (wsRef.current) {
      try {
        wsRef.current.close();
      } catch (error) {
        console.warn('[WebSocket] Error closing existing connection:', error);
      }
    }

    setConnectionStatus('authenticating');
    
    // First start monitoring to create the server-side client
    console.log('[WebSocket] Starting monitoring...');
    const monitoringStarted = await startMonitoring();
    
    if (monitoringStarted) {
      // Create the mock WebSocket connection
      createMockWebSocket();
    } else {
      setError('Failed to start monitoring');
      setConnectionStatus('error');
    }
  }, [startMonitoring, createMockWebSocket]);

  const disconnect = useCallback(() => {
    console.log(`[WebSocket] Disconnecting client ${clientId}...`);
    
    // Clear reconnection timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    // Close WebSocket connection
    if (wsRef.current) {
      try {
        wsRef.current.close();
      } catch (error) {
        console.warn('[WebSocket] Error closing WebSocket:', error);
      }
      wsRef.current = null;
    }

    // Clear auth token
    authTokenRef.current = null;

    if (isMountedRef.current) {
      setIsConnected(false);
      setConnectionStatus('disconnected');
    }
    
    reconnectAttempts.current = 0;
    onDisconnect?.();
  }, [clientId, onDisconnect]);

  const clearEvents = useCallback(() => {
    if (isMountedRef.current) {
      setEvents([]);
    }
  }, []);

  // Auto-connect on mount if enabled
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      isMountedRef.current = false;
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  return {
    events,
    isConnected,
    error,
    connect,
    disconnect,
    clearEvents,
    connectionStatus
  };
}