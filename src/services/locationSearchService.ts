
import { SharedAstroSpot, getRecommendedPhotoPoints } from '@/lib/api/astroSpots';
import { calculateRealTimeSiqs } from '@/services/realTimeSiqsService';
import { getCachedLocations, cacheLocations } from '@/services/locationCacheService';
import { calculateDistance } from '@/lib/api/coordinates';
import { locationDatabase } from '@/data/locationDatabase';
import { isWaterLocation } from '@/utils/locationValidator';
import { generateRandomPoint } from './locationFilters';

/**
 * Find locations within radius with improved caching and performance
 */
export async function findLocationsWithinRadius(
  latitude: number,
  longitude: number,
  radius: number,
  certifiedOnly: boolean = false,
  limit: number = 50
): Promise<SharedAstroSpot[]> {
  const cacheKey = `${latitude.toFixed(2)}-${longitude.toFixed(2)}-${radius}-${certifiedOnly ? 'certified' : 'all'}-${limit}`;
  const cachedData = getCachedLocations(certifiedOnly ? 'certified' : 'calculated', latitude, longitude, radius);

  if (cachedData?.length > 0) {
    return certifiedOnly 
      ? cachedData.filter(loc => loc.isDarkSkyReserve || loc.certification)
      : cachedData;
  }

  const points = await getRecommendedPhotoPoints(latitude, longitude, radius, certifiedOnly, limit);
  if (!points?.length) return [];

  const validPoints = points.filter(point => !isWaterLocation(point.latitude, point.longitude));
  
  cacheLocations(certifiedOnly ? 'certified' : 'calculated', latitude, longitude, radius, validPoints);
  return validPoints;
}

/**
 * Enhanced algorithm for finding calculated locations with parallel processing
 */
export async function findCalculatedLocations(
  latitude: number,
  longitude: number,
  radius: number,
  tryLargerRadius: boolean = true,
  limit: number = 10
): Promise<SharedAstroSpot[]> {
  console.log(`Finding calculated locations within ${radius}km of ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);

  // Check cache first
  const cachedLocations = getCachedLocations('calculated', latitude, longitude, radius);
  if (cachedLocations?.length > 0) {
    return cachedLocations;
  }

  // Generate multiple points in parallel
  const pointsToGenerate = Math.min(limit * 3, 30); // Generate more points than needed for better selection
  const pointPromises = Array(pointsToGenerate).fill(null).map(() => 
    generateCalculatedPoint(latitude, longitude, radius)
  );

  const generatedPoints = await Promise.all(pointPromises);
  const validPoints = generatedPoints.filter(Boolean) as SharedAstroSpot[];

  if (validPoints.length > 0) {
    // Sort by quality and take the best ones
    const sortedPoints = validPoints
      .sort((a, b) => (b.siqs as number) - (a.siqs as number))
      .slice(0, limit);

    cacheLocations('calculated', latitude, longitude, radius, sortedPoints);
    return sortedPoints;
  }

  // Try larger radius if needed
  if (tryLargerRadius && radius < 10000) {
    const newRadius = Math.min(radius * 2, 10000);
    return findCalculatedLocations(latitude, longitude, newRadius, false, limit);
  }

  return [];
}

/**
 * Generate a single calculated point with enhanced quality metrics
 */
async function generateCalculatedPoint(
  centerLat: number,
  centerLng: number,
  radius: number
): Promise<SharedAstroSpot | null> {
  const point = generateRandomPoint(centerLat, centerLng, radius);
  
  if (isWaterLocation(point.latitude, point.longitude)) {
    return null;
  }

  try {
    // Calculate SIQS score with improved accuracy
    const siqsResult = await calculateRealTimeSiqs(point.latitude, point.longitude, 4);
    if (!siqsResult || siqsResult.siqs < 3) {
      return null;
    }

    return {
      id: `calc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: 'Calculated Location',
      latitude: point.latitude,
      longitude: point.longitude,
      bortleScale: Math.floor(10 - siqsResult.siqs),
      siqs: siqsResult.siqs * 10,
      isViable: true,
      distance: point.distance,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.warn('Error calculating SIQS for point:', error);
    return null;
  }
}

/**
 * Find certified locations within radius
 * This function is used by the certifiedLocationsService
 */
export async function findCertifiedLocations(
  latitude: number,
  longitude: number,
  radius: number,
  limit: number = 100
): Promise<SharedAstroSpot[]> {
  return findLocationsWithinRadius(latitude, longitude, radius, true, limit);
}

/**
 * Sort locations by quality and distance
 */
export function sortLocationsByQuality(locations: SharedAstroSpot[]): SharedAstroSpot[] {
  if (!locations || !Array.isArray(locations)) return [];
  
  return [...locations].sort((a, b) => {
    // First prioritize certified locations
    const aCertified = a.isDarkSkyReserve || a.certification ? 1 : 0;
    const bCertified = b.isDarkSkyReserve || b.certification ? 1 : 0;
    
    if (aCertified !== bCertified) {
      return bCertified - aCertified;
    }
    
    // Then sort by SIQS score if available
    if (a.siqs && b.siqs) {
      return b.siqs - a.siqs;
    }
    
    // Then by Bortle scale (lower is better)
    if (a.bortleScale !== undefined && b.bortleScale !== undefined) {
      return a.bortleScale - b.bortleScale;
    }
    
    // Finally by distance if available
    if (a.distance !== undefined && b.distance !== undefined) {
      return a.distance - b.distance;
    }
    
    return 0;
  });
}
