
/**
 * Batch processing utilities for SIQS calculations
 */
import { calculateRealTimeSiqs } from './siqsCalculator';
import { SharedAstroSpot } from '@/lib/api/astroSpots';

/**
 * Calculate SIQS for multiple locations in a batch
 * Uses efficient parallelization while respecting rate limits
 * 
 * @param locations Array of locations to calculate SIQS for
 * @param bortleScale Optional default Bortle scale for locations without one
 * @returns Promise resolving to array of locations with SIQS values
 */
export async function batchCalculateSiqs(
  locations: SharedAstroSpot[],
  bortleScale: number = 5
): Promise<SharedAstroSpot[]> {
  if (!locations || locations.length === 0) {
    return [];
  }
  
  // Limit batch size for performance
  const batchSize = Math.min(locations.length, 10);
  console.log(`Processing batch SIQS calculation for ${locations.length} locations (max ${batchSize} at once)`);
  
  // Process in chunks to avoid overwhelming the system
  const results: SharedAstroSpot[] = [];
  const chunks = chunkArray(locations, batchSize);
  
  for (const chunk of chunks) {
    const chunkPromises = chunk.map(async (location) => {
      try {
        if (!location.latitude || !location.longitude) {
          console.warn("Invalid location coordinates for SIQS calculation", location);
          return location;
        }
        
        // Use location-specific Bortle scale if available, otherwise use default
        const effectiveBortle = location.bortleScale || bortleScale;
        
        // Calculate SIQS
        const siqsResult = await calculateRealTimeSiqs(
          location.latitude, 
          location.longitude,
          effectiveBortle
        );
        
        // Return enhanced location with SIQS data
        return {
          ...location,
          siqs: siqsResult
        };
      } catch (error) {
        console.error("Error calculating SIQS for location", location, error);
        return location;
      }
    });
    
    // Wait for all calculations in this chunk before proceeding to the next
    const chunkResults = await Promise.all(chunkPromises);
    results.push(...chunkResults);
    
    // Small delay between chunks to avoid rate limiting
    if (chunks.length > 1) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  return results;
}

/**
 * Split array into chunks of specified size
 */
function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}
