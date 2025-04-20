
import { SharedAstroSpot } from '@/lib/api/astroSpots';

// Cache structure to store spots by location
const spotsCache = new Map<string, {
  spots: SharedAstroSpot[];
  timestamp: number;
  minQuality: number;
}>();

// Cache expiration time (30 minutes)
const CACHE_EXPIRY = 30 * 60 * 1000;

/**
 * Get cached spots for a location if available and not expired
 */
export function getCachedSpots(
  latitude: number,
  longitude: number,
  radius: number,
  minQuality: number = 5
): SharedAstroSpot[] | null {
  const cacheKey = `spots-${latitude.toFixed(3)}-${longitude.toFixed(3)}-${radius}-${minQuality}`;
  const cached = spotsCache.get(cacheKey);
  
  if (cached && (Date.now() - cached.timestamp) < CACHE_EXPIRY && cached.minQuality <= minQuality) {
    console.log(`Using ${cached.spots.length} cached spots for location [${latitude.toFixed(3)}, ${longitude.toFixed(3)}]`);
    return cached.spots;
  }
  
  return null;
}

/**
 * Cache spots for a location
 */
export function cacheSpots(
  latitude: number,
  longitude: number,
  radius: number,
  minQuality: number,
  spots: SharedAstroSpot[]
): void {
  const cacheKey = `spots-${latitude.toFixed(3)}-${longitude.toFixed(3)}-${radius}-${minQuality}`;
  
  spotsCache.set(cacheKey, {
    spots,
    timestamp: Date.now(),
    minQuality
  });
  
  console.log(`Cached ${spots.length} spots for location [${latitude.toFixed(3)}, ${longitude.toFixed(3)}]`);
}

/**
 * Clear the spots cache
 */
export function clearSpotsCache(): void {
  spotsCache.clear();
  console.log("Spots cache cleared");
}
