/**
 * User Profile API Endpoints
 * Handles user profile operations
 */

import { NextRequest, NextResponse } from 'next/server';
import { UserProfile, UserHistoryEntry, UserHistoryStats } from '@/types/user-history';

// In a real implementation, this would be stored in a database
const serverProfileStore = new Map<string, UserProfile>();
const serverHistoryStore = new Map<string, UserHistoryEntry[]>();

function calculateStats(history: UserHistoryEntry[]): UserHistoryStats {
  if (history.length === 0) {
    return {
      totalVisits: 0,
      uniquePages: 0,
      mostVisitedPageType: 'other',
      averageSessionDuration: 0,
      lastVisit: 0,
      firstVisit: 0,
      dailyActivity: [],
      pageTypeDistribution: []
    };
  }

  const uniquePaths = new Set(history.map(h => h.path));
  const pageTypes = history.reduce((acc, h) => {
    acc[h.pageType] = (acc[h.pageType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const mostVisitedType = Object.entries(pageTypes).reduce((a, b) => 
    pageTypes[a[0]] > pageTypes[b[0]] ? a : b
  )[0];

  // Calculate daily activity
  const dailyActivity = history.reduce((acc, h) => {
    const date = new Date(h.timestamp).toISOString().split('T')[0];
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const dailyActivityArray = Object.entries(dailyActivity).map(([date, visits]) => ({
    date,
    visits
  })).sort((a, b) => a.date.localeCompare(b.date));

  // Calculate page type distribution
  const totalVisits = history.length;
  const pageTypeDistribution = Object.entries(pageTypes).map(([type, count]) => ({
    type,
    count,
    percentage: (count / totalVisits) * 100
  })).sort((a, b) => b.count - a.count);

  return {
    totalVisits: history.length,
    uniquePages: uniquePaths.size,
    mostVisitedPageType: mostVisitedType,
    averageSessionDuration: 0, // TODO: Calculate based on session data
    lastVisit: Math.max(...history.map(h => h.timestamp)),
    firstVisit: Math.min(...history.map(h => h.timestamp)),
    dailyActivity: dailyActivityArray,
    pageTypeDistribution
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: { walletAddress: string } }
) {
  try {
    const walletAddress = params.walletAddress;
    
    if (!walletAddress) {
      return NextResponse.json({ error: 'Wallet address is required' }, { status: 400 });
    }

    // Get profile from store
    let profile = serverProfileStore.get(walletAddress);
    
    // If profile doesn't exist, create a basic one
    if (!profile) {
      profile = {
        walletAddress,
        isPublic: true,
        createdAt: Date.now(),
        lastActive: Date.now(),
        stats: calculateStats([]),
        history: []
      };
    }

    // Get user history and update stats
    const history = serverHistoryStore.get(walletAddress) || [];
    profile.stats = calculateStats(history);
    profile.history = history;

    return NextResponse.json({ profile });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { walletAddress: string } }
) {
  try {
    const walletAddress = params.walletAddress;
    
    if (!walletAddress) {
      return NextResponse.json({ error: 'Wallet address is required' }, { status: 400 });
    }

    const body = await request.json();
    
    // Get existing profile or create new one
    let profile = serverProfileStore.get(walletAddress);
    
    if (!profile) {
      profile = {
        walletAddress,
        isPublic: true,
        createdAt: Date.now(),
        lastActive: Date.now(),
        stats: calculateStats([]),
        history: []
      };
    }

    // Update profile fields
    if (body.displayName !== undefined) {
      profile.displayName = body.displayName;
    }
    if (body.avatar !== undefined) {
      profile.avatar = body.avatar;
    }
    if (body.isPublic !== undefined) {
      profile.isPublic = body.isPublic;
    }
    
    profile.lastActive = Date.now();

    // Store updated profile
    serverProfileStore.set(walletAddress, profile);

    return NextResponse.json({ profile });
  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}