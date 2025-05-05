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
 * - Handles errors gracefully
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
  if (!url) {
    console.error("Invalid URL provided to fetchWithCache");
    throw new Error("Invalid URL provided to fetchWithCache");
  }

  // If there's already a pending request for this URL, reuse the promise
  if (pendingFetches.has(url)) {
    console.log(`Using pending request for ${url}`);
    return pendingFetches.get(url)!.catch(error => {
      // If the pending request fails, don't keep it in the cache
      pendingFetches.delete(url);
      throw error;
    });
  }

  // Cache key for memory cache
  const cacheKey = `${url}-${options?.method || 'GET'}-${JSON.stringify(options?.body || '')}`;
  
  // Create a new fetch promise with error handling
  const fetchPromise = fetchWithEnhancedCache(url, options, cacheDuration)
    .catch(error => {
      console.error(`Error fetching ${url}:`, error);
      // Remove from pending fetches when failed
      pendingFetches.delete(url);
      throw error;
    })
    .finally(() => {
      // Remove from pending fetches when done
      pendingFetches.delete(url);
    });
  
  // Store the promise to deduplicate requests
  pendingFetches.set(url, fetchPromise);
  
  return fetchPromise;
}

/**
 * Clear all cached responses and pending requests
 */
export function clearCache(): void {
  clearAllCache();
  pendingFetches.clear();
  console.log("All caches cleared");
}

/**
 * Clear a specific URL from cache and any pending requests
 */
export function clearCacheForUrl(url: string): void {
  if (!url) return;
  
  clearCacheForUrls([url]);
  
  // Also clear pending fetches for this URL
  if (pendingFetches.has(url)) {
    pendingFetches.delete(url);
    console.log(`Cleared pending fetch for ${url}`);
  }
}

/**
 * Add a completed fetch to the cache manually with validation
 * Useful for prefetching and storing results
 */
export function addToCache(url: string, data: any, duration = CACHE_DURATION): void {
  if (!url) {
    console.error("Invalid URL provided to addToCache");
    return;
  }
  
  if (data === undefined || data === null) {
    console.warn(`Attempted to cache null/undefined data for ${url}`);
    return;
  }
  
  // Implementation would depend on enhancedCache internals
  // This is a placeholder as the full implementation would need access to enhancedCache internals
  try {
    const cacheKey = `cache-${url}`;
    const cacheData = {
      data,
      timestamp: Date.now(),
      expiry: Date.now() + duration
    };
    localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    console.log(`Manually cached data for ${url}`);
  } catch (error) {
    console.error(`Failed to manually cache data for ${url}:`, error);
  }
}
