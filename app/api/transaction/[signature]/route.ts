import { NextRequest } from 'next/server';
import type { DetailedTransactionInfo } from '@/lib/solana';
import { getConnection } from '@/lib/solana-connection';
import type { ParsedTransactionWithMeta } from '@solana/web3.js';

const DEBUG = true; // Set to true to enable detailed logging

const defaultHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
} as const;

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: new Headers({
      ...defaultHeaders,
      'Access-Control-Max-Age': '86400',
    })
  });
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ signature: string }> }
) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

  try {
    // Get signature from params - properly awaited in Next.js 13+
    const params = await context.params;
    const { signature } = await params;

    if (DEBUG) {
      console.log(`[API] Processing transaction request for signature: ${signature}`);
    }

    if (!signature) {
      const error = 'Transaction signature is missing';
      if (DEBUG) {
        console.error(`[API] ${error}`);
      }
      return new Response(
        JSON.stringify({ error: 'Transaction signature is required' }),
        { 
          status: 400,
          headers: new Headers(defaultHeaders)
        }
      );
    }

    // Get connection from pool
    const connection = await getConnection();
    if (DEBUG) {
      console.log(`[API] Using OpenSVM RPC connection to fetch transaction data`);
    }

    // Fetch transaction with timeout
    const tx = await Promise.race([
      connection.getParsedTransaction(signature, {
        maxSupportedTransactionVersion: 0,
        commitment: 'confirmed'
      }),
      new Promise((_, reject) => {
        setTimeout(() => reject(new Error('RPC request timed out')), 8000);
      })
    ]) as ParsedTransactionWithMeta | null;

    clearTimeout(timeoutId);

    if (DEBUG) {
      console.log(`[API] Transaction data received: ${tx ? 'YES' : 'NO'}`);
    }
    if (!tx) {
      console.error(`[API] Transaction not found for signature: ${signature}`);
      return new Response(
        JSON.stringify({ error: 'Transaction not found' }),
        { 
          status: 404,
          headers: new Headers(defaultHeaders)
        }
      );
    }

    // Transform transaction data
    if (DEBUG) {
      console.log(`[API] Transforming transaction data for UI presentation`);
    }
    const transactionInfo: DetailedTransactionInfo = {
      signature,
      timestamp: tx.blockTime ? tx.blockTime * 1000 : Date.now(),
      slot: tx.slot,
      success: tx.meta?.err === null,
      type: 'unknown',
      details: {
        instructions: tx.transaction.message.instructions.map((ix: any) => {
          try {
            if ('parsed' in ix) {
              return {
                program: ix.program || '',
                programId: ix.programId?.toString() || '',
                parsed: ix.parsed || {},
                accounts: ix.accounts?.map((acc: any) => acc?.toString() || '') || [],
                data: JSON.stringify(ix.parsed || {}),
                computeUnits: undefined,
                computeUnitsConsumed: undefined
              };
            } else {
              return {
                programId: ix.programId?.toString() || '',
                accounts: ix.accounts?.map((acc: any) => acc?.toString() || '') || [],
                data: ix.data || '',
                computeUnits: undefined,
                computeUnitsConsumed: undefined
              };
            }
          } catch (error) {
            console.error('Error converting instruction:', error);
            return {
              program: '',
              programId: '',
              parsed: {},
              accounts: [],
              data: '',
              computeUnits: undefined,
              computeUnitsConsumed: undefined
            };
          }
        }),
        accounts: tx.transaction.message.accountKeys.map((key: any) => ({
          pubkey: key?.pubkey?.toString() || '',
          signer: key?.signer || false,
          writable: key?.writable || false
        })),
        preBalances: tx.meta?.preBalances || [],
        postBalances: tx.meta?.postBalances || [],
        preTokenBalances: tx.meta?.preTokenBalances || [],
        postTokenBalances: tx.meta?.postTokenBalances || [],
        logs: tx.meta?.logMessages || [],
        innerInstructions: tx.meta?.innerInstructions?.map(inner => ({
          index: inner.index,
          instructions: inner.instructions.map((ix: any) => {
            try {
              if ('parsed' in ix) {
                return {
                  program: ix.program || '',
                  programId: ix.programId?.toString() || '',
                  parsed: ix.parsed || {},
                  accounts: ix.accounts?.map((acc: any) => acc?.toString() || '') || [],
                  data: JSON.stringify(ix.parsed || {}),
                  computeUnits: undefined,
                  computeUnitsConsumed: undefined
                };
              } else {
                return {
                  programId: ix.programId?.toString() || '',
                  accounts: ix.accounts?.map((acc: any) => acc?.toString() || '') || [],
                  data: ix.data || '',
                  computeUnits: undefined,
                  computeUnitsConsumed: undefined
                };
              }
            } catch (error) {
              console.error('Error converting inner instruction:', error);
              return {
                program: '',
                programId: '',
                parsed: {},
                accounts: [],
                data: '',
                computeUnits: undefined,
                computeUnitsConsumed: undefined
              };
            }
          })
        })) || [],
        tokenChanges: [],
        solChanges: []
      }
    };

    // Try to determine transaction type and extract relevant details
    if (tx.meta?.preTokenBalances?.length && tx.meta.postTokenBalances?.length) {
      transactionInfo.type = 'token';
      if (transactionInfo.details) {
        // Extract token transfer details if available
        transactionInfo.details.tokenChanges = tx.meta.postTokenBalances
          .map(post => {
            const pre = tx.meta?.preTokenBalances?.find(p => p.accountIndex === post.accountIndex);
            return {
              mint: post.mint || '',
              preAmount: pre?.uiTokenAmount?.uiAmount || 0,
              postAmount: post.uiTokenAmount?.uiAmount || 0,
              change: (post.uiTokenAmount?.uiAmount || 0) - (pre?.uiTokenAmount?.uiAmount || 0)
            };
          })
          .filter(change => change.mint && (change.preAmount !== 0 || change.postAmount !== 0));
      }
    } else if (tx.meta?.preBalances?.length && tx.meta.postBalances?.length) {
      transactionInfo.type = 'sol';
      if (transactionInfo.details) {
        // Extract SOL transfer details
        transactionInfo.details.solChanges = tx.meta.postBalances
          .map((post, i) => ({
            accountIndex: i,
            preBalance: tx.meta?.preBalances?.[i] || 0,
            postBalance: post || 0,
            change: (post || 0) - (tx.meta?.preBalances?.[i] || 0)
          }))
          .filter(change => change.change !== 0);
      }
    }

    if (DEBUG) {
      console.log(`[API] Successfully processed transaction data, returning to client`);
    }
    return new Response(
      JSON.stringify(transactionInfo),
      {
        status: 200,
        headers: new Headers(defaultHeaders)
      }
    );
  } catch (error) {
    clearTimeout(timeoutId);
    if (DEBUG) {
      console.error('[API] Transaction error:', error);
    }
    
    let status = 500;
    let message = 'Failed to fetch transaction';

    if (error instanceof Error) {
      if (error.name === 'AbortError' || error.message.includes('timed out')) {
        status = 504;
        message = 'Request timed out. Please try again.';
      } else if (error.message.includes('429') || error.message.includes('Too many requests')) {
        status = 429;
        message = 'Rate limit exceeded. Please try again in a few moments.';
      } else if (error.message.includes('403') || error.message.includes('Forbidden')) {
        status = 403;
        message = 'Access denied. Please check your permissions.';
      } else if (error.message.includes('404') || error.message.includes('not found')) {
        status = 404;
        message = 'Transaction not found. Please check the signature and try again.';
      } else if (error.message.includes('500') || error.message.includes('Internal')) {
        status = 500;
        message = 'Server error. Please try again later.';
      }
    }
    
    return new Response(
      JSON.stringify({ 
        error: message,
        details: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : error
      }),
      { 
        status,
        headers: new Headers(defaultHeaders)
      }
    );
  }
}