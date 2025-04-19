
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { LOCATION_CACHE_DURATION } from '@/utils/constants';

// In-memory cache for locations
const locationCache = new Map<string, {
  locations: SharedAstroSpot[];
  timestamp: number;
}>();

/**
 * Generate a cache key based on coordinates and radius
 */
const getCacheKey = (lat: number, lng: number, radius: number): string => {
  return `loc-${lat.toFixed(2)}-${lng.toFixed(2)}-${radius}`;
};

/**
 * Get cached locations if available and not expired
 */
export const getCachedLocations = (
  latitude: number, 
  longitude: number, 
  radius: number
): SharedAstroSpot[] | null => {
  const cacheKey = getCacheKey(latitude, longitude, radius);
  const cachedData = locationCache.get(cacheKey);
  
  if (cachedData && (Date.now() - cachedData.timestamp) < LOCATION_CACHE_DURATION) {
    return cachedData.locations;
  }
  
  return null;
};

/**
 * Cache locations for future use
 */
export const cacheLocations = (
  latitude: number,
  longitude: number,
  radius: number,
  locations: SharedAstroSpot[]
): void => {
  const cacheKey = getCacheKey(latitude, longitude, radius);
  
  locationCache.set(cacheKey, {
    locations,
    timestamp: Date.now()
  });
  
  console.log(`Cached ${locations.length} locations for ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
};

/**
 * Clear all cached locations
 */
export const clearLocationCache = (): void => {
  locationCache.clear();
  console.log('Location cache cleared');
};
