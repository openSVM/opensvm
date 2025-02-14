import { Connection, ConnectionConfig } from '@solana/web3.js';
import { getRpcEndpoints, getRpcHeaders } from './opensvm-rpc';
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
  private readonly minRequestInterval = 10; // Decreased from 25
  private readonly maxConcurrentRequests = 12; // Increased from 8
  private readonly maxRetries = 12; // Increased from 8
  private activeRequests = 0;

  constructor(endpoint: string, config?: ConnectionConfig) {
    super(endpoint, {
      ...config,
      commitment: 'confirmed',
      disableRetryOnRateLimit: false,
      confirmTransactionInitialTimeout: 60000, // Decreased from 180000
      wsEndpoint: null,
      fetch: async (url, options) => {
        const headers = getRpcHeaders(endpoint);
        const maxRetries = 12; // Increased from 8
        let lastError;

        for (let i = 0; i < maxRetries; i++) {
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

            const response = await fetch(url, {
              ...options,
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                ...headers,
                ...(options?.headers || {})
              },
              signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (response.ok) {
              return response;
            }

            lastError = new Error(`HTTP error! status: ${response.status}`);
          } catch (error) {
            lastError = error;
            if (error.name === 'AbortError') {
              console.warn('Request timed out, retrying...');
            }
          }

          // Exponential backoff with max delay of 2 seconds
          await new Promise(resolve => setTimeout(resolve, Math.min(1000 * Math.pow(1.1, i), 2000))); // Changed from 1.25 to 1.1
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
      const headers = getRpcHeaders(this.rpcEndpoint);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const response = await fetch(this.rpcEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...headers
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: request.method,
          params: request.args
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = new Error(`HTTP error! status: ${response.status}`);
        if (response.status === 429 || response.status === 403) {
          if (request.retryCount < this.maxRetries) {
            console.warn(`Request failed with ${response.status}, retrying (${request.retryCount + 1}/${this.maxRetries})...`);
            await new Promise(resolve => setTimeout(resolve, Math.min(1000 * Math.pow(1.1, request.retryCount), 2000))); // Changed from 1.25 to 1.1
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
        await new Promise(resolve => setTimeout(resolve, Math.min(1000 * Math.pow(1.1, request.retryCount), 2000))); // Changed from 1.25 to 1.1
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
  private readonly healthCheckInterval = 60000; // Decreased from 120000

  private constructor() {
    this.config = {
      commitment: 'confirmed',
      disableRetryOnRateLimit: false,
      confirmTransactionInitialTimeout: 60000, // Decreased from 180000
      wsEndpoint: null
    };

    this.isOpenSvmMode = true;
    this.initializeConnections();
  }

  private initializeConnections() {
    const endpoints = getRpcEndpoints();
    this.connections = endpoints
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
    if (endpoint === 'opensvm') {
      this.isOpenSvmMode = true;
      this.failedEndpoints.clear();
      this.initializeConnections();
      this.currentIndex = 0;
    } else {
      this.isOpenSvmMode = false;
      this.connections = [new ProxyConnection(endpoint, this.config)];
      this.currentIndex = 0;
      this.failedEndpoints.clear();
    }
  }

  private async testConnection(connection: ProxyConnection): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout for health checks
      const blockHeight = await connection.getBlockHeight();
      clearTimeout(timeoutId);
      return blockHeight > 0;
    } catch (error) {
      if (error instanceof RateLimitError) {
        console.warn(`Rate limit hit during health check for ${connection.rpcEndpoint}`);
        return true; // Don't fail just because of rate limit
      }
      if (error.name === 'AbortError') {
        console.warn(`Health check timed out for ${connection.rpcEndpoint}`);
        return false;
      }
      console.error(`Error testing connection:`, error);
      return false;
    }
  }

  private async findHealthyConnection(): Promise<ProxyConnection | null> {
    const startIndex = this.currentIndex;
    let attempts = 0;
    const endpoints = getRpcEndpoints();
    
    while (attempts < this.connections.length) {
      const connection = this.connections[this.currentIndex];
      const endpoint = endpoints[this.currentIndex];
      
      try {
        const isHealthy = await this.testConnection(connection);
        if (isHealthy) {
          return connection;
        }
        
        console.warn(`Endpoint ${endpoint} failed health check`);
        this.failedEndpoints.add(endpoint);
      } catch (error) {
        console.error(`Error testing connection ${endpoint}:`, error);
        this.failedEndpoints.add(endpoint);
      }
      
      this.currentIndex = (this.currentIndex + 1) % this.connections.length;
      attempts++;
    }
    
    if (this.failedEndpoints.size === endpoints.length) {
      console.warn('All endpoints failed, resetting failed endpoints list');
      this.failedEndpoints.clear();
      this.initializeConnections();
    }
    
    return null;
  }

  public async getConnection(): Promise<Connection> {
    const now = Date.now();
    if (now - this.lastHealthCheck > this.healthCheckInterval) {
      this.lastHealthCheck = now;
      const healthyConnection = await this.findHealthyConnection();
      if (healthyConnection) {
        return healthyConnection;
      }
    }

    if (this.isOpenSvmMode && this.connections.length > 1) {
      const connection = this.connections[this.currentIndex];
      try {
        await rateLimit(`rpc-${connection.rpcEndpoint}`, {
          limit: 100, // Increased from 80
          windowMs: 1000,
          maxRetries: 20, // Increased from 15
          initialRetryDelay: 50, // Decreased from 100
          maxRetryDelay: 500 // Decreased from 1000
        });
        
        this.currentIndex = (this.currentIndex + 1) % this.connections.length;
        return connection;
      } catch (error) {
        if (error instanceof RateLimitError) {
          console.warn(`Rate limit exceeded for ${connection.rpcEndpoint}, switching endpoints`);
          this.currentIndex = (this.currentIndex + 1) % this.connections.length;
          return this.getConnection();
        }
        throw error;
      }
    }
    
    const connection = this.connections[0];
    await rateLimit(`rpc-single-${connection.rpcEndpoint}`, {
      limit: 50, // Increased from 40
      windowMs: 1000,
      maxRetries: 20, // Increased from 15
      initialRetryDelay: 50, // Decreased from 100
      maxRetryDelay: 500 // Decreased from 1000
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

export async function getConnection(): Promise<Connection> {
  return ConnectionPool.getInstance().getConnection();
}

export function updateRpcEndpoint(endpoint: string): void {
  ConnectionPool.getInstance().updateEndpoint(endpoint);
}

export const connectionPool = ConnectionPool.getInstance();
