
/**
 * Service for updating locations with real-time SIQS data
 */
import { calculateRealTimeSiqs, batchCalculateSiqs } from '../realTimeSiqsService';
import { SharedAstroSpot } from '@/lib/api/astroSpots';

// Cache for location data to reduce API calls
const locationCache = new Map<string, {
  data: any;
  timestamp: number;
}>();

// Cache lifetime in milliseconds
const CACHE_LIFETIME = 10 * 60 * 1000; // 10 minutes

/**
 * Update a collection of locations with real-time SIQS data
 * @param locations Array of locations to update
 * @returns Promise resolving to updated locations
 */
export async function updateLocationsWithRealTimeSiqs(
  locations: SharedAstroSpot[]
): Promise<SharedAstroSpot[]> {
  if (!locations || locations.length === 0) return [];
  
  console.log(`Updating ${locations.length} locations with real-time SIQS data`);
  
  try {
    // Use batch calculation for all locations
    return await batchCalculateSiqs(locations);
  } catch (error) {
    console.error("Error updating locations with real-time SIQS:", error);
    return locations;
  }
}

/**
 * Get a location from cache or external API
 * @param latitude Location latitude
 * @param longitude Location longitude
 * @param forceRefresh Whether to force a cache refresh
 * @returns Promise resolving to location data
 */
export async function getLocationData(
  latitude: number,
  longitude: number,
  forceRefresh: boolean = false
): Promise<any> {
  if (!latitude || !longitude) return null;
  
  const cacheKey = `${latitude.toFixed(4)}-${longitude.toFixed(4)}`;
  const cachedData = locationCache.get(cacheKey);
  
  // Check if we have valid cached data
  if (!forceRefresh && cachedData && (Date.now() - cachedData.timestamp) < CACHE_LIFETIME) {
    console.log(`Using cached location data for ${cacheKey}`);
    return cachedData.data;
  }
  
  try {
    // Calculate real-time SIQS
    const siqsResult = await calculateRealTimeSiqs(latitude, longitude, 5);
    
    // Create location data
    const locationData = {
      latitude,
      longitude,
      siqs: siqsResult.siqs,
      isViable: siqsResult.isViable,
      siqsFactors: siqsResult.factors || []
    };
    
    // Cache the result
    locationCache.set(cacheKey, {
      data: locationData,
      timestamp: Date.now()
    });
    
    return locationData;
  } catch (error) {
    console.error(`Error fetching location data for ${latitude}, ${longitude}:`, error);
    return null;
  }
}

/**
 * Clear the location cache entirely
 */
export function clearLocationCache(): void {
  const size = locationCache.size;
  locationCache.clear();
  console.log(`Location cache cleared (${size} entries removed)`);
}

/**
 * Clear a specific location from the cache
 */
export function clearLocationFromCache(latitude: number, longitude: number): void {
  const cacheKey = `${latitude.toFixed(4)}-${longitude.toFixed(4)}`;
  if (locationCache.has(cacheKey)) {
    locationCache.delete(cacheKey);
    console.log(`Cleared cache for location ${cacheKey}`);
  }
}

/**
 * Purge expired entries from the location cache
 */
export function purgeExpiredCache(): void {
  let purgedCount = 0;
  const now = Date.now();
  
  for (const [key, value] of locationCache.entries()) {
    if (now - value.timestamp > CACHE_LIFETIME) {
      locationCache.delete(key);
      purgedCount++;
    }
  }
  
  if (purgedCount > 0) {
    console.log(`Purged ${purgedCount} expired entries from location cache`);
  }
}
