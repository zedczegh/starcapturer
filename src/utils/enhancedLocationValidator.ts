/**
 * Enhanced location validator with efficient water detection
 */

import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { isWaterLocation, isValidAstronomyLocation } from './locationValidator';

// Cache for previously checked locations to avoid redundant checks
const waterLocationCache = new Map<string, boolean>();

/**
 * Efficiently check if a location is on water with caching
 * @param latitude Location latitude
 * @param longitude Location longitude
 * @returns boolean indicating if location is on water
 */
export function isWaterLocationFast(latitude: number, longitude: number): boolean {
  // Generate cache key (rounded to reduce cache size but maintain accuracy)
  const key = `${latitude.toFixed(4)},${longitude.toFixed(4)}`;
  
  // Check cache first
  if (waterLocationCache.has(key)) {
    return waterLocationCache.get(key)!;
  }
  
  // Not in cache, do the check
  const isWater = isWaterLocation(latitude, longitude);
  
  // Store in cache
  waterLocationCache.set(key, isWater);
  
  return isWater;
}

/**
 * Clear the water location cache
 */
export function clearWaterLocationCache(): void {
  waterLocationCache.clear();
}

/**
 * Filter out water locations from an array of locations
 * @param locations Array of locations to filter
 * @returns Array with water locations removed
 */
export function filterOutWaterLocations(locations: SharedAstroSpot[]): SharedAstroSpot[] {
  return locations.filter(location => {
    // Skip locations without valid coordinates
    if (!location.latitude || !location.longitude) {
      return false;
    }
    
    // Check if this is a water location
    const isWater = isWaterLocationFast(location.latitude, location.longitude);
    
    // Only keep non-water locations
    return !isWater;
  });
}

/**
 * Validate if a location is suitable for astronomy viewing 
 * @param location The location to validate
 * @returns boolean indicating if the location is valid
 */
export function validateAstronomyLocation(location: SharedAstroSpot): boolean {
  // Skip locations without valid coordinates
  if (!location.latitude || !location.longitude) {
    return false;
  }
  
  // For certified locations, don't filter them out even if they're on water
  if (location.isDarkSkyReserve || location.certification) {
    return true;
  }
  
  // For calculated locations, perform detailed checks
  return isValidAstronomyLocation(location.latitude, location.longitude, location.name);
}

/**
 * Filter astronomy locations for display on map
 * @param locations Array of locations to filter
 * @param isCertifiedView Whether we're in certified view mode
 * @returns Filtered array of locations
 */
export function filterLocationsForMap(
  locations: SharedAstroSpot[], 
  isCertifiedView: boolean
): SharedAstroSpot[] {
  // For certified view, don't filter out water locations
  if (isCertifiedView) {
    return locations;
  }
  
  return locations.filter(location => {
    // Skip invalid locations
    if (!location.latitude || !location.longitude) {
      return false;
    }
    
    // Always include certified locations regardless of water status
    if (location.isDarkSkyReserve || location.certification) {
      return true;
    }
    
    // For other locations, check if they're on water
    return !isWaterLocationFast(location.latitude, location.longitude);
  });
}
