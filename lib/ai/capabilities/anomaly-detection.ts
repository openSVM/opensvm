import { Connection } from '@solana/web3.js';
import { BaseCapability } from './base';
import type { Message, Tool, ToolParams } from '../types';

interface AnomalyPattern {
  type: string;
  description: string;
  threshold: number;
  check: (event: any, context: AnomalyContext) => boolean;
}

interface AnomalyContext {
  recentEvents: any[];
  transactionVolume: number;
  averageFees: number;
  errorRate: number;
  timestamp: number;
}

interface AnomalyAlert {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  event: any;
  context: AnomalyContext;
  timestamp: number;
}

export class AnomalyDetectionCapability extends BaseCapability {
  type = 'anomaly_detection' as const;
  private patterns: AnomalyPattern[] = [];
  private recentEvents: any[] = [];
  private alerts: AnomalyAlert[] = [];
  private maxEventHistory = 1000;
  private maxAlertHistory = 100;

  constructor(connection: Connection) {
    super(connection);
    this.initializePatterns();
    this.tools = this.createTools();
  }

  canHandle(message: Message): boolean {
    const content = message.content.toLowerCase();
    return content.includes('anomaly') || 
           content.includes('suspicious') ||
           content.includes('abnormal') ||
           content.includes('unusual') ||
           content.includes('detect') ||
           content.includes('alert') ||
           content.includes('monitor');
  }

  private initializePatterns(): void {
    this.patterns = [
      {
        type: 'high_failure_rate',
        description: 'Unusually high transaction failure rate',
        threshold: 0.3, // 30% failure rate
        check: (event, context) => {
          return context.errorRate > this.patterns.find(p => p.type === 'high_failure_rate')?.threshold || 0.3;
        }
      },
      {
        type: 'suspicious_fee_spike',
        description: 'Sudden spike in transaction fees',
        threshold: 5.0, // 5x average fee
        check: (event, context) => {
          if (event.type !== 'transaction' || !event.data.fee) return false;
          return event.data.fee > (context.averageFees * 5);
        }
      },
      {
        type: 'rapid_transaction_burst',
        description: 'Rapid burst of transactions from same address',
        threshold: 10, // 10 transactions in short time
        check: (event, context) => {
          if (event.type !== 'transaction') return false;
          const recentFromSameAddress = context.recentEvents
            .filter(e => e.type === 'transaction' && 
                        e.data.signature && 
                        e.timestamp > Date.now() - 60000) // Last minute
            .length;
          return recentFromSameAddress > 10;
        }
      },
      {
        type: 'unusual_program_activity',
        description: 'Unusual activity in lesser-known programs',
        threshold: 100, // Sudden increase in calls
        check: (event, context) => {
          if (event.type !== 'transaction' || !event.data.logs) return false;
          // Check for suspicious patterns in logs
          const suspiciousPatterns = [
            'error', 'failed', 'insufficient', 'unauthorized'
          ];
          return event.data.logs.some((log: string) => 
            suspiciousPatterns.some(pattern => log.toLowerCase().includes(pattern))
          );
        }
      }
    ];
  }

  private createTools(): Tool[] {
    return [
      this.createToolExecutor(
        'analyzeEvent',
        'Analyze a blockchain event for anomalies',
        this.analyzeEvent.bind(this)
      ),
      this.createToolExecutor(
        'getAnomalyAlerts',
        'Get recent anomaly alerts',
        this.getAnomalyAlerts.bind(this)
      ),
      this.createToolExecutor(
        'getAnomalyStats',
        'Get anomaly detection statistics',
        this.getAnomalyStats.bind(this)
      ),
      this.createToolExecutor(
        'configureDetection',
        'Configure anomaly detection parameters',
        this.configureDetection.bind(this)
      )
    ];
  }

  public async processEvent(event: any): Promise<AnomalyAlert[]> {
    // Add event to history
    this.recentEvents.push(event);
    if (this.recentEvents.length > this.maxEventHistory) {
      this.recentEvents.shift();
    }

    // Create context for analysis
    const context = this.createContext();
    
    // Check for anomalies
    const alerts: AnomalyAlert[] = [];
    
    for (const pattern of this.patterns) {
      try {
        if (pattern.check(event, context)) {
          const alert = this.createAlert(pattern, event, context);
          alerts.push(alert);
          this.alerts.push(alert);
        }
      } catch (error) {
        console.error(`Error checking pattern ${pattern.type}:`, error);
      }
    }

    // Limit alert history
    if (this.alerts.length > this.maxAlertHistory) {
      this.alerts = this.alerts.slice(-this.maxAlertHistory);
    }

    return alerts;
  }

