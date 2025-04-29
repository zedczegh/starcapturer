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

/**
 * Generate a random point within a specific radius around a center point
 * @param centerLat Center latitude
 * @param centerLng Center longitude
 * @param radiusKm Radius in kilometers
 * @returns Random point coordinates
 */
export function generateRandomPoint(
  centerLat: number,
  centerLng: number,
  radiusKm: number
): { latitude: number; longitude: number } {
  // Earth's radius in kilometers
  const earthRadius = 6371;
  
  // Convert radius from kilometers to radians
  const radiusInRadians = radiusKm / earthRadius;
  
  // Generate random distance and angle
  const u = Math.random();
  const v = Math.random();
  
  // Calculate random distance within the radius
  const w = radiusInRadians * Math.sqrt(u);
  
  // Calculate random angle
  const t = 2 * Math.PI * v;
  
  // Calculate offsets
  const x = w * Math.cos(t);
  const y = w * Math.sin(t);
  
  // Convert to latitude and longitude offsets
  // y is latitude offset, x is longitude offset adjusted for latitude
  const latOffset = y * 180 / Math.PI;
  const lngOffset = (x * 180 / Math.PI) / Math.cos(centerLat * Math.PI / 180);
  
  // Calculate new coordinates
  const newLat = centerLat + latOffset;
  const newLng = centerLng + lngOffset;
  
  return { latitude: newLat, longitude: newLng };
}

/**
 * Filter locations based on various criteria
 */
export function filterLocations(locations: any[], criteria: any): any[] {
  // Example filter function to be implemented as needed
  return locations.filter(location => {
    // Add filtering logic based on criteria
    return true;
  });
}
