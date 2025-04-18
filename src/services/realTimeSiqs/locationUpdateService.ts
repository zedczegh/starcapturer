
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { calculateRealTimeSiqs } from "./siqsCalculator";
import { clearSiqsCache } from "./siqsCache";
import { fetchForecastData } from '@/lib/api';
import { calculateTonightCloudCover } from '@/utils/nighttimeSIQS';

/**
 * Update locations with simplified real-time SIQS data based only on nighttime cloud cover
 */
export async function updateLocationsWithRealTimeSiqs(
  locations: SharedAstroSpot[]
): Promise<SharedAstroSpot[]> {
  if (!locations || locations.length === 0) return locations;
  
  console.log(`Updating ${locations.length} locations with real-time cloud cover-based SIQS`);
  
  try {
    // Process in batches to prevent overwhelming the API
    const batchSize = 5;
    const updatedLocations: SharedAstroSpot[] = [];
    
    for (let i = 0; i < locations.length; i += batchSize) {
      const batch = locations.slice(i, i + batchSize);
      
      // Process batch in parallel
      const batchPromises = batch.map(async (location) => {
        try {
          // Calculate SIQS for this location based only on cloud cover
          const siqsResult = await calculateRealTimeSiqs(
            location.latitude,
            location.longitude,
            location.bortleScale || 4
          );
          
          // Return updated location with new SIQS data
          return {
            ...location,
            siqs: siqsResult.score,
            siqsResult: siqsResult
          };
        } catch (error) {
          console.error(`Error calculating SIQS for location ${location.id || location.name}:`, error);
          return location;
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      updatedLocations.push(...batchResults);
      
      // Add small delay between batches to avoid rate limiting
      if (i + batchSize < locations.length) {
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }
    
    console.log(`Successfully updated ${updatedLocations.length} locations with cloud cover-based SIQS data`);
    return updatedLocations;
    
  } catch (error) {
    console.error("Error updating locations with real-time SIQS:", error);
    return locations;
  }
}

/**
 * Clear SIQS cache for a specific location or all locations
 */
export function clearLocationCache(
  latitude?: number,
  longitude?: number
): void {
  if (latitude !== undefined && longitude !== undefined) {
    console.log(`Clearing SIQS cache for location ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
    
    // Clear from session storage too
    try {
      const cacheKey = `siqs_${latitude.toFixed(4)}-${longitude.toFixed(4)}`;
      sessionStorage.removeItem(cacheKey);
    } catch (e) {
      // Ignore storage errors
    }
  } else {
    console.log("Clearing all SIQS cache entries");
    
    // Clear all SIQS cache from session storage
    try {
      const keys = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && key.startsWith('siqs_')) {
          keys.push(key);
        }
      }
      
      keys.forEach(key => sessionStorage.removeItem(key));
      console.log(`Cleared ${keys.length} SIQS entries from session storage`);
    } catch (e) {
      // Ignore storage errors
    }
  }
  
  clearSiqsCache();
}

/**
 * Calculate SIQS directly from cloud cover - provides immediate feedback
 * @param cloudCover Cloud cover percentage (0-100)
 */
export function calculateSiqsFromCloudCover(cloudCover: number): number {
  // 0% cloud cover = 10 points, 100% cloud cover = 0 points
  return Math.min(10, Math.max(0, 10 - (cloudCover / 10)));
}
