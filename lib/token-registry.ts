import { Connection, PublicKey } from '@solana/web3.js';

interface TokenInfo {
  symbol: string;
  name: string;
  decimals: number;
}

const TOKEN_LIST_URL = 'https://cdn.jsdelivr.net/gh/solana-labs/token-list@main/src/tokens/solana.tokenlist.json';

let tokenListCache: { [key: string]: TokenInfo } | null = null;

export async function getTokenInfo(connection: Connection, mint: string): Promise<TokenInfo | null> {
  try {
    // Try to get from cache first
    if (!tokenListCache) {
      const response = await fetch(TOKEN_LIST_URL);
      const data = await response.json();
      
      // Build cache
      tokenListCache = {};
      for (const token of data.tokens) {
        tokenListCache[token.address] = {
          symbol: token.symbol,
          name: token.name,
          decimals: token.decimals
        };
      }
    }

    // Check cache
    if (tokenListCache[mint]) {
      return tokenListCache[mint];
    }

    // If not in cache, try to get from on-chain data
    const mintAccount = await connection.getParsedAccountInfo(new PublicKey(mint));
    if (!mintAccount.value?.data || typeof mintAccount.value.data !== 'object') {
      return null;
    }

    const parsedData = mintAccount.value.data;
    if ('parsed' in parsedData && parsedData.program === 'spl-token') {
      const info = parsedData.parsed.info;
      return {
        symbol: info.symbol || 'UNKNOWN',
        name: info.name || 'Unknown Token',
        decimals: info.decimals
      };
    }

    return null;
  } catch (error) {
    console.error('Error fetching token info:', error);
    return null;
  }
}
