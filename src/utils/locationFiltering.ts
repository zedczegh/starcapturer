
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { isWaterLocation } from './locationWaterCheck';

/**
 * Check if a location is a certified location (Dark Sky Reserve or has certification)
 */
export function isCertifiedLocation(location: SharedAstroSpot): boolean {
  return Boolean(location.isDarkSkyReserve || location.certification);
}

/**
 * Filter locations to only include valid ones (with lat/lng)
 */
export function filterValidLocations(locations: SharedAstroSpot[]): SharedAstroSpot[] {
  return locations.filter(loc => 
    loc && typeof loc.latitude === 'number' && typeof loc.longitude === 'number'
  );
}

/**
 * Separate locations into certified and calculated types
 */
export function separateLocationTypes(locations: SharedAstroSpot[]): {
  certifiedLocations: SharedAstroSpot[];
  calculatedLocations: SharedAstroSpot[];
} {
  const certifiedLocations: SharedAstroSpot[] = [];
  const calculatedLocations: SharedAstroSpot[] = [];
  
  for (const location of locations) {
    if (isCertifiedLocation(location)) {
      certifiedLocations.push(location);
    } else {
      calculatedLocations.push(location);
    }
  }
  
  return { certifiedLocations, calculatedLocations };
}

/**
 * Merge multiple location arrays, removing duplicates
 */
export function mergeLocations(...locationArrays: SharedAstroSpot[][]): SharedAstroSpot[] {
  // Use Map to efficiently find duplicates by coordinate
  const uniqueLocations = new Map<string, SharedAstroSpot>();
  
  // Process each array of locations
  for (const locations of locationArrays) {
    for (const location of locations) {
      if (!location || typeof location.latitude !== 'number' || typeof location.longitude !== 'number') {
        continue;
      }
      
      const key = `${location.latitude.toFixed(6)},${location.longitude.toFixed(6)}`;
      
      // If this is a certified location or the key doesn't exist yet, add/update it
      if (isCertifiedLocation(location) || !uniqueLocations.has(key)) {
        uniqueLocations.set(key, location);
      }
    }
  }
  
  return Array.from(uniqueLocations.values());
}

/**
 * Add a valid ID to any location that's missing one
 */
export function ensureLocationId(location: SharedAstroSpot): SharedAstroSpot {
  if (!location.id && location.latitude && location.longitude) {
    return {
      ...location,
      id: `loc-${location.latitude.toFixed(6)}-${location.longitude.toFixed(6)}`
    };
  }
  return location;
}
