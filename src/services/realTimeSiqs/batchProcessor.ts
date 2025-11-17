
import { calculateRealTimeSiqs } from './siqsCalculator';
import { SharedAstroSpot } from '@/types/weather';

/**
 * Process a batch of locations for SIQS calculation efficiently
 * @param locations Array of location data to process
 * @returns Promise resolving to an array of locations with SIQS results
 */
export async function batchCalculateSiqs(
  locations: SharedAstroSpot[]
): Promise<SharedAstroSpot[]> {
  if (!locations || locations.length === 0) {
    return [];
  }
  
  console.log(`Batch calculating SIQS for ${locations.length} locations`);
  
  try {
    // Process locations with concurrency limit to avoid overwhelming the API
    const CONCURRENT_LIMIT = 3;
    const results: SharedAstroSpot[] = [];
    
    for (let i = 0; i < locations.length; i += CONCURRENT_LIMIT) {
      const batch = locations.slice(i, i + CONCURRENT_LIMIT);
      const batchResults = await Promise.all(
        batch.map(async location => {
          try {
            const siqsResult = await calculateRealTimeSiqs(
              location.latitude, 
              location.longitude, 
              location.bortleScale || 5
            );
            
            // Merge SIQS results with the original location data
            return {
              ...location,
              siqs: siqsResult.siqs,
              isViable: siqsResult.isViable,
              siqsResult: {
                score: siqsResult.siqs,
                isViable: siqsResult.isViable,
                factors: siqsResult.factors || []
              }
            };
          } catch (error) {
            console.error(`Error calculating SIQS for location at ${location.latitude}, ${location.longitude}:`, error);
            return {
              ...location,
              siqs: location.bortleScale ? (10 - location.bortleScale) : 5,
              isViable: true
            };
          }
        })
      );
      results.push(...batchResults);
    }
    
    return results;
  } catch (error) {
    console.error("Error in batch SIQS calculation:", error);
    return locations.map(location => ({
      ...location,
      siqs: 0, 
      isViable: false
    }));
  }
}

// Export as alias for backward compatibility
export const batchCalculateRealTimeSiqs = batchCalculateSiqs;
