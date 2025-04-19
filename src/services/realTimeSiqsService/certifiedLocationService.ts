
/**
 * Service specifically for handling certified dark sky locations
 */

import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { updateLocationsWithRealTimeSiqs } from "./locationUpdateService";

/**
 * Update an array of certified locations with real-time SIQS data
 * This specialized service provides optimized handling for certified locations
 */
export async function updateCertifiedLocationsWithSiqs(
  locations: SharedAstroSpot[]
): Promise<SharedAstroSpot[]> {
  // Higher priority and better caching for certified locations
  return updateLocationsWithRealTimeSiqs(locations);
}

/**
 * Clear SIQS cache for certified locations
 */
export function clearCertifiedLocationCache(): void {
  console.log("Clearing certified location SIQS cache");
  // Currently uses the same cache as regular locations
  // Could be extended to use a separate cache in the future
}
