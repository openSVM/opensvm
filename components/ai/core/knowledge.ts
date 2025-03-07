export const SOLANA_RPC_KNOWLEDGE = {
  // Network Performance
  getRecentPerformanceSamples: 'Get recent performance samples including TPS, block time, and network load',
  getSlot: 'Get the current slot number in the blockchain',
  getBlockTime: 'Get the estimated production time of a block',
  getEpochInfo: 'Get information about the current epoch including slots and progress',
  getInflationRate: 'Get the current inflation rate',
  getVoteAccounts: 'Get information about current validator vote accounts',
  
  // Account Information
  getAccountInfo: 'Returns all information associated with the account',
  getBalance: 'Returns the SOL balance of an account',
  getTokenAccountBalance: 'Get token balance for a specific token account',
  getTokenAccountsByOwner: 'Get all token accounts owned by an address',
  getProgramAccounts: 'Get all accounts owned by a program',
  
  // Transaction Information
  getTransaction: 'Get transaction details by signature',
  getSignaturesForAddress: 'Get confirmed signatures for address history',
  getBlock: 'Get block information by slot',
  getRecentPrioritizationFees: 'Get recent priority fee levels',
  
  // Real-time Subscriptions
  blockSubscribe: 'Subscribe to new blocks and transactions in real-time',
  logsSubscribe: 'Subscribe to program logs in real-time'
};

export const PUMPFUN_KNOWLEDGE = {
  programId: '6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P',
  actions: {
    create: 'Creates a new token with bonding curve',
    buy: 'Purchases tokens based on bonding curve price',
    sell: 'Sells tokens based on bonding curve price'
  },
  components: {
    mint: 'The created token address',
    bondingCurve: 'Account defining token price',
    associatedBondingCurve: 'Account holding tokens for trading'
  }
};

export const NETWORK_PERFORMANCE_KNOWLEDGE = {
  tps: {
    description: 'Transactions Per Second (TPS) measures the network\'s processing capacity',
    ranges: {
      low: 'Normal operation (< 500 TPS)',
      moderate: 'Increased activity (500-1500 TPS)',
      high: 'Heavy usage (1500-3000 TPS)',
      veryHigh: 'Peak performance (> 3000 TPS)'
    }
  },
  blockTime: {
    description: 'Time between blocks being produced',
    target: '400ms',
    range: '300ms to 600ms typical'
  },
  networkLoad: {
    description: 'Percentage of network capacity being utilized',
    ranges: {
      light: 'Normal operation (< 30% capacity)',
      moderate: 'Healthy activity (30-60% capacity)',
      heavy: 'High demand (60-80% capacity)',
      congested: 'Near maximum capacity (> 80%)'
    }
  }
};
