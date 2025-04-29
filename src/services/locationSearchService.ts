
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { calculateRealTimeSiqs } from '@/services/realTimeSiqs/siqsCalculator';
import { getCachedLocations, cacheLocations } from '@/services/locationCacheService';
import { calculateDistance } from '@/utils/geoUtils';
import { locationDatabase } from '@/data/locationDatabase';
import { isWaterLocation } from '@/utils/validation';
import { generateRandomPoint } from './locationFilters';
import { getTerrainCorrectedBortleScale } from '@/utils/terrainCorrection';
import { generateQualitySpots } from './locationSpotService';
import { findNearestImprovedLocations } from './location/calculatedLocationsService';

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

  // Mock implementation - in a real app this would call an API
  const locations: SharedAstroSpot[] = [];
  
  // Generate some mock data based on the location
  for (let i = 0; i < (certifiedOnly ? 3 : limit); i++) {
    const offset = (i * 0.01) + (Math.random() * 0.02);
    locations.push({
      id: `mock-${i}-${Date.now()}`,
      name: `Location near ${latitude.toFixed(2)}, ${longitude.toFixed(2)}`,
      latitude: latitude + offset,
      longitude: longitude + offset,
      certification: certifiedOnly ? "Mock Certification" : undefined,
      isDarkSkyReserve: certifiedOnly,
      siqs: Math.floor(Math.random() * 10) + 1,
      distance: Math.random() * radius,
      bortleScale: Math.floor(Math.random() * 9) + 1,
      timestamp: new Date().toISOString()
    });
  }
  
  const validPoints = locations.filter(point => !isWaterLocation(point.latitude, point.longitude));
  
  cacheLocations(certifiedOnly ? 'certified' : 'calculated', latitude, longitude, radius, validPoints);
  return validPoints;
}

/**
 * Enhanced algorithm for finding calculated locations with batched processing
 * and improved accuracy using terrain analysis
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

  // Use our enhanced spot generation service with batched processing
  const spots = await generateQualitySpots(latitude, longitude, radius, limit, 4);
  
  if (spots.length > 0) {
    // Cache the results
    cacheLocations('calculated', latitude, longitude, radius, spots);
    return spots;
  }

  // Try larger radius if needed with gradual increase
  if (tryLargerRadius && radius < 10000) {
    const newRadius = Math.min(radius * 1.5, 10000);
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
    
    // Then sort by SIQS score if available - Fix: Ensure we're using numbers for comparison
    const aScore = typeof a.siqs === 'number' ? a.siqs : 0;
    const bScore = typeof b.siqs === 'number' ? b.siqs : 0;
    
    if (aScore !== bScore) {
      return bScore - aScore;
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
