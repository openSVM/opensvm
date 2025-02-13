// RPC endpoints with auth headers
export const opensvmRpcEndpoints = [
  {
    url: process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com", // Use mainnet as fallback
    headers: {}, // No special headers needed for public RPC
    priority: 1
  },
  {
    url: "https://solana-mainnet.rpc.extrnode.com", // ExtrNode mainnet
    headers: {},
    priority: 2
  },
  {
    url: "https://rpc.ankr.com/solana", // Ankr mainnet
    headers: {},
    priority: 3
  },
  {
    url: "https://solana.public-rpc.com", // Public RPC mainnet
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