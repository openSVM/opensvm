/**
 * User History API Endpoints
 * Handles server-side user history operations
 */

import { NextRequest, NextResponse } from 'next/server';
import { UserHistoryEntry } from '@/types/user-history';

// In a real implementation, this would be stored in a database
// For now, we'll use a simple in-memory store as a fallback
const serverHistoryStore = new Map<string, UserHistoryEntry[]>();

export async function GET(
  request: NextRequest,
  { params }: { params: { walletAddress: string } }
) {
  try {
    const walletAddress = params.walletAddress;
    
    if (!walletAddress) {
      return NextResponse.json({ error: 'Wallet address is required' }, { status: 400 });
    }

    // Get query parameters
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '100');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const pageType = url.searchParams.get('pageType');

    // Get user history from store
    let history = serverHistoryStore.get(walletAddress) || [];
    
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
    const walletAddress = params.walletAddress;
    
    if (!walletAddress) {
      return NextResponse.json({ error: 'Wallet address is required' }, { status: 400 });
    }

    const body = await request.json();
    const entry: UserHistoryEntry = {
      ...body,
      walletAddress,
      timestamp: Date.now(),
      id: `${walletAddress}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };

    // Validate required fields
    if (!entry.path || !entry.pageType || !entry.pageTitle) {
      return NextResponse.json({ 
        error: 'Missing required fields: path, pageType, pageTitle' 
      }, { status: 400 });
    }

    // Get existing history or create new array
    const existingHistory = serverHistoryStore.get(walletAddress) || [];
    
    // Add new entry and keep only last 10,000 entries
    const updatedHistory = [entry, ...existingHistory].slice(0, 10000);
    
    // Store updated history
    serverHistoryStore.set(walletAddress, updatedHistory);

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
    const walletAddress = params.walletAddress;
    
    if (!walletAddress) {
      return NextResponse.json({ error: 'Wallet address is required' }, { status: 400 });
    }

    // Clear user history
    serverHistoryStore.delete(walletAddress);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error clearing user history:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}