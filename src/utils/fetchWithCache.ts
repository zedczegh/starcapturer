
import { fetchWithEnhancedCache, clearCacheForUrls, clearAllCache } from './enhancedCache';

/**
 * Utility for caching fetch requests to reduce API calls
 */

const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds
// Track pending fetch requests to deduplicate simultaneous requests
const pendingFetches = new Map<string, Promise<any>>();

/**
 * Improved fetch with caching and request deduplication
 * - Adds memory caching for faster repeated accesses
 * - Deduplicates identical requests in flight
 * - Supports cache invalidation
 * 
 * @param url URL to fetch
 * @param options Fetch options
 * @param cacheDuration Optional cache duration in milliseconds
 * @returns Promise resolving to fetch result
 */
export async function fetchWithCache(
  url: string,
  options?: RequestInit,
  cacheDuration = CACHE_DURATION
): Promise<any> {
  // If there's already a pending request for this URL, reuse the promise
  if (pendingFetches.has(url)) {
    console.log(`Using pending request for ${url}`);
    return pendingFetches.get(url);
  }

  // Cache key for memory cache
  const cacheKey = `${url}-${options?.method || 'GET'}-${JSON.stringify(options?.body || '')}`;
  
  // Create a new fetch promise
  const fetchPromise = fetchWithEnhancedCache(url, options, cacheDuration)
    .finally(() => {
      // Remove from pending fetches when done
      pendingFetches.delete(url);
    });
  
  // Store the promise to deduplicate requests
  pendingFetches.set(url, fetchPromise);
  
  return fetchPromise;
}

/**
 * Clear all cached responses
 */
export function clearCache(): void {
  clearAllCache();
  pendingFetches.clear();
}

/**
 * Clear a specific URL from cache
 */
export function clearCacheForUrl(url: string): void {
  clearCacheForUrls([url]);
  
  // Also clear pending fetches for this URL
  if (pendingFetches.has(url)) {
    pendingFetches.delete(url);
  }
}

/**
 * Add a completed fetch to the cache manually
 * Useful for prefetching and storing results
 */
export function addToCache(url: string, data: any, duration = CACHE_DURATION): void {
  // Implementation would depend on enhancedCache internals
  // This is a placeholder as the full implementation would need access to enhancedCache internals
}
