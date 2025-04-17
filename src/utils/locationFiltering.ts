
import { haversineDistance } from './geoUtils';
import { isWaterLocation } from './locationValidator';

/**
 * Check if a location is a certified dark sky site
 */
export function isCertifiedLocation(location: any): boolean {
  return !!(location.certification || location.isDarkSkyReserve);
}

/**
 * Filter out invalid locations (null, missing coordinates, etc.)
 */
export function filterValidLocations(locations: any[]): any[] {
  return locations.filter(loc => 
    loc && 
    typeof loc.latitude === 'number' && 
    typeof loc.longitude === 'number' &&
    !Number.isNaN(loc.latitude) && 
    !Number.isNaN(loc.longitude) &&
    loc.latitude >= -90 && 
    loc.latitude <= 90 &&
    loc.longitude >= -180 && 
    loc.longitude <= 180
  );
}

/**
 * Sort locations by distance from a center point
 */
export function sortByDistance(
  locations: any[], 
  centerLat: number, 
  centerLng: number
): any[] {
  return [...locations].sort((a, b) => {
    const distA = a.distance || haversineDistance(centerLat, centerLng, a.latitude, a.longitude);
    const distB = b.distance || haversineDistance(centerLat, centerLng, b.latitude, b.longitude);
    return distA - distB;
  });
}

/**
 * Filter locations by distance
 */
export function filterByDistance(
  locations: any[],
  centerLat: number,
  centerLng: number,
  maxDistanceKm: number
): any[] {
  return locations.filter(loc => {
    const distance = loc.distance || haversineDistance(
      centerLat, 
      centerLng, 
      loc.latitude, 
      loc.longitude
    );
    return distance <= maxDistanceKm;
  });
}

/**
 * Filter out water locations
 */
export function filterOutWaterLocations(locations: any[]): any[] {
  return locations.filter(loc => !isWaterLocation(loc.latitude, loc.longitude));
}

/**
 * Separate locations into certified and regular
 */
export function separateLocationTypes(locations: any[]): {
  certified: any[];
  regular: any[];
} {
  const certified = locations.filter(loc => isCertifiedLocation(loc));
  const regular = locations.filter(loc => !isCertifiedLocation(loc));
  
  return { certified, regular };
}

/**
 * Merge locations with priority (certified first)
 */
export function mergeLocations(certifiedLocations: any[], regularLocations: any[]): any[] {
  return [...certifiedLocations, ...regularLocations];
}
