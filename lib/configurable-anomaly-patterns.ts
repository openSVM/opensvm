/**
 * Configurable Anomaly Detection Patterns
 * Allows loading patterns from JSON configuration for dynamic deployment
 */

import { AnomalyPattern, AnomalyContext } from './anomaly-patterns';

interface AnomalyPatternConfig {
  id: string;
  name: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'financial' | 'security' | 'performance' | 'behavior' | 'token_manipulation';
  enabled: boolean;
  threshold: number;
  conditions: {
    type: 'fee_spike' | 'failure_rate' | 'transaction_burst' | 'unusual_program' | 'large_transfer' | 'rapid_trades';
    operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte' | 'contains' | 'regex';
    value: any;
    field?: string;
  }[];
  metadata?: {
    tags?: string[];
    mlWeight?: number;
    confidence?: number;
    timeWindowMs?: number;
  };
}

interface AnomalyPatternConfiguration {
  version: string;
  lastUpdated: string;
  patterns: AnomalyPatternConfig[];
}

/**
 * Default anomaly pattern configurations
 * Can be overridden by remote configuration
 */
const DEFAULT_PATTERNS: AnomalyPatternConfiguration = {
  version: '1.0.0',
  lastUpdated: new Date().toISOString(),
  patterns: [
    {
      id: 'high_fee_spike',
      name: 'High Fee Spike',
      description: 'Transaction fees significantly higher than average',
      severity: 'high',
      category: 'financial',
      enabled: true,
      threshold: 5.0,
      conditions: [
        {
          type: 'fee_spike',
          operator: 'gte',
          value: 5.0,
          field: 'fee'
        }
      ],
      metadata: {
        tags: ['fees', 'economics'],
        mlWeight: 1.2,
        confidence: 0.8,
        timeWindowMs: 300000 // 5 minutes
      }
    },
    {
      id: 'transaction_failure_burst',
      name: 'Transaction Failure Burst',
      description: 'High rate of transaction failures detected',
      severity: 'critical',
      category: 'security',
      enabled: true,
      threshold: 0.3,
      conditions: [
        {
          type: 'failure_rate',
          operator: 'gt',
          value: 0.3
        }
      ],
      metadata: {
        tags: ['failures', 'security'],
        mlWeight: 1.5,
        confidence: 0.9,
        timeWindowMs: 60000 // 1 minute
      }
    },
    {
      id: 'rapid_transaction_burst',
      name: 'Rapid Transaction Burst',
      description: 'Unusually high number of transactions from single address',
      severity: 'medium',
      category: 'behavior',
      enabled: true,
      threshold: 50,
      conditions: [
        {
          type: 'transaction_burst',
          operator: 'gte',
          value: 50,
          field: 'transactionCount'
        }
      ],
      metadata: {
        tags: ['volume', 'behavior'],
        mlWeight: 1.0,
        confidence: 0.7,
        timeWindowMs: 180000 // 3 minutes
      }
    },
    {
      id: 'large_token_transfer',
      name: 'Large Token Transfer',
      description: 'Unusually large token transfer detected',
      severity: 'high',
      category: 'financial',
      enabled: true,
      threshold: 1000000,
      conditions: [
        {
          type: 'large_transfer',
          operator: 'gte',
          value: 1000000,
          field: 'amount'
        }
      ],
      metadata: {
        tags: ['transfers', 'finance'],
        mlWeight: 1.1,
        confidence: 0.85,
        timeWindowMs: 3600000 // 1 hour
      }
    }
  ]
};

/**
 * Manages anomaly pattern configurations
 */
export class AnomalyPatternManager {
  private patterns: AnomalyPatternConfiguration = DEFAULT_PATTERNS;
  private lastUpdate: Date = new Date();
  private remoteConfigUrl?: string;

  constructor(remoteConfigUrl?: string) {
    this.remoteConfigUrl = remoteConfigUrl;
  }

  /**
   * Load patterns from remote configuration
   */
  async loadRemotePatterns(): Promise<void> {
    if (!this.remoteConfigUrl) {
      console.log('[AnomalyPatterns] No remote config URL provided, using defaults');
      return;
    }

    try {
      const response = await fetch(this.remoteConfigUrl);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const remotePatterns: AnomalyPatternConfiguration = await response.json();
      
      // Validate the configuration
      if (this.validateConfiguration(remotePatterns)) {
        this.patterns = remotePatterns;
        this.lastUpdate = new Date();
        console.log(`[AnomalyPatterns] Loaded ${remotePatterns.patterns.length} patterns from remote config`);
      } else {
        console.warn('[AnomalyPatterns] Invalid remote configuration, using defaults');
      }
    } catch (error) {
      console.error('[AnomalyPatterns] Failed to load remote configuration:', error);
      console.log('[AnomalyPatterns] Falling back to default patterns');
    }
  }

