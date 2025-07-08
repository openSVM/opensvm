/**
 * API endpoint for tracking profile views
 */

import { NextResponse } from 'next/server';
import { qdrantClient } from '@/lib/qdrant';
import { v4 as uuidv4 } from 'uuid';
import { getAuthenticatedSession } from '@/lib/auth-server';

export async function POST(request: Request) {
  try {
    const { targetAddress } = await request.json();

    if (!targetAddress || typeof targetAddress !== 'string') {
      return NextResponse.json({ error: 'Invalid target address' }, { status: 400 });
    }

    // Try to get authenticated session, but don't require it for viewing
    const session = await getAuthenticatedSession(request).catch(() => null);
    const viewerAddress = session?.walletAddress;

    // Don't count views if viewing your own profile
    if (viewerAddress === targetAddress) {
      return NextResponse.json({ success: true });
    }

    // Record the page view
    const pageView = {
      id: uuidv4(),
      viewerAddress: viewerAddress || 'anonymous',
      targetAddress: targetAddress,
      timestamp: Date.now(),
      userAgent: request.headers.get('user-agent') || undefined
    };

    await qdrantClient.upsert('user_page_views', {
      points: [
        {
          id: pageView.id,
          vector: Array(384).fill(0),
          payload: pageView
        }
      ]
    });

    // Update profile view count for target user
    const targetProfileResult = await qdrantClient.search('user_profiles', {
      vector: Array(384).fill(0),
      filter: {
        must: [{ key: 'walletAddress', match: { value: targetAddress } }]
      },
      limit: 1
    });

    if (targetProfileResult.length > 0) {
      const targetProfile = targetProfileResult[0].payload;
      
      // Ensure socialStats exists
      if (!targetProfile.socialStats) {
        targetProfile.socialStats = {
          visitsByUsers: 0,
          followers: 0,
          following: 0,
          likes: 0,
          profileViews: 0
        };
      }

      const updatedProfile = {
        ...targetProfile,
        socialStats: {
          ...targetProfile.socialStats,
          profileViews: (targetProfile.socialStats?.profileViews || 0) + 1,
          visitsByUsers: viewerAddress && viewerAddress !== 'anonymous' 
            ? (targetProfile.socialStats?.visitsByUsers || 0) + 1
            : (targetProfile.socialStats?.visitsByUsers || 0)
        }
      };

      await qdrantClient.upsert('user_profiles', {
        points: [
          {
            id: targetProfile.walletAddress,
            vector: Array(384).fill(0),
            payload: updatedProfile
          }
        ]
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error tracking profile view:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}