
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { calculateRealTimeSiqs } from '../realTimeSiqs/siqsCalculator';
import { batchCalculateSiqs } from '../realTimeSiqs/realTimeSiqsService';
import { isCertifiedLocation } from '@/utils/locationFiltering';

/**
 * Update locations with real-time SIQS data
 */
export async function updateLocationsWithRealTimeSiqs(
  locations: SharedAstroSpot[]
): Promise<SharedAstroSpot[]> {
  if (!locations || locations.length === 0) return [];
  
  try {
    console.log(`Updating ${locations.length} locations with real-time SIQS`);
    
    // Special handling for certified locations
    const enhancedLocations = locations.map(location => {
      // For certified locations, ensure they have appropriate Bortle scale
      if (isCertifiedLocation(location) && !location.bortleScale) {
        return {
          ...location,
          bortleScale: location.isDarkSkyReserve ? 2 : 4
        };
      }
      
      // Ensure all locations have a default Bortle scale
      if (!location.bortleScale) {
        return {
          ...location,
          bortleScale: 5 // Default Bortle scale
        };
      }
      
      return location;
    });
    
    // Use batch calculation for efficiency
    const results = await batchCalculateSiqs(enhancedLocations);
    
    console.log(`Successfully updated ${results.length} locations with SIQS data`);
    return results;
  } catch (error) {
    console.error("Error updating locations with real-time SIQS:", error);
    return locations;
  }
}
