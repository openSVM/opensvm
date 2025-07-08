/**
 * User History Types
 * Defines the data structures for tracking user browsing history
 */

export interface UserHistoryEntry {
  id: string;
  walletAddress: string;
  timestamp: number;
  path: string;
  pageType: 'transaction' | 'account' | 'block' | 'program' | 'token' | 'validator' | 'analytics' | 'search' | 'other';
  pageTitle: string;
  metadata?: {
    transactionId?: string;
    accountAddress?: string;
    blockNumber?: number;
    programId?: string;
    tokenMint?: string;
    validatorAddress?: string;
    searchQuery?: string;
    [key: string]: any;
  };
  userAgent?: string;
  referrer?: string;
}

export interface UserHistoryStats {
  totalVisits: number;
  uniquePages: number;
  mostVisitedPageType: string;
  averageSessionDuration: number;
  lastVisit: number;
  firstVisit: number;
  dailyActivity: Array<{
    date: string;
    visits: number;
  }>;
  pageTypeDistribution: Array<{
    type: string;
    count: number;
    percentage: number;
  }>;
}

export interface UserProfile {
  walletAddress: string;
  displayName?: string;
  avatar?: string;
  isPublic: boolean;
  createdAt: number;
  lastActive: number;
  stats: UserHistoryStats;
  history: UserHistoryEntry[];
}

export interface HistoryExportData {
  userProfile: UserProfile;
  exportTimestamp: number;
  totalEntries: number;
  dateRange: {
    start: number;
    end: number;
  };
}