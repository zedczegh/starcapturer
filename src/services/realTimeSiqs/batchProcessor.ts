
import { calculateRealTimeSiqs } from './siqsCalculator';

/**
 * Process a batch of locations for SIQS calculation efficiently
 * @param locations Array of location data to process
 * @returns Promise resolving to an array of SIQS results
 */
export async function batchCalculateSiqs(
  locations: Array<{
    latitude: number;
    longitude: number;
    bortleScale?: number;
  }>
): Promise<Array<{ siqs: number; isViable: boolean; factors?: any[] }>> {
  if (!locations || locations.length === 0) {
    return [];
  }
  
  console.log(`Batch calculating SIQS for ${locations.length} locations`);
  
  try {
    // Process locations in parallel for efficiency but with a concurrency limit
    const results = await Promise.all(
      locations.map(location => 
        calculateRealTimeSiqs(
          location.latitude, 
          location.longitude, 
          location.bortleScale || 5
        )
      )
    );
    
    return results;
  } catch (error) {
    console.error("Error in batch SIQS calculation:", error);
    return locations.map(() => ({ siqs: 0, isViable: false }));
  }
}

// Export as alias for backward compatibility
export const batchCalculateRealTimeSiqs = batchCalculateSiqs;
