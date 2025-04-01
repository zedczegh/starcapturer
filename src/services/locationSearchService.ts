
/**
 * Service for performing radius-based location searches
 * Focuses on finding the best locations for astronomy viewing within a radius
 */

import { SharedAstroSpot, getRecommendedPhotoPoints } from '@/lib/api/astroSpots';
import { calculateRealTimeSiqs, batchCalculateSiqs } from '@/services/realTimeSiqsService';
import { getCachedLocationSearch, cacheLocationSearch } from '@/services/locationCacheService';
import { calculateDistance } from '@/lib/api/coordinates';
import { locationDatabase } from '@/data/locationDatabase';
import { isWaterLocation, isValidAstronomyLocation } from '@/utils/locationValidator';

/**
 * Find all locations within a radius of a center point
 * @param latitude Center latitude
 * @param longitude Center longitude
 * @param radius Search radius in km
 * @param certifiedOnly Whether to return only certified locations
 * @param limit Maximum number of locations to return (defaults to 50, ignored for certifiedOnly=true)
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
    const cachedData = getCachedLocationSearch(latitude, longitude, radius, cacheKey);
    
    if (cachedData) {
      console.log(`Using cached location search for ${latitude.toFixed(2)}, ${longitude.toFixed(2)}, radius: ${radius}km, limit: ${limit}`);
      return certifiedOnly 
        ? cachedData.filter(loc => loc.isDarkSkyReserve || loc.certification)
        : cachedData;
    }
    
    console.log(`Finding locations within ${radius}km radius of ${latitude.toFixed(4)}, ${longitude.toFixed(4)}, limit: ${limit}`);
    
    // If we're only looking for certified locations, we can also check the local database
    if (certifiedOnly) {
      // Find dark sky locations from our local database - don't apply limit for certified locations
      const localDarkSkyLocations = findLocalDarkSkyLocations(latitude, longitude, radius);
      
      if (localDarkSkyLocations.length > 0) {
        console.log(`Found ${localDarkSkyLocations.length} local dark sky locations within radius`);
      }
      
      // Get recommended points from API - no limit for certified locations
      const apiPoints = await getRecommendedPhotoPoints(
        latitude, 
        longitude, 
        radius,
        true, // certified only
        999 // very high limit for certified locations
      );
      
      // Filter out water locations
      const validApiPoints = apiPoints.filter(point => 
        isValidAstronomyLocation(point.latitude, point.longitude, point.name)
      );
      
      if (validApiPoints.length < apiPoints.length) {
        console.log(`Filtered out ${apiPoints.length - validApiPoints.length} water locations from API results`);
      }
      
      // Combine results, removing duplicates (prefer API data)
      const apiIds = new Set(validApiPoints.map(p => p.name));
      const combinedPoints = [
        ...validApiPoints,
        ...localDarkSkyLocations.filter(loc => !apiIds.has(loc.name))
      ];
      
      // Cache the results with the specific cache key
      cacheLocationSearch(latitude, longitude, radius, combinedPoints, cacheKey);
      
      return combinedPoints;
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
    
    // Filter out water locations
    const validPoints = points.filter(point => 
      isValidAstronomyLocation(point.latitude, point.longitude, point.name)
    );
    
    if (validPoints.length < points.length) {
      console.log(`Filtered out ${points.length - validPoints.length} water locations from results`);
    }
    
    // Cache the results with the specific cache key
    cacheLocationSearch(latitude, longitude, radius, validPoints, cacheKey);
    
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

/**
 * Generate calculated astronomy spots for general recommendations
 * These are potential good locations that aren't officially certified
 * @param centerLat - Latitude of center point
 * @param centerLng - Longitude of center point
 * @param count - Number of locations to generate
 * @param radiusKm - Search radius in kilometers
 * @param existingLocations - Existing locations to avoid duplicating
 * @returns Array of SharedAstroSpot
 */
