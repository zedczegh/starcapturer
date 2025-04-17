
/**
 * Astronomy data fetch utilities with enhanced caching
 */

import { fetchWithCache } from '@/utils/fetchWithCache';

// Specialized cache for astronomy API requests
const astronomyRequestCache = new Map<string, {
  data: any;
  timestamp: number;
  validFor: number;
}>();

/**
 * Fetch astronomy data with enhanced caching
 * @param url URL to fetch
 * @param options Request options
 * @param cacheDuration Cache duration in milliseconds
 * @returns Fetched data
 */
export async function fetchAstronomyData<T>(
  url: string,
  options?: RequestInit,
  cacheDuration = 30 * 60 * 1000 // 30 minutes default
): Promise<T> {
  const cacheKey = `${url}-${JSON.stringify(options || {})}`;
  
  // Check memory cache first (faster than storage cache)
  const memCached = astronomyRequestCache.get(cacheKey);
  if (memCached && (Date.now() - memCached.timestamp) < memCached.validFor) {
    return memCached.data as T;
  }
  
  // Use storage cache as fallback
  try {
    const data = await fetchWithCache(url, options, cacheDuration) as T;
    
    // Update memory cache
    astronomyRequestCache.set(cacheKey, {
      data,
      timestamp: Date.now(),
      validFor: cacheDuration
    });
    
    return data;
  } catch (error) {
    console.error("Error fetching astronomy data:", error);
    throw error;
  }
}

/**
 * Clear astronomy data cache
 */
export function clearAstronomyDataCache(): void {
  astronomyRequestCache.clear();
}

/**
 * Batch fetch astronomy data for multiple locations
 * @param urls Array of URLs to fetch
 * @param options Request options
 * @returns Array of fetched data
 */
export async function batchFetchAstronomyData<T>(
  urls: string[],
  options?: RequestInit
): Promise<T[]> {
  try {
    // Use Promise.all for parallel fetching
    return await Promise.all(
      urls.map(url => fetchAstronomyData<T>(url, options))
    );
  } catch (error) {
    console.error("Error batch fetching astronomy data:", error);
    throw error;
  }
}

/**
 * Get estimated cache freshness of a URL
 * @param url URL to check
 * @returns Percentage of cache freshness (0-100)
 */
export function getCacheFreshness(url: string): number {
  const cacheKey = `${url}-{}`;
  const cached = astronomyRequestCache.get(cacheKey);
  
  if (!cached) return 0;
  
  const elapsed = Date.now() - cached.timestamp;
  const freshness = Math.max(0, 100 - (elapsed / cached.validFor) * 100);
  
  return Math.round(freshness);
}
