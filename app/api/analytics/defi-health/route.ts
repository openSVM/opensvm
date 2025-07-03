import { NextRequest, NextResponse } from 'next/server';

// Simple self-contained DeFi Health API without complex dependencies
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const protocol = searchParams.get('protocol') || undefined;
    
    // Generate mock data directly - fast and reliable
    const mockProtocols = [
      {
        protocol: 'Raydium',
        category: 'dex' as const,
        tvl: 2174803106.92,
        tvlChange24h: 0.05,
        tvlChange7d: -0.02,
        riskScore: 0.15,
        healthScore: 0.95,
        exploitAlerts: [],
        treasuryHealth: {
          treasuryValue: 7674755.40,
          runwayMonths: 23.06,
          diversificationScore: 0.57,
          burnRate: 250000,
          sustainabilityRisk: 'medium' as const
        },
        governanceActivity: {
          activeProposals: 1,
          voterParticipation: 0.20,
          tokenDistribution: 0.48,
          governanceHealth: 0.76,
          recentDecisions: []
        },
        tokenomics: {
          tokenSupply: 270049101.33,
          circulatingSupply: 173470568.00,
          inflationRate: 0.0023,
          emissionSchedule: [],
          vestingSchedule: [],
          tokenUtility: ['governance', 'staking', 'fees']
        }
      },
      {
        protocol: 'Orca',
        category: 'dex' as const,
        tvl: 845621234.56,
        tvlChange24h: -0.03,
        tvlChange7d: 0.07,
        riskScore: 0.12,
        healthScore: 0.92,
        exploitAlerts: [],
        treasuryHealth: {
          treasuryValue: 5432187.65,
          runwayMonths: 18.32,
          diversificationScore: 0.72,
          burnRate: 180000,
          sustainabilityRisk: 'medium' as const
        },
        governanceActivity: {
          activeProposals: 3,
          voterParticipation: 0.28,
          tokenDistribution: 0.51,
          governanceHealth: 0.53,
          recentDecisions: []
        },
        tokenomics: {
          tokenSupply: 58268024.57,
          circulatingSupply: 36290903.06,
          inflationRate: 0.019,
          emissionSchedule: [],
          vestingSchedule: [],
          tokenUtility: ['governance', 'staking', 'fees']
        }
      },
      {
        protocol: 'Solend',
        category: 'lending' as const,
        tvl: 133925190.16,
        tvlChange24h: 0.097,
        tvlChange7d: -0.02,
        riskScore: 0.18,
        healthScore: 0.88,
        exploitAlerts: [],
        treasuryHealth: {
          treasuryValue: 10080298.55,
          runwayMonths: 401.11,
          diversificationScore: 0.51,
          burnRate: 25131.13,
          sustainabilityRisk: 'low' as const
        },
        governanceActivity: {
          activeProposals: 4,
          voterParticipation: 0.27,
          tokenDistribution: 0.43,
          governanceHealth: 0.62,
          recentDecisions: []
        },
        tokenomics: {
          tokenSupply: 417190798.86,
          circulatingSupply: 288287586.76,
          inflationRate: 0.033,
          emissionSchedule: [],
          vestingSchedule: [],
          tokenUtility: ['governance', 'staking', 'fees']
        }
      },
      {
        protocol: 'Mango Markets',
        category: 'derivatives' as const,
        tvl: 89432156.78,
        tvlChange24h: 0.12,
        tvlChange7d: 0.25,
        riskScore: 0.22,
        healthScore: 0.85,
        exploitAlerts: [],
        treasuryHealth: {
          treasuryValue: 3456789.01,
          runwayMonths: 15.67,
          diversificationScore: 0.63,
          burnRate: 120000,
          sustainabilityRisk: 'medium' as const
        },
        governanceActivity: {
          activeProposals: 2,
          voterParticipation: 0.35,
          tokenDistribution: 0.45,
          governanceHealth: 0.71,
          recentDecisions: []
        },
        tokenomics: {
          tokenSupply: 145678234.12,
          circulatingSupply: 89123456.78,
          inflationRate: 0.025,
          emissionSchedule: [],
          vestingSchedule: [],
          tokenUtility: ['governance', 'trading', 'fees']
        }
      },
      {
        protocol: 'Drift Protocol',
        category: 'derivatives' as const,
        tvl: 67891234.45,
        tvlChange24h: -0.08,
        tvlChange7d: 0.15,
        riskScore: 0.25,
        healthScore: 0.82,
        exploitAlerts: [],
        treasuryHealth: {
          treasuryValue: 2345678.90,
          runwayMonths: 12.34,
          diversificationScore: 0.58,
          burnRate: 95000,
          sustainabilityRisk: 'medium' as const
        },
        governanceActivity: {
          activeProposals: 1,
          voterParticipation: 0.31,
          tokenDistribution: 0.52,
          governanceHealth: 0.68,
          recentDecisions: []
        },
        tokenomics: {
          tokenSupply: 98765432.10,
          circulatingSupply: 67891234.56,
          inflationRate: 0.028,
          emissionSchedule: [],
          vestingSchedule: [],
          tokenUtility: ['governance', 'trading', 'rewards']
        }
      }
    ];

    // Filter by protocol if specified
    const protocols = protocol 
      ? mockProtocols.filter(p => p.protocol.toLowerCase() === protocol.toLowerCase())
      : mockProtocols;

    // Generate mock alerts (occasionally)
    const alerts = Math.random() > 0.9 ? [{
      severity: 'medium' as const,
      type: 'Unusual Volume Pattern',
      description: 'Detected abnormal trading patterns in liquidity pools',
      affectedAmount: 450000,
      protocolsAffected: ['Raydium'],
      timestamp: Date.now() - 3600000, // 1 hour ago
      riskLevel: 0.4
    }] : [];

    // Generate rankings
    const rankings = protocols
      .sort((a, b) => b.tvl - a.tvl)
      .map(p => ({
        protocol: p.protocol,
        tvl: p.tvl,
        healthScore: p.healthScore,
        riskScore: p.riskScore
      }));

    // Calculate ecosystem stats
    const totalTvl = protocols.reduce((sum, p) => sum + p.tvl, 0);
    const avgHealthScore = protocols.reduce((sum, p) => sum + p.healthScore, 0) / protocols.length;
    const avgRiskScore = protocols.reduce((sum, p) => sum + p.riskScore, 0) / protocols.length;
    const criticalAlerts = alerts.filter(a => a.severity === 'critical').length;

    const ecosystem = {
      totalTvl,
      avgHealthScore,
      avgRiskScore,
      criticalAlerts,
      protocolCount: protocols.length
    };

    const health = {
      isHealthy: avgHealthScore > 0.7 && criticalAlerts === 0,
      lastUpdate: Date.now(),
      monitoredProtocols: protocols.length,
      activeAlerts: alerts.length
    };

    return NextResponse.json({
      success: true,
      data: {
        protocols,
        alerts,
        rankings,
        ecosystem,
        health
      },
      timestamp: Date.now()
    });

  } catch (error) {
    console.error('Error in DeFi health API:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: Date.now()
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
          message: 'DeFi health monitoring started',
          timestamp: Date.now()
        });

      case 'stop_monitoring':
        return NextResponse.json({
          success: true,
          message: 'DeFi health monitoring stopped',
          timestamp: Date.now()
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action',
          timestamp: Date.now()
        }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in DeFi health POST API:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: Date.now()
    }, { status: 500 });
  }
}