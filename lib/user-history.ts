/**
 * User History Storage Service
 * Handles storage and retrieval of user history data
 */

import { UserHistoryEntry, UserProfile, UserHistoryStats } from '@/types/user-history';

const STORAGE_KEY = 'opensvm_user_history';
const PROFILE_KEY = 'opensvm_user_profiles';

export class UserHistoryService {
  /**
   * Add a new history entry for a user
   */
  static addHistoryEntry(entry: UserHistoryEntry): void {
    try {
      const existingHistory = this.getUserHistory(entry.walletAddress);
      const updatedHistory = [entry, ...existingHistory].slice(0, 10000); // Keep last 10k entries
      
      localStorage.setItem(
        `${STORAGE_KEY}_${entry.walletAddress}`,
        JSON.stringify(updatedHistory)
      );
      
      // Update user profile
      this.updateUserProfile(entry.walletAddress, entry);
    } catch (error) {
      console.error('Error adding history entry:', error);
    }
  }

  /**
   * Get user history
   */
  static getUserHistory(walletAddress: string): UserHistoryEntry[] {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}_${walletAddress}`);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error getting user history:', error);
      return [];
    }
  }

  /**
   * Get user profile with stats
   */
  static getUserProfile(walletAddress: string): UserProfile | null {
    try {
      const stored = localStorage.getItem(`${PROFILE_KEY}_${walletAddress}`);
      if (!stored) return null;
      
      const profile: UserProfile = JSON.parse(stored);
      const history = this.getUserHistory(walletAddress);
      
      // Update stats
      profile.stats = this.calculateStats(history);
      profile.history = history;
      
      return profile;
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  }

  /**
   * Update user profile
   */
  private static updateUserProfile(walletAddress: string, entry: UserHistoryEntry): void {
    try {
      let profile = this.getUserProfile(walletAddress);
      
      if (!profile) {
        profile = {
          walletAddress,
          isPublic: true,
          createdAt: Date.now(),
          lastActive: Date.now(),
          stats: {} as UserHistoryStats,
          history: []
        };
      }
      
      profile.lastActive = Date.now();
      
      localStorage.setItem(`${PROFILE_KEY}_${walletAddress}`, JSON.stringify(profile));
    } catch (error) {
      console.error('Error updating user profile:', error);
    }
  }

  /**
   * Calculate user statistics
   */
  private static calculateStats(history: UserHistoryEntry[]): UserHistoryStats {
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

  /**
   * Get all user profiles (for public listing)
   */
  static getAllPublicProfiles(): UserProfile[] {
    try {
      const profiles: UserProfile[] = [];
      
      // Get all profile keys
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(PROFILE_KEY)) {
          const walletAddress = key.replace(`${PROFILE_KEY}_`, '');
          const profile = this.getUserProfile(walletAddress);
          if (profile && profile.isPublic) {
            profiles.push(profile);
          }
        }
      }
      
      return profiles.sort((a, b) => b.lastActive - a.lastActive);
    } catch (error) {
      console.error('Error getting all profiles:', error);
      return [];
    }
  }

  /**
   * Export user history as CSV
   */
  static exportUserHistoryAsCSV(walletAddress: string): string {
    const history = this.getUserHistory(walletAddress);
    
    const headers = [
      'Timestamp',
      'Date',
      'Time',
      'Page Type',
      'Page Title',
      'Path',
      'Transaction ID',
      'Account Address',
      'Block Number',
      'Program ID',
      'Token Mint',
      'Validator Address',
      'Search Query',
      'User Agent',
      'Referrer'
    ];

    const rows = history.map(entry => [
      entry.timestamp,
      new Date(entry.timestamp).toISOString().split('T')[0],
      new Date(entry.timestamp).toTimeString().split(' ')[0],
      entry.pageType,
      entry.pageTitle,
      entry.path,
      entry.metadata?.transactionId || '',
      entry.metadata?.accountAddress || '',
      entry.metadata?.blockNumber || '',
      entry.metadata?.programId || '',
      entry.metadata?.tokenMint || '',
      entry.metadata?.validatorAddress || '',
      entry.metadata?.searchQuery || '',
      entry.userAgent || '',
      entry.referrer || ''
    ]);

    return [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');
  }

  /**
   * Clear user history
   */
  static clearUserHistory(walletAddress: string): void {
    try {
      localStorage.removeItem(`${STORAGE_KEY}_${walletAddress}`);
      localStorage.removeItem(`${PROFILE_KEY}_${walletAddress}`);
    } catch (error) {
      console.error('Error clearing user history:', error);
    }
  }
}