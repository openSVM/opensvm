import { NextRequest, NextResponse } from 'next/server';
import { Connection, PublicKey } from '@solana/web3.js';
import { getMint } from '@solana/spl-token';
import { getConnection } from '@/lib/solana-connection';
import { rateLimit } from '@/lib/rate-limit';

const limiter = rateLimit({
  interval: 60 * 1000,
  uniqueTokenPerInterval: 500,
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(request: NextRequest, { params }: { params: { mint: string } }) {
  const { mint } = params;
  const baseHeaders = {
    ...corsHeaders,
    'Content-Type': 'application/json',
  };

  try {
    await limiter.check(request, 10, 'TOKEN_DETAILS');
    
    const connection = await getConnection();
    const mintPubkey = new PublicKey(mint);

    // Get basic token info
    const mintInfo = await getMint(connection, mintPubkey);

    // Get metadata account
    const metadataProgramId = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');
    const [metadataAddress] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('metadata'),
        metadataProgramId.toBuffer(),
        mintPubkey.toBuffer(),
      ],
      metadataProgramId
    );

    // Fetch metadata account
    const metadataAccount = await connection.getAccountInfo(metadataAddress);
    let metadata = null;

    if (metadataAccount) {
      const data = metadataAccount.data;
      
      // Skip discriminator and feature flags (1 byte each)
      let offset = 2;
      
      // Skip key and update authority (32 bytes each)
      offset += 64;
      
      // Skip mint (32 bytes)
      offset += 32;
      
      // Read name
      const nameLength = data[offset];
      offset += 1;
      const name = new TextDecoder().decode(data.slice(offset, offset + nameLength)).replace(/\0/g, '');
      offset += nameLength;
      
      // Read symbol
      const symbolLength = data[offset];
      offset += 1;
      const symbol = new TextDecoder().decode(data.slice(offset, offset + symbolLength)).replace(/\0/g, '');
      offset += symbolLength;
      
      // Read uri
      const uriLength = data[offset];
      offset += 1;
      const uri = new TextDecoder().decode(data.slice(offset, offset + uriLength)).replace(/\0/g, '');

      metadata = {
        name,
        symbol,
        uri,
      };

      // Fetch metadata JSON if uri exists
      if (uri.startsWith('http')) {
        try {
          const response = await fetch(uri, {
            mode: 'cors',
            headers: {
              'User-Agent': 'OpenSVM/1.0'
            }
          });
          if (!response.ok) throw new Error('Failed to fetch metadata');
          const json = await response.json();
          metadata.description = json.description;
          metadata.image = json.image;
        } catch (error) {
          console.error('Error fetching metadata JSON:', error);
          // Retry logic
          let json;
          let retries = 3;
          while (retries > 0) {
            try {
              const retryResponse = await fetch(uri, {
                mode: 'cors',
                headers: {
                  'User-Agent': 'OpenSVM/1.0'
                }
              });
              if (retryResponse.ok) {
                json = await retryResponse.json();
                break;
              }
            } catch (retryError) {
              console.error(`Metadata fetch retry failed (${4-retries}/3):`, retryError);
            }
            retries--;
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      }
    }

    // Get token holders
    const tokenAccounts = await connection.getTokenLargestAccounts(mintPubkey);
    const holders = tokenAccounts.value.filter(account => Number(account.amount) > 0).length;

    // Get recent token transfers
    const signatures = await connection.getSignaturesForAddress(mintPubkey, { limit: 100 });
    const recentTransactions = await connection.getParsedTransactions(
      signatures.map(sig => sig.signature),
      { maxSupportedTransactionVersion: 0 }
    );

    // Calculate 24h volume from recent transactions
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    let volume24h = 0;
    recentTransactions.forEach(tx => {
      if (tx?.blockTime && tx.blockTime * 1000 > oneDayAgo) {
        tx.meta?.postTokenBalances?.forEach(balance => {
          if (balance.mint === mint && balance.uiTokenAmount) {
            volume24h += Number(balance.uiTokenAmount.uiAmount || 0);
          }
        });
      }
    });

    const tokenData = {
      metadata,
      supply: Number(mintInfo.supply),
      decimals: mintInfo.decimals,
      holders,
      volume24h,
      isInitialized: mintInfo.isInitialized,
      freezeAuthority: mintInfo.freezeAuthority?.toBase58(),
      mintAuthority: mintInfo.mintAuthority?.toBase58()
    };

    return NextResponse.json(tokenData, { headers: baseHeaders });
  } catch (error) {
    console.error('Error fetching token details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch token details' },
      { status: 500, headers: baseHeaders }
    );
  }
}
