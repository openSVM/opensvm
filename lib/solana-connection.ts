import { Connection, ConnectionConfig } from '@solana/web3.js';
import { opensvmRpcEndpoints } from './opensvm-rpc';

class ConnectionPool {
  private static instance: ConnectionPool;
  private connections: Connection[] = [];
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
      .map(url => new Connection(url, this.config));
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
      this.connections = [new Connection(endpoint, this.config)];
      this.currentIndex = 0;
      this.failedEndpoints.clear();
    }
  }

  private async testConnection(connection: Connection): Promise<boolean> {
    try {
      const blockHeight = await connection.getBlockHeight();
      return blockHeight > 0;
    } catch (error) {
      return false;
    }
  }

  private async findHealthyConnection(): Promise<Connection | null> {
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
      // Round-robin selection for OpenSVM mode
      const connection = this.connections[this.currentIndex];
      this.currentIndex = (this.currentIndex + 1) % this.connections.length;
      return connection;
    }
    
    // Return first connection for single endpoint mode or fallback
    return this.connections[0];
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
