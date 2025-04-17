
import { calculateRealTimeSiqs } from './siqsCalculator';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { SiqsResult } from './siqsTypes';

// Constants for batch processing
const DEFAULT_CONCURRENCY = 3;
const BATCH_DELAY_MS = 1000;

/**
 * Process a batch of locations for SIQS calculation
 * 
 * @param batch Array of locations to process
 * @returns Promise that resolves when the batch is complete
 */
async function processBatch(
  batch: Array<{ latitude: number; longitude: number; bortleScale?: number }>,
): Promise<SiqsResult[]> {
  const batchPromises = batch.map(loc => 
    calculateRealTimeSiqs(
      loc.latitude, 
      loc.longitude, 
      loc.bortleScale || 5
    ).catch(err => {
      console.error(`Error calculating SIQS for location ${loc.latitude},${loc.longitude}:`, err);
      return { score: 0, isViable: false } as SiqsResult;
    })
  );
  
  return await Promise.all(batchPromises);
}

/**
 * Calculate SIQS for multiple locations in batches
 * 
 * @param locations Array of locations to calculate SIQS for
 * @param concurrency Number of concurrent calculations
 * @returns Promise resolving to SIQS results
 */
export async function batchCalculateSiqs(
  locations: Array<{ latitude: number; longitude: number; bortleScale?: number }>,
  concurrency: number = DEFAULT_CONCURRENCY
): Promise<SiqsResult[]> {
  const results: SiqsResult[] = [];
  
  // Process in batches to prevent API rate limits
  for (let i = 0; i < locations.length; i += concurrency) {
    const batch = locations.slice(i, i + concurrency);
    
    // Process this batch
    const batchResults = await processBatch(batch);
    results.push(...batchResults);
    
    // Add delay between batches if more are pending
    if (i + concurrency < locations.length) {
      await new Promise(resolve => setTimeout(resolve, BATCH_DELAY_MS));
    }
  }
  
  return results;
}

/**
 * Update AstroSpot objects with SIQS calculations
 * 
 * @param locations Array of locations to update
 * @param concurrency Number of concurrent calculations
 * @returns Promise resolving to updated locations
 */
export async function updateLocationsWithSiqs(
  locations: SharedAstroSpot[],
  concurrency: number = DEFAULT_CONCURRENCY
): Promise<SharedAstroSpot[]> {
  if (!locations || locations.length === 0) {
    return [];
  }
  
  // Map locations to simpler objects for SIQS calculation
  const siqsLocations = locations.map(loc => ({
    latitude: loc.latitude,
    longitude: loc.longitude,
    bortleScale: loc.bortleScale
  }));
  
  // Calculate SIQS values
  const siqsResults = await batchCalculateSiqs(siqsLocations, concurrency);
  
  // Update each location with its SIQS result
  return locations.map((location, index) => {
    const siqsResult = siqsResults[index];
    
    if (siqsResult && siqsResult.score > 0) {
      return {
        ...location,
        siqs: {
          score: siqsResult.score,
          isViable: siqsResult.isViable
        },
        siqsResult
      };
    }
    
    return location;
  });
}
