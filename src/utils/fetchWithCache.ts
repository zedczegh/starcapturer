
import { fetchWithEnhancedCache, clearCacheForUrls, clearAllCache } from './enhancedCache';

/**
 * Utility for caching fetch requests to reduce API calls
 */

const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds
const pendingFetches = new Map<string, Promise<any>>();
const regionCache = new Map<string, {data: any, timestamp: number, regionKey: string}>();
const REGION_PRECISION = 0.1; // Approximately 11km precision
const REGION_CACHE_DURATION = 60 * 60 * 1000; // 60 minutes for regional data

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
 * Fetch with regional caching to drastically reduce API calls for nearby locations
 * Great for weather, forecast, and other geospatial data
 * @param url URL to fetch
 * @param lat Latitude of the location
 * @param lng Longitude of the location
 * @param options Fetch options
 * @param precision Precision for regional caching (in degrees)
 * @returns Promise resolving to fetch result
 */
export async function fetchWithRegionalCache(
  url: string,
  lat: number,
  lng: number,
  options?: RequestInit,
  precision = REGION_PRECISION
): Promise<any> {
  // Generate regional cache key
  const regionLat = Math.round(lat / precision) * precision;
  const regionLng = Math.round(lng / precision) * precision;
  const regionKey = `${regionLat.toFixed(4)}-${regionLng.toFixed(4)}`;
  
  // Check if we have cached data for this region
  const cacheKey = `${url}-${regionKey}`;
  const cachedRegionData = regionCache.get(cacheKey);
  
  if (cachedRegionData && (Date.now() - cachedRegionData.timestamp) < REGION_CACHE_DURATION) {
    console.log(`Using regional cache for ${regionKey} (${url})`);
    return cachedRegionData.data;
  }
  
  // Not in region cache, use regular cache
  const result = await fetchWithCache(url, options);
  
  // Store in region cache
  regionCache.set(cacheKey, {
    data: result,
    timestamp: Date.now(),
    regionKey
  });
  
  return result;
}

/**
 * Clear all cached responses
 */
export function clearCache(): void {
  clearAllCache();
  pendingFetches.clear();
  regionCache.clear();
  console.log("All caches cleared");
}

/**
 * Clear a specific URL from cache
 */
export function clearCacheForUrl(url: string): void {
  clearCacheForUrls([url]);
  pendingFetches.delete(url);
  
  // Clear any regional caches for this URL
  const keysToDelete = [];
  for (const key of regionCache.keys()) {
    if (key.startsWith(url)) {
      keysToDelete.push(key);
    }
  }
  
  keysToDelete.forEach(key => regionCache.delete(key));
}

/**
 * Clear regional caches for a specific region
 */
export function clearRegionalCache(lat: number, lng: number): void {
  const regionLat = Math.round(lat / REGION_PRECISION) * REGION_PRECISION;
  const regionLng = Math.round(lng / REGION_PRECISION) * REGION_PRECISION;
  const regionKey = `${regionLat.toFixed(4)}-${regionLng.toFixed(4)}`;
  
  // Clear all caches for this region
  const keysToDelete = [];
  for (const [key, data] of regionCache.entries()) {
    if (data.regionKey === regionKey) {
      keysToDelete.push(key);
    }
  }
  
  keysToDelete.forEach(key => regionCache.delete(key));
  console.log(`Cleared ${keysToDelete.length} regional caches for ${regionKey}`);
}
