import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { calculateDistance } from '@/utils/geoUtils';
import { isWaterLocation, isValidAstronomyLocation } from '@/utils/validation';

/**
 * Filter locations based on distance from user
 */
export function filterLocationsByDistance(
  locations: SharedAstroSpot[],
  userLocation: { latitude: number; longitude: number } | null,
  radius: number
): SharedAstroSpot[] {
  if (!userLocation || !locations) {
    return locations || [];
  }
  
  return locations.filter(location => {
    // Skip locations without valid coordinates
    if (!location.latitude || !location.longitude) {
      return false;
    }
    
    // Calculate distance
    const distance = calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      location.latitude,
      location.longitude
    );
    
    // Add distance to location for sorting and display
    location.distance = distance;
    
    // Keep locations within radius
    return distance <= radius;
  });
}

/**
 * Filter out locations that are in water
 */
export function filterOutWaterLocations(locations: SharedAstroSpot[]): SharedAstroSpot[] {
  return locations.filter(location => {
    // Skip locations without valid coordinates
    if (!location.latitude || !location.longitude) {
      return false;
    }
    
    // Filter out water locations
    return !isWaterLocation(location.latitude, location.longitude);
  });
}

/**
 * Filter locations that are suitable for astronomy
 */
export function filterAstronomyLocations(locations: SharedAstroSpot[]): SharedAstroSpot[] {
  return locations.filter(location => {
    // Skip locations without valid coordinates
    if (!location.latitude || !location.longitude) {
      return false;
    }
    
    // Keep only valid astronomy locations
    return isValidAstronomyLocation(location.latitude, location.longitude);
  });
}

/**
 * Sort locations by distance
 */
export function sortByDistance(locations: SharedAstroSpot[]): SharedAstroSpot[] {
  return [...locations].sort((a, b) => {
    const distA = a.distance || Number.MAX_SAFE_INTEGER;
    const distB = b.distance || Number.MAX_SAFE_INTEGER;
    return distA - distB;
  });
}

/**
 * Get unique locations (no duplicates at same coordinates)
 */
export function getUniqueLocations(locations: SharedAstroSpot[]): SharedAstroSpot[] {
  const uniqueMap = new Map<string, SharedAstroSpot>();
  
  locations.forEach(loc => {
    if (loc.latitude && loc.longitude) {
      const key = `${loc.latitude.toFixed(6)}-${loc.longitude.toFixed(6)}`;
      
      // Prefer locations with higher SIQS score or certification
      if (!uniqueMap.has(key) || 
          loc.isDarkSkyReserve || 
          loc.certification) {
        uniqueMap.set(key, loc);
      }
    }
  });
  
  return Array.from(uniqueMap.values());
}

/**
 * Full pipeline to process locations
 */
export function processLocations(
  locations: SharedAstroSpot[],
  userLocation: { latitude: number; longitude: number } | null,
  radius: number
): SharedAstroSpot[] {
  // Start with all locations
  let processed = locations || [];
  
  // Filter by distance if we have user location
  if (userLocation) {
    processed = filterLocationsByDistance(processed, userLocation, radius);
  }
  
  // Remove duplicates
  processed = getUniqueLocations(processed);
  
  // Sort by distance
  processed = sortByDistance(processed);
  
  return processed;
}
