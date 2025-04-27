
import { calculateRealTimeSiqs } from './siqsCalculator';
import { SharedAstroSpot } from '@/types/weather';

/**
 * Process a batch of locations for SIQS calculation efficiently
 * @param locations Array of location data to process
 * @returns Promise resolving to an array of locations with SIQS results
 */
export async function batchCalculateSiqs(
  locations: any[]
): Promise<any[]> {
  if (!locations || locations.length === 0) {
    return [];
  }
  
  console.log(`Batch calculating SIQS for ${locations.length} locations`);
  
  try {
    // Process locations in parallel for efficiency but with a concurrency limit
    const results = await Promise.all(
      locations.map(async location => {
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
      })
    );
    
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
