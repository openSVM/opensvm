import { readFileSync } from 'fs';
import { NextResponse } from 'next/server';
import { join } from 'path';

export async function GET() {
  try {
    const faviconPath = join(process.cwd(), 'public', 'favicon.svg');
    const faviconContent = readFileSync(faviconPath);

    return new NextResponse(faviconContent, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Error serving favicon:', error);
    return new NextResponse(null, { status: 404 });
  }
}