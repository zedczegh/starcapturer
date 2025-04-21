
/**
 * High-performance in-memory location database for quick lookups
 * This is a subset of the full location database with only the most essential data
 * for faster performance in common operations
 */

import { locationDatabase } from '@/data/locationDatabase';

export interface QuickLocationEntry {
  name: string;
  coordinates: [number, number]; // [latitude, longitude]
  bortleScale: number;
  radius: number;
  type?: string;
  chineseName?: string;
}

// Build optimized in-memory database from full dataset
// This reduces memory footprint and improves lookup speed
export const quickLocationDatabase: QuickLocationEntry[] = locationDatabase.map(location => ({
  name: location.name,
  coordinates: location.coordinates,
  bortleScale: location.bortleScale,
  radius: location.radius,
  type: location.type,
  chineseName: location.chineseName
}));

/**
 * Quick lookup function for nearest location with minimal processing overhead
 */
export function quickFindNearestLocation(
  latitude: number,
  longitude: number
): QuickLocationEntry | null {
  if (!isFinite(latitude) || !isFinite(longitude) || !quickLocationDatabase.length) {
    return null;
  }
  
  let nearestLocation: QuickLocationEntry | null = null;
  let minDistance = Infinity;
  
  for (const location of quickLocationDatabase) {
    const [locLat, locLng] = location.coordinates;
    
    // Fast approximate distance calculation (squared distance)
    // This avoids expensive trigonometric calculations for initial filtering
    const latDiff = latitude - locLat;
    const lngDiff = longitude - locLng;
    const approximateDistance = latDiff * latDiff + lngDiff * lngDiff;
    
    if (approximateDistance < minDistance) {
      minDistance = approximateDistance;
      nearestLocation = location;
    }
  }
  
  return nearestLocation;
}

/**
 * Find all locations within a given radius (in degrees)
 * Useful for local area analysis and interpolation
 */
export function findLocationsWithinRadius(
  latitude: number,
  longitude: number,
  radiusDegrees: number = 0.5 // Approximately 55km at the equator
): QuickLocationEntry[] {
  if (!isFinite(latitude) || !isFinite(longitude)) {
    return [];
  }
  
  const results: QuickLocationEntry[] = [];
  const radiusSquared = radiusDegrees * radiusDegrees;
  
  for (const location of quickLocationDatabase) {
    const [locLat, locLng] = location.coordinates;
    
    // Fast approximate distance calculation (squared distance)
    const latDiff = latitude - locLat;
    const lngDiff = longitude - locLng;
    const approximateDistanceSquared = latDiff * latDiff + lngDiff * lngDiff;
    
    if (approximateDistanceSquared <= radiusSquared) {
      results.push(location);
    }
  }
  
  return results;
}

/**
 * Cache for recently accessed locations to improve performance
 * for repeated lookups in the same area
 */
const recentLocationsCache = new Map<string, {
  result: any;
  timestamp: number;
}>();

/**
 * Maximum cache size to prevent memory issues
 */
const MAX_CACHE_SIZE = 500;

/**
 * Cache expiration time (1 hour)
 */
const CACHE_EXPIRATION = 60 * 60 * 1000;

/**
 * Get cached location result or compute and cache new result
 */
export function getCachedLocationResult(
  latitude: number,
  longitude: number,
  precision: number = 3,
  computeFunction: (lat: number, lng: number) => any
): any {
  // Create cache key with specified precision
  const cacheKey = `${latitude.toFixed(precision)}-${longitude.toFixed(precision)}`;
  
  // Check if we have a recent cached result
  const cached = recentLocationsCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp) < CACHE_EXPIRATION) {
    return cached.result;
  }
  
  // Compute new result
  const result = computeFunction(latitude, longitude);
  
  // Cache the result
  recentLocationsCache.set(cacheKey, {
    result,
    timestamp: Date.now()
  });
  
  // Trim cache if it gets too large
  if (recentLocationsCache.size > MAX_CACHE_SIZE) {
    // Remove oldest entries
    const oldestEntries = [...recentLocationsCache.entries()]
      .sort((a, b) => a[1].timestamp - b[1].timestamp)
      .slice(0, Math.floor(MAX_CACHE_SIZE / 4));
    
    for (const [key] of oldestEntries) {
      recentLocationsCache.delete(key);
    }
  }
  
  return result;
}
