export const SOLANA_RPC_KNOWLEDGE = {
  getAccountInfo: 'Returns all information associated with the account',
  getBalance: 'Returns the SOL balance of an account',
  getTransaction: 'Get transaction details by signature',
  getSignaturesForAddress: 'Get confirmed signatures for address history',
  getTokenAccountBalance: 'Get token balance for a specific token account',
  getTokenAccountsByOwner: 'Get all token accounts owned by an address',
  getProgramAccounts: 'Get all accounts owned by a program',
  getBlock: 'Get block information by slot',
  getRecentPrioritizationFees: 'Get recent priority fee levels',
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