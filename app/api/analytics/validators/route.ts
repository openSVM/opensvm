import { NextRequest, NextResponse } from 'next/server';

// Simple self-contained Validators API without complex dependencies
export async function GET(request: NextRequest) {
  try {
    // Generate realistic mock validator data
    const mockValidators = [
      {
        voteAccount: '7K8DVxtNJGnMtUY1CQJT5jcs8sFGSZTDiG7kowvFpECh',
        name: 'Coinbase Cloud',
        commission: 5,
        activatedStake: 12500000000000000, // 12.5M SOL
        lastVote: 276543210,
        rootSlot: 276543200,
        credits: 450000,
        epochCredits: 450000,
        version: '1.18.22',
        status: 'active' as const,
        datacenter: 'Google Cloud (us-central1)',
        country: 'United States',
        apy: 6.8,
        performanceScore: 0.98,
        uptimePercent: 99.95
      },
      {
        voteAccount: '9QU2QSxhb24FUX3Tu2FpczXjpK3VYrvRudywSZaM29mF',
        name: 'Lido',
        commission: 7,
        activatedStake: 11200000000000000,
        lastVote: 276543211,
        rootSlot: 276543201,
        credits: 448500,
        epochCredits: 448500,
        version: '1.18.22',
        status: 'active' as const,
        datacenter: 'AWS (eu-west-1)',
        country: 'Ireland',
        apy: 6.5,
        performanceScore: 0.96,
        uptimePercent: 99.88
      },
      {
        voteAccount: 'J1to3PQfXidUUhprQWgdKkQAMWPJAEqSJ7amkBDE9qhF',
        name: 'Jito',
        commission: 4,
        activatedStake: 10800000000000000,
        lastVote: 276543212,
        rootSlot: 276543202,
        credits: 451200,
        epochCredits: 451200,
        version: '1.18.23',
        status: 'active' as const,
        datacenter: 'Hetzner (fsn1)',
        country: 'Germany',
        apy: 7.1,
        performanceScore: 0.99,
        uptimePercent: 99.98
      },
      // Add more validators with realistic data
      ...Array.from({ length: 47 }, (_, i) => ({
        voteAccount: `validator_${i + 4}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: [
          'Marinade Finance', 'Everstake', 'Staked', 'P2P Validator', 'Chorus One',
          'Figment', 'Blockdaemon', 'Allnodes', 'Stakin', 'DelegateInc'
        ][i % 10] + ` ${Math.floor(i / 10) + 1}`,
        commission: Math.floor(Math.random() * 10) + 1,
        activatedStake: Math.floor(Math.random() * 5000000000000000) + 1000000000000000,
        lastVote: 276543210 + Math.floor(Math.random() * 10),
        rootSlot: 276543200 + Math.floor(Math.random() * 10),
        credits: Math.floor(Math.random() * 50000) + 400000,
        epochCredits: Math.floor(Math.random() * 50000) + 400000,
        version: Math.random() > 0.7 ? '1.18.23' : '1.18.22',
        status: Math.random() > 0.05 ? 'active' as const : 'delinquent' as const,
        datacenter: [
          'AWS (us-east-1)', 'Google Cloud (us-west2)', 'Azure (eastus)', 
          'Hetzner (nbg1)', 'DigitalOcean (nyc3)', 'Linode (us-east)',
          'OVH (gra)', 'Vultr (nj)', 'Oracle Cloud (us-phoenix-1)'
        ][Math.floor(Math.random() * 9)],
        country: [
          'United States', 'Germany', 'Singapore', 'Netherlands', 'Japan',
          'Canada', 'United Kingdom', 'France', 'Australia'
        ][Math.floor(Math.random() * 9)],
        apy: Math.random() * 3 + 5, // 5-8% APY
        performanceScore: Math.random() * 0.15 + 0.85, // 85-100%
        uptimePercent: Math.random() * 5 + 95 // 95-100%
      }))
    ];

    // Calculate network stats
    const totalValidators = mockValidators.length;
    const activeValidators = mockValidators.filter(v => v.status === 'active').length;
    const delinquentValidators = mockValidators.filter(v => v.status === 'delinquent').length;
    const totalStake = mockValidators.reduce((sum, v) => sum + v.activatedStake, 0);
    const averageCommission = mockValidators.reduce((sum, v) => sum + v.commission, 0) / totalValidators;
    const averageUptime = mockValidators.reduce((sum, v) => sum + v.uptimePercent, 0) / totalValidators;

    // Calculate Nakamoto coefficient (validators controlling >33% stake)
    const sortedByStake = [...mockValidators].sort((a, b) => b.activatedStake - a.activatedStake);
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

    // Calculate decentralization metrics
    const countryMap = new Map<string, { count: number, stake: number }>();
    const datacenterMap = new Map<string, { count: number, stake: number }>();
    const versionMap = new Map<string, number>();
    
    mockValidators.forEach(validator => {
      // Country distribution
      const currentCountry = countryMap.get(validator.country) || { count: 0, stake: 0 };
      countryMap.set(validator.country, {
        count: currentCountry.count + 1,
        stake: currentCountry.stake + validator.activatedStake
      });
      
      // Datacenter distribution
      const currentDatacenter = datacenterMap.get(validator.datacenter) || { count: 0, stake: 0 };
      datacenterMap.set(validator.datacenter, {
        count: currentDatacenter.count + 1,
        stake: currentDatacenter.stake + validator.activatedStake
      });
      
      // Version distribution
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
      percent: (count / totalValidators) * 100
    }));

    const decentralization = {
      geograficDistribution,
      datacenterDistribution,
      clientDistribution
    };

    // Health status
    const issues = [];
    if (activeValidators < 1000) {
      issues.push('Low active validator count');
    }
    if (averageUptime < 95) {
      issues.push('Below average network uptime');
    }

    const health = {
      isHealthy: issues.length === 0,
      lastUpdate: Date.now(),
      monitoredValidators: totalValidators,
      issues
    };

    return NextResponse.json({
      success: true,
      data: {
        validators: mockValidators,
        networkStats,
        decentralization,
        health
      },
      timestamp: Date.now()
    });

  } catch (error) {
    console.error('Error in validator analytics API:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
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