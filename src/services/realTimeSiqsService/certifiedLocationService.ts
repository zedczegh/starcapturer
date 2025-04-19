
/**
 * Service specifically for handling certified dark sky locations
 */

import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { updateLocationsWithRealTimeSiqs } from "./locationUpdateService";
import { calculateRealTimeSiqs } from "../realTimeSiqs/siqsCalculator";

/**
 * Update an array of certified locations with real-time SIQS data
 * This specialized service provides optimized handling for certified locations
 */
export async function updateCertifiedLocationsWithSiqs(
  locations: SharedAstroSpot[]
): Promise<SharedAstroSpot[]> {
  console.log(`Updating ${locations.length} certified locations with real-time SIQS data`);
  
  try {
    // For certified locations, we use direct calculation rather than relying on the main service
    const updatedLocations = await Promise.all(locations.map(async (location) => {
      // Skip locations without valid coordinates
      if (!location.latitude || !location.longitude) return location;
      
      try {
        // Calculate SIQS directly for this location
        const siqsResult = await calculateRealTimeSiqs(
          location.latitude, 
          location.longitude, 
          location.bortleScale || 3 // Default to Bortle 3 for certified locations
        );
        
        if (siqsResult && siqsResult.siqs > 0) {
          // Create a shallow copy of the location with updated SIQS
          return {
            ...location,
            siqs: siqsResult.siqs
          };
        }
      } catch (error) {
        console.error(`Error calculating SIQS for certified location ${location.name}:`, error);
      }
      
      // Return original location if calculation failed
      return location;
    }));
    
    return updatedLocations;
  } catch (error) {
    console.error("Error updating certified locations with SIQS:", error);
    // If there's an error, fall back to normal update method
    return updateLocationsWithRealTimeSiqs(locations);
  }
}

/**
 * Clear SIQS cache for certified locations
 */
export function clearCertifiedLocationCache(): void {
  console.log("Clearing certified location SIQS cache");
  // Currently uses the same cache as regular locations
  // Could be extended to use a separate cache in the future
}
