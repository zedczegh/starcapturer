
import { fetchWithEnhancedCache, clearCacheForUrls, clearAllCache } from './enhancedCache';

/**
 * Utility for caching fetch requests to reduce API calls
 */

const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds
const pendingFetches = new Map<string, Promise<any>>();

/**
 * Fetch with caching to reduce API calls
 * Improved with request deduplication to prevent redundant network requests
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
    return pendingFetches.get(url);
  }
  
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
}

/**
 * Clear a specific URL from cache
 */
export function clearCacheForUrl(url: string): void {
  clearCacheForUrls([url]);
}
