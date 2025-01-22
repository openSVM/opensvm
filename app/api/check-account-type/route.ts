import { NextResponse } from 'next/server';
import { PublicKey } from '@solana/web3.js';
import { getConnection } from '@/lib/solana-connection';
import { isValidSolanaAddress } from '@/lib/utils';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get('address');

  if (!address) {
    return NextResponse.json({ error: 'Address is required' }, { status: 400 });
  }

  if (!isValidSolanaAddress(address)) {
    console.log('Invalid Solana address format:', address);
    return NextResponse.json({ type: 'unknown' });
  }

  try {
    console.log('Checking account type:', address);
    const connection = getConnection();
    const pubkey = new PublicKey(address);
    const accountInfo = await connection.getAccountInfo(pubkey);
    
    if (!accountInfo) {
      console.log('Account not found:', address);
      return NextResponse.json({ type: 'unknown' });
    }

    // Check if it's a program (executable)
    if (accountInfo.executable) {
      console.log('Found program:', address);
      return NextResponse.json({ type: 'program' });
    }

    // Check if it's a token mint
    const TOKEN_PROGRAM_ID = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
    const TOKEN_2022_PROGRAM_ID = 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb';
    
    const owner = accountInfo.owner.toBase58();
    if (owner === TOKEN_PROGRAM_ID || owner === TOKEN_2022_PROGRAM_ID) {
      console.log('Found token mint:', address, 'Owner:', owner);
      return NextResponse.json({ type: 'token' });
    }

    // Regular account
    console.log('Found regular account:', address, 'Owner:', owner);
    return NextResponse.json({ type: 'account' });
  } catch (error) {
    console.error('Error checking account type:', error);
    return NextResponse.json({ type: 'unknown' });
  }
}
