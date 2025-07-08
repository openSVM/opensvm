/**
 * API endpoint for liking user profiles
 */

import { NextResponse } from 'next/server';
import { qdrantClient } from '@/lib/qdrant';
import { v4 as uuidv4 } from 'uuid';
import { getAuthenticatedSession } from '@/lib/auth-server';

export async function POST(request: Request) {
  try {
    // Authenticate the user
    const session = await getAuthenticatedSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { targetAddress } = await request.json();

    if (!targetAddress || typeof targetAddress !== 'string') {
      return NextResponse.json({ error: 'Invalid target address' }, { status: 400 });
    }

    if (session.walletAddress === targetAddress) {
      return NextResponse.json({ error: 'Cannot like yourself' }, { status: 400 });
    }

    // Check if already liked
    const existingLikeResult = await qdrantClient.search('user_likes', {
      vector: Array(384).fill(0),
      filter: {
        must: [
          { key: 'likerAddress', match: { value: session.walletAddress } },
          { key: 'targetAddress', match: { value: targetAddress } }
        ]
      },
      limit: 1
    });

    if (existingLikeResult.length > 0) {
      return NextResponse.json({ error: 'Already liked this user' }, { status: 400 });
    }

    // Create like entry
    const likeEntry = {
      id: uuidv4(),
      likerAddress: session.walletAddress,
      targetAddress: targetAddress,
      timestamp: Date.now()
    };

    await qdrantClient.upsert('user_likes', {
      points: [
        {
          id: likeEntry.id,
          vector: Array(384).fill(0),
          payload: likeEntry
        }
      ]
    });

    // Update likes count for target user
    const targetProfileResult = await qdrantClient.search('user_profiles', {
      vector: Array(384).fill(0),
      filter: {
        must: [{ key: 'walletAddress', match: { value: targetAddress } }]
      },
      limit: 1
    });

    if (targetProfileResult.length > 0) {
      const targetProfile = targetProfileResult[0].payload;
      const updatedProfile = {
        ...targetProfile,
        socialStats: {
          ...targetProfile.socialStats,
          likes: (targetProfile.socialStats?.likes || 0) + 1
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
    console.error('Error liking user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}