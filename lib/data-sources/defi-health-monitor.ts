import { Connection } from '@solana/web3.js';
import { BaseAnalytics } from './base-analytics';
import {
  ProtocolHealth,
  ExploitAlert,
  TreasuryMetrics,
  GovernanceMetrics,
  TokenomicsHealth,
  AnalyticsCallback,
  AnalyticsResponse,
  AnalyticsConfig
} from '@/lib/types/solana-analytics';

export class DeFiHealthMonitor extends BaseAnalytics {
  // Monitored protocols by category
  private readonly MONITORED_PROTOCOLS = {
    dex: [
      'Raydium', 'Orca', 'Serum', 'Saber', 'Aldrin', 'Lifinity', 'Meteora', 'Phoenix'
    ],
    lending: [
      'Solend', 'Tulip Protocol', 'Larix', 'Port Finance', 'Jet Protocol', 'Francium'
    ],
    yield: [
      'Quarry', 'Sunny Aggregator', 'Friktion', 'Katana', 'Parrot Protocol', 'Cashio'
    ],
    derivatives: [
      'Mango Markets', 'Drift Protocol', 'Zeta Markets', 'Entropy', 'Cypher'
    ],
    insurance: [
      'UXD Protocol', 'Hedge Protocol', 'Risk Harbor', 'Nexus Mutual'
    ]
  };

  // Risk thresholds
  private readonly RISK_THRESHOLDS = {
    criticalTvlDrop: 0.5, // 50% TVL drop
    highVolumeSpike: 5.0, // 500% volume increase
    lowLiquidity: 100000, // $100k minimum liquidity
    highRiskScore: 0.8,
    treasuryRunwayLow: 6 // 6 months
  };

  constructor(config: AnalyticsConfig) {
    super(config);
  }

  protected getAnalyticsName(): string {
    return 'DeFi Health Monitor';
  }

  protected async onInitialize(): Promise<void> {
    // Custom initialization for DeFi health monitoring
  }

  protected async onStartMonitoring(): Promise<void> {
    // Protocol health monitoring (2-5 minutes)
    this.createInterval(async () => {
      await this.fetchAndUpdateProtocolHealth();
    }, 3 * 60 * 1000); // 3 minutes

    // Exploit detection (30 seconds)
    this.createInterval(async () => {
      await this.detectAndAlertExploits();
    }, 30 * 1000); // 30 seconds
  }

  // Event-driven callback system
  onHealthUpdate(callback: AnalyticsCallback<ProtocolHealth[]>): void {
    this.registerCallback('health', callback);
  }

  onExploitAlert(callback: AnalyticsCallback<ExploitAlert[]>): void {
    this.registerCallback('exploits', callback);
  }