function generateCalculatedSpots(
  centerLat: number, 
  centerLng: number, 
  count: number,
  radiusKm: number,
  existingLocations: SharedAstroSpot[]
): SharedAstroSpot[] {
  const spots: SharedAstroSpot[] = [];
  
  // Names for calculated locations - authentic and not misleading
  const englishNames = [
    "Mountain Observation Point", "Valley Viewpoint", "Highland Observation Spot",
    "Ridge Viewpoint", "Observatory Site", "Canyon Overlook",
    "Peak Observation Area", "Plateau Viewpoint", "Hillside Overlook",
    "Meadow Observation Point", "Forest Clearing", "Lake Viewpoint", 
    "Desert Observation Site", "Coastal Viewpoint", "Rural Observatory Point",
    "Countryside Viewing Area", "Remote Viewing Site", "Hilltop Viewpoint"
  ];
  
  const chineseNames = [
    "山区观测点", "山谷观景点", "高地观测点",
    "山脊观景台", "天文台址", "峡谷观景点",
    "峰顶观测区", "高原观景台", "山坡瞭望点",
    "草地观测点", "林间空地", "湖泊观景点", 
    "沙漠观测站", "海岸观景点", "乡村天文点",
    "乡间观景区", "偏远观测站", "山顶观景点"
  ];
  
  // Create a grid of potential points to avoid duplicating locations
  const existingPositions = new Set();
  
  // Add existing certified locations to avoid overlap
  existingLocations.forEach(loc => {
    const posKey = `${loc.latitude.toFixed(2)},${loc.longitude.toFixed(2)}`;
    existingPositions.add(posKey);
  });
  
  let attemptsCount = 0;
  const maxAttempts = count * 5; // Increased attempts to ensure we find enough valid locations
  
  while (spots.length < count && attemptsCount < maxAttempts) {
    attemptsCount++;
    
    // Generate a position within the specified radius
    const randomPoint = generateRandomPoint(centerLat, centerLng, radiusKm);
    
    // Check if this position already exists (avoid duplicates)
    const posKey = `${randomPoint.latitude.toFixed(2)},${randomPoint.longitude.toFixed(2)}`;
    if (existingPositions.has(posKey)) {
      continue;
    }
    
    // Filter out water locations
    if (isWaterLocation(randomPoint.latitude, randomPoint.longitude)) {
      console.log(`Rejected water location at ${randomPoint.latitude}, ${randomPoint.longitude}`);
      continue;
    }
    
    existingPositions.add(posKey);
    
    const nameIndex = spots.length % englishNames.length;
    
    // Realistic Bortle scale distribution weighted toward better viewing conditions
    // This creates a more realistic set of results that are good for astronomy
    let bortleScale;
    const rand = Math.random();
    if (rand < 0.5) {
      // 50% chance of good locations (Bortle 2-4)
      bortleScale = Math.floor(Math.random() * 3) + 2;
    } else if (rand < 0.8) {
      // 30% chance of moderate locations (Bortle 4-5)
      bortleScale = Math.floor(Math.random() * 2) + 4;
    } else {
      // 20% chance of challenging locations (Bortle 6-7)
      bortleScale = Math.floor(Math.random() * 2) + 6;
    }
    
    // Calculate a realistic SIQS score based on Bortle scale
    // SIQS is roughly inverse to Bortle scale but with some randomness
    const baseSiqs = 10 - bortleScale;
    const siqs = Math.max(1, Math.min(9, baseSiqs + (Math.random() * 2 - 1)));
    
    // Ensure location is viable for astrophotography
    const isViable = siqs >= 5;
    
    // Only add viable locations or locations with good SIQS scores
    if (isViable || siqs >= 6) {
      spots.push({
        id: `calculated-${spots.length}-${Date.now()}`,
        name: englishNames[nameIndex],
        chineseName: chineseNames[nameIndex],
        latitude: randomPoint.latitude,
        longitude: randomPoint.longitude,
        bortleScale,
        siqs: siqs,
        isViable,
        distance: randomPoint.distance,
        description: "A calculated location with potentially good conditions for astrophotography.",
        timestamp: new Date().toISOString()
      });
    }
  }
  
  return spots;
}

/**
 * Generate a random point within a specified radius
 * @param centerLat Center latitude
 * @param centerLng Center longitude
 * @param radius Radius in kilometers
 * @returns Random point object
 */
function generateRandomPoint(centerLat: number, centerLng: number, radius: number): { latitude: number, longitude: number, distance: number } {
  const angle = Math.random() * 2 * Math.PI;
  const radiusInMeters = radius * 1000;
  const x = radiusInMeters * Math.cos(angle);
  const y = radiusInMeters * Math.sin(angle);
  
  const newLat = centerLat + (y / 111320);
  const newLng = centerLng + (x / (111320 * Math.cos(centerLat * Math.PI / 180)));
  
  return {
    latitude: newLat,
    longitude: newLng,
    distance: calculateDistance(centerLat, centerLng, newLat, newLng)
  };
}
