import { test, expect } from '@playwright/test';

test.describe('Token API Tests', () => {
  // Increase timeout and configure retries
  test.setTimeout(120000);
  test.describe.configure({ retries: 2 });

  // Reset rate limit between tests
  test.beforeEach(async () => {
    // Wait 5 seconds between tests to ensure rate limit resets
    await new Promise(resolve => setTimeout(resolve, 5000));
  });

  // Add extra delay before rate limit test
  test.beforeEach(async ({}, testInfo) => {
    if (testInfo.title.includes('rate limiting')) {
      // Wait additional 5 seconds before rate limit test
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  });

  // Known valid Solana token mint address for testing
  const validTokenMint = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'; // USDC
  const invalidTokenMint = 'invalid_address_format';
  
  test('should handle valid token mint address', async ({ request }) => {
    const response = await request.get(`/api/token/${validTokenMint}`);
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data).toHaveProperty('metadata');
    expect(data.metadata).toHaveProperty('name');
    expect(data.metadata).toHaveProperty('symbol');
    expect(data).toHaveProperty('decimals');
  });

  test('should handle invalid token mint address', async ({ request }) => {
    const response = await request.get(`/api/token/${invalidTokenMint}`);
    expect(response.ok()).toBeFalsy();
    expect(response.status()).toBe(400);
    
    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data.error).toBe('Invalid address format');
  });

  test('should enforce rate limiting', async ({ request }) => {
    // Make parallel requests to ensure we hit rate limit
    const requests = Array(8).fill(null).map(() => 
      request.get(`/api/token/${validTokenMint}`)
    );
    const results = await Promise.all(requests);

    // Verify rate limiting occurred
    const hasRateLimited = results.some(response => response.status() === 429);
    expect(hasRateLimited).toBeTruthy();
    
    // Check rate limit error message
    const rateLimitedResponse = results.find(response => response.status() === 429);
    if (rateLimitedResponse) {
      const data = await rateLimitedResponse.json();
      expect(data).toHaveProperty('error');
      expect(data.error).toBe('Too many requests. Please try again later.');
    }
  });

  test('should handle non-token mint accounts', async ({ request }) => {
    // Use a known program ID as an example of non-token account
    const programId = '11111111111111111111111111111111';
    const response = await request.get(`/api/token/${programId}`);
    expect(response.ok()).toBeFalsy();
    expect(response.status()).toBe(400);
    
    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data.error).toBe('Not a token mint account');
    expect(data).toHaveProperty('message');
    expect(data.message).toBe('This account is not a token mint account.');
    expect(data).toHaveProperty('accountOwner');
  });

  test('should handle network errors gracefully', async ({ request }) => {
    // Use a valid address format that doesn't exist on network
    const badMint = 'BgE3vF1MxK3UwPpZbYaviHeFkbhiGJyUQgvwHHrDTZYu';
    const response = await request.get(`/api/token/${badMint}`);
    expect(response.ok()).toBeFalsy();
    expect(response.status()).toBe(404);
    
    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data.error).toBe('Account not found');
  });
});
