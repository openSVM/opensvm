/**
 * User Profile API Endpoints
 * Handles user profile operations
 */

import { NextRequest, NextResponse } from 'next/server';
import { UserProfile, UserHistoryEntry } from '@/types/user-history';
import { calculateStats, validateWalletAddress } from '@/lib/user-history-utils';

// In a real implementation, this would be stored in a database
// TODO: Replace with proper database storage for production
// TODO: Implement data persistence across server restarts
// TODO: Add proper indexing for wallet addresses and timestamps
// TODO: Consider using Redis for caching frequently accessed profiles
const serverProfileStore = new Map<string, UserProfile>();
const serverHistoryStore = new Map<string, UserHistoryEntry[]>();

// Basic authentication check
function isValidRequest(request: NextRequest): boolean {
  // TODO: Implement proper authentication (JWT, API key, etc.)
  // For now, basic rate limiting could be added here
  return true;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { walletAddress: string } }
) {
  try {
    // Basic authentication check
    if (!isValidRequest(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const walletAddress = params.walletAddress;
    
    // Validate wallet address
    const validatedAddress = validateWalletAddress(walletAddress);
    if (!validatedAddress) {
      return NextResponse.json({ error: 'Invalid wallet address format' }, { status: 400 });
    }

    // Get profile from store
    let profile = serverProfileStore.get(validatedAddress);
    
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
    const history = serverHistoryStore.get(validatedAddress) || [];
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
    // Basic authentication check
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
    let profile = serverProfileStore.get(validatedAddress);
    
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

    // Update profile fields with basic sanitization
    if (body.displayName !== undefined) {
      profile.displayName = String(body.displayName).trim().slice(0, 100); // Limit length
    }
    if (body.avatar !== undefined) {
      profile.avatar = String(body.avatar).trim().slice(0, 500); // Limit length
    }
    if (body.isPublic !== undefined) {
      profile.isPublic = Boolean(body.isPublic);
    }
    
    profile.lastActive = Date.now();

    // Store updated profile
    serverProfileStore.set(validatedAddress, profile);

    return NextResponse.json({ profile });
  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}