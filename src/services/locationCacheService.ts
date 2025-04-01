
import { SharedAstroSpot } from "@/lib/api/astroSpots";

// Cache TTL in milliseconds (5 minutes)
const CACHE_TTL = 5 * 60 * 1000;

// Cache for location searches
const searchCache = new Map<string, {
  timestamp: number;
  data: SharedAstroSpot[];
}>();

/**
 * Generate a cache key for location search
 */
const generateCacheKey = (
  latitude: number,
  longitude: number,
  radius: number
): string => {
  return `${latitude.toFixed(2)}-${longitude.toFixed(2)}-${radius}`;
};

/**
 * Cache location search results
 */
export const cacheLocationSearch = (
  latitude: number,
  longitude: number,
  radius: number,
  locations: SharedAstroSpot[]
): void => {
  const key = generateCacheKey(latitude, longitude, radius);
  searchCache.set(key, {
    timestamp: Date.now(),
    data: locations
  });
};

/**
 * Get cached location search results if available and not expired
 */
export const getCachedLocationSearch = (
  latitude: number,
  longitude: number,
  radius: number
): SharedAstroSpot[] | null => {
  const key = generateCacheKey(latitude, longitude, radius);
  const cached = searchCache.get(key);
  
  if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
    return cached.data;
  }
  
  return null;
};

/**
 * Clear the location search cache
 */
export const clearLocationSearchCache = (): void => {
  searchCache.clear();
};

/**
 * Get the current size of the location search cache
 */
export const getLocationSearchCacheSize = (): number => {
  return searchCache.size;
};
