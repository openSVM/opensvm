/**
 * Server-Sent Events (SSE) implementation for push-based anomaly alerts
 * 
 * This reduces frontend polling load by pushing alerts directly to clients
 */

export class SSEManager {
  private static instance: SSEManager;
  private clients = new Map<string, { 
    response: Response; 
    writer: ReadableStreamDefaultController<Uint8Array>; 
    lastActivity: number 
  }>();
  private alertBuffer = new Map<string, any[]>(); // Buffer alerts for each client

  static getInstance(): SSEManager {
    if (!SSEManager.instance) {
      SSEManager.instance = new SSEManager();
    }
    return SSEManager.instance;
  }

  /**
   * Add a new SSE client
   */
  addClient(clientId: string): Response {
    let controller: ReadableStreamDefaultController<Uint8Array>;
    
    // Create SSE response stream
    const stream = new ReadableStream<Uint8Array>({
      start: (ctrl) => {
        controller = ctrl;
        
        // Send initial connection event
        this.sendEvent(controller, 'connected', { clientId, timestamp: Date.now() });
        
        // Store client with writer
        this.clients.set(clientId, {
          response: null as any, // Will be set later
          writer: controller,
          lastActivity: Date.now()
        });

        // Send buffered alerts if any
        const buffered = this.alertBuffer.get(clientId) || [];
        buffered.forEach(alert => this.sendEvent(controller, 'anomaly_alert', alert));
        this.alertBuffer.delete(clientId);
      },
      cancel: () => {
        this.removeClient(clientId);
      }
    });

    const response = new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
      }
    });

    // Update the stored client with the actual response
    const client = this.clients.get(clientId);
    if (client) {
      client.response = response;
    }

    return response;
  }

  /**
   * Remove SSE client
   */
  removeClient(clientId: string): void {
    const client = this.clients.get(clientId);
    if (client) {
      try {
        if (client.writer) {
          client.writer.close();
        }
      } catch (error) {
        console.error('Failed to close SSE client %s:', clientId, error);
      }
      this.clients.delete(clientId);
      this.alertBuffer.delete(clientId);
      console.log(`SSE client ${clientId} disconnected`);
    }
  }

  /**
   * Broadcast anomaly alert to all connected clients
   */
  broadcastAnomalyAlert(alert: any): void {
    const eventData = {
      ...alert,
      timestamp: Date.now()
    };

    let successCount = 0;
    let failureCount = 0;

    for (const [clientId, client] of this.clients.entries()) {
      try {
        this.sendEvent(client.writer, 'anomaly_alert', eventData);
        client.lastActivity = Date.now();
        successCount++;
      } catch (error) {
        console.error(`Failed to send alert to SSE client ${clientId}:`, error);
        
        // Buffer the alert for later delivery
        if (!this.alertBuffer.has(clientId)) {
          this.alertBuffer.set(clientId, []);
        }
        this.alertBuffer.get(clientId)!.push(eventData);
        
        // Remove failed client
        this.removeClient(clientId);
        failureCount++;
      }
    }

    if (failureCount > 0) {
      console.warn(`Alert broadcast: ${successCount} successful, ${failureCount} failed`);
    }
  }

  /**
   * Send system status updates
   */
  broadcastSystemStatus(status: any): void {
    const eventData = {
      ...status,
      timestamp: Date.now()
    };

    for (const [clientId, client] of this.clients.entries()) {
      try {
        this.sendEvent(client.writer, 'system_status', eventData);
        client.lastActivity = Date.now();
      } catch (error) {
        console.error(`Failed to send status to SSE client ${clientId}:`, error);
        this.removeClient(clientId);
      }
    }
  }

  /**
   * Send SSE event to client
   */
  private sendEvent(controller: ReadableStreamDefaultController<Uint8Array>, eventType: string, data: any): void {
    try {
      const eventString = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
      const encoded = new TextEncoder().encode(eventString);
      controller.enqueue(encoded);
    } catch (error) {
      console.error('Failed to send SSE event:', error);
    }
  }

  /**
   * Clean up inactive clients
   */
  cleanup(): void {
    const now = Date.now();
    const timeout = 30 * 60 * 1000; // 30 minutes

    for (const [clientId, client] of this.clients.entries()) {
      if (now - client.lastActivity > timeout) {
        console.log(`Removing inactive SSE client ${clientId}`);
        this.removeClient(clientId);
      }
    }

    // Clean up old buffered alerts
    for (const [clientId, alerts] of this.alertBuffer.entries()) {
      if (alerts.length > 100) { // Keep only latest 100 alerts
        this.alertBuffer.set(clientId, alerts.slice(-100));
      }
    }
  }

  /**
   * Get SSE statistics
   */
  getStats(): any {
    return {
      connectedClients: this.clients.size,
      bufferedAlerts: Object.fromEntries(
        Array.from(this.alertBuffer.entries()).map(([clientId, alerts]) => [clientId, alerts.length])
      ),
      lastActivity: Math.max(...Array.from(this.clients.values()).map(c => c.lastActivity))
    };
  }
}

// Global cleanup interval
let cleanupInterval: NodeJS.Timeout | null = null;

export function startSSECleanup(): void {
  if (!cleanupInterval) {
    cleanupInterval = setInterval(() => {
      SSEManager.getInstance().cleanup();
    }, 5 * 60 * 1000); // Clean up every 5 minutes
  }
}

export function stopSSECleanup(): void {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
  }
}