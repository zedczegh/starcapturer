
import { updateLocationsWithRealTimeSiqs } from './realTimeSiqsService/locationUpdateService';
import { SharedAstroSpot } from '@/lib/siqs/types';

/**
 * Service for finding the best locations for astronomy
 */

/**
 * Update locations with SIQS data
 * @param locations Array of locations to update
 * @returns Promise resolving to locations with updated SIQS
 */
export async function updateLocationsWithSiqs(locations: SharedAstroSpot[]): Promise<SharedAstroSpot[]> {
  // Validate input
  if (!locations || !Array.isArray(locations) || locations.length === 0) {
    console.log("No locations provided to updateLocationsWithSiqs");
    return [];
  }
  
  console.log(`Updating SIQS for ${locations.length} locations`);
  
  // Make sure all locations have an id before passing to the update function
  const locationsWithIds = locations.map(loc => {
    if (!loc.id) {
      return {
        ...loc,
        id: `loc-${loc.latitude?.toFixed(6)}-${loc.longitude?.toFixed(6)}`
      } as SharedAstroSpot; // Type assertion to ensure it matches required id
    }
    return loc;
  });
  
  const result = await updateLocationsWithRealTimeSiqs(locationsWithIds);
  return result;
}
