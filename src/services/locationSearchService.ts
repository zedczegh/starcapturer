
/**
 * Service for performing radius-based location searches
 * Focuses on finding the best locations for astronomy viewing within a radius
 */

import { SharedAstroSpot, getRecommendedPhotoPoints } from '@/lib/api/astroSpots';
import { calculateRealTimeSiqs, batchCalculateSiqs } from '@/services/realTimeSiqsService';
import { getCachedLocationSearch, cacheLocationSearch } from '@/services/locationCacheService';
import { calculateDistance } from '@/lib/api/coordinates';
import { locationDatabase } from '@/data/locationDatabase';

// Cache for frequent searches to avoid redundant processing
const localSearchCache: Map<string, SharedAstroSpot[]> = new Map();

/**
 * Generate cache key for location searches
 */
function generateCacheKey(
  latitude: number, 
  longitude: number, 
  radius: number, 
  certifiedOnly: boolean = false
): string {
  return `${latitude.toFixed(2)}-${longitude.toFixed(2)}-${radius}-${certifiedOnly ? 'certified' : 'all'}`;
}

/**
 * Find Dark Sky locations from local database within radius
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
        timestamp: new Date().toISOString() // Add timestamp
      };
    });
  } catch (error) {
    console.error("Error finding local dark sky locations:", error);
    return [];
  }
}

/**
 * Get locations from API with error handling
 */
async function getLocationsFromApi(
  latitude: number,
  longitude: number,
  radius: number,
  certifiedOnly: boolean
): Promise<SharedAstroSpot[]> {
  try {
    return await getRecommendedPhotoPoints(
      latitude, 
      longitude, 
      radius,
      certifiedOnly,
      50 // limit
    );
  } catch (error) {
    console.error("Error getting locations from API:", error);
    return [];
  }
}

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
    // Validate inputs
    if (!isFinite(latitude) || !isFinite(longitude) || !isFinite(radius)) {
      console.error("Invalid coordinates or radius");
      return [];
    }
    
    // Generate cache key
    const cacheKey = generateCacheKey(latitude, longitude, radius, certifiedOnly);
    
    // Check in-memory cache first (fastest)
    const inMemoryCache = localSearchCache.get(cacheKey);
    if (inMemoryCache) {
      return inMemoryCache;
    }
    
    // Check persistent cache next
    const cachedData = getCachedLocationSearch(latitude, longitude, radius, cacheKey);
    if (cachedData) {
      console.log(`Using cached location search for ${latitude.toFixed(2)}, ${longitude.toFixed(2)}, radius: ${radius}km`);
      
      // Update in-memory cache with this data
      localSearchCache.set(cacheKey, cachedData);
      
      return certifiedOnly 
        ? cachedData.filter(loc => loc.isDarkSkyReserve || loc.certification)
        : cachedData;
    }
    
    console.log(`Finding locations within ${radius}km radius of ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
    
    // If we're only looking for certified locations, optimize the search
    if (certifiedOnly) {
      // Find dark sky locations from our local database
      const localDarkSkyLocations = findLocalDarkSkyLocations(latitude, longitude, radius);
      
      if (localDarkSkyLocations.length > 0) {
        console.log(`Found ${localDarkSkyLocations.length} local dark sky locations within radius`);
      }
      
      // Get recommended points from API
      const apiPoints = await getLocationsFromApi(latitude, longitude, radius, true);
      
      // Combine results, removing duplicates (prefer API data)
      const apiIds = new Set(apiPoints.map(p => p.name));
      const combinedPoints = [
        ...apiPoints,
        ...localDarkSkyLocations.filter(loc => !apiIds.has(loc.name))
      ];
      
      // Cache the results
      cacheLocationSearch(latitude, longitude, radius, combinedPoints, cacheKey);
      localSearchCache.set(cacheKey, combinedPoints);
      
      return combinedPoints;
    }
    
    // For all locations (not just certified), get from API
    const points = await getLocationsFromApi(latitude, longitude, radius, certifiedOnly);
    
    if (!points || points.length === 0) {
      console.log("No photo points found within radius");
      return [];
    }
    
    // Cache the results
    cacheLocationSearch(latitude, longitude, radius, points, cacheKey);
    localSearchCache.set(cacheKey, points);
    
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
      const locationsWithSiqs = await batchCalculateSiqs(calculatedPoints);
      
      // Filter out locations with SIQS 0 (bad viewing conditions)
      const validLocations = locationsWithSiqs.filter(loc => loc.siqs !== undefined && loc.siqs > 0);
      
      if (validLocations.length > 0) {
        return validLocations;
      }
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
    // Generate cache key for this specific search
    const cacheKey = generateCacheKey(latitude, longitude, radius, true);
    
    // Check in-memory cache first
    const inMemoryCache = localSearchCache.get(cacheKey);
    if (inMemoryCache) {
      return inMemoryCache;
    }
    
    // Get locations with certified flag for better performance
    const points = await findLocationsWithinRadius(latitude, longitude, radius, true);
    
    if (points.length > 0) {
      // Calculate SIQS scores for these locations
      const locationsWithSiqs = await batchCalculateSiqs(points);
      
      // Update in-memory cache
      localSearchCache.set(cacheKey, locationsWithSiqs);
      
      return locationsWithSiqs;
    }
    
    return [];
  } catch (error) {
    console.error("Error finding certified locations:", error);
    return [];
  }
}

/**
 * Clear the in-memory search cache
 */
export function clearLocationSearchCache(): void {
  localSearchCache.clear();
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
    
    // If both are certified or both are not certified, check if they're in the same category
    const aIsCertified = a.isDarkSkyReserve || a.certification;
    const bIsCertified = b.isDarkSkyReserve || b.certification;
    
    if (aIsCertified && bIsCertified) {
      // If both are certified, sort by SIQS score first
      if (a.siqs !== b.siqs) {
        return (b.siqs || 0) - (a.siqs || 0);
      }
      // Then by distance
      return (a.distance || Infinity) - (b.distance || Infinity);
    }
    
    if (!aIsCertified && !bIsCertified) {
      // For calculated locations, sort by SIQS score first
      if (a.siqs !== b.siqs) {
        return (b.siqs || 0) - (a.siqs || 0);
      }
      // Then by distance
      return (a.distance || Infinity) - (b.distance || Infinity);
    }
    
    // Default case: sort by SIQS score
    return (b.siqs || 0) - (a.siqs || 0);
  });
}
