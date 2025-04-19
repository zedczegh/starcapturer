import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { calculateDistance } from "@/utils/geoUtils";
import { isWaterLocation } from "@/utils/validation";
import { getSiqsScore } from "@/utils/siqsHelpers";

/**
 * Efficiently filter locations by quality and distance
 * @param locations The locations to filter
 * @param userLocation The current user location
 * @param radius The search radius in kilometers
 * @param qualityThreshold Minimum SIQS score threshold
 * @returns Filtered array of locations
 */
export function filterLocationsByQualityAndDistance(
  locations: SharedAstroSpot[],
  userLocation: { latitude: number; longitude: number } | null,
  radius: number,
  qualityThreshold: number = 0
): SharedAstroSpot[] {
  if (!locations || locations.length === 0) {
    return [];
  }
  
  // Create a set for O(1) lookups for duplicate checking
  const uniqueLocationKeys = new Set<string>();
  
  return locations.filter(location => {
    // Skip locations with no coordinates
    if (!location.latitude || !location.longitude) {
      return false;
    }
    
    // Deduplicate locations
    const locationKey = `${location.latitude.toFixed(4)}-${location.longitude.toFixed(4)}`;
    if (uniqueLocationKeys.has(locationKey)) {
      return false;
    }
    uniqueLocationKeys.add(locationKey);
    
    // Always keep certified locations
    if (location.isDarkSkyReserve || location.certification) {
      return true;
    }
    
    // Filter out water locations for calculated spots
    if (isWaterLocation(location.latitude, location.longitude)) {
      return false;
    }
    
    // Filter by quality threshold only if SIQS is available
    if (location.siqs !== undefined && getSiqsScore(location.siqs) < qualityThreshold) {
      return false;
    }
    
    // Filter by distance if user location is provided
    if (userLocation && radius > 0) {
      const distance = location.distance || calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        location.latitude,
        location.longitude
      );
      
      location.distance = distance;
      return distance <= radius;
    }
    
    return true;
  });
}

/**
 * Sort locations by quality and distance
 * @param locations Locations to sort
 * @returns Sorted array of locations
 */
export function sortLocationsByQualityAndDistance(
  locations: SharedAstroSpot[]
): SharedAstroSpot[] {
  if (!locations || locations.length === 0) {
    return [];
  }
  
  return [...locations].sort((a, b) => {
    // First prioritize certified locations
    if ((a.isDarkSkyReserve || a.certification) && !(b.isDarkSkyReserve || b.certification)) {
      return -1;
    }
    if (!(a.isDarkSkyReserve || a.certification) && (b.isDarkSkyReserve || b.certification)) {
      return 1;
    }
    
    // Then sort by SIQS score
    if ((a.siqs || 0) !== (b.siqs || 0)) {
      return (getSiqsScore(b.siqs) || 0) - (getSiqsScore(a.siqs) || 0);
    }
    
    // Then sort by distance
    return (a.distance || Infinity) - (b.distance || Infinity);
  });
}