  // Fetch and update protocol health data
  private async fetchAndUpdateProtocolHealth(): Promise<void> {
    const allProtocols = Object.values(this.MONITORED_PROTOCOLS).flat();
    const promises = allProtocols.map(protocol => this.fetchProtocolHealth(protocol));
    const results = await Promise.allSettled(promises);
    
    const healthData: ProtocolHealth[] = [];
    
    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value) {
        healthData.push(result.value);
      } else {
        console.warn(`Failed to fetch health data for ${allProtocols[index]}:`, result.reason);
      }
    });

    if (healthData.length > 0) {
      this.emit('health', healthData);
    }
  }

  private async fetchProtocolHealth(protocol: string): Promise<ProtocolHealth | null> {
    const timestamp = Date.now();
    
    try {
      // Determine protocol category
      const category = this.getProtocolCategory(protocol);
      
      // Mock implementation - replace with actual API calls
      const baseHealth = await this.generateMockProtocolHealth(protocol, category, timestamp);
      
      // Calculate risk and health scores
      const riskScore = this.calculateRiskScore(baseHealth);
      const healthScore = this.calculateHealthScore(baseHealth, riskScore);
      
      return {
        ...baseHealth,
        riskScore,
        healthScore
      };
    } catch (error) {
      console.error(`Error fetching health data for ${protocol}:`, error);
      return null;
    }
  }

  private getProtocolCategory(protocol: string): 'dex' | 'lending' | 'yield' | 'derivatives' | 'insurance' {
    for (const [category, protocols] of Object.entries(this.MONITORED_PROTOCOLS)) {
      if (protocols.includes(protocol)) {
        return category as any;
      }
    }
    return 'dex'; // Default
  }

  private async generateMockProtocolHealth(
    protocol: string, 
    category: 'dex' | 'lending' | 'yield' | 'derivatives' | 'insurance',
    timestamp: number
  ): Promise<Omit<ProtocolHealth, 'riskScore' | 'healthScore'>> {
    
    // Base TVL varies by protocol size
    const baseTvl = this.getBaseTvlForProtocol(protocol);
    const tvlVariation = (Math.random() - 0.5) * 0.4; // ±20% variation
    const tvl = baseTvl * (1 + tvlVariation);
    
    return {
      protocol,
      category,
      tvl,
      tvlChange24h: (Math.random() - 0.5) * 0.3, // ±15% change
      tvlChange7d: (Math.random() - 0.5) * 0.6, // ±30% change
      exploitAlerts: await this.generateExploitAlerts(protocol),
      treasuryHealth: this.generateTreasuryMetrics(protocol, tvl),
      governanceActivity: this.generateGovernanceMetrics(protocol),
      tokenomics: this.generateTokenomicsHealth(protocol),
      riskScore: 0, // Will be calculated
      healthScore: 0 // Will be calculated
    };
  }

  private getBaseTvlForProtocol(protocol: string): number {
    // Assign realistic TVL ranges based on protocol prominence
    const tvlRanges: Record<string, number> = {
      // Major DEXes
      'Raydium': 250000000,
      'Orca': 180000000,
      'Serum': 150000000,
      
      // Major Lending
      'Solend': 120000000,
      'Tulip Protocol': 80000000,
      
      // Derivatives
      'Mango Markets': 100000000,
      'Drift Protocol': 60000000,
      
      // Others get smaller amounts
      'default': 30000000
    };
    
    return tvlRanges[protocol] || tvlRanges['default'];
  }

  private async generateExploitAlerts(protocol: string): Promise<ExploitAlert[]> {
    // TODO: Replace with real exploit detection using transaction analysis
    // Randomly generate exploit alerts (very low probability)
    if (Math.random() < 0.02) { // 2% chance
      const exploitTypes: ExploitAlert['type'][] = [
        'flash_loan', 'oracle_manipulation', 'governance_attack', 'bridge_exploit', 'reentrancy'
      ];
      
      const severities: ExploitAlert['severity'][] = ['critical', 'high', 'medium', 'low'];
      
      return [{
        severity: severities[Math.floor(Math.random() * severities.length)],
        type: exploitTypes[Math.floor(Math.random() * exploitTypes.length)],
        description: `Potential ${exploitTypes[0]} vulnerability detected in ${protocol}`,
        affectedAmount: Math.random() * 1000000,
        protocolsAffected: [protocol],
        mitigationStatus: 'investigating',
        timestamp: Date.now()
      }];
    }
    
    return [];
  }

  private generateTreasuryMetrics(protocol: string, tvl: number): TreasuryMetrics {
    const treasuryValue = tvl * (0.02 + Math.random() * 0.08); // 2-10% of TVL
    const burnRate = treasuryValue * (0.01 + Math.random() * 0.04) / 12; // 1-5% monthly
    const runwayMonths = treasuryValue / burnRate;
    
    return {
      treasuryValue,
      runwayMonths,
      diversificationScore: 0.3 + Math.random() * 0.5, // 30-80%
      burnRate,
      sustainabilityRisk: runwayMonths < 6 ? 'critical' : 
                         runwayMonths < 12 ? 'high' :
                         runwayMonths < 24 ? 'medium' : 'low'
    };
  }

  private generateGovernanceMetrics(protocol: string): GovernanceMetrics {
    return {
      activeProposals: Math.floor(Math.random() * 5),
      voterParticipation: 0.1 + Math.random() * 0.4, // 10-50%
      tokenDistribution: 0.3 + Math.random() * 0.4, // 30-70%
      governanceHealth: 0.4 + Math.random() * 0.4, // 40-80%
      recentDecisions: []
    };
  }

  private generateTokenomicsHealth(protocol: string): TokenomicsHealth {
    const totalSupply = 100000000 + Math.random() * 900000000; // 100M-1B
    const circulatingSupply = totalSupply * (0.3 + Math.random() * 0.5); // 30-80%
    
    return {
      tokenSupply: totalSupply,
      circulatingSupply,
      inflationRate: Math.random() * 0.1, // 0-10%
      emissionSchedule: [],
      vestingSchedule: [],
      tokenUtility: ['governance', 'staking', 'fees']
    };
  }

  private calculateRiskScore(health: Omit<ProtocolHealth, 'riskScore' | 'healthScore'>): number {
    let riskScore = 0;
    
    // TVL drop risk
    if (health.tvlChange24h < -this.RISK_THRESHOLDS.criticalTvlDrop) {
      riskScore += 0.4;
    } else if (health.tvlChange24h < -0.2) {
      riskScore += 0.2;
    }
    
    // Exploit alerts
    if (health.exploitAlerts.length > 0) {
      const maxSeverity = Math.max(...health.exploitAlerts.map(alert => 
        alert.severity === 'critical' ? 4 : 
        alert.severity === 'high' ? 3 :
        alert.severity === 'medium' ? 2 : 1
      ));
      riskScore += maxSeverity * 0.1;
    }
    
    // Treasury risk
    if (health.treasuryHealth.sustainabilityRisk === 'critical') {
      riskScore += 0.3;
    } else if (health.treasuryHealth.sustainabilityRisk === 'high') {
      riskScore += 0.2;
    }
    
    // Governance risk
    if (health.governanceActivity.voterParticipation < 0.1) {
      riskScore += 0.1;
    }
    
    return Math.min(riskScore, 1);
  }

  private calculateHealthScore(
    health: Omit<ProtocolHealth, 'riskScore' | 'healthScore'>, 
    riskScore: number
  ): number {
    let healthScore = 1 - riskScore;
    
    // Boost for positive metrics
    if (health.tvlChange7d > 0.1) healthScore += 0.1;
    if (health.tvl > 100000000) healthScore += 0.1; // $100M+ TVL
    if (health.governanceActivity.voterParticipation > 0.3) healthScore += 0.1;
    if (health.treasuryHealth.runwayMonths > 24) healthScore += 0.1;
    
    return Math.min(Math.max(healthScore, 0), 1);
  }

  // Exploit detection system
  private async detectAndAlertExploits(): Promise<void> {
    // This would integrate with real-time transaction monitoring
    // For now, we'll use mock detection logic
    
    const alerts = await this.scanForExploitPatterns();
    if (alerts.length > 0) {
      this.emit('exploits', alerts);
    }
  }

  private async scanForExploitPatterns(): Promise<ExploitAlert[]> {
    const alerts: ExploitAlert[] = [];
    
    // TODO: Replace with real exploit detection - in reality, this would analyze:
    // - Large value transfers
    // - Unusual transaction patterns
    // - Oracle price deviations
    // - Flash loan activities
    // - Governance voting anomalies
    // - Integration with security monitoring services like Forta, OpenZeppelin Defender, etc.
    
    if (Math.random() < 0.001) { // 0.1% chance of detecting something
      alerts.push({
        severity: 'high',
        type: 'flash_loan',
        description: 'Unusual flash loan activity detected across multiple protocols',
        affectedAmount: Math.random() * 5000000,
        protocolsAffected: ['Mango Markets', 'Solend'],
        mitigationStatus: 'investigating',
        timestamp: Date.now()
      });
    }
    
    return alerts;
  }

  // Public API methods
  async getProtocolHealth(protocol?: string): Promise<AnalyticsResponse<ProtocolHealth[]>> {
    try {
      // For MVP, return mock data since we don't have persistent storage
      const allProtocols = protocol ? [protocol] : Object.values(this.MONITORED_PROTOCOLS).flat().slice(0, 20);
      const healthData: ProtocolHealth[] = [];
      
      for (const protocolName of allProtocols) {
        const health = await this.fetchProtocolHealth(protocolName);
        if (health) {
          healthData.push(health);
        }
      }
      
      return {
        success: true,
        data: healthData,
        timestamp: Date.now()
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now()
      };
    }
  }

  async getExploitAlerts(): Promise<AnalyticsResponse<ExploitAlert[]>> {
    try {
      const alerts = await this.scanForExploitPatterns();
      return {
        success: true,
        data: alerts,
        timestamp: Date.now()
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now()
      };
    }
  }

  async getProtocolRankings(): Promise<AnalyticsResponse<{ protocol: string; tvl: number; healthScore: number; riskScore: number }[]>> {
    try {
      const healthData = await this.getProtocolHealth();
      if (!healthData.success || !healthData.data) {
        throw new Error('Failed to fetch protocol health data');
      }
      
      const rankings = healthData.data
        .map(protocol => ({
          protocol: protocol.protocol,
          tvl: protocol.tvl,
          healthScore: protocol.healthScore,
          riskScore: protocol.riskScore
        }))
        .sort((a, b) => b.tvl - a.tvl);
      
      return {
        success: true,
        data: rankings,
        timestamp: Date.now()
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now()
      };
    }
  }

  async getEcosystemHealth(): Promise<AnalyticsResponse<{
    totalTvl: number;
    avgHealthScore: number;
    avgRiskScore: number;
    criticalAlerts: number;
    protocolCount: number;
  }>> {
    try {
      const healthData = await this.getProtocolHealth();
      if (!healthData.success || !healthData.data) {
        throw new Error('Failed to fetch protocol health data');
      }
      
      const protocols = healthData.data;
      const totalTvl = protocols.reduce((sum, p) => sum + p.tvl, 0);
      const avgHealthScore = protocols.reduce((sum, p) => sum + p.healthScore, 0) / protocols.length;
      const avgRiskScore = protocols.reduce((sum, p) => sum + p.riskScore, 0) / protocols.length;
      const criticalAlerts = protocols.reduce((sum, p) => 
        sum + p.exploitAlerts.filter(a => a.severity === 'critical').length, 0
      );
      
      return {
        success: true,
        data: {
          totalTvl,
          avgHealthScore,
          avgRiskScore,
          criticalAlerts,
          protocolCount: protocols.length
        },
        timestamp: Date.now()
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now()
      };
    }
  }

  // Health check
  async getHealthStatus(): Promise<{
    isHealthy: boolean;
    lastUpdate: number;
    monitoredProtocols: number;
    activeAlerts: number;
  }> {
    try {
      const healthData = await this.getProtocolHealth();
      const alertData = await this.getExploitAlerts();
      
      return {
        isHealthy: healthData.success && alertData.success,
        lastUpdate: Date.now(),
        monitoredProtocols: Object.values(this.MONITORED_PROTOCOLS).flat().length,
        activeAlerts: alertData.data?.length || 0
      };
    } catch (error) {
      return {
        isHealthy: false,
        lastUpdate: 0,
        monitoredProtocols: 0,
        activeAlerts: 0
      };
    }
  }
}

// Singleton instance
let defiHealthMonitorInstance: DeFiHealthMonitor | null = null;

export function getDeFiHealthMonitor(config?: AnalyticsConfig): DeFiHealthMonitor {
  if (!defiHealthMonitorInstance) {
    const defaultConfig: AnalyticsConfig = {
      refreshIntervals: {
        dexData: 60000,
        crossChainData: 120000,
        rpcData: 10000,
        validatorData: 120000
      },
      apiKeys: {},
      rpcEndpoints: {
        solana: ['https://api.mainnet-beta.solana.com'],
        ethereum: ['https://eth-mainnet.g.alchemy.com/v2/demo']
      }
    };
    
    defiHealthMonitorInstance = new DeFiHealthMonitor(config || defaultConfig);
  }
  
  return defiHealthMonitorInstance;
}

export default DeFiHealthMonitor;