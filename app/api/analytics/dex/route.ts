import { NextRequest, NextResponse } from 'next/server';
import { getSolanaDEXAnalytics } from '@/lib/data-sources/solana-dex-analytics';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dex = searchParams.get('dex') || undefined;
    
    const analytics = getSolanaDEXAnalytics();
    
    // Initialize if not already done
    try {
      await analytics.initialize();
    } catch (error) {
      // Might already be initialized
      console.log('Analytics already initialized or initialization failed:', error);
    }

    const liquidityData = await analytics.getLiquidityData(dex);
    const volumeMetrics = await analytics.getVolumeMetrics(dex);
    const arbitrageOpportunities = await analytics.getArbitrageOpportunities();
    const dexRankings = await analytics.getDEXRankings();
    const healthStatus = await analytics.getHealthStatus();

    return NextResponse.json({
      success: true,
      data: {
        liquidity: liquidityData.data || [],
        volume: volumeMetrics.data || [],
        arbitrage: arbitrageOpportunities.data || [],
        rankings: dexRankings.data || [],
        health: healthStatus
      },
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Error in DEX analytics API:', error);
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

    const analytics = getSolanaDEXAnalytics();
    
    // Initialize if not already done
    try {
      await analytics.initialize();
    } catch (error) {
      console.log('Analytics already initialized or initialization failed:', error);
    }

    switch (action) {
      case 'start_monitoring':
        analytics.startMonitoring();
        return NextResponse.json({
          success: true,
          message: 'Monitoring started',
          timestamp: Date.now()
        });

      case 'stop_monitoring':
        analytics.stopMonitoring();
        return NextResponse.json({
          success: true,
          message: 'Monitoring stopped',
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
    console.error('Error in DEX analytics POST API:', error);
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