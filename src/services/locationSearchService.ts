
import { SharedAstroSpot } from "@/lib/types/sharedTypes";

/**
 * Find locations within a specified radius
 * @param latitude Center latitude
 * @param longitude Center longitude
 * @param radius Search radius in km
 * @returns Promise resolving to array of locations
 */
export async function findLocationsWithinRadius(
  latitude: number,
  longitude: number,
  radius: number
): Promise<SharedAstroSpot[]> {
  // In a real implementation, this would call an API to find locations
  return [{
    id: `loc-${latitude.toFixed(6)}-${longitude.toFixed(6)}`,
    name: `Location at ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
    latitude,
    longitude,
    siqs: 6.5,
    timestamp: new Date().toISOString(),
    distance: 0
  }];
}

/**
 * Find calculated locations for astrophotography
 * @param latitude Center latitude
 * @param longitude Center longitude
 * @param radius Search radius in km
 * @returns Promise resolving to array of calculated locations
 */
export async function findCalculatedLocations(
  latitude: number,
  longitude: number,
  radius: number
): Promise<SharedAstroSpot[]> {
  // In a real implementation, this would calculate optimal locations
  return [{
    id: `calc-${latitude.toFixed(6)}-${longitude.toFixed(6)}`,
    name: `Calculated location near ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
    latitude: latitude + 0.05,
    longitude: longitude + 0.05,
    siqs: 7.2,
    timestamp: new Date().toISOString(),
    distance: 5
  }];
}

/**
 * Sort locations by quality and distance
 * @param locations Array of locations to sort
 * @returns Sorted array of locations
 */
export function sortLocationsByQuality(locations: SharedAstroSpot[]): SharedAstroSpot[] {
  return [...locations].sort((a, b) => {
    // Sort by certification status first
    if ((a.isDarkSkyReserve || a.certification) && !(b.isDarkSkyReserve || b.certification)) {
      return -1;
    }
    if (!(a.isDarkSkyReserve || a.certification) && (b.isDarkSkyReserve || b.certification)) {
      return 1;
    }
    
    // Then by SIQS
    const aSiqs = a.siqs || 0;
    const bSiqs = b.siqs || 0;
    
    if (aSiqs !== bSiqs) {
      return bSiqs - aSiqs;
    }
    
    // Finally by distance
    return (a.distance || Infinity) - (b.distance || Infinity);
  });
}
