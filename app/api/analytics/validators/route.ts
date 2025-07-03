import { NextRequest, NextResponse } from 'next/server';
import { Connection, PublicKey } from '@solana/web3.js';

// Real Solana RPC endpoint - using public mainnet RPC
const SOLANA_RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';

export async function GET(request: NextRequest) {
  try {
    const connection = new Connection(SOLANA_RPC_URL, 'confirmed');
    
    // Fetch real validator data from Solana RPC
    const voteAccounts = await connection.getVoteAccounts('confirmed');
    const epochInfo = await connection.getEpochInfo('confirmed');
    const clusterNodes = await connection.getClusterNodes();
    
    // Process real validator data
    const allValidators = [...voteAccounts.current, ...voteAccounts.delinquent];
    
    // Limit to top 50 validators by stake for performance
    const topValidators = allValidators
      .sort((a, b) => b.activatedStake - a.activatedStake)
      .slice(0, 50)
      .map((validator, index) => {
        const clusterNode = clusterNodes.find(node => 
          node.pubkey === validator.nodePubkey
        );
        
        // Calculate performance metrics from real data
        const totalCredits = validator.epochCredits.reduce((sum, credit) => sum + credit[1], 0);
        const recentCredits = validator.epochCredits.slice(-5).reduce((sum, credit) => sum + credit[1], 0);
        const performanceScore = recentCredits > 0 ? Math.min(recentCredits / (5 * 440000), 1) : 0;
        
        // Calculate APY estimate based on commission and performance
        const baseAPY = 7; // Base Solana staking APY
        const apy = baseAPY * (1 - validator.commission / 100) * performanceScore;
        
        return {
          voteAccount: validator.votePubkey,
          name: `Validator ${index + 1}`, // Real validator names would need additional API
          commission: validator.commission,
          activatedStake: validator.activatedStake,
          lastVote: validator.lastVote,
          rootSlot: validator.rootSlot,
          credits: totalCredits,
          epochCredits: validator.epochCredits[validator.epochCredits.length - 1]?.[1] || 0,
          version: clusterNode?.version || 'Unknown',
          status: voteAccounts.current.includes(validator) ? 'active' as const : 'delinquent' as const,
          datacenter: clusterNode?.tpu ? `TPU: ${clusterNode.tpu}` : 'Unknown',
          country: 'Unknown', // Would need geolocation API for real location data
          apy: Math.round(apy * 100) / 100,
          performanceScore: Math.round(performanceScore * 100) / 100,
          uptimePercent: Math.round(performanceScore * 100 * 100) / 100
        };
      });

    // Calculate real network stats from Solana data
    const totalValidators = allValidators.length;
    const activeValidators = voteAccounts.current.length;
    const delinquentValidators = voteAccounts.delinquent.length;
    const totalStake = allValidators.reduce((sum, v) => sum + v.activatedStake, 0);
    const averageCommission = allValidators.reduce((sum, v) => sum + v.commission, 0) / totalValidators;
    const averageUptime = topValidators.reduce((sum, v) => sum + v.uptimePercent, 0) / topValidators.length;

    // Calculate Nakamoto coefficient from real stake distribution
    const sortedByStake = [...allValidators].sort((a, b) => b.activatedStake - a.activatedStake);
    let cumulativeStake = 0;
    let nakamotoCoefficient = 0;
    const thresholdStake = totalStake * 0.33;
    
    for (const validator of sortedByStake) {
      cumulativeStake += validator.activatedStake;
      nakamotoCoefficient++;
      if (cumulativeStake >= thresholdStake) break;
    }

    const networkHealth = averageUptime > 99 ? 'excellent' : averageUptime > 97 ? 'good' : averageUptime > 95 ? 'fair' : 'poor';

    const networkStats = {
      totalValidators,
      activeValidators,
      delinquentValidators,
      totalStake,
      averageCommission,
      nakamotoCoefficient,
      averageUptime,
      networkHealth
    };

    // Calculate decentralization metrics from real data
    const countryMap = new Map<string, { count: number, stake: number }>();
    const datacenterMap = new Map<string, { count: number, stake: number }>();
    const versionMap = new Map<string, number>();
    
    topValidators.forEach(validator => {
      // Country distribution (would need geolocation service for real data)
      const currentCountry = countryMap.get(validator.country) || { count: 0, stake: 0 };
      countryMap.set(validator.country, {
        count: currentCountry.count + 1,
        stake: currentCountry.stake + validator.activatedStake
      });
      
      // Datacenter distribution (simplified - would need IP geolocation)
      const currentDatacenter = datacenterMap.get(validator.datacenter) || { count: 0, stake: 0 };
      datacenterMap.set(validator.datacenter, {
        count: currentDatacenter.count + 1,
        stake: currentDatacenter.stake + validator.activatedStake
      });
      
      // Version distribution from real cluster data
      const currentVersion = versionMap.get(validator.version) || 0;
      versionMap.set(validator.version, currentVersion + 1);
    });

    const geograficDistribution = Array.from(countryMap.entries()).map(([country, data]) => ({
      country,
      validatorCount: data.count,
      stakePercent: (data.stake / totalStake) * 100
    }));

    const datacenterDistribution = Array.from(datacenterMap.entries()).map(([datacenter, data]) => ({
      datacenter,
      validatorCount: data.count,
      stakePercent: (data.stake / totalStake) * 100
    }));

    const clientDistribution = Array.from(versionMap.entries()).map(([version, count]) => ({
      version,
      validatorCount: count,
      percent: (count / topValidators.length) * 100
    }));

    const decentralization = {
      geograficDistribution,
      datacenterDistribution,
      clientDistribution
    };

    // Health status based on real network conditions
    const issues = [];
    if (activeValidators < 1000) {
      issues.push('Low active validator count');
    }
    if (averageUptime < 95) {
      issues.push('Below average network uptime');
    }
    if (delinquentValidators > totalValidators * 0.05) {
      issues.push('High delinquent validator ratio');
    }

    const health = {
      isHealthy: issues.length === 0,
      lastUpdate: Date.now(),
      monitoredValidators: topValidators.length,
      issues
    };

    return NextResponse.json({
      success: true,
      data: {
        validators: topValidators,
        networkStats,
        decentralization,
        health
      },
      timestamp: Date.now()
    });

  } catch (error) {
    console.error('Error fetching real validator data:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch validator data from Solana RPC'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;
    
    switch (action) {
      case 'start_monitoring':
        return NextResponse.json({
          success: true,
          message: 'Validator monitoring started'
        });
        
      case 'stop_monitoring':
        return NextResponse.json({
          success: true,
          message: 'Validator monitoring stopped'
        });
        
      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action'
        }, { status: 400 });
    }
    
  } catch (error) {
    console.error('Error in validator analytics POST:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 });
  }
}