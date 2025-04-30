
import { calculateRealTimeSiqs } from './siqsCalculator';
import { SiqsResult } from './siqsTypes';

// Control simultaneous calculations
const MAX_BATCH_SIZE = 5;
const BATCH_DELAY_MS = 250;

/**
 * Process multiple SIQS calculations in optimized batches
 * 
 * @param locations Array of locations to calculate SIQS for
 * @param bortleScale Optional bortle scale to use for all locations
 * @returns Array of results with location index and SIQS result
 */
export async function processBatchSiqs(
  locations: Array<{ latitude: number; longitude: number; bortleScale?: number }>,
  defaultBortleScale: number = 4
): Promise<Array<{ index: number; result: SiqsResult | null }>> {
  // Avoid overloading with too many calculations
  if (locations.length > 25) {
    console.warn(`Large batch of ${locations.length} SIQS calculations requested. Limiting to 25.`);
    locations = locations.slice(0, 25);
  }
  
  const results: Array<{ index: number; result: SiqsResult | null }> = [];
  const batches = splitIntoBatches(locations, MAX_BATCH_SIZE);
  
  // Process each batch with a delay between batches
  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    const batchOffset = i * MAX_BATCH_SIZE;
    
    // Process batch in parallel
    const batchPromises = batch.map((location, batchIndex) => {
      const globalIndex = batchOffset + batchIndex;
      return calculateBatchItem(location, globalIndex, defaultBortleScale);
    });
    
    // Wait for current batch to complete
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
    
    // Add delay between batches except for last batch
    if (i < batches.length - 1) {
      await new Promise(resolve => setTimeout(resolve, BATCH_DELAY_MS));
    }
  }
  
  return results;
}

/**
 * Calculate SIQS for multiple locations with optimized settings
 * 
 * @param locations Array of locations with bortle scale
 * @param options Additional calculation options
 * @returns Array of SIQS results
 */
export async function batchCalculateSiqs(
  locations: Array<{ latitude: number; longitude: number; bortleScale?: number }>,
  options?: {
    skipCache?: boolean;
    useForecasting?: boolean;
    prioritizeDarkSkyReserves?: boolean;
  }
): Promise<SiqsResult[]> {
  // Sort locations by priority if needed
  if (options?.prioritizeDarkSkyReserves) {
    locations = [...locations].sort((a, b) => {
      const aPriority = (a as any).isDarkSkyReserve ? 1 : 0;
      const bPriority = (b as any).isDarkSkyReserve ? 1 : 0;
      return bPriority - aPriority;
    });
  }
  
  const results = await processBatchSiqs(locations, 4);
  
  // Filter out nulls and sort back to original order
  return results
    .filter(item => item.result !== null)
    .sort((a, b) => a.index - b.index)
    .map(item => item.result) as SiqsResult[];
}

// Helper functions
async function calculateBatchItem(
  location: { latitude: number; longitude: number; bortleScale?: number },
  index: number,
  defaultBortleScale: number
): Promise<{ index: number; result: SiqsResult | null }> {
  try {
    const result = await calculateRealTimeSiqs(
      location.latitude,
      location.longitude,
      location.bortleScale || defaultBortleScale,
      {
        useSingleHourSampling: true,
        targetHour: 1,
        cacheDurationMins: 5
      }
    );
    return { index, result };
  } catch (error) {
    console.error(`Error calculating SIQS for location ${index}:`, error);
    return { index, result: null };
  }
}

function splitIntoBatches<T>(array: T[], batchSize: number): T[][] {
  const batches: T[][] = [];
  for (let i = 0; i < array.length; i += batchSize) {
    batches.push(array.slice(i, i + batchSize));
  }
  return batches;
}
