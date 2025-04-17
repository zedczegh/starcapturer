
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { calculateRealTimeSiqs } from '../realTimeSiqs/siqsCalculator';
import { batchCalculateSiqs } from '../realTimeSiqs/realTimeSiqsService';

/**
 * Update certified locations with real-time SIQS data
 * This function prioritizes certified locations and handles them specially
 */
export async function updateCertifiedLocationsWithSiqs(
  locations: SharedAstroSpot[]
): Promise<SharedAstroSpot[]> {
  if (!locations || locations.length === 0) return [];
  
  try {
    console.log(`Updating ${locations.length} certified locations with real-time SIQS`);
    
    // Certified locations use a lower Bortle scale value for calculation
    const locationsWithAdjustedBortle = locations.map(location => {
      // For certified dark sky reserves, assume Bortle scale 2-3 unless specified
      if (location.isDarkSkyReserve && !location.bortleScale) {
        return {
          ...location,
          bortleScale: 2 // Dark sky reserves are typically Bortle 2-3
        };
      }
      
      // For other certified locations without a specified Bortle scale, use 4
      if (location.certification && !location.bortleScale) {
        return {
          ...location,
          bortleScale: 4 // Other certified locations typically Bortle 4
        };
      }
      
      return location;
    });
    
    // Use batch calculation for efficiency
    const results = await batchCalculateSiqs(locationsWithAdjustedBortle);
    
    console.log(`Successfully updated ${results.length} certified locations with SIQS data`);
    return results;
  } catch (error) {
    console.error("Error updating certified locations with real-time SIQS:", error);
    return locations;
  }
}
