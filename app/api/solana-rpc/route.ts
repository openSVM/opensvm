import { NextRequest, NextResponse } from 'next/server';
import { Connection, PublicKey } from '@solana/web3.js';
import fs from 'fs';
import { getConnection } from '@/lib/solana-connection';

// Simple in-memory cache
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 10000; // 10 seconds

function getCacheKey(method: string, params: any[]): string {
  return `${method}:${JSON.stringify(params)}`;
}

function getFromCache(key: string): any | null {
  const cached = cache.get(key);
  if (!cached) return null;

  const now = Date.now();
  if (now - cached.timestamp > CACHE_TTL) {
    cache.delete(key);
    return null;
  }

  return cached.data;
}

function setCache(key: string, data: any): void {
  cache.set(key, { data, timestamp: Date.now() });
}

async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  let lastError;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      // Check if we should retry based on error type
      if (error instanceof Error) {
        const errorMessage = error.message.toLowerCase();
        // Don't retry if it's a validation error or unsupported method
        if (errorMessage.includes('invalid') || errorMessage.includes('unsupported')) {
          throw error;
        }
      }
      
      // If this was the last attempt, throw the error
      if (attempt === maxRetries - 1) {
        throw lastError;
      }
      
      // Wait before retrying, with exponential backoff
      const delay = initialDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

// Configure request size limits
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Log the incoming RPC method and parameters
    try {
      fs.appendFileSync('solana_rpc_logs.txt', `RPC Method: ${body.method}\nRPC Params: ${JSON.stringify(body.params)}\n`);
    } catch (err) {
      console.error('Failed to write to log file:', err);
    }

    // Try to get from cache first
    const cacheKey = getCacheKey(body.method, body.params);
    const cachedResult = getFromCache(cacheKey);
    if (cachedResult) {
      return NextResponse.json({
        jsonrpc: '2.0',
        result: cachedResult,
        id: body.id
      });
    }

    // Get connection from pool
    const connection = await getConnection();

    let result;
    try {
      result = await retryOperation(async () => {
        switch (body.method) {
          case 'getAccountInfo':
            const pubkey = new PublicKey(body.params[0]);
            const accountInfo = await connection.getAccountInfo(pubkey);
            if (!accountInfo) {
              throw new Error('Account not found');
            }
            return {
              context: { slot: await connection.getSlot() },
              value: accountInfo
            };

          case 'getHealth':
            const blockHeight = await connection.getBlockHeight();
            return blockHeight > 0 ? 'ok' : null;

          case 'getSignaturesForAddress':
            const sigPubkey = new PublicKey(body.params[0]);
            const options = body.params[1] || {};
            const commitment = body.params[2] || 'confirmed';
            return await connection.getSignaturesForAddress(sigPubkey, options, commitment);

          case 'getParsedTransactions':
            const signatures = body.params[0];
            const txOptions = body.params[1] || {};
            const txs = await connection.getParsedTransactions(signatures, txOptions);
            if (!txs || txs.length === 0) {
              throw new Error('No transactions found');
            }
            return txs;

          case 'getParsedTokenAccountsByOwner':
            const ownerPubkey = new PublicKey(body.params[0]);
            const filter = body.params[1];
            const tokenAccounts = await connection.getParsedTokenAccountsByOwner(ownerPubkey, filter);
            return {
              value: tokenAccounts.value.map(account => ({
                pubkey: account.pubkey.toBase58(),
                account: {
                  ...account.account,
                  owner: account.account.owner.toBase58()
                }
              }))
            };

          case 'getSlot':
            return await connection.getSlot();

          case 'getBlockHeight':
            return await connection.getBlockHeight();

          default:
            throw new Error(`Unsupported method: ${body.method}`);
        }
      });
    } catch (error) {
      if (error instanceof Error) {
        const errorMessage = error.message.toLowerCase();
        if (errorMessage.includes('account not found')) {
          return NextResponse.json({
            jsonrpc: '2.0',
            error: {
              code: -32000,
              message: `Account ${body.params[0]} not found`
            },
            id: body.id
          }, { status: 404 });
        } else if (errorMessage.includes('rate limit')) {
          return NextResponse.json({
            jsonrpc: '2.0',
            error: {
              code: -32000,
              message: 'Rate limit exceeded. Please try again later.'
            },
            id: body.id
          }, { status: 429 });
        }
      }
      throw error;
    }

    // Cache the result before returning
    setCache(cacheKey, result);

    return NextResponse.json({
      jsonrpc: '2.0',
      result,
      id: body.id
    });
  } catch (error) {
    console.error('RPC error:', error);
    
    // Determine appropriate error response
    let status = 500;
    let message = error instanceof Error ? error.message : 'Unknown error';
    
    if (message.toLowerCase().includes('invalid')) {
      status = 400;
    } else if (message.toLowerCase().includes('not found')) {
      status = 404;
    } else if (message.toLowerCase().includes('rate limit')) {
      status = 429;
    }
    
    return NextResponse.json(
      {
        jsonrpc: '2.0',
        error: {
          code: -32000,
          message
        },
        id: 1
      },
      { status }
    );
  }
}
