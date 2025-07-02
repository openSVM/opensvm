import { NextRequest, NextResponse } from 'next/server';
import { getValidatorAnalytics } from '@/lib/data-sources/validator-analytics';

export async function GET(request: NextRequest) {
  try {
    const validatorAnalytics = getValidatorAnalytics();
    
    // Get all validator data
    const [validatorsResponse, networkStatsResponse, decentralizationResponse, healthStatus] = await Promise.all([
      validatorAnalytics.getValidators(),
      validatorAnalytics.getNetworkStats(),
      validatorAnalytics.getDecentralizationMetrics(),
      validatorAnalytics.getHealthStatus()
    ]);
    
    if (!validatorsResponse.success) {
      return NextResponse.json({
        success: false,
        error: validatorsResponse.error || 'Failed to fetch validator data'
      }, { status: 500 });
    }
    
    if (!networkStatsResponse.success) {
      return NextResponse.json({
        success: false,
        error: networkStatsResponse.error || 'Failed to fetch network stats'
      }, { status: 500 });
    }
    
    if (!decentralizationResponse.success) {
      return NextResponse.json({
        success: false,
        error: decentralizationResponse.error || 'Failed to fetch decentralization metrics'
      }, { status: 500 });
    }
    
    const responseData = {
      validators: validatorsResponse.data,
      networkStats: networkStatsResponse.data,
      decentralization: decentralizationResponse.data,
      health: healthStatus
    };
    
    return NextResponse.json({
      success: true,
      data: responseData,
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
    
    const validatorAnalytics = getValidatorAnalytics();
    
    switch (action) {
      case 'start_monitoring':
        await validatorAnalytics.initialize();
        await validatorAnalytics.startMonitoring();
        return NextResponse.json({
          success: true,
          message: 'Validator monitoring started'
        });
        
      case 'stop_monitoring':
        await validatorAnalytics.stopMonitoring();
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