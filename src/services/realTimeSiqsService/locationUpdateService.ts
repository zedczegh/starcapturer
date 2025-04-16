
import { clearSiqsCache } from '../realTimeSiqs/siqsCache';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { calculateRealTimeSiqs } from '../realTimeSiqs/siqsCalculator';

// Cache for location data
const locationSiqsCache = new Map<string, number>();

/**
 * Update a collection of locations with real-time SIQS data
 */
export async function updateLocationsWithRealTimeSiqs(
  locations: SharedAstroSpot[]
): Promise<SharedAstroSpot[]> {
  if (!locations || locations.length === 0) {
    return [];
  }
  
  const updatedLocations = [...locations];
  
  for (const location of updatedLocations) {
    if (!location.latitude || !location.longitude) continue;
    
    // Use cached value if available
    const cacheKey = `${location.latitude.toFixed(4)}-${location.longitude.toFixed(4)}`;
    if (locationSiqsCache.has(cacheKey)) {
      location.siqs = locationSiqsCache.get(cacheKey);
      continue;
    }
    
    try {
      // Calculate default Bortle scale if not available
      const bortleScale = location.bortleScale || 4;
      
      const result = await calculateRealTimeSiqs(
        location.latitude,
        location.longitude,
        bortleScale
      );
      
      location.siqs = result.siqs;
      location.isViable = result.isViable;
      
      // Cache the result
      locationSiqsCache.set(cacheKey, result.siqs);
    } catch (error) {
      console.error(`Failed to update SIQS for location ${location.name}:`, error);
    }
  }
  
  return updatedLocations;
}

/**
 * Clear the location cache
 */
export function clearLocationCache(): void {
  locationSiqsCache.clear();
  clearSiqsCache();
  console.log("Location cache cleared");
}
