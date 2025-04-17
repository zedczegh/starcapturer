
import { calculateRealTimeSiqs } from '../realTimeSiqs/siqsCalculator';

/**
 * Update a collection of locations with real-time SIQS data
 * This service handles batch processing locations to add real-time
 * SIQS scores efficiently
 */
export async function updateLocationsWithRealTimeSiqs(locations: any[]): Promise<any[]> {
  console.log(`Updating ${locations.length} locations with real-time SIQS`);
  
  if (!locations || locations.length === 0) return [];
  
  try {
    // Process in smaller batches to avoid overwhelming the system
    const batchSize = 3;
    const result = [...locations];
    
    for (let i = 0; i < result.length; i += batchSize) {
      const batch = result.slice(i, i + batchSize);
      
      // Process batch in parallel
      const updates = await Promise.all(batch.map(async (location) => {
        try {
          if (!location.latitude || !location.longitude) {
            return location;
          }
          
          // For certified locations, use a slightly better Bortle scale if not specified
          const bortle = location.bortleScale || 
                        (location.isDarkSkyReserve || location.certification ? 3 : 5);
          
          // Calculate real-time SIQS
          const siqsResult = await calculateRealTimeSiqs(
            location.latitude,
            location.longitude,
            bortle
          );
          
          // Update location with real-time SIQS data
          return {
            ...location,
            siqs: siqsResult.siqs,
            siqsResult: {
              score: siqsResult.siqs,
              isViable: siqsResult.isViable,
              factors: siqsResult.factors || []
            }
          };
        } catch (error) {
          console.error(`Error updating location ${location.name || 'unknown'}:`, error);
          return location;
        }
      }));
      
      // Update the result array with processed locations
      updates.forEach((updated, idx) => {
        result[i + idx] = updated;
      });
      
      // Small delay between batches to prevent API rate limits
      if (i + batchSize < result.length) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }
    
    return result;
  } catch (error) {
    console.error("Error updating locations with SIQS:", error);
    return locations;
  }
}

/**
 * Add placeholder SIQS scores for locations
 * This is useful for testing or when real-time data is not available
 */
export function addPlaceholderSiqsScores(locations: any[]): any[] {
  return locations.map(location => {
    // For certified locations, use higher scores
    const isCertified = location.isDarkSkyReserve || location.certification;
    const baseScore = isCertified ? 8.0 : 6.5;
    const variation = Math.random() * 1.0 - 0.5; // -0.5 to +0.5
    
    const siqs = Math.max(3.0, Math.min(9.5, baseScore + variation));
    
    return {
      ...location,
      siqs: siqs,
      siqsResult: {
        score: siqs,
        isViable: siqs >= 5.0,
        factors: []
      }
    };
  });
}
