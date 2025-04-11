import { SharedAstroSpot } from '@/lib/siqs/types';
import { calculateDistance } from '@/utils/geoUtils';
import { isValidAstronomyLocation } from '@/utils/locationValidator';

/**
 * Filter and sort locations for display
 * @param locations All locations
 * @param userLocation Current user location
 * @param maxCount Maximum number of locations to return
 * @returns Filtered and sorted locations
 */
export const getTopLocations = (
  locations: SharedAstroSpot[],
  userLocation: { latitude: number; longitude: number } | null,
  maxCount: number = 20
): SharedAstroSpot[] => {
  if (!locations || locations.length === 0) return [];
  
  // Filter out invalid locations
  const validLocations = locations.filter(loc => 
    loc && loc.latitude && loc.longitude && 
    isValidAstronomyLocation(loc.latitude, loc.longitude)
  );
  
  // Add distance to each location if user location is available
  const withDistance = validLocations.map(loc => {
    if (userLocation) {
      const distance = calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        loc.latitude,
        loc.longitude
      );
      return { ...loc, distance };
    }
    return loc;
  });
  
  // First prioritize certified locations
  const sortedLocations = [...withDistance].sort((a, b) => {
    // First sort by certification status
    if ((a.isDarkSkyReserve || a.certification) && !(b.isDarkSkyReserve || b.certification)) {
      return -1;
    }
    if (!(a.isDarkSkyReserve || a.certification) && (b.isDarkSkyReserve || b.certification)) {
      return 1;
    }
    
    // Then sort by SIQS if available
    const aSiqs = a.siqsResult?.score ?? a.siqs ?? 0;
    const bSiqs = b.siqsResult?.score ?? b.siqs ?? 0;
    
    if (aSiqs !== bSiqs) {
      return bSiqs - aSiqs; // Higher SIQS first
    }
    
    // Finally sort by distance if available
    if (a.distance !== undefined && b.distance !== undefined) {
      return a.distance - b.distance;
    }
    
    return 0;
  });
  
  return sortedLocations.slice(0, maxCount);
};

/**
 * Deduplicate locations by coordinates
 * @param locations Array of locations
 * @param precision Coordinate precision for deduplication
 * @returns Deduplicated locations
 */
export const deduplicateLocations = (
  locations: SharedAstroSpot[],
  precision: number = 5
): SharedAstroSpot[] => {
  const seen = new Map<string, SharedAstroSpot>();
  
  locations.forEach(loc => {
    if (!loc.latitude || !loc.longitude) return;
    
    const key = `${loc.latitude.toFixed(precision)},${loc.longitude.toFixed(precision)}`;
    
    // If we haven't seen this coordinate before, or if this location has better data, keep it
    if (!seen.has(key) || 
        (loc.siqs && (!seen.get(key)?.siqs || loc.siqs > (seen.get(key)?.siqs || 0)))) {
      seen.set(key, loc);
    }
  });
  
  return Array.from(seen.values());
};
