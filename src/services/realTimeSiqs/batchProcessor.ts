
import { calculateRealTimeSiqs } from './siqsCalculator';
import { SiqsResult, SiqsCalculationOptions, BatchLocationData } from './siqsTypes';

// Control simultaneous calculations
const MAX_BATCH_SIZE = 5;
const BATCH_DELAY_MS = 250;

/**
 * Process multiple SIQS calculations in optimized batches
 * 
 * @param locations Array of locations to calculate SIQS for
 * @param options Calculation options or default bortle scale
 * @returns Array of results with location index and SIQS result
 */
export async function processBatchSiqs(
  locations: Array<{ latitude: number; longitude: number; bortleScale?: number; forecastDay?: number; priority?: number; cloudCover?: number }>,
  options?: SiqsCalculationOptions | number
): Promise<Array<{ index: number; result: SiqsResult | null }>> {
  // If options is a number, it's the default bortle scale
  const defaultBortleScale = typeof options === 'number' ? options : 4;
  const calculationOptions = typeof options === 'object' ? options : {};
  
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
      return calculateBatchItem(location, globalIndex, defaultBortleScale, calculationOptions);
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
  location: { latitude: number; longitude: number; bortleScale?: number; forecastDay?: number; },
  index: number,
  defaultBortleScale: number,
  options?: SiqsCalculationOptions
): Promise<{ index: number; result: SiqsResult | null }> {
  try {
    // Prepare calculation options
    const calcOptions: SiqsCalculationOptions = {
      ...options,
      useSingleHourSampling: options?.useSingleHourSampling !== false,
      targetHour: options?.targetHour || 1,
      cacheDurationMins: options?.cacheDurationMins || 5
    };
    
    // Add forecast day if available
    if (location.forecastDay !== undefined) {
      calcOptions.forecastDay = location.forecastDay;
      calcOptions.useForecasting = true;
    }
    
    const result = await calculateRealTimeSiqs(
      location.latitude,
      location.longitude,
      location.bortleScale || defaultBortleScale,
      calcOptions
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
