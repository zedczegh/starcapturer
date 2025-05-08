
/**
 * Batch processing for SIQS calculations
 */
import { SiqsResult } from './siqsTypes';
import { calculateRealTimeSiqs } from './siqsCalculator';
import { logError } from '@/utils/debug/errorLogger';

/**
 * Calculate SIQS for multiple locations in batch
 * @param locations Array of locations with coordinates and optional Bortle scale
 * @param concurrency Maximum number of parallel calculations
 * @returns Array of SIQS results
 */
export async function batchCalculateSiqs(
  locations: Array<{ 
    latitude: number; 
    longitude: number; 
    bortleScale?: number;
    id?: string;
    name?: string; 
  }>,
  concurrency: number = 3
): Promise<any[]> {
  if (!locations || !locations.length) {
    return [];
  }
  
  console.log(`Batch calculating SIQS for ${locations.length} locations with concurrency ${concurrency}`);
  
  const results: any[] = [];
  
  // Process in batches to prevent overwhelming APIs
  for (let i = 0; i < locations.length; i += concurrency) {
    const batch = locations.slice(i, i + concurrency);
    
    const batchPromises = batch.map(loc => 
      calculateRealTimeSiqs(
        loc.latitude, 
        loc.longitude, 
        loc.bortleScale || 4
      ).then(siqsResult => ({
        ...loc,
        siqs: siqsResult.siqs,
        isViable: siqsResult.isViable,
        siqsResult: {
          score: siqsResult.siqs,
          isViable: siqsResult.isViable,
          factors: siqsResult.factors || []
        }
      })).catch(err => {
        logError(`Error calculating SIQS for location ${loc.name || `${loc.latitude},${loc.longitude}`}:`, err);
        return {
          ...loc,
          siqs: 0,
          isViable: false,
          siqsResult: {
            score: 0,
            isViable: false,
            factors: [{ name: 'Error', score: 0, description: 'Failed to calculate' }]
          }
        };
      })
    );
    
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
    
    // Pause between batches if we have more to process
    if (i + concurrency < locations.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return results;
}
