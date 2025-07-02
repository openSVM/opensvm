import {
  SolanaLiquidityData,
  DEXVolumeMetrics,
  CrossDEXArbitrage,
  CrossChainFlow,
  EcosystemMigration,
  ProtocolHealth,
  ExploitAlert,
  ValidatorMetrics,
  NetworkDecentralization
} from '@/lib/types/solana-analytics';

// In-memory data store for analytics data
// In production, this would be replaced with a proper database like PostgreSQL or Redis
class MemoryCache {
  private liquidityData: SolanaLiquidityData[] = [];
  private volumeMetrics: DEXVolumeMetrics[] = [];
  private arbitrageOpportunities: CrossDEXArbitrage[] = [];
  private crossChainFlows: CrossChainFlow[] = [];
  private validatorMetrics: ValidatorMetrics[] = [];
  private initialized = false;
  private readonly maxItems = 1000; // Limit memory usage
  private readonly retentionDays = 14;

  constructor() {
    // Initialize with empty data
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      this.initialized = true;
      console.log('Memory cache initialized successfully');
      
      // Set up periodic cleanup
      setInterval(() => {
        this.cleanupOldData();
      }, 60 * 60 * 1000); // Every hour
    } catch (error) {
      console.error('Failed to initialize Memory cache:', error);
      throw error;
    }
  }

  // Solana Liquidity Data Methods
  async insertLiquidityData(data: SolanaLiquidityData[]): Promise<void> {
    if (!this.initialized) await this.initialize();

    // Add new data and keep only the most recent items
    this.liquidityData.push(...data);
    this.liquidityData.sort((a, b) => b.timestamp - a.timestamp);
    if (this.liquidityData.length > this.maxItems) {
      this.liquidityData = this.liquidityData.slice(0, this.maxItems);
    }
  }

  async getLiquidityData(dex?: string, limit = 100): Promise<SolanaLiquidityData[]> {
    if (!this.initialized) await this.initialize();

    let filteredData = this.liquidityData;
    if (dex) {
      filteredData = this.liquidityData.filter(item => item.dex === dex);
    }
    
    return filteredData.slice(0, limit);
  }

  // DEX Volume Metrics Methods
  async insertDEXVolumeMetrics(data: DEXVolumeMetrics[]): Promise<void> {
    if (!this.initialized) await this.initialize();

    this.volumeMetrics.push(...data);
    this.volumeMetrics.sort((a, b) => b.timestamp - a.timestamp);
    if (this.volumeMetrics.length > this.maxItems) {
      this.volumeMetrics = this.volumeMetrics.slice(0, this.maxItems);
    }
  }

  async getDEXVolumeMetrics(dex?: string, limit = 100): Promise<DEXVolumeMetrics[]> {
    if (!this.initialized) await this.initialize();

    let filteredData = this.volumeMetrics;
    if (dex) {
      filteredData = this.volumeMetrics.filter(item => item.dex === dex);
    }
    
    return filteredData.slice(0, limit);
  }

  // Arbitrage Opportunities Methods
  async insertArbitrageOpportunities(data: CrossDEXArbitrage[]): Promise<void> {
    if (!this.initialized) await this.initialize();

    this.arbitrageOpportunities.push(...data);
    this.arbitrageOpportunities.sort((a, b) => b.profitOpportunity - a.profitOpportunity);
    if (this.arbitrageOpportunities.length > this.maxItems) {
      this.arbitrageOpportunities = this.arbitrageOpportunities.slice(0, this.maxItems);
    }
  }

  async getArbitrageOpportunities(limit = 100): Promise<CrossDEXArbitrage[]> {
    if (!this.initialized) await this.initialize();

    return this.arbitrageOpportunities.slice(0, limit);
  }

  // Cross-Chain Flow Methods
  async insertCrossChainFlows(data: CrossChainFlow[]): Promise<void> {
    if (!this.initialized) await this.initialize();

    this.crossChainFlows.push(...data);
    this.crossChainFlows.sort((a, b) => b.volume24h - a.volume24h);
    if (this.crossChainFlows.length > this.maxItems) {
      this.crossChainFlows = this.crossChainFlows.slice(0, this.maxItems);
    }
  }

  async getCrossChainFlows(bridgeProtocol?: string, limit = 100): Promise<CrossChainFlow[]> {
    if (!this.initialized) await this.initialize();

    let filteredData = this.crossChainFlows;
    if (bridgeProtocol) {
      filteredData = this.crossChainFlows.filter(item => item.bridgeProtocol === bridgeProtocol);
    }
    
    return filteredData.slice(0, limit);
  }

  // Validator Metrics Methods
  async insertValidatorMetrics(data: ValidatorMetrics[]): Promise<void> {
    if (!this.initialized) await this.initialize();

    this.validatorMetrics.push(...data);
    this.validatorMetrics.sort((a, b) => b.totalStake - a.totalStake);
    if (this.validatorMetrics.length > this.maxItems) {
      this.validatorMetrics = this.validatorMetrics.slice(0, this.maxItems);
    }
  }

  async getValidatorMetrics(validatorAddress?: string, limit = 100): Promise<ValidatorMetrics[]> {
    if (!this.initialized) await this.initialize();

    let filteredData = this.validatorMetrics;
    if (validatorAddress) {
      filteredData = this.validatorMetrics.filter(item => item.validatorAddress === validatorAddress);
    }
    
    return filteredData.slice(0, limit);
  }

  // Data cleanup methods
  async cleanupOldData(daysToKeep = 14): Promise<void> {
    if (!this.initialized) await this.initialize();

    const cutoffTimestamp = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);
    
    this.liquidityData = this.liquidityData.filter(item => item.timestamp >= cutoffTimestamp);
    this.volumeMetrics = this.volumeMetrics.filter(item => item.timestamp >= cutoffTimestamp);
    this.arbitrageOpportunities = this.arbitrageOpportunities.filter(item => item.timestamp >= cutoffTimestamp);
    this.crossChainFlows = this.crossChainFlows.filter(item => item.timestamp >= cutoffTimestamp);
    this.validatorMetrics = this.validatorMetrics.filter(item => item.timestamp >= cutoffTimestamp);

    console.log('Cleaned up old data');
  }

  async close(): Promise<void> {
    // Nothing to close for memory cache
    this.initialized = false;
  }
}

// Singleton instance
let memoryCacheInstance: MemoryCache | null = null;

export function getDuckDBCache(): MemoryCache {
  if (!memoryCacheInstance) {
    memoryCacheInstance = new MemoryCache();
  }
  return memoryCacheInstance;
}

export default MemoryCache;