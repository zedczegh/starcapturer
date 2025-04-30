import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { calculateRealTimeSiqs } from '@/services/realTimeSiqs/siqsCalculator';
import { getCachedLocations, cacheLocations } from '@/services/locationCacheService';
import { calculateDistance } from '@/utils/geoUtils';
import { locationDatabase } from '@/data/locationDatabase';
import { isWaterLocation } from '@/utils/validation';
import { generateRandomPoint } from './locationFilters';
import { getTerrainCorrectedBortleScale } from '@/utils/terrainCorrection';
import { generateQualitySpots } from './locationSpotService';

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

  // Mock implementation that generates locations instead of calling API
  const generatedPoints: SharedAstroSpot[] = [];
  for (let i = 0; i < Math.min(limit, 10); i++) {
    const offsetLat = (Math.random() - 0.5) * (radius / 111);
    const offsetLng = (Math.random() - 0.5) * (radius / (111 * Math.cos(latitude * Math.PI / 180)));
    
    const lat = latitude + offsetLat;
    const lng = longitude + offsetLng;
    
    if (!isWaterLocation(lat, lng)) {
      const distance = calculateDistance(latitude, longitude, lat, lng);
      if (distance <= radius) {
        generatedPoints.push({
          id: `gen-${Date.now()}-${i}`,
          name: `Generated Location ${i+1}`,
          latitude: lat,
          longitude: lng,
          timestamp: new Date().toISOString(),
          bortleScale: Math.floor(Math.random() * 5) + 2,
          siqs: Math.floor(Math.random() * 50) + 50,
          isDarkSkyReserve: i === 0 && certifiedOnly, // Make the first one certified if we're looking for certified
          certification: i === 1 && certifiedOnly ? "International Dark Sky Park" : undefined,
          distance
        });
      }
    }
  }
  
  const validPoints = generatedPoints.filter(point => !isWaterLocation(point.latitude, point.longitude));
  
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
