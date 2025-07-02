import { NextRequest, NextResponse } from 'next/server';
import { getCrossChainAnalytics } from '@/lib/data-sources/cross-chain-analytics';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const bridgeProtocol = searchParams.get('bridge') || undefined;
    
    const analytics = getCrossChainAnalytics();
    
    // Initialize if not already done
    try {
      await analytics.initialize();
    } catch (error) {
      console.log('Cross-chain analytics already initialized or initialization failed:', error);
    }

    const crossChainFlows = await analytics.getCrossChainFlows(bridgeProtocol);
    const bridgeRankings = await analytics.getBridgeRankings();
    const topAssets = await analytics.getTopAssets();
    const healthStatus = await analytics.getHealthStatus();

    return NextResponse.json({
      success: true,
      data: {
        flows: crossChainFlows.data || [],
        rankings: bridgeRankings.data || [],
        assets: topAssets.data || [],
        health: healthStatus
      },
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Error in cross-chain analytics API:', error);
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

    const analytics = getCrossChainAnalytics();
    
    // Initialize if not already done
    try {
      await analytics.initialize();
    } catch (error) {
      console.log('Cross-chain analytics already initialized or initialization failed:', error);
    }

    switch (action) {
      case 'start_monitoring':
        analytics.startMonitoring();
        return NextResponse.json({
          success: true,
          message: 'Cross-chain monitoring started',
          timestamp: Date.now()
        });

      case 'stop_monitoring':
        analytics.stopMonitoring();
        return NextResponse.json({
          success: true,
          message: 'Cross-chain monitoring stopped',
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
    console.error('Error in cross-chain analytics POST API:', error);
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