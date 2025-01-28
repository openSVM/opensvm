import '@testing-library/jest-dom';
import { TextDecoder, TextEncoder } from 'util';
import { Connection } from '@solana/web3.js';

// Polyfills for Next.js and Web APIs
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock Response, Request, and Headers for fetch API
export class MockResponse {
  private body: string;
  public status: number;
  public statusText: string;
  public headers: Headers;
  public ok: boolean;

  constructor(body: string | object, init?: { status?: number; statusText?: string; headers?: Record<string, string> }) {
    this.body = typeof body === 'string' ? body : JSON.stringify(body);
    this.status = init?.status ?? 200;
    this.statusText = init?.statusText ?? '';
    this.headers = new Headers(init?.headers);
    this.ok = this.status >= 200 && this.status < 300;
  }

  json() {
    return Promise.resolve(JSON.parse(this.body));
  }

  text() {
    return Promise.resolve(this.body);
  }
}

global.Response = MockResponse as any;
global.Headers = class Headers {
  private headers: Record<string, string>;
  
  constructor(init?: Record<string, string>) {
    this.headers = init || {};
  }

  get(name: string): string | null {
    return this.headers[name.toLowerCase()] || null;
  }

  set(name: string, value: string): void {
    this.headers[name.toLowerCase()] = value;
  }
} as any;

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '',
}));

// Mock Solana Connection
jest.mock('@solana/web3.js', () => ({
  Connection: jest.fn().mockImplementation(() => ({
    getBlockHeight: jest.fn().mockResolvedValue(100),
    getProgramAccounts: jest.fn().mockResolvedValue([]),
  })),
  PublicKey: jest.fn().mockImplementation((key) => ({
    toString: () => key,
    toBase58: () => key,
  })),
}));

// Mock rate limiter
jest.mock('@/lib/rate-limit', () => ({
  rateLimit: () => ({
    check: jest.fn().mockResolvedValue(true),
  }),
}));

// Test utilities
export const TEST_ENDPOINTS = {
  local: 'http://localhost:8899',
  devnet: 'https://api.devnet.solana.com',
  mockRPC: 'mock://solana',
};

export const fixtures = {
  nftCollections: [
    {
      address: 'DGNAqCCHypUq5kQhRhxXpUj9H1yBj7iGZUmDgqJBVhMV',
      name: 'Degen Apes',
      symbol: 'DAPE',
      mintDate: '2025-01-27',
      image: 'https://example.com/dape.png',
    },
    {
      address: 'SMNKqxEVjmqmEuEYHzKVTKLPGWpwHkxRTxkGJhBhxVi',
      name: 'Solana Monke',
      symbol: 'SMONK',
      mintDate: '2025-01-26',
      image: 'https://example.com/smonk.png',
    },
  ],
  tokenDetails: {
    decimals: 9,
    supply: '1000000000',
    volume: '50000',
  },
};

// Mock fetch globally
global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

export const mockNetworkConditions = {
  offline: () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));
  },
  slow: () => {
    (global.fetch as jest.Mock).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => {
        resolve(new MockResponse({}, {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }));
      }, 2000))
    );
  },
  normal: () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      new MockResponse({}, {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );
  },
};

// Custom matchers
expect.extend({
  toMatchPerformanceMetrics(received, expected, tolerance = 0.05) {
    const pass = Math.abs(received - expected) <= expected * tolerance;
    return {
      pass,
      message: () =>
        `expected ${received} to be within ${tolerance * 100}% of ${expected}`,
    };
  },
});
