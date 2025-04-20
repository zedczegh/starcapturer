
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { calculateRealTimeSiqs } from './siqsCalculator';

/**
 * Batch process multiple locations for SIQS calculation
 * with smart prioritization and parallelization
 * @param locations Array of locations to process
 * @param maxParallel Maximum number of parallel requests
 * @returns Promise resolving to locations with updated SIQS
 */
export async function batchCalculateSiqs(
  locations: SharedAstroSpot[],
  maxParallel: number = 3
): Promise<SharedAstroSpot[]> {
  if (!locations || locations.length === 0) return [];
  
  console.log(`Batch calculating SIQS for ${locations.length} locations`);
  
  // Clone the locations array to avoid mutating the original
  const updatedLocations = [...locations];
  
  // Enhanced error handling: filter out invalid locations
  const validLocations = updatedLocations.filter(loc => 
    loc && isFinite(loc.latitude) && isFinite(loc.longitude)
  );
  
  // Prioritize locations - process most important first
  const prioritizedLocations = [...validLocations].sort((a, b) => {
    // Prioritize dark sky reserves and certified locations
    if (a.isDarkSkyReserve && !b.isDarkSkyReserve) return -1;
    if (!a.isDarkSkyReserve && b.isDarkSkyReserve) return 1;
    if (a.certification && !b.certification) return -1;
    if (!a.certification && b.certification) return 1;
    
    // Then prioritize by darkest skies
    return (a.bortleScale || 5) - (b.bortleScale || 5);
  });
  
  // Process locations in chunks to avoid too many parallel requests with improved error handling
  for (let i = 0; i < prioritizedLocations.length; i += maxParallel) {
    const chunk = prioritizedLocations.slice(i, i + maxParallel);
    const promises = chunk.map(async (location) => {
      if (!location.latitude || !location.longitude) return location;
      
      try {
        const result = await calculateRealTimeSiqs(
          location.latitude,
          location.longitude,
          location.bortleScale || 5
        );
        
        // Update the location object with real-time SIQS
        return {
          ...location,
          siqs: result.siqs,
          isViable: result.isViable,
          siqsFactors: result.factors // Store factors for potential display
        };
      } catch (error) {
        console.error(`Error calculating SIQS for location ${location.name}:`, error);
        // Return location with fallback calculation based on bortleScale
        // This ensures we still display locations even if API fails
        const fallbackSiqs = Math.max(0, 10 - (location.bortleScale || 5));
        return {
          ...location,
          siqs: fallbackSiqs,
          isViable: fallbackSiqs >= 2.0
        };
      }
    });
    
    try {
      // Wait for the current chunk to complete before processing next chunk
      const results = await Promise.allSettled(promises);
      
      // Update the locations array with the results, handling potential rejections
      results.forEach((result, idx) => {
        if (result.status === 'fulfilled') {
          const locationIndex = updatedLocations.findIndex(loc => 
            loc.id === prioritizedLocations[i + idx].id
          );
          if (locationIndex >= 0) {
            updatedLocations[locationIndex] = result.value;
          }
        }
      });
    } catch (error) {
      console.error("Error in batch processing chunk:", error);
      // Continue with next chunk if one fails
    }
  }
  
  // Filter out any locations with SIQS = 0 and sort by SIQS (highest first)
  return updatedLocations
    .filter(loc => loc.siqs > 0)
    .sort((a, b) => (b.siqs || 0) - (a.siqs || 0));
}
