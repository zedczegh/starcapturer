/**
 * Service for performing radius-based location searches
 * Focuses on finding the best locations for astronomy viewing within a radius
 */

import { SharedAstroSpot, getRecommendedPhotoPoints } from '@/lib/api/astroSpots';
import { calculateRealTimeSiqs, batchCalculateSiqs } from '@/services/realTimeSiqsService';
import { getCachedLocations, cacheLocations } from '@/services/locationCacheService';
import { calculateDistance } from '@/lib/api/coordinates';
import { locationDatabase } from '@/data/locationDatabase';
import { isWaterLocation, isValidAstronomyLocation } from '@/utils/locationValidator';
import { filterLocations, sortLocationsByQuality, generateRandomPoint } from './locationFilters';

/**
 * Find all locations within a radius of a center point
 * @param latitude Center latitude
 * @param longitude Center longitude
 * @param radius Search radius in km
 * @param certifiedOnly Whether to return only certified locations
 * @param limit Maximum number of locations to return (defaults to 50)
 * @returns Promise resolving to array of SharedAstroSpot
 */
export async function findLocationsWithinRadius(
  latitude: number,
  longitude: number,
  radius: number,
  certifiedOnly: boolean = false,
  limit: number = 50
): Promise<SharedAstroSpot[]> {
  try {
    // Check cache first with more specific cache key
    const cacheKey = `${latitude.toFixed(2)}-${longitude.toFixed(2)}-${radius}-${certifiedOnly ? 'certified' : 'all'}-${limit}`;
    const cachedData = getCachedLocations(
      certifiedOnly ? 'certified' : 'calculated',
      latitude,
      longitude,
      radius
    );
    
    if (cachedData) {
      console.log(`Using cached location search for ${latitude.toFixed(2)}, ${longitude.toFixed(2)}, radius: ${radius}km, limit: ${limit}`);
      return certifiedOnly 
        ? cachedData.filter(loc => loc.isDarkSkyReserve || loc.certification)
        : cachedData;
    }
    
    console.log(`Finding locations within ${radius}km radius of ${latitude.toFixed(4)}, ${longitude.toFixed(4)}, limit: ${limit}`);
    
    // If we're only looking for certified locations, we can also check the local database
    if (certifiedOnly) {
      // Find dark sky locations from our local database
      const localDarkSkyLocations = findLocalDarkSkyLocations(latitude, longitude, radius);
      
      if (localDarkSkyLocations.length > 0) {
        console.log(`Found ${localDarkSkyLocations.length} local dark sky locations within radius`);
      }
      
      // Get recommended points from API with provided limit
      const apiPoints = await getRecommendedPhotoPoints(
        latitude, 
        longitude, 
        radius,
        true, // certified only
        limit // use passed limit
      );
      
      // Filter out water locations with enhanced detection
      const validApiPoints = filterLocations(apiPoints);
      
      if (validApiPoints.length < apiPoints.length) {
        console.log(`Filtered out ${apiPoints.length - validApiPoints.length} water locations from API results`);
      }
      
      // Combine results, removing duplicates (prefer API data)
      const apiIds = new Set(validApiPoints.map(p => p.name));
      const combinedPoints = [
        ...validApiPoints,
        ...localDarkSkyLocations.filter(loc => !apiIds.has(loc.name))
      ];
      
      // Apply enhanced detection for IDA certified locations
      const enhancedPoints = combineWithIDACertifiedLocations(combinedPoints, latitude, longitude, radius);
      
      // Cache the results with the specific cache key
      cacheLocations(
        'certified',
        latitude,
        longitude,
        radius,
        enhancedPoints
      );
      
      return enhancedPoints;
    }
    
    // For all locations (not just certified), get from API with provided limit
    const points = await getRecommendedPhotoPoints(
      latitude, 
      longitude, 
      radius,
      certifiedOnly,
      limit
    );
    
    if (!points || points.length === 0) {
      console.log("No photo points found within radius");
      return [];
    }
    
    // Filter out water locations with enhanced detection
    const validPoints = filterLocations(points);
    
    if (validPoints.length < points.length) {
      console.log(`Filtered out ${points.length - validPoints.length} water locations from results`);
    }
    
    // Cache the results with the specific cache key
    cacheLocations(
      'calculated',
      latitude,
      longitude,
      radius,
      validPoints
    );
    
    return validPoints;
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
    const darkSkyEntries = locationDatabase.filter(loc => {
      if (loc.type !== 'dark-site') return false;
      
      const distance = calculateDistance(
        latitude, longitude, loc.coordinates[0], loc.coordinates[1]
      );
      
      if (distance > radius) return false;
      
      // Filter out water locations
      if (isWaterLocation(loc.coordinates[0], loc.coordinates[1])) {
        console.log(`Filtered out water location: ${loc.name}`);
        return false;
      }
      
      return true;
    });
    
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
 * Enhanced search for calculated locations with fallback
 * @param latitude Center latitude
 * @param longitude Center longitude
 * @param radius Search radius in km
 * @param tryLargerRadius Whether to try a larger radius if no results found
 * @param limit Maximum number of locations to return (defaults to 10)
 * @returns Promise resolving to array of SharedAstroSpot
 */
export async function findCalculatedLocations(
  latitude: number,
  longitude: number,
  radius: number,
  tryLargerRadius: boolean = true,
  limit: number = 10
): Promise<SharedAstroSpot[]> {
  try {
    console.log(`Finding calculated locations within ${radius}km of ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
    
    // Try to get from cache first
    const cachedLocations = getCachedLocations('calculated', latitude, longitude, radius);
    if (cachedLocations && cachedLocations.length > 0) {
      console.log(`Using ${cachedLocations.length} cached calculated locations`);
      return cachedLocations;
    }

    // First try the specified radius with limited locations
    const points = await findLocationsWithinRadius(
      latitude, 
      longitude, 
      radius, 
      false, 
      limit
    );
    
    // Filter out certified locations to get only calculated ones
    const calculatedPoints = points.filter(point => 
      !point.isDarkSkyReserve && !point.certification
    );
    
    if (calculatedPoints.length > 0) {
      console.log(`Found ${calculatedPoints.length} calculated locations within ${radius}km`);
      
      // Calculate SIQS scores for these locations in chunks to improve performance
      const chunkSize = 5; // Process 5 at a time to prevent overwhelming API
      const results = [];
      
      for (let i = 0; i < calculatedPoints.length; i += chunkSize) {
        const chunk = calculatedPoints.slice(i, i + chunkSize);
        const locationsWithSiqs = await batchCalculateSiqs(chunk);
        results.push(...locationsWithSiqs);
        
        // Small delay between chunks to avoid rate limiting
        if (i + chunkSize < calculatedPoints.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      // Filter out locations with SIQS 0 (bad viewing conditions)
      const validLocations = results.filter(loc => loc.siqs !== undefined && loc.siqs > 0);
      
      if (validLocations.length > 0) {
        // Cache the results for future use
        cacheLocations('calculated', latitude, longitude, radius, validLocations);
        return validLocations;
      }
    }
    
    // If no calculated points found and we can try larger radius
    if (tryLargerRadius && radius < 10000) {
      console.log(`No calculated locations found within ${radius}km, trying larger radius`);
      // Use exponential increase for radius but cap at 10000km
      const newRadius = Math.min(radius * 2, 10000);
      return findCalculatedLocations(latitude, longitude, newRadius, false, limit);
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
 * @param limit Maximum number of locations to return (defaults to 50)
 * @returns Promise resolving to array of SharedAstroSpot
 */
export async function findCertifiedLocations(
  latitude: number,
  longitude: number,
  radius: number,
  limit: number = 50
): Promise<SharedAstroSpot[]> {
  try {
    // Try to get from cache first
    const cachedLocations = getCachedLocations('certified', latitude, longitude, radius);
    if (cachedLocations && cachedLocations.length > 0) {
      console.log(`Using ${cachedLocations.length} cached certified locations`);
      return cachedLocations;
    }

    // Get locations with certified flag for better performance
    const points = await findLocationsWithinRadius(
      latitude, 
      longitude, 
      radius, 
      true,
      limit
    );
    
    if (points.length > 0) {
      // Calculate SIQS scores for these locations
      const locationsWithSiqs = await batchCalculateSiqs(points);
      
      // Cache the results for future use
      cacheLocations('certified', latitude, longitude, radius, locationsWithSiqs);
      
      return locationsWithSiqs;
    }
    
    return [];
  } catch (error) {
    console.error("Error finding certified locations:", error);
    return [];
  }
}

/**
 * Combine locations with additional IDA certified locations
 * Uses special knowledge about International Dark Sky Association locations
 */
function combineWithIDACertifiedLocations(
  existingLocations: SharedAstroSpot[],
  latitude: number,
  longitude: number,
  radius: number
): SharedAstroSpot[] {
  try {
    // Key IDA certified locations that might be missing
    const keyIDALocations: Array<{name: string, lat: number, lng: number, type: string}> = [
      // Dark Sky Reserves
      {name: "Alpes Azur Mercantour Dark Sky Reserve", lat: 44.1800, lng: 7.0500, type: "Dark Sky Reserve"},
      {name: "Central Idaho Dark Sky Reserve", lat: 44.2210, lng: -114.9318, type: "Dark Sky Reserve"},
      {name: "NamibRand Dark Sky Reserve", lat: -24.9400, lng: 16.0600, type: "Dark Sky Reserve"},
      {name: "Cranborne Chase Dark Sky Reserve", lat: 51.0290, lng: -2.1370, type: "Dark Sky Reserve"},
      {name: "Snowdonia Dark Sky Reserve", lat: 52.9493, lng: -3.8872, type: "Dark Sky Reserve"},
      {name: "Rhön Dark Sky Reserve", lat: 50.3492, lng: 9.9675, type: "Dark Sky Reserve"},
      {name: "Galloway Dark Sky Park", lat: 55.1054, lng: -4.4899, type: "Dark Sky Park"},
      {name: "Great Barrier Island Dark Sky Sanctuary", lat: -36.2058, lng: 175.4831, type: "Dark Sky Sanctuary"},
      {name: "Wairarapa Dark Sky Reserve", lat: -41.3446, lng: 175.5440, type: "Dark Sky Reserve"},
      {name: "River Murray Dark Sky Reserve", lat: -34.4048, lng: 139.2851, type: "Dark Sky Reserve"},
      
      // Dark Sky Parks in USA
      {name: "Death Valley National Park", lat: 36.5323, lng: -116.9325, type: "Dark Sky Park"},
      {name: "Joshua Tree National Park", lat: 33.8734, lng: -115.9010, type: "Dark Sky Park"},
      {name: "Grand Canyon National Park", lat: 36.1069, lng: -112.1129, type: "Dark Sky Park"},
      {name: "Chaco Culture National Historical Park", lat: 36.0319, lng: -107.9698, type: "Dark Sky Park"},
      {name: "Arches National Park", lat: 38.7331, lng: -109.5925, type: "Dark Sky Park"},
      {name: "Canyonlands National Park", lat: 38.2136, lng: -109.9025, type: "Dark Sky Park"}
    ];
    
    // Create a map of existing locations to avoid duplicates
    const existingMap = new Map<string, boolean>();
    existingLocations.forEach(loc => {
      if (loc.name) {
        existingMap.set(loc.name.toLowerCase(), true);
      }
    });
    
    // Add IDA locations that aren't already in our list and are within radius
    const additionalLocations: SharedAstroSpot[] = [];
    
    keyIDALocations.forEach(idaLoc => {
      // Check if this location already exists
      if (!existingMap.has(idaLoc.name.toLowerCase())) {
        // Check if it's within our radius
        const distance = calculateDistance(
          latitude, 
          longitude,
          idaLoc.lat,
          idaLoc.lng
        );
        
        if (distance <= radius) {
          // Create a new location entry
          additionalLocations.push({
            id: `ida-${idaLoc.name.replace(/\s+/g, '-').toLowerCase()}`,
            name: idaLoc.name,
            latitude: idaLoc.lat,
            longitude: idaLoc.lng,
            bortleScale: 2, // Most IDA locations have excellent Bortle scales
            siqs: 8.5, // High SIQS for IDA certified locations
            isDarkSkyReserve: idaLoc.type === "Dark Sky Reserve",
            certification: `International ${idaLoc.type}`,
            description: `An International Dark Sky Association certified ${idaLoc.type}.`,
            distance: distance,
            timestamp: new Date().toISOString()
          });
        }
      }
    });
    
    // Combine existing and additional locations
    return [...existingLocations, ...additionalLocations];
  } catch (error) {
    console.error("Error adding IDA certified locations:", error);
    return existingLocations;
  }
}

// Export the sortLocationsByQuality function
export { sortLocationsByQuality } from './locationFilters';
