
/**
 * Service for performing radius-based location searches
 * Focuses on finding the best locations for astronomy viewing within a radius
 */

import { SharedAstroSpot, getRecommendedPhotoPoints } from '@/lib/api/astroSpots';
import { calculateRealTimeSiqs, batchCalculateSiqs } from '@/services/realTimeSiqsService';
import { getCachedLocationSearch, cacheLocationSearch } from '@/services/locationCacheService';

/**
 * Find all locations within a radius of a center point
 * @param latitude Center latitude
 * @param longitude Center longitude
 * @param radius Search radius in km
 * @param certifiedOnly Whether to return only certified locations
 * @returns Promise resolving to array of SharedAstroSpot
 */
export async function findLocationsWithinRadius(
  latitude: number,
  longitude: number,
  radius: number,
  certifiedOnly: boolean = false
): Promise<SharedAstroSpot[]> {
  try {
    // Check cache first
    const cacheKey = `${latitude.toFixed(2)}-${longitude.toFixed(2)}-${radius}-${certifiedOnly}`;
    const cachedData = getCachedLocationSearch(latitude, longitude, radius);
    
    if (cachedData) {
      return cachedData;
    }
    
    console.log(`Finding locations within ${radius}km radius of ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
    
    // Get recommended points within the specified radius
    const points = await getRecommendedPhotoPoints(
      latitude, 
      longitude, 
      radius,
      certifiedOnly
    );
    
    if (!points || points.length === 0) {
      console.log("No photo points found within radius");
      return [];
    }
    
    // Cache the results
    cacheLocationSearch(latitude, longitude, radius, points);
    
    return points;
  } catch (error) {
    console.error("Error finding locations within radius:", error);
    return [];
  }
}

/**
 * Enhanced search for calculated locations with fallback
 * @param latitude Center latitude
 * @param longitude Center longitude
 * @param radius Search radius in km
 * @param tryLargerRadius Whether to try a larger radius if no results found
 * @returns Promise resolving to array of SharedAstroSpot
 */
export async function findCalculatedLocations(
  latitude: number,
  longitude: number,
  radius: number,
  tryLargerRadius: boolean = true
): Promise<SharedAstroSpot[]> {
  try {
    // First try the specified radius
    const points = await findLocationsWithinRadius(latitude, longitude, radius, false);
    
    // Filter out certified locations to get only calculated ones
    const calculatedPoints = points.filter(point => 
      !point.isDarkSkyReserve && !point.certification
    );
    
    if (calculatedPoints.length > 0) {
      // Calculate SIQS scores for these locations
      return await batchCalculateSiqs(calculatedPoints);
    }
    
    // If no calculated points found and we can try larger radius
    if (tryLargerRadius && radius < 10000) {
      console.log(`No calculated locations found within ${radius}km, trying larger radius`);
      // Double the radius but cap at 10000km
      const newRadius = Math.min(radius * 2, 10000);
      return findCalculatedLocations(latitude, longitude, newRadius, false);
    }
    
    return [];
  } catch (error) {
    console.error("Error finding calculated locations:", error);
    return [];
  }
}

/**
 * Find certified Dark Sky locations within radius
 * @param latitude Center latitude
 * @param longitude Center longitude 
 * @param radius Search radius in km
 * @returns Promise resolving to array of SharedAstroSpot
 */
export async function findCertifiedLocations(
  latitude: number,
  longitude: number,
  radius: number
): Promise<SharedAstroSpot[]> {
  try {
    // Get all locations including certified ones
    const points = await findLocationsWithinRadius(latitude, longitude, radius, false);
    
    // Filter to get only certified locations
    const certifiedPoints = points.filter(point => 
      point.isDarkSkyReserve || point.certification
    );
    
    if (certifiedPoints.length > 0) {
      // Calculate SIQS scores for these locations
      return await batchCalculateSiqs(certifiedPoints);
    }
    
    return [];
  } catch (error) {
    console.error("Error finding certified locations:", error);
    return [];
  }
}
