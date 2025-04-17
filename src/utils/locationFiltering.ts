
/**
 * Location filtering and processing utilities
 */

import { haversineDistance } from './geoUtils';

/**
 * Filter locations to keep only valid ones with required properties
 */
export function filterValidLocations(locations: any[]): any[] {
  if (!locations || !Array.isArray(locations)) {
    return [];
  }
  
  return locations.filter(loc => 
    loc && 
    typeof loc.latitude === 'number' && 
    typeof loc.longitude === 'number' &&
    !isNaN(loc.latitude) && 
    !isNaN(loc.longitude)
  );
}

/**
 * Separate locations into different types (certified, dark sky, regular)
 */
export function separateLocationTypes(locations: any[]): {
  certified: any[];
  darkSky: any[];
  regular: any[];
} {
  const certified: any[] = [];
  const darkSky: any[] = [];
  const regular: any[] = [];
  
  if (!locations || !Array.isArray(locations)) {
    return { certified, darkSky, regular };
  }
  
  locations.forEach(loc => {
    if (loc.certification) {
      certified.push(loc);
    } else if (loc.isDarkSkyReserve) {
      darkSky.push(loc);
    } else {
      regular.push(loc);
    }
  });
  
  return { certified, darkSky, regular };
}

/**
 * Merge different types of locations with priority order
 */
export function mergeLocations(
  certified: any[], 
  darkSky: any[], 
  regular: any[],
  limit?: number
): any[] {
  // Start with certified locations (highest priority)
  let result = [...certified];
  
  // Add dark sky locations
  result = result.concat(darkSky);
  
  // Add regular locations
  result = result.concat(regular);
  
  // Limit the number of results if specified
  if (typeof limit === 'number' && limit > 0) {
    result = result.slice(0, limit);
  }
  
  return result;
}

/**
 * Calculate distance from user for all locations
 */
export function addDistanceToLocations(
  locations: any[], 
  userLat: number, 
  userLng: number
): any[] {
  if (!locations || !Array.isArray(locations) || !userLat || !userLng) {
    return locations;
  }
  
  return locations.map(loc => {
    if (!loc || typeof loc.latitude !== 'number' || typeof loc.longitude !== 'number') {
      return loc;
    }
    
    const distance = haversineDistance(
      userLat, 
      userLng, 
      loc.latitude, 
      loc.longitude
    );
    
    return {
      ...loc,
      distance
    };
  });
}

/**
 * Sort locations by distance
 */
export function sortLocationsByDistance(locations: any[]): any[] {
  if (!locations || !Array.isArray(locations)) {
    return [];
  }
  
  return [...locations].sort((a, b) => {
    const distA = typeof a.distance === 'number' ? a.distance : Infinity;
    const distB = typeof b.distance === 'number' ? b.distance : Infinity;
    return distA - distB;
  });
}

/**
 * Sort locations by SIQS score (highest first)
 */
export function sortLocationsBySiqs(locations: any[]): any[] {
  if (!locations || !Array.isArray(locations)) {
    return [];
  }
  
  return [...locations].sort((a, b) => {
    const scoreA = a.siqsResult?.siqs || a.siqs || 0;
    const scoreB = b.siqsResult?.siqs || b.siqs || 0;
    return scoreB - scoreA;
  });
}
