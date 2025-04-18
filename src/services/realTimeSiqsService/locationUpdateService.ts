
import { calculateRealTimeSiqs } from '../realTimeSiqs/siqsCalculator';
import { clearSiqsCache } from '../realTimeSiqs/siqsCache';

/**
 * Update a batch of locations with real-time SIQS data
 * @param locations Array of location objects with latitude and longitude
 * @returns Updated locations with SIQS data
 */
export async function updateLocationsWithRealTimeSiqs(locations: any[], concurrency: number = 3) {
  if (!locations || !locations.length) return [];
  
  const results = [...locations];
  const batchSize = Math.min(concurrency, 5); // Never process more than 5 at once
  
  console.log(`Updating ${locations.length} locations with real-time SIQS data`);
  
  // Process in batches
  for (let i = 0; i < locations.length; i += batchSize) {
    const batch = locations.slice(i, i + batchSize);
    
    const promises = batch.map(async (location, index) => {
      // Skip if no coordinates
      if (!location.latitude || !location.longitude) return location;
      
      try {
        // Use appropriate Bortle scale if available or default
        const bortleScale = location.bortleScale || 5;
        
        const siqsResult = await calculateRealTimeSiqs(
          location.latitude,
          location.longitude,
          bortleScale
        );
        
        // Update the original location in results array
        if (siqsResult && siqsResult.siqs > 0) {
          results[i + index] = {
            ...location,
            siqsResult: siqsResult
          };
        }
      } catch (error) {
        console.error(`Error updating SIQS for location ${location.name || 'unknown'}:`, error);
      }
    });
    
    await Promise.all(promises);
    
    // Add a small delay between batches to avoid rate limiting
    if (i + batchSize < locations.length) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  return results;
}

/**
 * Clear the SIQS cache for all locations
 * @returns The number of cache entries cleared
 */
export const clearLocationCache = (): number => {
  try {
    // Clear in-memory cache
    const cleared = clearSiqsCache();
    
    // Also clear session storage entries related to SIQS
    let sessionStorageCleared = 0;
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && key.startsWith('siqs_')) {
        sessionStorage.removeItem(key);
        sessionStorageCleared++;
      }
    }
    
    console.log(`Cleared ${cleared} memory cache entries and ${sessionStorageCleared} session storage entries`);
    return cleared + sessionStorageCleared;
  } catch (error) {
    console.error("Error clearing SIQS cache:", error);
    return 0;
  }
};
