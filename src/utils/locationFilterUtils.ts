
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { calculateDistance } from "@/utils/geoUtils";
import { isValidAstronomyLocation } from "@/utils/locationValidator";

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
    if (!isValidAstronomyLocation(location.latitude, location.longitude, location.name)) {
      return false;
    }
    
    // Filter by quality
    const siqs = typeof location.siqs === 'number' ? location.siqs : 
              (location.siqs && typeof location.siqs === 'object' && 'score' in location.siqs) ? 
              location.siqs.score : 0;
    
    if (siqs < qualityThreshold) {
      return false;
    }
    
    // Filter by distance if user location is provided
    if (userLocation && radius > 0) {
      // Use existing distance property or calculate it
      const distance = location.distance || calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        location.latitude,
        location.longitude
      );
      
      // Add or update the distance property
      location.distance = distance;
      
      // Filter out locations beyond the radius
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
    const siqsA = typeof a.siqs === 'number' ? a.siqs : 
                (a.siqs && typeof a.siqs === 'object' && 'score' in a.siqs) ? 
                a.siqs.score : 0;
                
    const siqsB = typeof b.siqs === 'number' ? b.siqs : 
                (b.siqs && typeof b.siqs === 'object' && 'score' in b.siqs) ? 
                b.siqs.score : 0;
    
    if (siqsA !== siqsB) {
      return siqsB - siqsA;
    }
    
    // Then sort by distance
    return (a.distance || Infinity) - (b.distance || Infinity);
  });
}
