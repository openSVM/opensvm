import { NextRequest, NextResponse } from 'next/server';
import { checkSVMAIAccess } from '@/lib/token-gating';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const walletAddress = searchParams.get('wallet');

  console.log(`[Token Gating] Checking access for wallet: ${walletAddress}`);

  if (!walletAddress) {
    return NextResponse.json(
      { error: 'Wallet address is required' },
      { status: 400 }
    );
  }

  try {
    const result = await checkSVMAIAccess(walletAddress);
    
    console.log(`[Token Gating] Result for ${walletAddress}:`, result);
    
    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error checking token gating access:', error);
    return NextResponse.json(
      { 
        error: 'Failed to check token gating access',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
