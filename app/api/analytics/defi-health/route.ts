import { NextRequest, NextResponse } from 'next/server';
import { getDeFiHealthMonitor } from '@/lib/data-sources/defi-health-monitor';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const protocol = searchParams.get('protocol') || undefined;
    
    const monitor = getDeFiHealthMonitor();
    
    // Initialize if not already done
    try {
      await monitor.initialize();
    } catch (error) {
      console.log('DeFi health monitor already initialized or initialization failed:', error);
    }

    const protocolHealth = await monitor.getProtocolHealth(protocol);
    const exploitAlerts = await monitor.getExploitAlerts();
    const protocolRankings = await monitor.getProtocolRankings();
    const ecosystemHealth = await monitor.getEcosystemHealth();
    const healthStatus = await monitor.getHealthStatus();

    return NextResponse.json({
      success: true,
      data: {
        protocols: protocolHealth.data || [],
        alerts: exploitAlerts.data || [],
        rankings: protocolRankings.data || [],
        ecosystem: ecosystemHealth.data || {
          totalTvl: 0,
          avgHealthScore: 0,
          avgRiskScore: 0,
          criticalAlerts: 0,
          protocolCount: 0
        },
        health: healthStatus
      },
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Error in DeFi health monitor API:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now()
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    const monitor = getDeFiHealthMonitor();
    
    // Initialize if not already done
    try {
      await monitor.initialize();
    } catch (error) {
      console.log('DeFi health monitor already initialized or initialization failed:', error);
    }

    switch (action) {
      case 'start_monitoring':
        monitor.startMonitoring();
        return NextResponse.json({
          success: true,
          message: 'DeFi health monitoring started',
          timestamp: Date.now()
        });

      case 'stop_monitoring':
        monitor.stopMonitoring();
        return NextResponse.json({
          success: true,
          message: 'DeFi health monitoring stopped',
          timestamp: Date.now()
        });

      default:
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid action',
            timestamp: Date.now()
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in DeFi health monitor POST API:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now()
      },
      { status: 500 }
    );
  }
}