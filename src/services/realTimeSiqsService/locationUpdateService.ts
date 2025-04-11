
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { calculateRealTimeSiqs } from '../realTimeSiqsService';

// Cache for storing location data to avoid redundant calculations
const locationCache: Map<string, { location: SharedAstroSpot; timestamp: number }> = new Map();

// Constants
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

/**
 * Generate a cache key for a location
 * @param latitude Location latitude
 * @param longitude Location longitude 
 * @returns Cache key string
 */
const generateLocationCacheKey = (latitude: number, longitude: number): string => {
  return `${latitude.toFixed(6)}-${longitude.toFixed(6)}`;
};

/**
 * Clear the location cache
 */
export const clearLocationCache = (): void => {
  locationCache.clear();
  console.log("Location cache cleared");
};

/**
 * Clear the SIQS cache (re-exported in realTimeSiqsService.ts)
 */
export const clearSiqsCache = (): void => {
  // This is implemented in realTimeSiqsService.ts and re-exported
  console.log("SIQS cache cleared through locationUpdateService");
};

/**
 * Update multiple locations with real-time SIQS values in batch
 * @param locations Array of locations to update
 * @returns Updated locations with real-time SIQS values
 */
export const updateLocationsWithRealTimeSiqs = async (
  locations: SharedAstroSpot[]
): Promise<SharedAstroSpot[]> => {
  if (!locations || locations.length === 0) {
    console.log("No locations to update with real-time SIQS");
    return [];
  }
  
  console.log(`Updating ${locations.length} locations with real-time SIQS`);
  
  const now = Date.now();
  const updatedLocations: SharedAstroSpot[] = [];
  
  // Process locations in batches to avoid overwhelming the API
  const processBatch = async (batch: SharedAstroSpot[]): Promise<SharedAstroSpot[]> => {
    const batchResults: SharedAstroSpot[] = [];
    
    for (const location of batch) {
      if (!location.latitude || !location.longitude) continue;
      
      // Generate cache key for this location
      const cacheKey = generateLocationCacheKey(location.latitude, location.longitude);
      const cachedItem = locationCache.get(cacheKey);
      
      // Use cached value if available and fresh
      if (cachedItem && (now - cachedItem.timestamp < CACHE_DURATION)) {
        batchResults.push(cachedItem.location);
        continue;
      }
      
      try {
        // Calculate real-time SIQS for this location
        const { siqs } = await calculateRealTimeSiqs(
          location.latitude,
          location.longitude,
          location.bortleScale
        );
        
        const updatedLocation = {
          ...location,
          siqs
        };
        
        // Cache the result
        locationCache.set(cacheKey, {
          location: updatedLocation,
          timestamp: now
        });
        
        batchResults.push(updatedLocation);
      } catch (error) {
        console.error(`Error calculating SIQS for location (${location.latitude}, ${location.longitude}):`, error);
        batchResults.push(location);
      }
    }
    
    return batchResults;
  };
  
  // Process in batches of 5 to avoid overwhelming API
  const batchSize = 5;
  const totalBatches = Math.ceil(locations.length / batchSize);
  
  for (let i = 0; i < totalBatches; i++) {
    const start = i * batchSize;
    const end = Math.min((i + 1) * batchSize, locations.length);
    const batch = locations.slice(start, end);
    
    const batchResults = await processBatch(batch);
    updatedLocations.push(...batchResults);
    
    // Add a small delay between batches
    if (i < totalBatches - 1) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }
  
  console.log(`Updated SIQS for ${updatedLocations.length} locations`);
  return updatedLocations;
};
