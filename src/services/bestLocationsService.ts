
import { calculateRealTimeSiqs } from './realTimeSiqs/siqsCalculator';

/**
 * Batch calculate SIQS scores for multiple locations
 */
export async function batchCalculateSiqs(locations: any[]): Promise<any[]> {
  if (!locations || locations.length === 0) return [];
  
  try {
    const results = await Promise.all(
      locations.map(async (location) => {
        if (!location.latitude || !location.longitude) {
          return location;
        }
        
        const bortleScale = location.bortleScale || 
                          (location.isDarkSkyReserve ? 2 : 5);
        
        try {
          const result = await calculateRealTimeSiqs(
            location.latitude,
            location.longitude,
            bortleScale
          );
          
          return {
            ...location,
            siqs: result.siqs,
            siqsResult: result
          };
        } catch (error) {
          console.error(`Error calculating SIQS for ${location.name}:`, error);
          return location;
        }
      })
    );
    
    return results;
  } catch (error) {
    console.error("Error in batch SIQS calculation:", error);
    return locations;
  }
}
