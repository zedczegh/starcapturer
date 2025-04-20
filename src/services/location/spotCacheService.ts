
import { SharedAstroSpot } from '@/lib/api/astroSpots';

// Enhanced cache structure to store spots by location
const spotsCache = new Map<string, {
  spots: SharedAstroSpot[];
  timestamp: number;
  minQuality: number;
}>();

// Lookup index for faster spatial queries
const spatialIndex = new Map<string, string[]>();

// Cache expiration time (30 minutes)
const CACHE_EXPIRY = 30 * 60 * 1000;

/**
 * Get cached spots for a location if available and not expired
 * Optimized with spatial indexing for better performance
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
  
  // If exact match not found, try to find nearby spots within a reasonable distance
  const gridKey = getGridKey(latitude, longitude, 1); // 1 degree grid (~100km)
  const nearbyCacheKeys = spatialIndex.get(gridKey);
  
  if (nearbyCacheKeys) {
    for (const nearbyCacheKey of nearbyCacheKeys) {
      const nearbyCache = spotsCache.get(nearbyCacheKey);
      if (nearbyCache && 
          (Date.now() - nearbyCache.timestamp) < CACHE_EXPIRY && 
          nearbyCache.minQuality <= minQuality) {
        
        // Check if the nearby cache is close enough to be useful
        const [, latStr, lonStr, radiusStr] = nearbyCacheKey.split('-');
        const cachedLat = parseFloat(latStr);
        const cachedLon = parseFloat(lonStr);
        const cachedRadius = parseFloat(radiusStr);
        
        const distance = calculateDistance(latitude, longitude, cachedLat, cachedLon);
        
        // If the cached location is close enough and its radius is similar or larger
        if (distance < radius * 0.5 && cachedRadius >= radius * 0.7) {
          console.log(`Using nearby cached spots (${distance.toFixed(1)}km away) for location [${latitude.toFixed(3)}, ${longitude.toFixed(3)}]`);
          return nearbyCache.spots;
        }
      }
    }
  }
  
  return null;
}

/**
 * Cache spots for a location with improved spatial indexing
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
  
  // Update spatial index
  const gridKey = getGridKey(latitude, longitude, 1);
  if (!spatialIndex.has(gridKey)) {
    spatialIndex.set(gridKey, []);
  }
  
  const keys = spatialIndex.get(gridKey)!;
  if (!keys.includes(cacheKey)) {
    keys.push(cacheKey);
  }
  
  console.log(`Cached ${spots.length} spots for location [${latitude.toFixed(3)}, ${longitude.toFixed(3)}]`);
}

/**
 * Get grid key for spatial indexing
 * Divides the world into grid cells for faster lookup
 */
function getGridKey(latitude: number, longitude: number, gridSize: number): string {
  const latGrid = Math.floor(latitude / gridSize) * gridSize;
  const lonGrid = Math.floor(longitude / gridSize) * gridSize;
  return `grid-${latGrid}-${lonGrid}`;
}

/**
 * Calculate distance between two points
 * Uses the Haversine formula for accuracy
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  
  return distance;
}

/**
 * Clear the spots cache
 */
export function clearSpotsCache(): void {
  spotsCache.clear();
  spatialIndex.clear();
  console.log("Spots cache cleared");
}