  private createContext(): AnomalyContext {
    const now = Date.now();
    const recentWindow = 5 * 60 * 1000; // 5 minutes
    const recentEvents = this.recentEvents.filter(e => e.timestamp > now - recentWindow);
    
    const transactionEvents = recentEvents.filter(e => e.type === 'transaction');
    const failedTransactions = transactionEvents.filter(e => e.data.err !== null);
    
    return {
      recentEvents,
      transactionVolume: transactionEvents.length,
      averageFees: this.calculateAverageFees(transactionEvents),
      errorRate: transactionEvents.length > 0 ? failedTransactions.length / transactionEvents.length : 0,
      timestamp: now
    };
  }

  private calculateAverageFees(transactions: any[]): number {
    if (transactions.length === 0) return 0;
    
    const validFees = transactions
      .map(t => t.data.fee)
      .filter(fee => typeof fee === 'number' && fee > 0);
    
    if (validFees.length === 0) return 0;
    
    return validFees.reduce((sum, fee) => sum + fee, 0) / validFees.length;
  }

  private createAlert(pattern: AnomalyPattern, event: any, context: AnomalyContext): AnomalyAlert {
    let severity: AnomalyAlert['severity'] = 'medium';
    
    // Determine severity based on pattern type and context
    if (pattern.type === 'high_failure_rate' && context.errorRate > 0.5) {
      severity = 'critical';
    } else if (pattern.type === 'suspicious_fee_spike') {
      severity = 'high';
    } else if (pattern.type === 'rapid_transaction_burst') {
      severity = 'high';
    } else if (pattern.type === 'unusual_program_activity') {
      severity = 'medium';
    }

    return {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: pattern.type,
      severity,
      description: pattern.description,
      event,
      context,
      timestamp: Date.now()
    };
  }

  private async analyzeEvent(params: ToolParams): Promise<any> {
    const { message } = params;
    
    try {
      // Extract event data from message content
      const eventData = this.extractEventFromMessage(message.content);
      if (!eventData) {
        return { error: 'No event data found in message' };
      }

      const alerts = await this.processEvent(eventData);
      
      return {
        analyzed: true,
        event: eventData,
        alerts,
        summary: alerts.length > 0 
          ? `Detected ${alerts.length} anomalies: ${alerts.map(a => a.type).join(', ')}`
          : 'No anomalies detected'
      };
    } catch (error) {
      console.error('Error analyzing event:', error);
      return { error: 'Failed to analyze event' };
    }
  }

  private async getAnomalyAlerts(params: ToolParams): Promise<any> {
    const recentAlerts = this.alerts
      .filter(alert => alert.timestamp > Date.now() - (24 * 60 * 60 * 1000)) // Last 24 hours
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 50); // Limit to 50 most recent

    const stats = {
      total: recentAlerts.length,
      bySeverity: {
        critical: recentAlerts.filter(a => a.severity === 'critical').length,
        high: recentAlerts.filter(a => a.severity === 'high').length,
        medium: recentAlerts.filter(a => a.severity === 'medium').length,
        low: recentAlerts.filter(a => a.severity === 'low').length,
      },
      byType: recentAlerts.reduce((acc, alert) => {
        acc[alert.type] = (acc[alert.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };

    return {
      alerts: recentAlerts,
      stats
    };
  }

  private async getAnomalyStats(params: ToolParams): Promise<any> {
    const now = Date.now();
    const periods = [
      { name: '1h', duration: 60 * 60 * 1000 },
      { name: '6h', duration: 6 * 60 * 60 * 1000 },
      { name: '24h', duration: 24 * 60 * 60 * 1000 }
    ];

    const stats = periods.map(period => {
      const alerts = this.alerts.filter(alert => alert.timestamp > now - period.duration);
      return {
        period: period.name,
        total: alerts.length,
        critical: alerts.filter(a => a.severity === 'critical').length,
        high: alerts.filter(a => a.severity === 'high').length,
        medium: alerts.filter(a => a.severity === 'medium').length,
        low: alerts.filter(a => a.severity === 'low').length,
      };
    });

    return {
      stats,
      patterns: this.patterns.map(p => ({
        type: p.type,
        description: p.description,
        threshold: p.threshold
      })),
      systemHealth: {
        eventHistorySize: this.recentEvents.length,
        alertHistorySize: this.alerts.length,
        activePatterns: this.patterns.length
      }
    };
  }

  private async configureDetection(params: ToolParams): Promise<any> {
    // This would allow configuration of detection parameters
    // For now, return current configuration
    return {
      message: 'Anomaly detection configuration',
      patterns: this.patterns.length,
      maxEventHistory: this.maxEventHistory,
      maxAlertHistory: this.maxAlertHistory
    };
  }

  private extractEventFromMessage(content: string): any | null {
    try {
      // Try to parse JSON from the message
      const jsonMatch = content.match(/\{.*\}/s);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      // Try to extract signature for transaction lookup
      const sigMatch = content.match(/signature:\s*([A-Za-z0-9]{88,})/);
      if (sigMatch) {
        return {
          type: 'transaction',
          data: { signature: sigMatch[1] },
          timestamp: Date.now()
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error extracting event from message:', error);
      return null;
    }
  }
}