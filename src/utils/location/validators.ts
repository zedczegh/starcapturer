
/**
 * Location validation utilities
 */

import { SharedAstroSpot } from "@/lib/api/astroSpots";

/**
 * Validate if a location has valid coordinates
 */
export function isValidLocation(location: SharedAstroSpot): boolean {
  return (
    typeof location.latitude === 'number' &&
    typeof location.longitude === 'number' &&
    isFinite(location.latitude) &&
    isFinite(location.longitude) &&
    Math.abs(location.latitude) <= 90 &&
    Math.abs(location.longitude) <= 180
  );
}

/**
 * Check if a location is in a water area (ocean, lake, etc.)
 * This is a simplified implementation.
 */
export function isWaterLocation(
  latitude: number,
  longitude: number,
  isCertified: boolean
): boolean {
  // Never filter certified locations as water
  if (isCertified) return false;
  
  // This would typically use a GeoJSON dataset or API to check
  // For simplicity, we're just using basic geographic boundaries
  
  // Very simple approximation of oceans
  // Pacific Ocean (rough approximation)
  if (longitude < -110 && longitude > -180 && 
      latitude < 60 && latitude > -60) {
    return true;
  }
  
  // Atlantic Ocean (rough approximation)
  if (longitude < 0 && longitude > -60 && 
      latitude < 60 && latitude > -60) {
    return true;
  }
  
  // Indian Ocean (rough approximation)
  if (longitude > 40 && longitude < 120 && 
      latitude < 20 && latitude > -60) {
    return true;
  }
  
  return false;
}
