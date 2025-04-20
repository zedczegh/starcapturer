
/**
 * Utility for caching fetch requests to reduce API calls
 */

const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds

// Simple in-memory cache
const cache = new Map<string, {
  data: any;
  timestamp: number;
}>();

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
  const cacheKey = `${url}-${JSON.stringify(options || {})}`;
  
  // Check if we have a valid cached response
  const cachedResponse = cache.get(cacheKey);
  if (cachedResponse && (Date.now() - cachedResponse.timestamp) < cacheDuration) {
    console.log(`Using cached response for ${url}`);
    return cachedResponse.data;
  }
  
  // Perform the fetch
  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Cache the response
    cache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });
    
    return data;
  } catch (error) {
    console.error(`Error fetching ${url}:`, error);
    throw error;
  }
}

/**
 * Clear all cached responses
 */
export function clearCache(): void {
  cache.clear();
}

/**
 * Clear a specific URL from cache
 */
export function clearCacheForUrl(url: string): void {
  for (const key of cache.keys()) {
    if (key.startsWith(url)) {
      cache.delete(key);
    }
  }
}
