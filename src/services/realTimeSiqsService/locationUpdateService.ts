
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { calculateSiqs } from '../realTimeSiqsService';
import { getSiqsScore } from '@/utils/siqsHelpers';

/**
 * Update a collection of locations with real-time SIQS scores
 * @param locations Array of locations to update
 * @returns Updated array with real-time SIQS scores
 */
export async function updateLocationsWithRealTimeSiqs(
  locations: SharedAstroSpot[]
): Promise<SharedAstroSpot[]> {
  if (!locations || locations.length === 0) {
    return [];
  }
  
  try {
    // Process in batches to avoid overwhelming APIs
    const batchSize = 3;
    const results: SharedAstroSpot[] = [];
    
    for (let i = 0; i < locations.length; i += batchSize) {
      const batch = locations.slice(i, i + batchSize);
      
      // Process in parallel
      const batchPromises = batch.map(location => {
        // Skip update for locations that already have good SIQS data
        if (location.siqs !== undefined && getSiqsScore(location.siqs) > 0) {
          return Promise.resolve(location);
        }
        
        // Calculate SIQS for this location
        return calculateSiqs(location);
      });
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // Small delay between batches to prevent rate limiting
      if (i + batchSize < locations.length) {
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }
    
    return results;
  } catch (error) {
    console.error("Error updating locations with real-time SIQS:", error);
    return locations; // Return original locations if update fails
  }
}

/**
 * Update a single location with real-time SIQS score
 * @param location Location to update
 * @returns Updated location with SIQS score
 */
export async function updateLocationWithRealTimeSiqs(
  location: SharedAstroSpot
): Promise<SharedAstroSpot> {
  if (!location) {
    return location;
  }
  
  try {
    return await calculateSiqs(location);
  } catch (error) {
    console.error("Error updating location with real-time SIQS:", error);
    return location; // Return original location if update fails
  }
}
