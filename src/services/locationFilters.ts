import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { isWaterLocation } from '@/utils/validation';
import { calculateDistance } from '@/lib/api/coordinates';
import { getSiqsScore } from '@/utils/siqsHelpers';

/**
 * Apply a filter to exclude locations in water
 * @param locations Array of locations to filter
 * @returns Filtered array of locations
 */
export function applyWaterFilter(locations: SharedAstroSpot[]): SharedAstroSpot[] {
  return locations.filter(location => {
    // Skip locations without valid coordinates
    if (
      typeof location.latitude !== 'number' ||
      typeof location.longitude !== 'number'
    ) {
      return false;
    }
    
    // Remove locations that are in water
    return !isWaterLocation(location.latitude, location.longitude);
  });
}

/**
 * Apply a filter to include only locations with a SIQS score greater than a threshold
 * @param locations Array of locations to filter
 * @param threshold Minimum SIQS score
 * @returns Filtered array of locations
 */
export function applySiqsThresholdFilter(
  locations: SharedAstroSpot[],
  threshold: number
): SharedAstroSpot[] {
  return locations.filter(location => {
    const siqs = getSiqsScore(location.siqs);
    return siqs !== null && siqs >= threshold;
  });
}

/**
 * Apply a distance filter based on a user location
 * @param locations Array of locations to filter
 * @param userLocation User's location
 * @param maxDistance Maximum distance in kilometers
 * @returns Filtered array of locations
 */
export function applyDistanceFilter(
  locations: SharedAstroSpot[],
  userLocation: { latitude: number; longitude: number } | null,
  maxDistance: number
): SharedAstroSpot[] {
  if (!userLocation) {
    return locations;
  }
  
  return locations.filter(location => {
    // Skip locations without valid coordinates
    if (
      typeof location.latitude !== 'number' ||
      typeof location.longitude !== 'number'
    ) {
      return false;
    }
    
    const distance = calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      location.latitude,
      location.longitude
    );
    
    return distance <= maxDistance;
  });
}
