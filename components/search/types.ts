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
  
  // Enhanced metadata for more detailed display
  symbol?: string;         // Token symbol
  name?: string;           // Full name for tokens/programs
  marketCap?: number;      // Token market capitalization
  priceChange24h?: number; // 24h price change percentage
  supply?: number;         // Token total supply
  holders?: number;        // Number of token holders
  decimals?: number;       // Token decimals
  
  // Address/Account specific
  tokensHeld?: number;     // Number of different tokens held
  nftCount?: number;       // Number of NFTs owned
  stakeBalance?: number;   // Staked SOL amount
  recentTxCount?: number;  // Recent transaction count (last 7 days)
  
  // Program specific
  deployer?: string;       // Program deployer address
  deploymentDate?: string; // When program was deployed
  programType?: string;    // Type of program (e.g., "DeFi", "NFT", "Gaming")
  weeklyInvocations?: number; // Weekly invocation count
  
  // Transaction specific
  blockHeight?: number;    // Block height
  participants?: string[]; // Transaction participants
  fees?: number;          // Transaction fees
  instructions?: number;   // Number of instructions
  success?: boolean;      // Transaction success status
  
  // Additional metadata container
  metadata?: {
    isRecent?: boolean;    // Flag for recent search entries
    scope?: 'global' | 'user';  // Scope for recent searches
    verified?: boolean;    // Verified token/program status
    risk?: 'low' | 'medium' | 'high'; // Risk assessment
    category?: string;     // Entity category
    description?: string;  // Entity description
    [key: string]: any;    // Flexible container for additional data
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