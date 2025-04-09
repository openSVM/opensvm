/**
 * Moralis API client for Solana data
 * 
 * This module provides functions to interact with the Moralis Solana API
 * to fetch token data, NFT metadata, account portfolios, and other blockchain data.
 */

const MORALIS_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJub25jZSI6IjRjOTdiNjY5LWU0NTAtNDc0ZC04NDk5LWM3MzQ3MTY2MzZjZSIsIm9yZ0lkIjoiNDM3NTQzIiwidXNlcklkIjoiNDUwMTMwIiwidHlwZUlkIjoiZjY3MzczODctNjQ1MC00YzIyLTg1YjAtOWI1ZjE3NWE3ZWQ3IiwidHlwZSI6IlBST0pFQ1QiLCJpYXQiOjE3NDI2MzYxMDcsImV4cCI6NDg5ODM5NjEwN30.bLDNejPrPEg9tFbmUITy9cpuMBuvU5pzbloq0b-7r4A';
const MORALIS_API_BASE_URL = 'https://solana-gateway.moralis.io';

/**
 * Fetch token pair statistics by address
 * @param network - 'mainnet' or 'devnet'
 * @param address - Token address
 * @returns Token pair statistics
 */
export async function getTokenPairStats(network: 'mainnet' | 'devnet', address: string) {
  try {
    const response = await fetch(
      `${MORALIS_API_BASE_URL}/token/${network}/${address}/pairs/stats`,
      {
        headers: {
          'Accept': 'application/json',
          'X-API-Key': MORALIS_API_KEY
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`Moralis API error: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching token pair stats:', error);
    throw error;
  }
}

/**
 * Fetch candlesticks for a pair address
 * @param network - 'mainnet' or 'devnet'
 * @param address - Pair address
 * @param params - Query parameters
 * @returns Candlestick data
 */
export async function getCandleSticks(
  network: 'mainnet' | 'devnet', 
  address: string,
  params: {
    fromDate: string,
    toDate: string,
    timeframe: '1min' | '5min' | '15min' | '1h' | '4h' | '1d',
    currency: 'usd' | 'native',
    limit?: number
  }
) {
  try {
    const queryParams = new URLSearchParams({
      fromDate: params.fromDate,
      toDate: params.toDate,
      timeframe: params.timeframe,
      currency: params.currency,
      ...(params.limit && { limit: params.limit.toString() })
    });
    
    const response = await fetch(
      `${MORALIS_API_BASE_URL}/token/${network}/pairs/${address}/ohlcv?${queryParams}`,
      {
        headers: {
          'Accept': 'application/json',
          'X-API-Key': MORALIS_API_KEY
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`Moralis API error: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching candlesticks:', error);
    throw error;
  }
}

/**
 * Fetch NFT metadata
 * @param network - 'mainnet' or 'devnet'
 * @param address - NFT address
 * @returns NFT metadata
 */
export async function getNFTMetadata(network: 'mainnet' | 'devnet', address: string) {
  try {
    const response = await fetch(
      `${MORALIS_API_BASE_URL}/nft/${network}/${address}/metadata`,
      {
        headers: {
          'Accept': 'application/json',
          'X-API-Key': MORALIS_API_KEY
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`Moralis API error: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching NFT metadata:', error);
    throw error;
  }
}

/**
 * Fetch NFTs owned by an address
 * @param network - 'mainnet' or 'devnet'
 * @param address - Owner address
 * @param nftMetadata - Whether to include full NFT metadata
 * @returns NFTs owned by the address
 */
export async function getNFTs(network: 'mainnet' | 'devnet', address: string, nftMetadata: boolean = false) {
  try {
    const response = await fetch(
      `${MORALIS_API_BASE_URL}/account/${network}/${address}/nft?nftMetadata=${nftMetadata}`,
      {
        headers: {
          'Accept': 'application/json',
          'X-API-Key': MORALIS_API_KEY
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`Moralis API error: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching NFTs:', error);
    throw error;
  }
}

/**
 * Fetch pair statistics
 * @param network - 'mainnet' or 'devnet'
 * @param pairAddress - Pair address
 * @returns Pair statistics
 */
export async function getPairStats(network: 'mainnet' | 'devnet', pairAddress: string) {
  try {
    const response = await fetch(
      `${MORALIS_API_BASE_URL}/token/${network}/pairs/${pairAddress}/stats`,
      {
        headers: {
          'Accept': 'application/json',
          'X-API-Key': MORALIS_API_KEY
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`Moralis API error: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching pair stats:', error);
    throw error;
  }
}

/**
 * Fetch portfolio for an address
 * @param network - 'mainnet' or 'devnet'
 * @param address - Account address
 * @param nftMetadata - Whether to include full NFT metadata
 * @returns Portfolio data
 */
export async function getPortfolio(network: 'mainnet' | 'devnet', address: string, nftMetadata: boolean = false) {
  try {
    const response = await fetch(
      `${MORALIS_API_BASE_URL}/account/${network}/${address}/portfolio?nftMetadata=${nftMetadata}`,
      {
        headers: {
          'Accept': 'application/json',
          'X-API-Key': MORALIS_API_KEY
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`Moralis API error: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching portfolio:', error);
    throw error;
  }
}

/**
 * Fetch token balances for an address
 * @param network - 'mainnet' or 'devnet'
 * @param address - Account address
 * @returns Token balances
 */
export async function getTokenBalances(network: 'mainnet' | 'devnet', address: string) {
  try {
    const response = await fetch(
      `${MORALIS_API_BASE_URL}/account/${network}/${address}/tokens`,
      {
        headers: {
          'Accept': 'application/json',
          'X-API-Key': MORALIS_API_KEY
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`Moralis API error: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching token balances:', error);
    throw error;
  }
}

/**
 * Enrich search results with Moralis data
 * @param query - Search query
 * @param results - Original search results
 * @returns Enriched search results with Moralis data
 */
export async function enrichSearchResultsWithMoralisData(query: string, results: any[]) {
  try {
    // Check if query is a valid Solana address
    if (results.length > 0 && results[0].address) {
      const address = results[0].address;
      
      // Fetch portfolio data in parallel
      const [portfolio, tokens] = await Promise.all([
        getPortfolio('mainnet', address, false).catch(() => null),
        getTokenBalances('mainnet', address).catch(() => null)
      ]);
      
      // Enrich results with portfolio and token data
      return results.map(result => ({
        ...result,
        moralisData: {
          portfolio: portfolio,
          tokens: tokens
        }
      }));
    }
    
    return results;
  } catch (error) {
    console.error('Error enriching search results with Moralis data:', error);
    return results; // Return original results on error
  }
}
