/**
 * User History API Endpoints
 * Handles server-side user history operations
 */

import { NextRequest, NextResponse } from 'next/server';
import { UserHistoryEntry } from '@/types/user-history';
import { validateWalletAddress, sanitizeInput } from '@/lib/user-history-utils';

// In a real implementation, this would be stored in a database
// TODO: Replace with proper database storage for production
// TODO: Implement data persistence across server restarts
// TODO: Add proper indexing for wallet addresses and timestamps
// TODO: Consider using Redis for caching frequently accessed data
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

    // Get query parameters
    const url = new URL(request.url);
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '100'), 1000); // Cap at 1000
    const offset = Math.max(parseInt(url.searchParams.get('offset') || '0'), 0);
    const pageType = sanitizeInput(url.searchParams.get('pageType') || '');

    // Get user history from store
    let history = serverHistoryStore.get(validatedAddress) || [];
    
    // Filter by page type if specified
    if (pageType) {
      history = history.filter(entry => entry.pageType === pageType);
    }

    // Apply pagination
    const paginatedHistory = history.slice(offset, offset + limit);

    return NextResponse.json({
      history: paginatedHistory,
      total: history.length,
      limit,
      offset,
      hasMore: offset + limit < history.length
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

    // Get existing history or create new array
    const existingHistory = serverHistoryStore.get(validatedAddress) || [];
    
    // Add new entry and keep only last 10,000 entries
    const updatedHistory = [entry, ...existingHistory].slice(0, 10000);
    
    // Store updated history
    serverHistoryStore.set(validatedAddress, updatedHistory);

    return NextResponse.json({ 
      success: true, 
      entry,
      total: updatedHistory.length 
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

    // Clear user history
    serverHistoryStore.delete(validatedAddress);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error clearing user history:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}