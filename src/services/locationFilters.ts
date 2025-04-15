
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { isWaterLocation, isValidAstronomyLocation } from '@/utils/locationValidator';
import { calculateDistance } from '@/lib/api/coordinates';

/**
 * Sort locations by quality and distance
 * @param locations Array of locations
 * @returns Sorted array of locations
 */
export function sortLocationsByQuality(locations: SharedAstroSpot[]): SharedAstroSpot[] {
  return [...locations].sort((a, b) => {
    // First prioritize certified locations
    if ((a.isDarkSkyReserve || a.certification) && !(b.isDarkSkyReserve || b.certification)) {
      return -1;
    }
    if (!(a.isDarkSkyReserve || a.certification) && (b.isDarkSkyReserve || b.certification)) {
      return 1;
    }
    
    // If both are certified or both are not certified, check if they're in the same category
    const aIsCertified = a.isDarkSkyReserve || a.certification;
    const bIsCertified = b.isDarkSkyReserve || b.certification;
    
    if (aIsCertified && bIsCertified) {
      // If both are certified, sort by SIQS score first
      if (a.siqs !== b.siqs) {
        return (b.siqs || 0) - (a.siqs || 0);
      }
      // Then by distance
      return (a.distance || Infinity) - (b.distance || Infinity);
    }
    
    if (!aIsCertified && !bIsCertified) {
      // For calculated locations, sort by SIQS score first
      if (a.siqs !== b.siqs) {
        return (b.siqs || 0) - (a.siqs || 0);
      }
      // Then by distance
      return (a.distance || Infinity) - (b.distance || Infinity);
    }
    
    // Default case: sort by SIQS score
    return (b.siqs || 0) - (a.siqs || 0);
  });
}

/**
 * Filter locations by criteria (e.g., remove water locations)
 * @param locations Array of locations to filter
 * @returns Filtered array of locations
 */
export function filterLocations(locations: SharedAstroSpot[]): SharedAstroSpot[] {
  return locations.filter(point => {
    // IMPORTANT: Never filter out certified locations
    if (point.isDarkSkyReserve || point.certification) {
      return true;
    }
    
    // Only apply astronomy location validation to non-certified locations
    return isValidAstronomyLocation(point.latitude, point.longitude, point.name);
  });
}

/**
 * Generate a random point within a specified radius
 * @param centerLat Center latitude
 * @param centerLng Center longitude
 * @param radius Radius in kilometers
 * @returns Random point object
 */
export function generateRandomPoint(centerLat: number, centerLng: number, radius: number): { latitude: number, longitude: number, distance: number } {
  const angle = Math.random() * 2 * Math.PI;
  const radiusInMeters = radius * 1000;
  const x = radiusInMeters * Math.cos(angle);
  const y = radiusInMeters * Math.sin(angle);
  
  const newLat = centerLat + (y / 111320);
  const newLng = centerLng + (x / (111320 * Math.cos(centerLat * Math.PI / 180)));
  
  return {
    latitude: newLat,
    longitude: newLng,
    distance: calculateDistance(centerLat, centerLng, newLat, newLng)
  };
}
