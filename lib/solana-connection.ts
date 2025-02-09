import { Connection, ConnectionConfig } from '@solana/web3.js';
import { opensvmRpcEndpoints } from './opensvm-rpc';
import { rateLimit, RateLimitError } from './rate-limit';

class ProxyConnection extends Connection {
  private requestQueue: Array<{
    resolve: (value: any) => void;
    reject: (error: any) => void;
    method: string;
    args: any[];
    retryCount: number;
  }> = [];
  private isProcessingQueue = false;
  private lastRequestTime = 0;
  private readonly minRequestInterval = 100; // Reduced interval for better concurrency
  private readonly maxConcurrentRequests = 3; // Allow multiple concurrent requests
  private readonly maxRetries = 3;
  private activeRequests = 0;

  constructor(endpoint: string, config?: ConnectionConfig) {
    super(endpoint, {
      ...config,
      // Add bigint configuration
      commitment: 'confirmed',
      disableRetryOnRateLimit: false,
      confirmTransactionInitialTimeout: 60000,
      wsEndpoint: null, // Disable WebSocket for better stability
      fetch: async (url, options) => {
        const maxRetries = 3;
        let lastError;

        for (let i = 0; i < maxRetries; i++) {
          try {
            const response = await fetch(url, {
              ...options,
              headers: {
                ...options?.headers,
                'Origin': 'https://explorer.solana.com',
                'User-Agent': 'Mozilla/5.0',
                'Accept': '*/*',
                'Accept-Encoding': 'gzip, deflate, br',
                'Connection': 'keep-alive',
                'Referer': 'https://explorer.solana.com/'
              }
            });

            if (response.ok) {
              return response;
            }

            lastError = new Error(`HTTP error! status: ${response.status}`);
          } catch (error) {
            lastError = error;
          }

          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, Math.min(1000 * Math.pow(2, i), 4000)));
        }

        throw lastError;
      }
    });
  }

  private async processQueue() {
    if (this.isProcessingQueue) return;
    this.isProcessingQueue = true;

    while (this.requestQueue.length > 0 && this.activeRequests < this.maxConcurrentRequests) {
      const request = this.requestQueue.shift();
      if (!request) continue;

      this.activeRequests++;
      this.processRequest(request).finally(() => {
        this.activeRequests--;
        if (this.requestQueue.length > 0) {
          this.processQueue();
        }
      });
    }

    this.isProcessingQueue = this.activeRequests > 0;
  }

  private async processRequest(request: {
    resolve: (value: any) => void;
    reject: (error: any) => void;
    method: string;
    args: any[];
    retryCount: number;
  }) {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < this.minRequestInterval) {
      await new Promise(resolve => setTimeout(resolve, this.minRequestInterval - timeSinceLastRequest));
    }

    try {
      const response = await fetch('/api/solana-rpc', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: request.method,
          params: request.args
        })
      });

      if (!response.ok) {
        const error = new Error(`HTTP error! status: ${response.status}`);
        if (response.status === 429 || response.status === 403) {
          if (request.retryCount < this.maxRetries) {
            console.warn(`Request failed with ${response.status}, retrying (${request.retryCount + 1}/${this.maxRetries})...`);
            await new Promise(resolve => setTimeout(resolve, Math.min(1000 * Math.pow(2, request.retryCount), 8000)));
            this.requestQueue.push({ ...request, retryCount: request.retryCount + 1 });
            return;
          }
        }
        throw error;
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error.message);
      }

      request.resolve(data.result);
    } catch (error) {
      if (error instanceof Error && request.retryCount < this.maxRetries) {
        console.warn(`Request failed, retrying (${request.retryCount + 1}/${this.maxRetries})...`, error);
        await new Promise(resolve => setTimeout(resolve, Math.min(1000 * Math.pow(2, request.retryCount), 8000)));
        this.requestQueue.push({ ...request, retryCount: request.retryCount + 1 });
        return;
      }
      request.reject(error);
    }

    this.lastRequestTime = Date.now();
  }

  async _rpcRequest(method: string, args: any[]): Promise<any> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push({ resolve, reject, method, args, retryCount: 0 });
      this.processQueue();
    });
  }
}

class ConnectionPool {
  private static instance: ConnectionPool;
  private connections: ProxyConnection[] = [];
  private currentIndex = 0;
  private config: ConnectionConfig;
  private isOpenSvmMode = false;
  private failedEndpoints: Set<string> = new Set();
  private lastHealthCheck: number = 0;
  private readonly healthCheckInterval = 30000; // 30 seconds

  private constructor() {
    this.config = {
      commitment: 'confirmed',
      disableRetryOnRateLimit: false,
      confirmTransactionInitialTimeout: 60000,
      wsEndpoint: null // Disable WebSocket for better stability
    };

    // Initialize with OpenSVM endpoints by default
    this.isOpenSvmMode = true;
    this.initializeConnections();
  }

