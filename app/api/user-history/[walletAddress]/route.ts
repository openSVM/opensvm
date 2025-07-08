/**
 * User History API Endpoints
 * Handles server-side user history operations with Qdrant storage and authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { UserHistoryEntry } from '@/types/user-history';
import { validateWalletAddress, sanitizeInput } from '@/lib/user-history-utils';
import { getSessionFromCookie } from '@/lib/auth-server';
import { 
  storeHistoryEntry, 
  getUserHistory, 
  deleteUserHistory,
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

    // Get query parameters
    const url = new URL(request.url);
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '100'), 1000); // Cap at 1000
    const offset = Math.max(parseInt(url.searchParams.get('offset') || '0'), 0);
    const pageType = sanitizeInput(url.searchParams.get('pageType') || '');

    // Get user history from Qdrant
    const result = await getUserHistory(validatedAddress, {
      limit,
      offset,
      pageType: pageType || undefined
    });

    return NextResponse.json({
      history: result.history,
      total: result.total,
      limit,
      offset,
      hasMore: offset + limit < result.total
    });
  } catch (error) {
    console.error('Error fetching user history:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
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
    
    // Sanitize input fields
    const entry: UserHistoryEntry = {
      ...body,
      walletAddress: validatedAddress,
      timestamp: Date.now(),
      id: `${validatedAddress}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      path: sanitizeInput(body.path || ''),
      pageTitle: sanitizeInput(body.pageTitle || ''),
      userAgent: sanitizeInput(body.userAgent || ''),
      referrer: sanitizeInput(body.referrer || '')
    };

    // Validate required fields
    if (!entry.path || !entry.pageType || !entry.pageTitle) {
      return NextResponse.json({ 
        error: 'Missing required fields: path, pageType, pageTitle' 
      }, { status: 400 });
    }

    // Validate pageType
    const validPageTypes = ['transaction', 'account', 'block', 'program', 'token', 'validator', 'analytics', 'search', 'other'];
    if (!validPageTypes.includes(entry.pageType)) {
      return NextResponse.json({ error: 'Invalid pageType' }, { status: 400 });
    }

    // Store in Qdrant
    await storeHistoryEntry(entry);

    // Get updated total count
    const result = await getUserHistory(validatedAddress, { limit: 1 });

    return NextResponse.json({ 
      success: true, 
      entry,
      total: result.total
    });
  } catch (error) {
    console.error('Error adding history entry:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
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

    // Delete user history from Qdrant
    await deleteUserHistory(validatedAddress);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error clearing user history:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}