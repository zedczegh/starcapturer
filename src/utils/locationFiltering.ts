
/**
 * Utilities for filtering and organizing location data
 */
import { isValidAstronomyLocation } from './locationValidator';
import { SharedAstroSpot } from '@/lib/api/astroSpots';

/**
 * Filter locations to only include those with valid coordinates
 */
export function filterValidLocations(locations: SharedAstroSpot[]): SharedAstroSpot[] {
  if (!Array.isArray(locations)) return [];
  
  return locations.filter(location => 
    isValidAstronomyLocation(location)
  );
}

/**
 * Separate locations into certified and regular types
 */
export function separateLocationTypes(
  locations: SharedAstroSpot[]
): {
  certified: SharedAstroSpot[];
  regular: SharedAstroSpot[];
} {
  const certified: SharedAstroSpot[] = [];
  const regular: SharedAstroSpot[] = [];
  
  if (!Array.isArray(locations)) {
    return { certified, regular };
  }
  
  locations.forEach(location => {
    if (location.isDarkSkyReserve || location.certification) {
      certified.push(location);
    } else {
      regular.push(location);
    }
  });
  
  return { certified, regular };
}

/**
 * Merge multiple location arrays, removing duplicates by ID
 */
export function mergeLocations(...locationArrays: SharedAstroSpot[][]): SharedAstroSpot[] {
  const merged: Record<string, SharedAstroSpot> = {};
  
  locationArrays.forEach(locations => {
    if (Array.isArray(locations)) {
      locations.forEach(location => {
        if (location && typeof location === 'object') {
          // Create a stable ID if none exists
          const id = location.id || `loc-${location.latitude}-${location.longitude}`;
          
          // Only add if not already in the merged object or if this version has more data
          if (!merged[id] || Object.keys(location).length > Object.keys(merged[id]).length) {
            merged[id] = { ...location, id };
          }
        }
      });
    }
  });
  
  return Object.values(merged);
}
