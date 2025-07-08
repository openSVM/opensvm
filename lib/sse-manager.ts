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
   * Broadcast blockchain event to all connected clients
   */
  broadcastBlockchainEvent(event: any): void {
    const eventData = {
      ...event,
      timestamp: Date.now()
    };

    let successCount = 0;
    let failureCount = 0;

    for (const [clientId, client] of this.clients.entries()) {
      try {
        // Send as both generic blockchain_event and specific event type
        this.sendEvent(client.writer, 'blockchain_event', eventData);
        this.sendEvent(client.writer, event.type, eventData.data);
        client.lastActivity = Date.now();
        successCount++;
      } catch (error) {
        console.error(`Failed to send blockchain event to SSE client ${clientId}:`, error);
        this.removeClient(clientId);
        failureCount++;
      }
    }

    if (failureCount > 0) {
      console.warn(`Blockchain event broadcast: ${successCount} successful, ${failureCount} failed`);
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
   * Enhanced cleanup with better memory management
   */
  cleanup(): void {
    const now = Date.now();
    const clientTimeout = 30 * 60 * 1000; // 30 minutes
    const bufferTimeout = 10 * 60 * 1000; // 10 minutes for buffer
    const maxBufferSize = 50; // Reduced from 100
    
    let removedClients = 0;
    let cleanedBuffers = 0;

    // Clean up inactive clients
    for (const [clientId, client] of this.clients.entries()) {
      if (now - client.lastActivity > clientTimeout) {
        console.log(`Removing inactive SSE client ${clientId}`);
        this.removeClient(clientId);
        removedClients++;
      }
    }

    // Enhanced buffer cleanup with memory pressure detection
    const memoryPressure = this.detectMemoryPressure();
    const bufferSizeLimit = memoryPressure ? 25 : maxBufferSize;

    for (const [clientId, alerts] of this.alertBuffer.entries()) {
      const bufferAge = now - (alerts[0]?.timestamp || now);
      
      // Remove old buffers entirely
      if (bufferAge > bufferTimeout) {
        this.alertBuffer.delete(clientId);
        cleanedBuffers++;
        continue;
      }
      
      // Trim oversized buffers
      if (alerts.length > bufferSizeLimit) {
        this.alertBuffer.set(clientId, alerts.slice(-bufferSizeLimit));
        cleanedBuffers++;
      }
      
      // Remove buffers for clients that no longer exist
      if (!this.clients.has(clientId)) {
        this.alertBuffer.delete(clientId);
        cleanedBuffers++;
      }
    }

    // Log cleanup stats
    if (removedClients > 0 || cleanedBuffers > 0) {
      console.log(`SSE cleanup completed: ${removedClients} clients removed, ${cleanedBuffers} buffers cleaned`);
    }
    
    // Emergency cleanup if memory usage is still high
    if (memoryPressure && this.getTotalMemoryUsage() > 10 * 1024 * 1024) { // 10MB threshold
      this.emergencyCleanup();
    }
  }

  /**
   * Detect memory pressure from buffer sizes
   */
  private detectMemoryPressure(): boolean {
    const totalAlerts = Array.from(this.alertBuffer.values())
      .reduce((sum, alerts) => sum + alerts.length, 0);
    
    const avgAlertsPerClient = this.alertBuffer.size > 0 ? totalAlerts / this.alertBuffer.size : 0;
    
    // Memory pressure if we have too many alerts or large buffers
    return totalAlerts > 1000 || avgAlertsPerClient > 50 || this.alertBuffer.size > 20;
  }

  /**
   * Emergency cleanup when memory usage is high
   */
  private emergencyCleanup(): void {
    console.warn('Performing emergency SSE cleanup due to memory pressure');
    
    // Keep only the most recent alerts for each client
    for (const [clientId, alerts] of this.alertBuffer.entries()) {
      if (alerts.length > 10) {
        this.alertBuffer.set(clientId, alerts.slice(-10));
      }
    }
    
    // Remove clients that haven't been active in 10 minutes (instead of 30)
    const now = Date.now();
    const emergencyTimeout = 10 * 60 * 1000;
    
    for (const [clientId, client] of this.clients.entries()) {
      if (now - client.lastActivity > emergencyTimeout) {
        this.removeClient(clientId);
      }
    }
  }

  /**
   * Estimate total memory usage
   */
  private getTotalMemoryUsage(): number {
    let totalSize = 0;
    
    // Estimate buffer memory usage
    for (const alerts of this.alertBuffer.values()) {
      totalSize += alerts.length * 1024; // Rough estimate: 1KB per alert
    }
    
    // Estimate client connection memory
    totalSize += this.clients.size * 512; // Rough estimate: 512 bytes per client
    
    return totalSize;
  }

  /**
   * Get enhanced SSE statistics with memory info
   */
  getStats(): any {
    const memoryUsage = this.getTotalMemoryUsage();
    const memoryPressure = this.detectMemoryPressure();
    
    return {
      connectedClients: this.clients.size,
      bufferedAlerts: Object.fromEntries(
        Array.from(this.alertBuffer.entries()).map(([clientId, alerts]) => [clientId, alerts.length])
      ),
      totalBufferedAlerts: Array.from(this.alertBuffer.values()).reduce((sum, alerts) => sum + alerts.length, 0),
      estimatedMemoryUsage: Math.round(memoryUsage / 1024) + ' KB',
      memoryPressure,
      lastActivity: this.clients.size > 0 ? Math.max(...Array.from(this.clients.values()).map(c => c.lastActivity)) : 0,
      oldestBuffer: this.alertBuffer.size > 0 ? Math.min(...Array.from(this.alertBuffer.values()).map(alerts => alerts[0]?.timestamp || Date.now())) : null
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