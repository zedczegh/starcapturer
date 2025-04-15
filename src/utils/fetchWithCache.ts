
import { fetchWithEnhancedCache, clearCacheForUrls, clearAllCache } from './enhancedCache';

/**
 * Utility for caching fetch requests to reduce API calls
 */

const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds

/**
 * Fetch with caching to reduce API calls
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
  return fetchWithEnhancedCache(url, options, cacheDuration);
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
