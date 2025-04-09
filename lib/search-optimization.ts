/**
 * Performance optimizations for multi-SVM search
 * 
 * This module provides performance enhancements for the search functionality
 * including caching, lazy loading, and request debouncing.
 */

// Cache for search results to reduce redundant API calls
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes in milliseconds
const searchCache: Record<string, {
  timestamp: number;
  results: any;
}> = {};

/**
 * Get cached search results if available and not expired
 * @param cacheKey - Cache key (typically query + options hash)
 * @returns Cached results or null if not found/expired
 */
export function getCachedResults(cacheKey: string): any | null {
  const cached = searchCache[cacheKey];
  if (!cached) return null;
  
  const now = Date.now();
  if (now - cached.timestamp > CACHE_EXPIRY) {
    // Cache expired, remove it
    delete searchCache[cacheKey];
    return null;
  }
  
  return cached.results;
}

/**
 * Cache search results
 * @param cacheKey - Cache key (typically query + options hash)
 * @param results - Search results to cache
 */
export function cacheResults(cacheKey: string, results: any): void {
  searchCache[cacheKey] = {
    timestamp: Date.now(),
    results
  };
}

/**
 * Generate a cache key from search query and options
 * @param query - Search query
 * @param options - Search options
 * @returns Cache key string
 */
export function generateCacheKey(query: string, options: any): string {
  return `${query}:${JSON.stringify(options)}`;
}

/**
 * Clear expired cache entries
 */
export function clearExpiredCache(): void {
  const now = Date.now();
  Object.keys(searchCache).forEach(key => {
    if (now - searchCache[key].timestamp > CACHE_EXPIRY) {
      delete searchCache[key];
    }
  });
}

// Set up periodic cache cleanup
setInterval(clearExpiredCache, 60 * 1000); // Clean up every minute

/**
 * Debounce function to prevent excessive API calls
 * @param func - Function to debounce
 * @param wait - Wait time in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function(...args: Parameters<T>): void {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout !== null) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Batch multiple search requests together
 * @param requests - Array of search requests
 * @returns Promise with array of results
 */
export async function batchSearchRequests<T>(
  requests: Array<() => Promise<T>>
): Promise<T[]> {
  // Process in batches of 3 to avoid overwhelming APIs
  const batchSize = 3;
  const results: T[] = [];
  
  for (let i = 0; i < requests.length; i += batchSize) {
    const batch = requests.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(request => request()));
    results.push(...batchResults);
  }
  
  return results;
}

/**
 * Lazy load search results as user scrolls
 * @param allResults - All search results
 * @param pageSize - Number of results per page
 * @returns Object with pagination methods
 */
export function createLazyLoader(allResults: any[], pageSize: number = 10) {
  let currentPage = 1;
  
  return {
    /**
     * Get current page of results
     * @returns Current page results
     */
    getCurrentPage(): any[] {
      const start = 0;
      const end = currentPage * pageSize;
      return allResults.slice(start, end);
    },
    
    /**
     * Load next page of results
     * @returns Newly added results
     */
    loadNextPage(): any[] {
      const prevEnd = currentPage * pageSize;
      currentPage++;
      const newEnd = currentPage * pageSize;
      
      return allResults.slice(prevEnd, newEnd);
    },
    
    /**
     * Check if more results are available
     * @returns True if more results exist
     */
    hasMoreResults(): boolean {
      return currentPage * pageSize < allResults.length;
    },
    
    /**
     * Get total number of results
     * @returns Total result count
     */
    getTotalCount(): number {
      return allResults.length;
    },
    
    /**
     * Reset pagination to first page
     */
    reset(): void {
      currentPage = 1;
    }
  };
}

/**
 * Optimize images in search results for faster loading
 * @param html - HTML string containing image tags
 * @returns Optimized HTML
 */
export function optimizeResultImages(html: string): string {
  // Add loading="lazy" to all images
  const optimizedHtml = html.replace(
    /<img(.*?)>/g,
    '<img$1 loading="lazy">'
  );
  
  // Add width and height attributes if missing to prevent layout shifts
  return optimizedHtml.replace(
    /<img((?!width|height).*?)>/g,
    '<img$1 width="40" height="40">'
  );
}

/**
 * Measure and log search performance metrics
 * @param searchFunction - Search function to measure
 * @returns Wrapped function with performance measurement
 */
export function withPerformanceTracking<T extends (...args: any[]) => Promise<any>>(
  searchFunction: T
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  return async function(...args: Parameters<T>): Promise<ReturnType<T>> {
    const startTime = performance.now();
    
    try {
      const results = await searchFunction(...args);
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Log performance metrics
      console.log(`Search Performance:
        - Query: ${args[0]}
        - Duration: ${duration.toFixed(2)}ms
        - Result count: ${Array.isArray(results) ? results.length : 'N/A'}
      `);
      
      return results;
    } catch (error) {
      const endTime = performance.now();
      console.error(`Search failed after ${(endTime - startTime).toFixed(2)}ms:`, error);
      throw error;
    }
  };
}
