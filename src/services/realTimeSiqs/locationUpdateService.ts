
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { calculateRealTimeSiqs } from "./siqsCalculator";
import { clearSiqsCache } from "./siqsCache";

/**
 * Update locations with simplified real-time SIQS data
 */
export async function updateLocationsWithRealTimeSiqs(
  locations: SharedAstroSpot[]
): Promise<SharedAstroSpot[]> {
  if (!locations || locations.length === 0) return locations;
  
  console.log(`Updating ${locations.length} locations with simplified real-time SIQS data`);
  
  try {
    const updatedLocations = await Promise.all(
      locations.map(async (location) => {
        try {
          const siqsResult = await calculateRealTimeSiqs(
            location.latitude,
            location.longitude
          );
          
          const updatedLocation = {
            ...location,
            siqs: siqsResult.score,
            siqsResult: siqsResult
          };
          
          console.log(`Updated location ${location.id || 'unnamed'} with SIQS ${siqsResult.score}`);
          return updatedLocation;
        } catch (error) {
          console.error(`Error calculating SIQS for location ${location.id}:`, error);
          return location;
        }
      })
    );
    
    console.log(`Successfully updated ${updatedLocations.length} locations with SIQS data`);
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
 * Update certified locations with specialized handling
 */
export async function updateCertifiedLocationsWithSiqs(
  locations: SharedAstroSpot[]
): Promise<SharedAstroSpot[]> {
  // This is just a wrapper around the main function for now
  // With the simplified SIQS, we don't need special handling for certified locations
  return updateLocationsWithRealTimeSiqs(locations);
}
