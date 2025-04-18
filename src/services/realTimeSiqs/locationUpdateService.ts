
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
          
          return {
            ...location,
            siqs: {
              score: siqsResult.score,
              isViable: siqsResult.isViable
            },
            siqsResult: siqsResult.siqsResult
          };
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
  } else {
    console.log("Clearing all SIQS cache entries");
  }
  
  clearSiqsCache();
}
