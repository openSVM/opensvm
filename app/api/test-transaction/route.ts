import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Mock transaction data for testing
    const mockTransaction = {
      signature: '5QpShPQKT2ZbBxdrGHP6uaZKR5RuNWSZrtgqFPwif3KPmJxc8NzKEr3HpLyZmHwa8zPrmGC8H8FBHhyFpvjkSAr5',
      timestamp: Date.now(),
      slot: 234567890,
      success: true,
      type: 'token',
      details: {
        instructions: [
          {
            program: 'spl-token',
            programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
            accounts: [0, 1, 2],
            data: JSON.stringify({
              program: 'spl-token',
              type: 'transfer',
              info: {
                amount: '1000000',
                authority: 'test456',
                source: 'test789',
                destination: 'testABC'
              }
            }),
            parsed: {
              type: 'transfer',
              info: {
                amount: '1000000',
                authority: 'test456',
                source: 'test789',
                destination: 'testABC'
              }
            },
            computeUnits: 2400,
            computeUnitsConsumed: 1800
          }
        ],
        accounts: [
          {
            pubkey: 'test456',
            signer: true,
            writable: true
          },
          {
            pubkey: 'test789',
            signer: false,
            writable: true
          },
          {
            pubkey: 'testABC',
            signer: false,
            writable: true
          }
        ],
        preBalances: [1000000, 500000, 300000],
        postBalances: [999000, 499000, 301000],
        preTokenBalances: [
          {
            accountIndex: 1,
            mint: 'testMint',
            uiTokenAmount: {
              amount: '1000000',
              decimals: 6,
              uiAmount: 1.0
            }
          }
        ],
        postTokenBalances: [
          {
            accountIndex: 2,
            mint: 'testMint',
            uiTokenAmount: {
              amount: '1000000',
              decimals: 6,
              uiAmount: 1.0
            }
          }
        ],
        logs: [
          'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [1]',
          'Program log: Transfer 1 USDC',
          'Program consumed 1800 of 2400 compute units',
          'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success'
        ],
        innerInstructions: [],
        tokenChanges: [
          {
            mint: 'testMint',
            preAmount: 1.0,
            postAmount: 1.0,
            change: 0
          }
        ]
      }
    };

    const headers = {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=10, stale-while-revalidate=30',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    };

    return NextResponse.json(mockTransaction, { headers });
  } catch (error) {
    console.error('Test transaction error:', error);
    
    const headers = {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    };

    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to fetch test transaction',
        details: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : error
      },
      { 
        status: 500,
        headers
      }
    );
  }
}