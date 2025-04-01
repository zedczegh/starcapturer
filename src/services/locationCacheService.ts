
/**
 * Service for caching location search results
 * Improves performance by reducing redundant API calls and calculations
 */

import { SharedAstroSpot } from '@/lib/api/astroSpots';

// In-memory location cache
const searchCache: Map<string, { 
  data: SharedAstroSpot[]; 
  timestamp: number;
  latitude: number;
  longitude: number;
  radius: number;
}> = new Map();

// Cache duration in milliseconds (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

// Maximum cache size
const MAX_CACHE_SIZE = 30;

/**
 * Store location search results in cache
 * @param latitude - Search center latitude
 * @param longitude - Search center longitude
 * @param radius - Search radius in km
 * @param data - Location data to cache
 * @param cacheKey - Optional custom cache key
 */
export function cacheLocationSearch(
  latitude: number,
  longitude: number,
  radius: number,
  data: SharedAstroSpot[],
  cacheKey?: string
): void {
  try {
    // Generate cache key if not provided
    const key = cacheKey || `${latitude.toFixed(2)},${longitude.toFixed(2)},${radius}`;
    
    // Add timestamp to track cache freshness
    searchCache.set(key, {
      data,
      timestamp: Date.now(),
      latitude,
      longitude,
      radius
    });
    
    // Evict oldest entries if cache gets too large
    if (searchCache.size > MAX_CACHE_SIZE) {
      const oldestKey = findOldestCacheKey();
      if (oldestKey) {
        searchCache.delete(oldestKey);
      }
    }
  } catch (error) {
    console.error("Error caching location search:", error);
  }
}

/**
 * Find the oldest entry in the cache
 * @returns The key of the oldest cache entry or null if cache is empty
 */
function findOldestCacheKey(): string | null {
  if (searchCache.size === 0) return null;
  
  let oldestKey: string | null = null;
  let oldestTime = Infinity;
  
  for (const [key, value] of searchCache.entries()) {
    if (value.timestamp < oldestTime) {
      oldestTime = value.timestamp;
      oldestKey = key;
    }
  }
  
  return oldestKey;
}

/**
 * Get cached location search results
 * @param latitude - Search center latitude
 * @param longitude - Search center longitude
 * @param radius - Search radius in km
 * @param cacheKey - Optional custom cache key
 * @returns Cached location data or null if not found or expired
 */
export function getCachedLocationSearch(
  latitude: number,
  longitude: number,
  radius: number,
  cacheKey?: string
): SharedAstroSpot[] | null {
  try {
    // Try custom key first if provided
    if (cacheKey && searchCache.has(cacheKey)) {
      const cached = searchCache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.data;
      }
    }
    
    // Then try standard key
    const standardKey = `${latitude.toFixed(2)},${longitude.toFixed(2)},${radius}`;
    
    if (searchCache.has(standardKey)) {
      const cached = searchCache.get(standardKey);
      
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.data;
      }
    }
    
    // Check if we have a close-enough match with a larger radius
    for (const [key, value] of searchCache.entries()) {
      // Skip expired entries
      if (Date.now() - value.timestamp >= CACHE_DURATION) continue;
      
      // If we have a larger radius that covers this search
      if (value.radius >= radius && 
          Math.abs(value.latitude - latitude) < 0.1 && 
          Math.abs(value.longitude - longitude) < 0.1) {
        
        // Filter results by actual radius
        return value.data.filter(loc => 
          loc.distance !== undefined && loc.distance <= radius
        );
      }
    }
    
    return null;
  } catch (error) {
    console.error("Error retrieving cached location search:", error);
    return null;
  }
}

/**
 * Clear all location search caches
 */
export function clearLocationSearchCache(): void {
  searchCache.clear();
}

/**
 * Remove expired entries from cache
 */
export function cleanExpiredCache(): void {
  const now = Date.now();
  
  for (const [key, value] of searchCache.entries()) {
    if (now - value.timestamp >= CACHE_DURATION) {
      searchCache.delete(key);
    }
  }
}

// Clean expired cache entries automatically every 10 minutes
setInterval(cleanExpiredCache, 10 * 60 * 1000);
