import { NextRequest } from 'next/server';
import { LRUCache } from 'lru-cache';

export interface RateLimitConfig {
  interval: number;
  uniqueTokenPerInterval: number;
}

export interface RateLimiter {
  check: (req: NextRequest, limit: number, prefix: string) => Promise<void>;
}

export function rateLimit(options: RateLimitConfig): RateLimiter {
  const tokenCache = new LRUCache({
    max: options.uniqueTokenPerInterval || 500,
    ttl: options.interval || 60000,
  });

  return {
    check: async (req: NextRequest, limit: number, prefix: string): Promise<void> => {
      const ip = req.headers.get('x-forwarded-for') || 
                 req.headers.get('x-real-ip') || 
                 req.headers.get('cf-connecting-ip') ||
                 'anonymous';
      const tokenKey = `${prefix}_${ip}`;
      const tokenCount = (tokenCache.get(tokenKey) as number[]) || [0];
      const currentUsage = tokenCount[0];
      const currentTimestamp = Date.now();

      if (currentUsage === 0) {
        tokenCache.set(tokenKey, [1, currentTimestamp]);
        return;
      }

      if (currentUsage >= limit) {
        const timePassed = currentTimestamp - tokenCount[1];
        if (timePassed < options.interval) {
          throw new Error('Rate limit exceeded');
        }
        tokenCache.set(tokenKey, [1, currentTimestamp]);
        return;
      }

      tokenCache.set(tokenKey, [currentUsage + 1, tokenCount[1]]);
    },
  };
}
