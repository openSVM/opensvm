/**
 * Deduplication utilities for events and anomalies
 */

import { generateSecureUUID } from '@/lib/crypto-utils';

export interface DeduplicatedEvent {
  id: string;
  type: string;
  timestamp: number;
  signature?: string;
  data: any;
  metadata?: any;
  count: number; // Number of times this event occurred
  firstSeen: number;
  lastSeen: number;
}

export interface DeduplicatedAnomaly {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  timestamp: number;
  count: number; // Number of similar anomalies
  firstSeen: number;
  lastSeen: number;
  instances: string[]; // IDs of individual anomaly instances
  event?: {
    type: string;
    data: any;
  };
}

export interface AnomalyStack {
  type: string;
  count: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  firstSeen: number;
  lastSeen: number;
  description: string;
  anomalies: DeduplicatedAnomaly[];
  expanded: boolean;
}

/**
 * Generate a unique key for an event based on its signature or content
 */
export function generateEventKey(event: any): string {
  // For transactions, use signature if available
  if (event.type === 'transaction' && event.data?.signature) {
    return `tx_${event.data.signature}`;
  }
  
  // For blocks, use slot number
  if (event.type === 'block' && event.data?.slot) {
    return `block_${event.data.slot}`;
  }
  
  // For account changes, use account + slot
  if (event.type === 'account_change' && event.data?.account && event.data?.slot) {
    return `account_${event.data.account}_${event.data.slot}`;
  }
  
  // Fallback: hash critical data
  const criticalData = {
    type: event.type,
    timestamp: Math.floor(event.timestamp / 1000), // Round to seconds
    dataHash: JSON.stringify(event.data || {}).slice(0, 100) // First 100 chars
  };
  
  return `generic_${btoa(JSON.stringify(criticalData)).replace(/[^a-zA-Z0-9]/g, '').slice(0, 20)}`;
}

/**
 * Generate a unique key for an anomaly based on its type and critical data
 */
export function generateAnomalyKey(anomaly: any): string {
  const criticalData = {
    type: anomaly.type,
    severity: anomaly.severity,
    // Round timestamp to 5-minute intervals for grouping
    timeWindow: Math.floor(anomaly.timestamp / (5 * 60 * 1000))
  };
  
  return `anomaly_${anomaly.type}_${anomaly.severity}_${criticalData.timeWindow}`;
}

/**
 * Deduplicate events array
 */
export function deduplicateEvents(events: any[]): DeduplicatedEvent[] {
  const eventMap = new Map<string, DeduplicatedEvent>();
  
  for (const event of events) {
    const key = generateEventKey(event);
    
    if (eventMap.has(key)) {
      const existing = eventMap.get(key)!;
      existing.count++;
      existing.lastSeen = event.timestamp;
      
      // Update data if newer
      if (event.timestamp > existing.timestamp) {
        existing.data = event.data;
        existing.metadata = event.metadata;
        existing.timestamp = event.timestamp;
      }
    } else {
      eventMap.set(key, {
        id: event.id || generateSecureUUID(),
        type: event.type,
        timestamp: event.timestamp,
        signature: event.data?.signature,
        data: event.data,
        metadata: event.metadata,
        count: 1,
        firstSeen: event.timestamp,
        lastSeen: event.timestamp
      });
    }
  }
  
  return Array.from(eventMap.values()).sort((a, b) => b.timestamp - a.timestamp);
}

/**
 * Deduplicate anomalies array
 */
export function deduplicateAnomalies(anomalies: any[]): DeduplicatedAnomaly[] {
  const anomalyMap = new Map<string, DeduplicatedAnomaly>();
  
  for (const anomaly of anomalies) {
    const key = generateAnomalyKey(anomaly);
    
    if (anomalyMap.has(key)) {
      const existing = anomalyMap.get(key)!;
      existing.count++;
      existing.lastSeen = anomaly.timestamp;
      existing.instances.push(anomaly.id);
      
      // Update to highest severity
      const severityOrder = { low: 1, medium: 2, high: 3, critical: 4 };
      if (severityOrder[anomaly.severity] > severityOrder[existing.severity]) {
        existing.severity = anomaly.severity;
      }
      
      // Update data if newer
      if (anomaly.timestamp > existing.timestamp) {
        existing.description = anomaly.description;
        existing.event = anomaly.event;
        existing.timestamp = anomaly.timestamp;
      }
    } else {
      anomalyMap.set(key, {
        id: anomaly.id || generateSecureUUID(),
        type: anomaly.type,
        severity: anomaly.severity,
        description: anomaly.description,
        timestamp: anomaly.timestamp,
        count: 1,
        firstSeen: anomaly.timestamp,
        lastSeen: anomaly.timestamp,
        instances: [anomaly.id],
        event: anomaly.event
      });
    }
  }
  
  return Array.from(anomalyMap.values()).sort((a, b) => b.timestamp - a.timestamp);
}

/**
 * Stack anomalies by type
 */
export function stackAnomaliesByType(anomalies: DeduplicatedAnomaly[]): AnomalyStack[] {
  const stackMap = new Map<string, AnomalyStack>();
  
  for (const anomaly of anomalies) {
    if (stackMap.has(anomaly.type)) {
      const existing = stackMap.get(anomaly.type)!;
      existing.count += anomaly.count;
      existing.lastSeen = Math.max(existing.lastSeen, anomaly.lastSeen);
      existing.firstSeen = Math.min(existing.firstSeen, anomaly.firstSeen);
      existing.anomalies.push(anomaly);
      
      // Update to highest severity
      const severityOrder = { low: 1, medium: 2, high: 3, critical: 4 };
      if (severityOrder[anomaly.severity] > severityOrder[existing.severity]) {
        existing.severity = anomaly.severity;
      }
    } else {
      stackMap.set(anomaly.type, {
        type: anomaly.type,
        count: anomaly.count,
        severity: anomaly.severity,
        firstSeen: anomaly.firstSeen,
        lastSeen: anomaly.lastSeen,
        description: anomaly.description,
        anomalies: [anomaly],
        expanded: false
      });
    }
  }
  
  return Array.from(stackMap.values()).sort((a, b) => {
    // Sort by severity first, then by last seen
    const severityOrder = { low: 1, medium: 2, high: 3, critical: 4 };
    const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
    if (severityDiff !== 0) return severityDiff;
    
    return b.lastSeen - a.lastSeen;
  });
}

/**
 * Clean up old events and anomalies
 */
export function cleanupOldData<T extends { timestamp: number }>(
  items: T[],
  maxAge: number = 24 * 60 * 60 * 1000, // 24 hours
  maxCount: number = 1000
): T[] {
  const now = Date.now();
  const cutoff = now - maxAge;
  
  // Filter by age first
  const recent = items.filter(item => item.timestamp > cutoff);
  
  // Then limit by count
  return recent.slice(0, maxCount);
}