  /**
   * Get all enabled patterns converted to AnomalyPattern format
   */
  getEnabledPatterns(): AnomalyPattern[] {
    return this.patterns.patterns
      .filter(config => config.enabled)
      .map(config => this.convertConfigToPattern(config));
  }

  /**
   * Get pattern configuration by ID
   */
  getPatternConfig(id: string): AnomalyPatternConfig | null {
    return this.patterns.patterns.find(p => p.id === id) || null;
  }

  /**
   * Update pattern configuration
   */
  updatePattern(id: string, updates: Partial<AnomalyPatternConfig>): boolean {
    const patternIndex = this.patterns.patterns.findIndex(p => p.id === id);
    if (patternIndex === -1) {
      return false;
    }

    this.patterns.patterns[patternIndex] = {
      ...this.patterns.patterns[patternIndex],
      ...updates
    };

    return true;
  }

  /**
   * Get configuration metadata
   */
  getConfigurationInfo() {
    return {
      version: this.patterns.version,
      lastUpdated: this.patterns.lastUpdated,
      localUpdate: this.lastUpdate,
      totalPatterns: this.patterns.patterns.length,
      enabledPatterns: this.patterns.patterns.filter(p => p.enabled).length,
      remoteConfigUrl: this.remoteConfigUrl
    };
  }

  /**
   * Convert configuration to AnomalyPattern
   */
  private convertConfigToPattern(config: AnomalyPatternConfig): AnomalyPattern {
    return {
      type: config.id,
      description: config.description,
      severity: config.severity,
      threshold: config.threshold,
      category: config.category,
      check: (event: any, context: AnomalyContext) => this.evaluateConditions(config.conditions, event, context),
      metadata: config.metadata
    };
  }

  /**
   * Evaluate pattern conditions against event and context
   */
  private evaluateConditions(conditions: AnomalyPatternConfig['conditions'], event: any, context: AnomalyContext): boolean {
    return conditions.every(condition => {
      const value = condition.field ? event[condition.field] : this.getContextValue(condition.type, context);
      
      switch (condition.operator) {
        case 'gt': return value > condition.value;
        case 'gte': return value >= condition.value;
        case 'lt': return value < condition.value;
        case 'lte': return value <= condition.value;
        case 'eq': return value === condition.value;
        case 'contains': return String(value).includes(String(condition.value));
        case 'regex': return new RegExp(condition.value).test(String(value));
        default: return false;
      }
    });
  }

  /**
   * Get value from context based on condition type
   */
  private getContextValue(type: string, context: AnomalyContext): any {
    switch (type) {
      case 'fee_spike':
        return context.averageFees;
      case 'failure_rate':
        return context.errorRate;
      case 'transaction_burst':
        return context.recentEvents.length;
      default:
        return 0;
    }
  }

  /**
   * Validate configuration structure
   */
  private validateConfiguration(config: any): config is AnomalyPatternConfiguration {
    if (!config || typeof config !== 'object') return false;
    if (!config.version || !config.patterns || !Array.isArray(config.patterns)) return false;
    
    return config.patterns.every((pattern: any) => {
      return pattern.id && pattern.name && pattern.description && 
             pattern.severity && pattern.category && 
             typeof pattern.enabled === 'boolean' &&
             typeof pattern.threshold === 'number' &&
             Array.isArray(pattern.conditions);
    });
  }
}

// Global pattern manager instance
let patternManager: AnomalyPatternManager | null = null;

/**
 * Get or create global pattern manager
 */
export function getAnomalyPatternManager(remoteConfigUrl?: string): AnomalyPatternManager {
  if (!patternManager) {
    patternManager = new AnomalyPatternManager(remoteConfigUrl);
  }
  return patternManager;
}

/**
 * Load patterns with remote configuration support
 */
export async function loadAnomalyPatterns(remoteConfigUrl?: string): Promise<AnomalyPattern[]> {
  const manager = getAnomalyPatternManager(remoteConfigUrl);
  await manager.loadRemotePatterns();
  return manager.getEnabledPatterns();
}