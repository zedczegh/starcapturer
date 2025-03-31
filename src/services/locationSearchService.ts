
/**
 * Service for performing radius-based location searches
 * Focuses on finding the best locations for astronomy viewing within a radius
 */

import { SharedAstroSpot, getRecommendedPhotoPoints } from '@/lib/api/astroSpots';
import { calculateRealTimeSiqs, batchCalculateSiqs } from '@/services/realTimeSiqsService';
import { getCachedLocationSearch, cacheLocationSearch } from '@/services/locationCacheService';
import { calculateDistance } from '@/lib/api/coordinates';
import { locationDatabase } from '@/data/locationDatabase';

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
    // Check cache first with more specific cache key
    const cacheKey = `${latitude.toFixed(2)}-${longitude.toFixed(2)}-${radius}-${certifiedOnly ? 'certified' : 'all'}`;
    const cachedData = getCachedLocationSearch(latitude, longitude, radius, cacheKey);
    
    if (cachedData) {
      console.log(`Using cached location search for ${latitude.toFixed(2)}, ${longitude.toFixed(2)}, radius: ${radius}km`);
      return certifiedOnly 
        ? cachedData.filter(loc => loc.isDarkSkyReserve || loc.certification)
        : cachedData;
    }
    
    console.log(`Finding locations within ${radius}km radius of ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
    
    // If we're only looking for certified locations, we can also check the local database
    if (certifiedOnly) {
      // Find dark sky locations from our local database
      const localDarkSkyLocations = findLocalDarkSkyLocations(latitude, longitude, radius);
      
      if (localDarkSkyLocations.length > 0) {
        console.log(`Found ${localDarkSkyLocations.length} local dark sky locations within radius`);
      }
      
      // Get recommended points from API
      const apiPoints = await getRecommendedPhotoPoints(
        latitude, 
        longitude, 
        radius,
        true, // certified only
        50 // limit
      );
      
      // Combine results, removing duplicates (prefer API data)
      const apiIds = new Set(apiPoints.map(p => p.name));
      const combinedPoints = [
        ...apiPoints,
        ...localDarkSkyLocations.filter(loc => !apiIds.has(loc.name))
      ];
      
      // Cache the results with the specific cache key
      cacheLocationSearch(latitude, longitude, radius, combinedPoints, cacheKey);
      
      return combinedPoints;
    }
    
    // For all locations (not just certified), get from API
    const points = await getRecommendedPhotoPoints(
      latitude, 
      longitude, 
      radius,
      certifiedOnly,
      50 // limit
    );
    
    if (!points || points.length === 0) {
      console.log("No photo points found within radius");
      return [];
    }
    
    // Cache the results with the specific cache key
    cacheLocationSearch(latitude, longitude, radius, points, cacheKey);
    
    return points;
  } catch (error) {
    console.error("Error finding locations within radius:", error);
    
    // On API error, try to use local database as fallback
    if (certifiedOnly) {
      console.log("API error, using local dark sky database as fallback");
      return findLocalDarkSkyLocations(latitude, longitude, radius);
    }
    
    return [];
  }
}

/**
 * Find Dark Sky locations from local database within radius
 * @param latitude Center latitude
 * @param longitude Center longitude
 * @param radius Search radius in km
 * @returns Array of SharedAstroSpot
 */
function findLocalDarkSkyLocations(
  latitude: number,
  longitude: number,
  radius: number
): SharedAstroSpot[] {
  try {
    // Filter dark sky locations from our database
    const darkSkyEntries = locationDatabase.filter(loc => 
      loc.type === 'dark-site' && 
      calculateDistance(latitude, longitude, loc.coordinates[0], loc.coordinates[1]) <= radius
    );
    
    // Convert to SharedAstroSpot format
    return darkSkyEntries.map(entry => {
      const distance = calculateDistance(
        latitude, 
        longitude, 
        entry.coordinates[0], 
        entry.coordinates[1]
      );
      
      return {
        id: `local-${entry.name.replace(/\s+/g, '-').toLowerCase()}`,
        name: entry.name,
        latitude: entry.coordinates[0],
        longitude: entry.coordinates[1],
        siqs: 10 - entry.bortleScale, // Convert Bortle to approximate SIQS
        bortleScale: entry.bortleScale,
        isDarkSkyReserve: true,
        certification: 'International Dark Sky Association',
        description: `${entry.name} is a certified dark sky location with Bortle scale ${entry.bortleScale}.`,
        distance: distance,
        type: 'dark-sky',
        timestamp: new Date().toISOString() // Add timestamp
      };
    });
  } catch (error) {
    console.error("Error finding local dark sky locations:", error);
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
    // Get locations with certified flag for better performance
    const points = await findLocationsWithinRadius(latitude, longitude, radius, true);
    
    if (points.length > 0) {
      // Calculate SIQS scores for these locations
      return await batchCalculateSiqs(points);
    }
    
    return [];
  } catch (error) {
    console.error("Error finding certified locations:", error);
    return [];
  }
}

/**
 * Sort locations by quality and distance
 * @param locations Array of locations
 * @returns Sorted array of locations
 */
export function sortLocationsByQuality(locations: SharedAstroSpot[]): SharedAstroSpot[] {
  return [...locations].sort((a, b) => {
    // First prioritize certified locations
    if ((a.isDarkSkyReserve || a.certification) && !(b.isDarkSkyReserve || b.certification)) {
      return -1;
    }
    if (!(a.isDarkSkyReserve || a.certification) && (b.isDarkSkyReserve || b.certification)) {
      return 1;
    }
    
    // Then sort by SIQS score (higher is better)
    if (a.siqs !== b.siqs) {
      return b.siqs - a.siqs;
    }
    
    // If equal SIQS, sort by distance
    return (a.distance || Infinity) - (b.distance || Infinity);
  });
}
