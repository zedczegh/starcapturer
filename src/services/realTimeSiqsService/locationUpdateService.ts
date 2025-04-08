
import { calculateRealTimeSiqs, batchCalculateSiqs } from '../realTimeSiqsService';
import { SharedAstroSpot } from '@/lib/siqs/types';
import { getConsistentSiqsValue } from '@/utils/nighttimeSIQS';

// Create a cache for locations to avoid redundant processing
const locationCache = new Map<string, {
  data: SharedAstroSpot;
  timestamp: number;
}>();

// Cache lifetime in milliseconds (30 minutes)
const LOCATION_CACHE_LIFETIME = 30 * 60 * 1000;

/**
 * Updates a set of locations with real-time SIQS data
 * @param locations Array of locations to update
 * @returns Promise resolving to locations with updated SIQS
 */
export async function updateLocationsWithRealTimeSiqs(
  locations: SharedAstroSpot[]
): Promise<SharedAstroSpot[]> {
  if (!locations || !Array.isArray(locations) || locations.length === 0) {
    return [];
  }
  
  console.log(`Updating ${locations.length} locations with real-time SIQS`);
  
  // Filter out invalid locations
  const validLocations = locations.filter(loc => 
    loc && typeof loc.latitude === 'number' && typeof loc.longitude === 'number'
  );
  
  // Check cache first for each location
  const locationsToUpdate: SharedAstroSpot[] = [];
  const updatedLocations: SharedAstroSpot[] = [];
  
  for (const location of validLocations) {
    const cacheKey = `${location.latitude.toFixed(4)}-${location.longitude.toFixed(4)}`;
    const cachedLocation = locationCache.get(cacheKey);
    
    if (cachedLocation && (Date.now() - cachedLocation.timestamp) < LOCATION_CACHE_LIFETIME) {
      // Use cached data if fresh
      updatedLocations.push({
        ...location,
        siqs: cachedLocation.data.siqs,
        isViable: cachedLocation.data.isViable,
        siqsResult: cachedLocation.data.siqsResult
      });
    } else {
      // Need to update this location
      locationsToUpdate.push(location);
    }
  }
  
  if (locationsToUpdate.length > 0) {
    try {
      // Batch update the remaining locations
      const freshLocations = await batchCalculateSiqs(locationsToUpdate);
      
      // Update the cache with fresh data
      for (const location of freshLocations) {
        const cacheKey = `${location.latitude.toFixed(4)}-${location.longitude.toFixed(4)}`;
        locationCache.set(cacheKey, {
          data: location,
          timestamp: Date.now()
        });
      }
      
      // Combine cached and fresh results
      const result = [...updatedLocations, ...freshLocations];
      
      // Ensure SIQS values are consistent across the app
      const finalResult = result.map(location => ({
        ...location,
        siqs: getConsistentSiqsValue(location)
      }));
      
      console.log(`Updated SIQS for ${freshLocations.length} locations`);
      return finalResult;
    } catch (error) {
      console.error("Error updating locations with SIQS:", error);
      return [...updatedLocations, ...locationsToUpdate];
    }
  } else {
    // All locations were cached
    return updatedLocations;
  }
}

/**
 * Clear the location cache for testing or when data becomes stale
 */
export function clearLocationCache(): void {
  const size = locationCache.size;
  locationCache.clear();
  console.log(`Location cache cleared (${size} entries removed)`);
}

/**
 * Get the current location cache size
 * @returns Number of cached entries
 */
export function getLocationCacheSize(): number {
  return locationCache.size;
}
