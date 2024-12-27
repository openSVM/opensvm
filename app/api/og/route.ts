import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const title = searchParams.get('title') ?? 'OPENSVM';

    // Return a simple JSON response for now
    return NextResponse.json({
      title,
      description: 'Solana Block Explorer',
    });
  } catch (e) {
    console.error(e);
    return new Response('Failed to generate OpenGraph data', { status: 500 });
  }
} 