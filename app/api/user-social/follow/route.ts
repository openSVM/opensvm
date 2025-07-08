/**
 * API endpoint for following users
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
      return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 });
    }

    // Check if already following
    const existingFollowResult = await qdrantClient.search('user_follows', {
      vector: Array(384).fill(0),
      filter: {
        must: [
          { key: 'followerAddress', match: { value: session.walletAddress } },
          { key: 'followingAddress', match: { value: targetAddress } }
        ]
      },
      limit: 1
    });

    if (existingFollowResult.length > 0) {
      return NextResponse.json({ error: 'Already following this user' }, { status: 400 });
    }

    // Create follow relationship
    const followEntry = {
      id: uuidv4(),
      followerAddress: session.walletAddress,
      followingAddress: targetAddress,
      timestamp: Date.now()
    };

    await qdrantClient.upsert('user_follows', {
      points: [
        {
          id: followEntry.id,
          vector: Array(384).fill(0),
          payload: followEntry
        }
      ]
    });

    // Update follower count for target user
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
          followers: (targetProfile.socialStats?.followers || 0) + 1
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

    // Update following count for current user
    const currentProfileResult = await qdrantClient.search('user_profiles', {
      vector: Array(384).fill(0),
      filter: {
        must: [{ key: 'walletAddress', match: { value: session.walletAddress } }]
      },
      limit: 1
    });

    if (currentProfileResult.length > 0) {
      const currentProfile = currentProfileResult[0].payload;
      const updatedProfile = {
        ...currentProfile,
        socialStats: {
          ...currentProfile.socialStats,
          following: (currentProfile.socialStats?.following || 0) + 1
        }
      };

      await qdrantClient.upsert('user_profiles', {
        points: [
          {
            id: currentProfile.walletAddress,
            vector: Array(384).fill(0),
            payload: updatedProfile
          }
        ]
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error following user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}