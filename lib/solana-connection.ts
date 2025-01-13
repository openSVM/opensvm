import { Connection, ConnectionConfig } from '@solana/web3.js';
import { opensvmRpcEndpoints } from './opensvm-rpc';

class ConnectionPool {
  private static instance: ConnectionPool;
  private connections: Connection[] = [];
  private currentIndex = 0;
  private config: ConnectionConfig;
  private isOpenSvmMode = false;

  private constructor() {
    this.config = {
      commitment: 'confirmed',
      disableRetryOnRateLimit: false,
      confirmTransactionInitialTimeout: 60000
    };

    // Initialize with OpenSVM endpoints by default
    this.isOpenSvmMode = true;
    this.connections = opensvmRpcEndpoints.map(url => new Connection(url, this.config));
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
      this.connections = opensvmRpcEndpoints.map(url => new Connection(url, this.config));
      this.currentIndex = 0;
      console.log('Initialized OpenSVM connection pool with', this.connections.length, 'endpoints');
    } else {
      // Regular single endpoint mode
      this.isOpenSvmMode = false;
      this.connections = [new Connection(endpoint, this.config)];
      this.currentIndex = 0;
    }
  }

  public getConnection(): Connection {
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
      const connection = this.getConnection();
      const blockHeight = await connection.getBlockHeight();
      return blockHeight > 0;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }
}

// Export a function to get a connection
export function getConnection(): Connection {
  return ConnectionPool.getInstance().getConnection();
}

// Export a function to update the RPC endpoint
export function updateRpcEndpoint(endpoint: string): void {
  ConnectionPool.getInstance().updateEndpoint(endpoint);
}

// Export the pool instance for direct access if needed
export const connectionPool = ConnectionPool.getInstance();
