// RPC endpoints with auth headers
export const opensvmRpcEndpoints = [
  {
    url: process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com", // Use devnet as fallback
    headers: {}, // No special headers needed for devnet
    priority: 1
  },
  {
    url: "https://api.testnet.solana.com", // Add testnet as backup
    headers: {},
    priority: 2
  },
  {
    url: "https://rpc.ankr.com/solana_devnet", // Ankr devnet
    headers: {},
    priority: 3
  },
  {
    url: "https://api.devnet.rpcpool.com", // RPC Pool devnet
    headers: {},
    priority: 4
  }
];

// Helper to get endpoint URLs in priority order
export function getRpcEndpoints(): string[] {
  // Sort by priority and filter out any undefined or empty URLs
  return opensvmRpcEndpoints
    .sort((a, b) => (a.priority || 999) - (b.priority || 999))
    .map(endpoint => endpoint.url)
    .filter(url => url && url.length > 0);
}

// Helper to get headers for an endpoint with additional performance headers
export function getRpcHeaders(url: string): Record<string, string> {
  const endpoint = opensvmRpcEndpoints.find(e => e.url === url);
  const commonHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };

  // Add endpoint-specific headers
  const headers = {
    ...commonHeaders,
    ...(endpoint?.headers || {})
  };

  // Remove any undefined or null headers
  Object.keys(headers).forEach(key => {
    if (headers[key] === undefined || headers[key] === null || headers[key] === '') {
      delete headers[key];
    }
  });

  return headers;
}