/**
 * History Tracking Hook
 * Tracks user page visits for logged-in users
 */

'use client';

import { useEffect, useCallback } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useWallet } from '@solana/wallet-adapter-react';
import { UserHistoryEntry } from '@/types/user-history';

// Helper function to determine page type from path
function getPageType(path: string): UserHistoryEntry['pageType'] {
  if (path.includes('/tx/') || path.includes('/transaction/')) return 'transaction';
  if (path.includes('/account/') || path.includes('/address/')) return 'account';
  if (path.includes('/block/') || path.includes('/blocks/')) return 'block';
  if (path.includes('/program/')) return 'program';
  if (path.includes('/token/')) return 'token';
  if (path.includes('/validator/')) return 'validator';
  if (path.includes('/analytics')) return 'analytics';
  if (path.includes('/search')) return 'search';
  return 'other';
}

// Helper function to extract metadata from path
function extractMetadata(path: string, pageType: UserHistoryEntry['pageType']) {
  const metadata: UserHistoryEntry['metadata'] = {};
  
  switch (pageType) {
    case 'transaction':
      const txMatch = path.match(/\/tx\/([^\/]+)|\/transaction\/([^\/]+)/);
      if (txMatch) {
        metadata.transactionId = txMatch[1] || txMatch[2];
      }
      break;
    case 'account':
      const accountMatch = path.match(/\/account\/([^\/]+)|\/address\/([^\/]+)/);
      if (accountMatch) {
        metadata.accountAddress = accountMatch[1] || accountMatch[2];
      }
      break;
    case 'block':
      const blockMatch = path.match(/\/block\/(\d+)/);
      if (blockMatch) {
        metadata.blockNumber = parseInt(blockMatch[1], 10);
      }
      break;
    case 'program':
      const programMatch = path.match(/\/program\/([^\/]+)/);
      if (programMatch) {
        metadata.programId = programMatch[1];
      }
      break;
    case 'token':
      const tokenMatch = path.match(/\/token\/([^\/]+)/);
      if (tokenMatch) {
        metadata.tokenMint = tokenMatch[1];
      }
      break;
    case 'validator':
      const validatorMatch = path.match(/\/validator\/([^\/]+)/);
      if (validatorMatch) {
        metadata.validatorAddress = validatorMatch[1];
      }
      break;
  }
  
  return metadata;
}

// Helper function to get page title from document or path
function getPageTitle(path: string, pageType: UserHistoryEntry['pageType']): string {
  // Try to get from document title first
  if (typeof document !== 'undefined' && document.title) {
    return document.title;
  }
  
  // Fallback to generating title from path
  switch (pageType) {
    case 'transaction':
      const txId = extractMetadata(path, 'transaction').transactionId;
      return txId ? `Transaction ${txId.slice(0, 8)}...` : 'Transaction';
    case 'account':
      const accountId = extractMetadata(path, 'account').accountAddress;
      return accountId ? `Account ${accountId.slice(0, 8)}...` : 'Account';
    case 'block':
      const blockNum = extractMetadata(path, 'block').blockNumber;
      return blockNum ? `Block ${blockNum}` : 'Block';
    case 'program':
      const programId = extractMetadata(path, 'program').programId;
      return programId ? `Program ${programId.slice(0, 8)}...` : 'Program';
    case 'token':
      const tokenMint = extractMetadata(path, 'token').tokenMint;
      return tokenMint ? `Token ${tokenMint.slice(0, 8)}...` : 'Token';
    case 'validator':
      const validatorId = extractMetadata(path, 'validator').validatorAddress;
      return validatorId ? `Validator ${validatorId.slice(0, 8)}...` : 'Validator';
    case 'analytics':
      return 'Analytics';
    case 'search':
      return 'Search';
    default:
      return 'OpenSVM Explorer';
  }
}

export function useHistoryTracking() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { publicKey, connected } = useWallet();

  const trackPageVisit = useCallback(async (path: string, searchQuery?: string) => {
    if (!connected || !publicKey) return;

    const walletAddress = publicKey.toBase58();
    const pageType = getPageType(path);
    const metadata = extractMetadata(path, pageType);
    
    // Add search query to metadata if present
    if (searchQuery) {
      metadata.searchQuery = searchQuery;
    }

    const historyEntry: Omit<UserHistoryEntry, 'id' | 'timestamp'> = {
      walletAddress,
      path,
      pageType,
      pageTitle: getPageTitle(path, pageType),
      metadata,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      referrer: typeof document !== 'undefined' ? document.referrer : undefined
    };

    try {
      // Store locally first
      const existingHistory = JSON.parse(
        localStorage.getItem(`opensvm_user_history_${walletAddress}`) || '[]'
      );
      
      const newEntry = {
        ...historyEntry,
        id: `${walletAddress}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now()
      };
      
      const updatedHistory = [newEntry, ...existingHistory].slice(0, 10000);
      localStorage.setItem(`opensvm_user_history_${walletAddress}`, JSON.stringify(updatedHistory));

      // Also send to server API (fire and forget)
      fetch(`/api/user-history/${walletAddress}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(historyEntry)
      }).catch(error => {
        console.warn('Failed to sync history to server:', error);
      });

    } catch (error) {
      console.error('Error tracking page visit:', error);
    }
  }, [connected, publicKey]);

  // Track page visits
  useEffect(() => {
    if (!connected || !publicKey) return;

    const path = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '');
    const searchQuery = searchParams.get('q') || searchParams.get('search') || undefined;
    
    // Small delay to ensure page is fully loaded
    const timer = setTimeout(() => {
      trackPageVisit(path, searchQuery);
    }, 1000);

    return () => clearTimeout(timer);
  }, [pathname, searchParams, trackPageVisit, connected, publicKey]);

  return { trackPageVisit };
}