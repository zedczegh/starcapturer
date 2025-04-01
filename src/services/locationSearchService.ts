/**
 * Service for searching and finding astronomy locations
 * Optimized for better performance and memory usage
 */

import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { calculateDistance } from "@/utils/geoUtils";
import { batchCalculateSiqs } from "@/services/realTimeSiqsService";

// Cache for location searches to prevent redundant API calls
const locationSearchCache = new Map<string, {
  locations: SharedAstroSpot[];
  timestamp: number;
}>();

// Cache lifetime: 1 hour
const CACHE_LIFETIME = 60 * 60 * 1000;

// Limit the maximum number of parallel SIQS calculations to prevent overloading
const MAX_PARALLEL_SIQS = 3;

// Limit the maximum number of locations to process at once
const MAX_BATCH_SIZE = 15;

// Maximum wait time for operations before timing out (10 seconds)
const OPERATION_TIMEOUT = 10000;

/**
 * Clear the location search cache
 */
export function clearLocationSearchCache(): void {
  locationSearchCache.clear();
  console.log("Location search cache cleared");
}

/**
 * Generate a cache key for location searches
 */
export function generateLocationCacheKey(
  latitude: number,
  longitude: number,
  radiusKm: number
): string {
  return `locations-${latitude.toFixed(2)}-${longitude.toFixed(2)}-${radiusKm}`;
}

/**
 * Get cached location search results if available
 */
export function getCachedLocationSearch(
  latitude: number,
  longitude: number,
  radiusKm: number
): SharedAstroSpot[] | null {
  const cacheKey = generateLocationCacheKey(latitude, longitude, radiusKm);
  const cached = locationSearchCache.get(cacheKey);
  
  if (cached && (Date.now() - cached.timestamp) < CACHE_LIFETIME) {
    return cached.locations;
  }
  
  return null;
}

/**
 * Cache location search results
 */
export function cacheLocationSearch(
  latitude: number,
  longitude: number,
  radiusKm: number,
  locations: SharedAstroSpot[]
): void {
  const cacheKey = generateLocationCacheKey(latitude, longitude, radiusKm);
  locationSearchCache.set(cacheKey, {
    locations,
    timestamp: Date.now()
  });
}

/**
 * Timeout wrapper for promises to prevent long-running operations
 */
function withTimeout<T>(promise: Promise<T>, ms: number, errorMessage: string): Promise<T> {
  const timeoutPromise = new Promise<T>((_, reject) => {
    setTimeout(() => reject(new Error(errorMessage)), ms);
  });
  
  return Promise.race([promise, timeoutPromise]);
}

/**
 * Find locations within a specified radius of coordinates
 * Uses caching for better performance and memory usage
 */
export async function findLocationsWithinRadius(
  latitude: number,
  longitude: number,
  radiusKm: number = 1000,
  certifiedOnly: boolean = false
): Promise<SharedAstroSpot[]> {
  console.log(`Finding locations within ${radiusKm}km of ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);

  try {
    // Try to get cached results first
    const cachedResults = getCachedLocationSearch(latitude, longitude, radiusKm);
    
    if (cachedResults) {
      console.log(`Using cached location results for ${latitude.toFixed(2)}, ${longitude.toFixed(2)}, radius: ${radiusKm}km`);
      
      // Filter for certified only if needed
      if (certifiedOnly) {
        return cachedResults.filter(
          (location: SharedAstroSpot) => location.isDarkSkyReserve || location.certification
        );
      }
      
      return cachedResults;
    }
    
    // No cached results, fetch from API with timeout
    const { getRecommendedPhotoPoints } = await import("@/lib/api");
    
    console.log(`Fetching locations within ${radiusKm}km radius...`);
    
    // Get recommended points with timeout protection
    const locations = await withTimeout(
      getRecommendedPhotoPoints(
        latitude,
        longitude,
        radiusKm,
        certifiedOnly,
        30 // Limit to 30 results for better performance
      ),
      OPERATION_TIMEOUT,
      "Location search timed out"
    );
    
    if (!locations || locations.length === 0) {
      console.log("No locations found, falling back to calculated locations");
      return findCalculatedLocations(latitude, longitude, radiusKm, true);
    }
    
    // Add distance information to each location if not already present
    const enhancedLocations = locations.map(location => {
      // Calculate distance if not already present
      const distance = location.distance ?? calculateDistance(
        latitude, longitude,
        location.latitude, location.longitude
      );
      
      return {
        ...location,
        distance,
        county: location.county || getDummyCounty(location.latitude, location.longitude),
        state: location.state || getDummyState(location.latitude, location.longitude),
        country: location.country || getDummyCountry(location.latitude, location.longitude)
      };
    });
    
    // Sort by distance
    enhancedLocations.sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
    
    // Cache the results for future use (only keep a reasonable number)
    const resultsToCache = enhancedLocations.slice(0, 30);
    cacheLocationSearch(latitude, longitude, radiusKm, resultsToCache);
    
    return enhancedLocations;
  } catch (error) {
    console.error("Error finding locations within radius:", error);
    
    // Fallback to calculated locations on error
    return findCalculatedLocations(latitude, longitude, radiusKm, true);
  }
}

/**
 * Find calculated/generated locations when no real ones are available
 * Uses synthetic data generation for better coverage
 */
export async function findCalculatedLocations(
  latitude: number,
  longitude: number,
  radiusKm: number = 1000,
  allowExpand: boolean = false
): Promise<SharedAstroSpot[]> {
  console.log(`Finding calculated locations within ${radiusKm}km of ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
  
  try {
    // Try to get cached results first with a slightly different key
    const cacheKey = `calc-locations-${latitude.toFixed(2)}-${longitude.toFixed(2)}-${radiusKm}`;
    const cached = locationSearchCache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < CACHE_LIFETIME) {
      console.log("Using cached calculated locations");
      return cached.locations;
    }
    
    // Import calculation points data with timeout protection
    const { getCalculationPoints } = await import('@/data/calculationPoints');
    const points = await withTimeout(
      getCalculationPoints(),
      OPERATION_TIMEOUT,
      "Calculation points fetching timed out"
    );
    
    if (!points || points.length === 0) {
      console.log("No calculation points available");
      return [];
    }
    
    // Filter points within radius and add distance
    const pointsWithDistance = points.map(point => {
      const distance = calculateDistance(
        latitude, longitude,
        point.latitude, point.longitude
      );
      
      return {
        ...point,
        distance
      };
    }).filter(point => point.distance <= (allowExpand ? radiusKm * 2 : radiusKm));
    
    // Sort by distance and limit to a reasonable number for performance
    pointsWithDistance.sort((a, b) => a.distance - b.distance);
    const limitedPoints = pointsWithDistance.slice(0, 15);
    
    // Convert to SharedAstroSpot format
    const locations: SharedAstroSpot[] = limitedPoints.map(point => ({
      id: point.id,
      name: point.name,
      chineseName: point.chineseName,
      latitude: point.latitude,
      longitude: point.longitude,
      bortleScale: point.bortleScale,
      distance: point.distance,
      county: point.county || getDummyCounty(point.latitude, point.longitude),
      state: point.state || getDummyState(point.latitude, point.longitude),
      country: point.country || getDummyCountry(point.latitude, point.longitude),
      description: point.description,
      timestamp: new Date().toISOString()
    }));
    
    // Calculate SIQS in batches to prevent overloading, with timeout
    const batchedLocations = await withTimeout(
      processInBatches(locations, MAX_BATCH_SIZE),
      OPERATION_TIMEOUT,
      "SIQS calculation timed out"
    );
    
    // Cache the results
    locationSearchCache.set(cacheKey, {
      locations: batchedLocations,
      timestamp: Date.now()
    });
    
    return batchedLocations;
  } catch (error) {
    console.error("Error finding calculated locations:", error);
    return [];
  }
}

