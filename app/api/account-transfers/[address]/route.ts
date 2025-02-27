import { NextRequest, NextResponse } from 'next/server';
import { PublicKey, Connection } from '@solana/web3.js';
import { getConnection } from '@/lib/solana-connection';
import { isValidSolanaAddress } from '@/lib/utils';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

interface Transfer {
  txId: string;
  date: string;
  from: string;
  to: string;
  tokenSymbol: string;
  tokenAmount: string;
  usdValue: string;
  currentUsdValue: string;
  transferType: 'IN' | 'OUT';
}

async function fetchTransactionBatch(
  connection: Connection,
  signatures: string[]
): Promise<Transfer[]> {
  const transfers: Transfer[] = [];
  const startTime = Date.now();

  await Promise.all(
    signatures.map(async (signature) => {
      let retries = 3;
      while (retries > 0) {
        try {
          const tx = await connection.getParsedTransaction(signature, {
            maxSupportedTransactionVersion: 0,
            commitment: 'confirmed'
          });
          if (!tx?.meta) return;

          const preBalances = tx.meta.preBalances || [];
          const postBalances = tx.meta.postBalances || [];
          const accountKeys = tx.transaction.message.accountKeys;
          const blockTime = tx.blockTime! * 1000;

          const solPrice = await getPriceData();

          preBalances.forEach((_: number, index: number) => {
            const preBalance = preBalances[index] || 0;
            const postBalance = postBalances[index] || 0;
            const delta = postBalance - preBalance;
            const account = accountKeys[index]?.pubkey.toString() || '';
            const firstAccount = accountKeys[0]?.pubkey.toString() || '';

            if (delta === 0 || !account) return;

            const amount = Math.abs(delta / 1e9);
            const usdValue = amount * solPrice;

            transfers.push({
              txId: signature,
              date: new Date(blockTime).toISOString(),
              from: delta < 0 ? account : (delta > 0 ? firstAccount : ''),
              to: delta > 0 ? account : (delta < 0 ? firstAccount : ''),
              tokenSymbol: 'SOL',
              tokenAmount: amount.toString(),
              usdValue: usdValue.toString(),
              currentUsdValue: usdValue.toString(),
              transferType: delta < 0 ? 'OUT' : 'IN',
            });
          });

          break;
        } catch (err) {
          console.error(`Transaction error (${retries} retries left):`, err);
          retries--;
          if (retries > 0) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      }
    })
  );

  console.log(`Processed ${transfers.length} transfers in ${Date.now() - startTime}ms`);
  return transfers;
}

async function getPriceData(): Promise<number> {
  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd`,
      { next: { revalidate: 60 } }
    );
    const data = await response.json();
    return data?.solana?.usd || 0;
  } catch (err) {
    console.error('Price API error:', err);
    return 0;
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ address: string }> }
) {
  const startTime = Date.now();

  try {
    const params = await context.params;
    const { address: rawAddress } = await params;
    const address = decodeURIComponent(String(rawAddress));
    console.log(`Starting transfer fetch for ${address}`);

    const searchParams = request.nextUrl.searchParams;
    const offset = parseInt(searchParams.get('offset') || '0');
    const limit = Math.min(parseInt(searchParams.get('limit') || '1000'), 1000);

    // Validate address
    if (!isValidSolanaAddress(address)) {
      return NextResponse.json(
        { error: 'Invalid Solana address format' },
        { 
          status: 400,
          headers: corsHeaders
        }
      );
    }

    // Get connection from pool
    const connection = await getConnection();
    const pubkey = new PublicKey(address);
    
    // Fetch signatures
    console.log(`Fetching signatures for ${address}`);
    const signatures = await connection.getSignaturesForAddress(
      pubkey,
      {
        limit,
        before: offset > 0 ? undefined : undefined
      }
    );

    if (signatures.length === 0) {
      return NextResponse.json({
        data: [],
        hasMore: false
      }, { headers: corsHeaders });
    }

    console.log(`Found ${signatures.length} signatures, processing transfers`);

    // Process transactions
    const transfers = await fetchTransactionBatch(
      connection,
      signatures.map(s => s.signature)
    );

    console.log(`Total transfers found: ${transfers.length}`);

    return NextResponse.json({
      data: transfers,
      hasMore: signatures.length === limit,
      total: transfers.length
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('API Error:', error);
    const errorTime = Date.now() - startTime;
    console.error(`Request failed after ${errorTime}ms`);
    
    return NextResponse.json(
      { error: 'Failed to fetch transfers' },
      { 
        status: 500,
        headers: corsHeaders
      }
    );
  }
}
