import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '@/lib/solana';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const slot = searchParams.get('slot');

  if (!slot) {
    return NextResponse.json(
      { error: 'Slot parameter is required' },
      { status: 400 }
    );
  }

  try {
    const conn = await getConnection();
    const slotNumber = parseInt(slot);
    if (isNaN(slotNumber)) {
      return NextResponse.json(
        { error: 'Invalid slot number' },
        { status: 400 }
      );
    }

    const [block, blockTime] = await Promise.all([
      conn.getBlock(slotNumber, { maxSupportedTransactionVersion: 0 }),
      conn.getBlockTime(slotNumber),
    ]);

    if (!block) {
      return NextResponse.json(
        { error: 'Block not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ block, blockTime });
  } catch (error) {
    console.error('Error fetching block:', error);
    return NextResponse.json(
      { error: 'Failed to fetch block data' },
      { status: 500 }
    );
  }
} 