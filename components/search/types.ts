// Common types for search components

export interface SearchSuggestion {
  type: 'address' | 'transaction' | 'token' | 'program' | 'recent_global' | 'recent_user';
  value: string;
  label?: string;
  
  // Entity-specific metadata
  lastUpdate?: string;     // ISO timestamp of last activity
  balance?: number;        // For accounts: SOL balance
  price?: number;          // For tokens: current price
  volume?: number;         // For tokens: 24h volume
  usageCount?: number;     // For programs: invocation count
  actionCount?: number;    // General action/transaction count
  status?: string;         // For transactions: success/failure
  amount?: number;         // For transactions: value involved
  
  // Additional metadata container
  metadata?: {
    isRecent?: boolean;    // Flag for recent search entries
    scope?: 'global' | 'user';  // Scope for recent searches
    [key: string]: any;    // Flexible container for entity-specific data
  };
}

export interface SearchSettings {
  networks: string[];
  dataTypes: ('transactions' | 'blocks' | 'programs' | 'tokens')[];
  sortBy: 'relevance' | 'date' | 'amount';
  sortOrder: 'asc' | 'desc';
  dateRange?: {
    start: string;
    end: string;
  };
  status?: 'success' | 'failed';
  minAmount?: number;
  maxAmount?: number;
}