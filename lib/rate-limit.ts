export class RateLimitError extends Error {
  constructor(message: string, public retryAfter: number) {
    super(message);
    this.name = 'RateLimitError';
  }
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
  queue: Array<{
    resolve: (value: void) => void;
    reject: (error: Error) => void;
  }>;
}

interface RateLimitOptions {
  limit: number;
  windowMs: number;
  maxRetries?: number;
  initialRetryDelay?: number;
  maxRetryDelay?: number;
}

const DEFAULT_OPTIONS: Required<Omit<RateLimitOptions, 'limit' | 'windowMs'>> = {
  maxRetries: 1000,
  initialRetryDelay: 5,
  maxRetryDelay: 1000,
};

class RateLimiter {
  private rateLimitMap = new Map<string, RateLimitEntry>();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Cleanup expired entries every minute
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.rateLimitMap.entries()) {
      if (now > entry.resetTime) {
        this.rateLimitMap.delete(key);
      }
    }
  }

  async rateLimit(key: string, options: RateLimitOptions): Promise<void> {
    const { limit, windowMs, maxRetries = DEFAULT_OPTIONS.maxRetries,
            initialRetryDelay = DEFAULT_OPTIONS.initialRetryDelay,
            maxRetryDelay = DEFAULT_OPTIONS.maxRetryDelay } = options;
    
    let retryCount = 0;
    let delay = initialRetryDelay;

    while (true) {
      try {
        await this.attempt(key, limit * 2, windowMs); // Double the limit to be more lenient
        return;
      } catch (error) {
        if (error instanceof RateLimitError) {
          const errorDetails = {
            key,
            options: {
              limit,
              windowMs,
              maxRetries,
              initialRetryDelay,
              maxRetryDelay
            },
            currentState: {
              retryCount,
              delay,
              entry: this.rateLimitMap.get(key)
            },
            error: {
              message: error.message,
              retryAfter: error.retryAfter
            }
          };

          if (retryCount >= maxRetries) {
            console.error('Rate limit error details:', errorDetails);
            throw new RateLimitError(
              `Rate limit exceeded after ${maxRetries} retries`,
              error.retryAfter
            );
          }

          // Exponential backoff with jitter
          const jitter = Math.random() * 100;
          await new Promise(resolve => setTimeout(resolve, delay + jitter));
          
          delay = Math.min(delay * 2, maxRetryDelay);
          retryCount++;
          
          console.warn('Rate limit warning:', {
            ...errorDetails,
            nextAttempt: {
              delay,
              retryCount
            }
          });
          continue;
        }
        throw error;
      }
    }
  }

  private async attempt(key: string, limit: number, windowMs: number): Promise<void> {
    const now = Date.now();
    let entry = this.rateLimitMap.get(key);

    // Clean up expired entry
    if (entry && now > entry.resetTime) {
      this.rateLimitMap.delete(key);
      entry = undefined;
    }

    // Initialize new entry
    if (!entry) {
      this.rateLimitMap.set(key, {
        count: 1,
        resetTime: now + windowMs,
        queue: [],
      });
      return;
    }

    // Handle rate limit
    if (entry.count >= limit) {
      const retryAfter = entry.resetTime - now;
      
      // If close to reset, wait for it
      if (retryAfter < 200) {
        await new Promise(resolve => setTimeout(resolve, retryAfter));
        return this.attempt(key, limit, windowMs);
      }

      throw new RateLimitError(
        `Rate limit exceeded. Try again in ${Math.ceil(retryAfter / 1000)}s`,
        retryAfter
      );
    }

    entry.count++;
  }

  destroy() {
    clearInterval(this.cleanupInterval);
  }
}

// Export singleton instance
export const rateLimiter = new RateLimiter();

// Export convenience method
export async function rateLimit(
  key: string,
  options: RateLimitOptions
): Promise<void> {
  return rateLimiter.rateLimit(key, options);
}
