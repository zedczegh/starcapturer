
import { SharedAstroSpot } from '@/lib/api/astroSpots';

/**
 * Check if a location is a certified dark sky location
 */
export function isCertifiedLocation(location: SharedAstroSpot): boolean {
  return Boolean(location.isDarkSkyReserve || location.certification);
}

/**
 * Filter locations by quality (certified first, then by SIQS score)
 */
export function filterLocationsByQuality(locations: SharedAstroSpot[]): SharedAstroSpot[] {
  if (!locations || locations.length === 0) return [];
  
  // Create a copy of the array to avoid mutating the original
  return [...locations].sort((a, b) => {
    // First sort by certification status
    if (isCertifiedLocation(a) && !isCertifiedLocation(b)) {
      return -1;
    }
    if (!isCertifiedLocation(a) && isCertifiedLocation(b)) {
      return 1;
    }
    
    // Then sort by SIQS score (higher first)
    const scoreA = typeof a.siqs === 'number' ? a.siqs : 
                  (typeof a.siqs === 'object' && a.siqs?.score ? a.siqs.score : 0);
                  
    const scoreB = typeof b.siqs === 'number' ? b.siqs : 
                  (typeof b.siqs === 'object' && b.siqs?.score ? b.siqs.score : 0);
                  
    return scoreB - scoreA;
  });
}

/**
 * Filter locations by distance from user
 */
export function filterLocationsByDistance(
  locations: SharedAstroSpot[],
  userLocation: { latitude: number; longitude: number } | null,
  searchRadius: number
): SharedAstroSpot[] {
  if (!locations || locations.length === 0) return [];
  if (!userLocation) return locations;
  
  return locations.filter(location => {
    // Always include certified locations regardless of distance
    if (isCertifiedLocation(location)) {
      return true;
    }
    
    // Filter regular locations by distance
    return location.distance !== undefined && location.distance <= searchRadius;
  });
}