  private initializeConnections() {
    this.connections = opensvmRpcEndpoints
      .filter(url => !this.failedEndpoints.has(url))
      .map(url => new ProxyConnection(url, this.config));
    console.log('Initialized OpenSVM connection pool with', this.connections.length, 'endpoints');
  }

  public static getInstance(): ConnectionPool {
    if (!ConnectionPool.instance) {
      ConnectionPool.instance = new ConnectionPool();
    }
    return ConnectionPool.instance;
  }

  public updateEndpoint(endpoint: string): void {
    // If it's a special "opensvm" endpoint, initialize all OpenSVM connections
    if (endpoint === 'opensvm') {
      this.isOpenSvmMode = true;
      this.failedEndpoints.clear(); // Reset failed endpoints
      this.initializeConnections();
      this.currentIndex = 0;
    } else {
      // Regular single endpoint mode
      this.isOpenSvmMode = false;
      this.connections = [new ProxyConnection(endpoint, this.config)];
      this.currentIndex = 0;
      this.failedEndpoints.clear();
    }
  }

  private async testConnection(connection: ProxyConnection): Promise<boolean> {
    try {
      const blockHeight = await connection.getBlockHeight();
      return blockHeight > 0;
    } catch (error) {
      if (error instanceof RateLimitError) {
        console.warn(`Rate limit hit during health check for ${connection.rpcEndpoint}`);
        return false;
      }
      console.error(`Error testing connection:`, error);
      return false;
    }
  }

  private async findHealthyConnection(): Promise<ProxyConnection | null> {
    const startIndex = this.currentIndex;
    let attempts = 0;
    
    while (attempts < this.connections.length) {
      const connection = this.connections[this.currentIndex];
      const endpoint = opensvmRpcEndpoints[this.currentIndex];
      
      try {
        const isHealthy = await this.testConnection(connection);
        if (isHealthy) {
          return connection;
        }
        
        // Mark endpoint as failed
        console.warn(`Endpoint ${endpoint} failed health check`);
        this.failedEndpoints.add(endpoint);
      } catch (error) {
        console.error(`Error testing connection ${endpoint}:`, error);
        this.failedEndpoints.add(endpoint);
      }
      
      // Move to next connection
      this.currentIndex = (this.currentIndex + 1) % this.connections.length;
      attempts++;
    }
    
    // If all connections failed, reset and try again
    if (this.failedEndpoints.size === opensvmRpcEndpoints.length) {
      console.warn('All endpoints failed, resetting failed endpoints list');
      this.failedEndpoints.clear();
      this.initializeConnections();
    }
    
    return null;
  }

  public async getConnection(): Promise<Connection> {
    // Perform health check if needed
    const now = Date.now();
    if (now - this.lastHealthCheck > this.healthCheckInterval) {
      this.lastHealthCheck = now;
      const healthyConnection = await this.findHealthyConnection();
      if (healthyConnection) {
        return healthyConnection;
      }
    }

    if (this.isOpenSvmMode && this.connections.length > 1) {
      // Apply rate limiting with reasonable limits for RPC requests
      const connection = this.connections[this.currentIndex];
      try {
        await rateLimit(`rpc-${connection.rpcEndpoint}`, {
          limit: 20,    // Increased limit for better concurrency
          windowMs: 1000, // per second
          maxRetries: 5,
          initialRetryDelay: 500,
          maxRetryDelay: 5000
        });
        
        // Round-robin selection for OpenSVM mode
        this.currentIndex = (this.currentIndex + 1) % this.connections.length;
        return connection;
      } catch (error) {
        if (error instanceof RateLimitError) {
          console.warn(`Rate limit exceeded for ${connection.rpcEndpoint}, switching endpoints`);
          // Move to next connection immediately when rate limited
          this.currentIndex = (this.currentIndex + 1) % this.connections.length;
          return this.getConnection(); // Retry with next connection
        }
        throw error;
      }
    }
    
    // For single endpoint mode, apply more conservative rate limits
    const connection = this.connections[0];
    await rateLimit(`rpc-single-${connection.rpcEndpoint}`, {
      limit: 10,     // Increased limit for better concurrency
      windowMs: 1000, // per second
      maxRetries: 5,
      initialRetryDelay: 500,
      maxRetryDelay: 5000
    });
    
    return connection;
  }

  public async healthCheck(): Promise<boolean> {
    try {
      const connection = await this.getConnection();
      const blockHeight = await connection.getBlockHeight();
      return blockHeight > 0;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }
}

// Export a function to get a connection
export async function getConnection(): Promise<Connection> {
  return ConnectionPool.getInstance().getConnection();
}

// Export a function to update the RPC endpoint
export function updateRpcEndpoint(endpoint: string): void {
  ConnectionPool.getInstance().updateEndpoint(endpoint);
}

// Export the pool instance for direct access if needed
export const connectionPool = ConnectionPool.getInstance();
