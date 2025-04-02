
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { calculateRealTimeSiqs } from "@/services/realTimeSiqsService";

/**
 * Processes locations in batches with improved error handling and performance
 * @param locations Array of locations to process
 * @param batchSize Number of locations to process in parallel
 * @param delayBetweenBatches Delay in ms between batches to prevent rate limiting
 * @returns Promise resolving to array of locations with SIQS data
 */
export async function processBatchedSiqs(
  locations: SharedAstroSpot[],
  batchSize: number = 3,
  delayBetweenBatches: number = 200
): Promise<SharedAstroSpot[]> {
  if (!locations || locations.length === 0) return [];
  
  console.log(`Processing ${locations.length} locations for real-time SIQS in batches of ${batchSize}`);
  
  const result: SharedAstroSpot[] = [];
  let processedCount = 0;
  let successCount = 0;
  
  // Create batches of locations
  const batches: SharedAstroSpot[][] = [];
  for (let i = 0; i < locations.length; i += batchSize) {
    batches.push(locations.slice(i, i + batchSize));
  }
  
  // Process each batch with delay between batches
  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    
    // Process this batch in parallel
    const batchPromises = batch.map(async (location) => {
      try {
        if (!location.latitude || !location.longitude) {
          return location;
        }
        
        const siqsResult = await calculateRealTimeSiqs(
          location.latitude,
          location.longitude,
          location.bortleScale || 5
        );
        
        successCount++;
        
        // Return location with updated SIQS
        return {
          ...location,
          siqs: siqsResult.siqs,
          isViable: siqsResult.isViable,
          siqsFactors: siqsResult.factors
        };
      } catch (err) {
        console.error(`Error processing location ${location.name}:`, err);
        return location; // Return original location on error
      } finally {
        processedCount++;
      }
    });
    
    // Wait for all promises in this batch to complete
    const batchResults = await Promise.all(batchPromises);
    result.push(...batchResults);
    
    // Add delay before processing next batch, unless it's the last batch
    if (i < batches.length - 1) {
      await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
    }
  }
  
  console.log(`SIQS batch processing complete: ${successCount}/${processedCount} successful`);
  
  // Sort by SIQS score (highest first)
  return result.sort((a, b) => (b.siqs || 0) - (a.siqs || 0));
}

/**
 * Prioritizes locations based on importance and processes them in batches
 * @param locations Array of locations
 * @returns Promise resolving to prioritized and processed locations
 */
export async function processPrioritizedBatchedSiqs(
  locations: SharedAstroSpot[]
): Promise<SharedAstroSpot[]> {
  if (!locations || locations.length === 0) return [];
  
  // Copy the array to avoid mutating the original
  const locationsCopy = [...locations];
  
  // Prioritize locations by type and quality
  const prioritized = locationsCopy.sort((a, b) => {
    // First by certification
    if (a.isDarkSkyReserve && !b.isDarkSkyReserve) return -1;
    if (!a.isDarkSkyReserve && b.isDarkSkyReserve) return 1;
    if (a.certification && !b.certification) return -1;
    if (!a.certification && b.certification) return 1;
    
    // Then by bortle scale (lower is better)
    return (a.bortleScale || 5) - (b.bortleScale || 5);
  });
  
  // Process highest priority locations first, with more parallelism
  const highPriority = prioritized.slice(0, 10);
  const lowPriority = prioritized.slice(10);
  
  const highPriorityResults = await processBatchedSiqs(highPriority, 5, 100);
  const lowPriorityResults = await processBatchedSiqs(lowPriority, 3, 300);
  
  return [...highPriorityResults, ...lowPriorityResults];
}
