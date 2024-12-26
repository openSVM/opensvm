import { NextResponse } from 'next/server';
import { connection } from '@/lib/solana';

export async function GET(request: Request) {
  try {
    const slot = request.url.split('/').pop();
    if (!slot) {
      return NextResponse.json(
        { error: 'Slot parameter is required' },
        { status: 400 }
      );
    }

    const slotNumber = parseInt(slot);
    if (isNaN(slotNumber)) {
      return NextResponse.json(
        { error: 'Invalid slot number' },
        { status: 400 }
      );
    }

    const [block, blockTime] = await Promise.all([
      connection.getBlock(slotNumber, { maxSupportedTransactionVersion: 0 }),
      connection.getBlockTime(slotNumber),
    ]);

    if (!block) {
      return NextResponse.json(
        { error: 'Block not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ block, blockTime });
  } catch (error) {
    console.error('Error fetching block data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch block data' },
      { status: 500 }
    );
  }
} 