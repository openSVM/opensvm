/**
 * User Profile API Endpoints
 * Handles user profile operations with Qdrant storage and authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { UserProfile } from '@/types/user-history';
import { calculateStats, validateWalletAddress, sanitizeInput } from '@/lib/user-history-utils';
import { getSessionFromCookie } from '@/lib/auth-server';
import { 
  getUserProfile,
  storeUserProfile,
  getUserHistory,
  checkQdrantHealth
} from '@/lib/qdrant';

// Authentication check using session validation
function isValidRequest(request: NextRequest): boolean {
  try {
    const session = getSessionFromCookie();
    if (!session) return false;
    
    // Check if session is expired
    if (Date.now() > session.expiresAt) return false;
    
    return true;
  } catch (error) {
    console.error('Session validation error:', error);
    return false;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { walletAddress: string } }
) {
  try {
    // Check Qdrant health first
    const isHealthy = await checkQdrantHealth();
    if (!isHealthy) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
    }

    // Authentication check
    if (!isValidRequest(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const walletAddress = params.walletAddress;
    
    // Validate wallet address
    const validatedAddress = validateWalletAddress(walletAddress);
    if (!validatedAddress) {
      return NextResponse.json({ error: 'Invalid wallet address format' }, { status: 400 });
    }

    // Get profile from Qdrant
    let profile = await getUserProfile(validatedAddress);
    
    // If profile doesn't exist, create a basic one
    if (!profile) {
      profile = {
        walletAddress: validatedAddress,
        isPublic: true,
        createdAt: Date.now(),
        lastActive: Date.now(),
        stats: calculateStats([]),
        history: []
      };
    }

    // Get user history and update stats using centralized function
    const historyResult = await getUserHistory(validatedAddress, { limit: 10000 });
    profile.stats = calculateStats(historyResult.history);
    profile.history = historyResult.history;

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
    // Check Qdrant health first
    const isHealthy = await checkQdrantHealth();
    if (!isHealthy) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
    }

    // Authentication check
    if (!isValidRequest(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const walletAddress = params.walletAddress;
    
    // Validate wallet address
    const validatedAddress = validateWalletAddress(walletAddress);
    if (!validatedAddress) {
      return NextResponse.json({ error: 'Invalid wallet address format' }, { status: 400 });
    }

    const body = await request.json();
    
    // Get existing profile or create new one
    let profile = await getUserProfile(validatedAddress);
    
    if (!profile) {
      profile = {
        walletAddress: validatedAddress,
        isPublic: true,
        createdAt: Date.now(),
        lastActive: Date.now(),
        stats: calculateStats([]),
        history: []
      };
    }

    // Update profile fields with proper sanitization
    if (body.displayName !== undefined) {
      profile.displayName = sanitizeInput(String(body.displayName)).slice(0, 100); // Limit length
    }
    if (body.avatar !== undefined) {
      profile.avatar = sanitizeInput(String(body.avatar)).slice(0, 500); // Limit length
    }
    if (body.bio !== undefined) {
      profile.bio = sanitizeInput(String(body.bio)).slice(0, 500); // Limit length
    }
    if (body.isPublic !== undefined) {
      profile.isPublic = Boolean(body.isPublic);
    }
    
    profile.lastActive = Date.now();

    // Store updated profile in Qdrant
    await storeUserProfile(profile);

    return NextResponse.json({ profile });
  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}