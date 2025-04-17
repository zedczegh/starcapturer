
import { calculateRealTimeSiqs } from './siqsCalculator';
import { SiqsResult } from './siqsTypes';

/**
 * Process a batch of SIQS calculations
 * 
 * @param locations Array of locations to calculate SIQS for
 * @param concurrency Number of concurrent calculations
 * @returns Array of SIQS results
 */
export async function batchCalculateSiqs(
  locations: Array<{ latitude: number; longitude: number; bortleScale?: number }>,
  concurrency: number = 3
): Promise<SiqsResult[]> {
  if (!locations || !locations.length) {
    return [];
  }
  
  console.log(`Batch calculating SIQS for ${locations.length} locations with concurrency ${concurrency}`);
  
  const results: SiqsResult[] = [];
  
  // Process in batches to prevent overwhelming APIs
  for (let i = 0; i < locations.length; i += concurrency) {
    const batch = locations.slice(i, i + concurrency);
    
    const batchPromises = batch.map(loc => 
      calculateRealTimeSiqs(
        loc.latitude, 
        loc.longitude, 
        loc.bortleScale || 5
      ).catch(err => {
        console.error(`Error calculating SIQS for location ${loc.latitude},${loc.longitude}:`, err);
        return { siqs: 0, isViable: false };
      })
    );
    
    const batchResults = await Promise.all(batchPromises);
    
    // Make sure all results conform to the SiqsResult interface
    const validatedResults = batchResults.map(result => {
      if (!result.hasOwnProperty('isViable')) {
        return {
          ...result,
          isViable: result.siqs >= 5.0,
          factors: result.factors || []
        };
      }
      return result;
    });
    
    results.push(...validatedResults);
    
    // Pause between batches if we have more to process
    if (i + concurrency < locations.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return results;
}
