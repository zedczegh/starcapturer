
import { calculateRealTimeSiqs } from '../realTimeSiqs/siqsCalculator';
import { SharedAstroSpot } from '@/lib/api/astroSpots';

/**
 * Update a collection of locations with real-time SIQS scores
 * @param locations Array of locations to update
 * @returns Promise resolving to the updated locations
 */
export async function updateLocationsWithRealTimeSiqs(locations: SharedAstroSpot[]): Promise<SharedAstroSpot[]> {
  if (!locations || locations.length === 0) return [];
  
  try {
    const updatedLocations = await Promise.all(
      locations.map(async (location) => {
        // Skip if no valid latitude/longitude or already has SIQS
        if (!location.latitude || !location.longitude) {
          return location;
        }

        // If location has a valid Bortle scale, calculate real-time SIQS
        const bortleScale = location.bortleScale || 
                          (location.isDarkSkyReserve ? 3 : 5);
        
        try {
          const result = await calculateRealTimeSiqs(
            location.latitude,
            location.longitude,
            bortleScale
          );
          
          if (result && typeof result.siqs === 'number') {
            return {
              ...location,
              siqs: result.siqs
            };
          }
        } catch (error) {
          console.error(`Error calculating SIQS for ${location.name}:`, error);
        }
        
        return location;
      })
    );
    
    return updatedLocations;
  } catch (error) {
    console.error("Error updating locations with real-time SIQS:", error);
    return locations;
  }
}

/**
 * Add placeholder SIQS scores to locations without scores
 * @param locations Array of locations to update
 * @returns The updated locations with placeholder scores
 */
export function addPlaceholderSiqsScores(locations: SharedAstroSpot[]): SharedAstroSpot[] {
  if (!locations || locations.length === 0) return [];
  
  return locations.map(location => {
    if (location.siqs !== undefined && location.siqs !== null) {
      return location;
    }
    
    // Add placeholder score based on Bortle scale or certification
    let placeholderScore = 5.0;
    
    if (location.isDarkSkyReserve || location.certification) {
      placeholderScore = 8.0;
    } else if (location.bortleScale) {
      // Convert Bortle scale (1-9) to SIQS (0-10)
      // Lower Bortle = better conditions = higher SIQS
      placeholderScore = Math.max(0, 10 - (location.bortleScale - 1));
    }
    
    return {
      ...location,
      siqs: placeholderScore
    };
  });
}
