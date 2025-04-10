import { updateLocationsWithRealTimeSiqs } from './realTimeSiqsService/locationUpdateService';
import { SharedAstroSpot } from '@/lib/api/astroSpots';

/**
 * Service for finding the best locations for astronomy
 */

/**
 * Update locations with SIQS data
 * @param locations Array of locations to update
 * @returns Promise resolving to locations with updated SIQS
 */
// Fix the type error with SharedAstroSpot[]
export async function updateLocationsWithSiqs(locations: any[]): Promise<any[]> {
  // Wrap the locations in a type assertion to match the expected type
  const result = await updateLocationsWithRealTimeSiqs(locations as SharedAstroSpot[]);
  return result;
}
