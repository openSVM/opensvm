/**
 * Share System Types
 * Defines data structures for the universal ref link and OG image generation system
 */

export type EntityType = 'transaction' | 'account' | 'program' | 'user';

export interface ShareEntry {
  id: string;
  shareCode: string;
  referrerAddress: string;
  entityType: EntityType;
  entityId: string;
  ogImageUrl: string;
  title: string;
  description: string;
  aiAnalysis?: string;
  metadata?: {
    hashtags?: string[];
    highlights?: string[];
    stats?: Record<string, any>;
  };
  clicks: number;
  conversions: number;
  timestamp: number;
  expiresAt?: number;
}

export interface GenerateShareRequest {
  entityType: EntityType;
  entityId: string;
  referrerAddress?: string;
}

export interface GenerateShareResponse {
  shareUrl: string;
  shareCode: string;
  ogImageUrl: string;
  title: string;
  description: string;
  aiInsights?: string;
  preview: {
    type: EntityType;
    data: any;
  };
}

export interface ShareClickEntry {
  id: string;
  shareCode: string;
  clickerAddress?: string;
  userAgent?: string;
  referrer?: string;
  timestamp: number;
  converted: boolean;
}

export interface ShareStats {
  totalShares: number;
  totalClicks: number;
  totalConversions: number;
  sharesByType: Record<EntityType, number>;
  topShares: ShareEntry[];
  recentShares: ShareEntry[];
  conversionRate: number;
}

// OG Image generation types
export interface OGImageData {
  entityType: EntityType;
  entityId: string;
  data: TransactionOGData | AccountOGData | ProgramOGData | UserOGData;
}

export interface TransactionOGData {
  hash: string;
  status: 'success' | 'error';
  amount?: number;
  fee: number;
  timestamp: number;
  programCount: number;
  from?: string;
  to?: string;
}

export interface AccountOGData {
  address: string;
  balance: number;
  tokenCount: number;
  transactionCount: number;
  firstActivity?: number;
  lastActivity?: number;
  activityData?: Array<{ date: string; count: number }>;
}

export interface ProgramOGData {
  programId: string;
  name?: string;
  transactionCount: number;
  userCount: number;
  volume?: number;
  successRate: number;
  dailyActivity?: Array<{ date: string; count: number }>;
}

export interface UserOGData {
  walletAddress: string;
  displayName?: string;
  avatar?: string;
  followers: number;
  following: number;
  pageViews: number;
  totalVisits: number;
  joinDate: number;
  activityHeatmap?: Array<{ date: string; value: number }>;
}