/**
 * Find certified dark sky locations
 */
export async function findCertifiedLocations(
  latitude: number,
  longitude: number,
  radiusKm: number = 1000
): Promise<SharedAstroSpot[]> {
  // Use the standard function but with certifiedOnly flag
  return findLocationsWithinRadius(latitude, longitude, radiusKm, true);
}

/**
 * Process locations in batches to prevent memory overload
 */
async function processInBatches(
  locations: SharedAstroSpot[],
  batchSize: number
): Promise<SharedAstroSpot[]> {
  const result: SharedAstroSpot[] = [];
  
  // Process in batches
  for (let i = 0; i < locations.length; i += batchSize) {
    const batch = locations.slice(i, i + batchSize);
    
    // Calculate SIQS for this batch
    const processedBatch = await batchCalculateSiqs(batch, MAX_PARALLEL_SIQS);
    
    // Add to results
    result.push(...processedBatch);
  }
  
  return result;
}

/**
 * Get a reasonable county name based on coordinates
 * This is a fallback when real data isn't available
 */
function getDummyCounty(latitude: number, longitude: number): string {
  // Simple hash function to get consistent names for the same coordinates
  const hash = Math.abs(Math.floor((latitude * 10000 + longitude * 10000) % 10));
  
  const counties = [
    "Alpine", "Riverside", "Jefferson", "Franklin", "Madison",
    "Douglas", "Washington", "Lincoln", "Jackson", "Fairview"
  ];
  
  return counties[hash];
}

/**
 * Get a reasonable state/province name based on coordinates
 * This is a fallback when real data isn't available
 */
function getDummyState(latitude: number, longitude: number): string {
  // Simple region determination based on coordinates
  if (latitude > 40 && longitude < -100) return "Montana";
  if (latitude > 35 && longitude < -115) return "Nevada";
  if (latitude > 40 && longitude > -80) return "New York";
  if (latitude < 30 && longitude < -100) return "Texas";
  if (latitude > 35 && longitude < -80) return "Virginia";
  
  // For other regions, use a simple hash
  const hash = Math.abs(Math.floor((latitude * 1000 + longitude * 1000) % 10));
  const states = [
    "Colorado", "California", "Oregon", "Washington", "Arizona",
    "New Mexico", "Idaho", "Wyoming", "Utah", "Maine"
  ];
  
  return states[hash];
}

/**
 * Get a reasonable country name based on coordinates
 * This is a fallback when real data isn't available
 */
function getDummyCountry(latitude: number, longitude: number): string {
  // Simple country determination based on coordinates
  if (latitude > 24 && latitude < 50 && longitude < -66 && longitude > -125) return "USA";
  if (latitude > 24 && latitude < 50 && longitude < -50 && longitude > -66) return "Canada";
  if (latitude > 15 && latitude < 33 && longitude < -86 && longitude > -118) return "Mexico";
  if (latitude > 35 && latitude < 60 && longitude < 25 && longitude > -10) return "Europe";
  if (latitude > 10 && latitude < 55 && longitude < 145 && longitude > 70) return "China";
  
  return "International";
}
