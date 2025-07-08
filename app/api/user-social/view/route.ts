/**
 * API endpoint for tracking profile views
 */

import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { targetAddress } = await request.json();

    if (!targetAddress || typeof targetAddress !== 'string') {
      return NextResponse.json({ error: 'Invalid target address' }, { status: 400 });
    }

    // For now, just return success without storing the view
    // The actual view tracking can be implemented when Qdrant is properly configured
    console.log(`Profile view tracked for ${targetAddress}`);
    
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error tracking profile view:', error);
    // Don't fail the page load if view tracking fails
    return NextResponse.json({ success: true });
  }
}