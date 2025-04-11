
import { SharedAstroSpot } from '@/lib/siqs/types';
import { calculateRealTimeSiqs } from '@/services/realTimeSiqsService';

// Cache to store SIQS results by location coordinates
const siqsCache = new Map<string, { siqs: number, timestamp: number }>();

// Limit parallel requests to avoid rate limiting
const MAX_PARALLEL_REQUESTS = 2;
// Batch size for processing locations
const BATCH_SIZE = 8;
// Cache expiration time (30 minutes)
const CACHE_EXPIRATION_MS = 30 * 60 * 1000;

/**
 * Clear the location SIQS cache
 */
export function clearLocationCache(): void {
  siqsCache.clear();
  console.log("Location SIQS cache cleared");
}

/**
 * Update locations with real-time SIQS data with throttling and caching
 * @param locations Array of locations to update
 * @returns Promise resolving to updated locations
 */
export async function updateLocationsWithRealTimeSiqs(
  locations: SharedAstroSpot[]
): Promise<SharedAstroSpot[]> {
  if (!locations || locations.length === 0) {
    return [];
  }
  
  console.log(`Updating ${locations.length} locations with real-time SIQS`);
  const now = Date.now();
  const updatedLocations: SharedAstroSpot[] = [];
  
  // Filter locations to only those that need updates (not in cache or cache expired)
  const locationsNeedingUpdate = locations.filter(location => {
    if (!location.latitude || !location.longitude) return false;
    
    const cacheKey = `${location.latitude.toFixed(5)},${location.longitude.toFixed(5)}`;
    const cachedResult = siqsCache.get(cacheKey);
    
    // Skip if we have a fresh cached result
    if (cachedResult && (now - cachedResult.timestamp) < CACHE_EXPIRATION_MS) {
      console.log(`Using cached SIQS for ${location.name || 'location'}: ${cachedResult.siqs.toFixed(1)}`);
      
      // Update location with cached SIQS data
      updatedLocations.push({
        ...location,
        siqs: cachedResult.siqs,
        siqsResult: {
          score: cachedResult.siqs,
          isViable: cachedResult.siqs >= 5.0,
          factors: [],
          isNighttimeCalculation: true
        }
      });
      
      return false;
    }
    
    return true;
  });
  
  console.log(`Found ${locationsNeedingUpdate.length} locations needing SIQS update`);
  
  // Process locations in batches to avoid overwhelming APIs
  for (let i = 0; i < locationsNeedingUpdate.length; i += BATCH_SIZE) {
    const batch = locationsNeedingUpdate.slice(i, i + BATCH_SIZE);
    
    // Process batch with limited parallelism
    const batchPromises = [];
    
    for (let j = 0; j < batch.length; j += MAX_PARALLEL_REQUESTS) {
      const parallelBatch = batch.slice(j, j + MAX_PARALLEL_REQUESTS);
      
      // Wait a small amount of time between parallel batches to reduce API load
      if (j > 0) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      const parallelPromises = parallelBatch.map(async location => {
        try {
          const { latitude, longitude, bortleScale = 4 } = location;
          
          if (!latitude || !longitude) {
            return location;
          }
          
          const cacheKey = `${latitude.toFixed(5)},${longitude.toFixed(5)}`;
          
          // Calculate SIQS for the location
          const result = await calculateRealTimeSiqs(latitude, longitude, bortleScale);
          
          // Cache the result
          siqsCache.set(cacheKey, {
            siqs: result.siqs,
            timestamp: now
          });
          
          // Update location with calculated SIQS
          const updatedLocation: SharedAstroSpot = {
            ...location,
            siqs: result.siqs,
            siqsResult: {
              score: result.siqs,
              isViable: result.siqs >= 5.0,
              factors: result.factors || [],
              isNighttimeCalculation: true
            }
          };
          
          return updatedLocation;
        } catch (error) {
          console.error(`Error calculating SIQS for location:`, error);
          return location;
        }
      });
      
      const results = await Promise.all(parallelPromises);
      batchPromises.push(...results);
    }
    
    // Add batch results to updated locations
    updatedLocations.push(...batchPromises);
  }
  
  return updatedLocations;
}
