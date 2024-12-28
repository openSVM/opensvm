import { Message } from '../types';
import { BaseCapability } from './base';

export class NetworkCapability extends BaseCapability {
  type = 'network' as const;

  private readonly NETWORK_TERMS = ['network', 'tps', 'validator', 'performance', 'block time'];

  tools = [
    this.createToolExecutor(
      'getNetworkStatus',
      'Fetches current network status and performance metrics',
      async () => {
        return this.executeWithConnection(async (connection) => {
          const slot = await connection.getSlot();
          const [blockTime, performance] = await Promise.all([
            connection.getBlockTime(slot),
            connection.getRecentPerformanceSamples(1)
          ]);

          return {
            currentSlot: slot,
            blockTime,
            performance: performance[0]
          };
        });
      }
    ),
    this.createToolExecutor(
      'getValidatorInfo',
      'Fetches information about network validators',
      async () => {
        return this.executeWithConnection(async (connection) => {
          const validators = await connection.getVoteAccounts();
          
          return {
            current: validators.current.length,
            delinquent: validators.delinquent.length,
            totalActive: validators.current.length,
            topValidators: validators.current
              .sort((a, b) => b.activatedStake - a.activatedStake)
              .slice(0, 5)
              .map(v => ({
                votePubkey: v.votePubkey,
                stake: v.activatedStake,
                commission: v.commission
              }))
          };
        });
      }
    ),
    this.createToolExecutor(
      'analyzeNetworkLoad',
      'Analyzes current network load and performance',
      async () => {
        return this.executeWithConnection(async (connection) => {
          const samples = await connection.getRecentPerformanceSamples(60);
          
          const avgTps = samples.reduce((acc, sample) => 
            acc + sample.numTransactions / sample.samplePeriodSecs, 0
          ) / samples.length;

          const maxTps = Math.max(...samples.map(
            sample => sample.numTransactions / sample.samplePeriodSecs
          ));

          return {
            averageTps: avgTps,
            maxTps,
            timeRange: samples.length * samples[0].samplePeriodSecs,
            load: this.classifyNetworkLoad(avgTps)
          };
        });
      }
    )
  ];

  canHandle(message: Message): boolean {
    return this.NETWORK_TERMS.some(term => 
      message.content.toLowerCase().includes(term)
    );
  }

  private classifyNetworkLoad(tps: number): string {
    if (tps < 500) return 'low';
    if (tps < 1500) return 'moderate';
    if (tps < 3000) return 'high';
    return 'very high';
  }
} 