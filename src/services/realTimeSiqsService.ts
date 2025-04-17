
/**
 * Service wrapper for SIQS calculation
 */
import { calculateRealTimeSiqs } from './realTimeSiqs/realTimeSiqsService';
import { generateSiqsCacheKey } from './realTimeSiqs/siqsCache';

/**
 * Calculate SIQS for multiple locations in batch
 * @param locations Array of locations
 * @returns Updated locations with SIQS scores
 */
export async function batchCalculateSiqs(
  locations: any[]
): Promise<any[]> {
  if (!locations || !Array.isArray(locations) || locations.length === 0) {
    return [];
  }
  
  // Process each location
  const updatedLocations = await Promise.all(
    locations.map(async (location) => {
      if (!location || !location.latitude || !location.longitude) {
        return location;
      }
      
      try {
        // Use default Bortle scale if not specified
        const bortleScale = location.bortleScale || 4;
        
        // Calculate SIQS for this location
        const result = await calculateRealTimeSiqs(
          location.latitude,
          location.longitude,
          bortleScale,
          location.weatherData
        );
        
        // Return updated location with SIQS result
        return {
          ...location,
          siqsResult: result,
          siqs: result.siqs  // Add siqs field for backward compatibility
        };
      } catch (error) {
        console.error("Error calculating SIQS for location:", error);
        return location;
      }
    })
  );
  
  return updatedLocations;
}

/**
 * Calculate SIQS for a single location
 */
export async function calculateSiqs(
  latitude: number,
  longitude: number,
  bortleScale: number = 4,
  weatherData?: any
): Promise<any> {
  try {
    return calculateRealTimeSiqs(latitude, longitude, bortleScale, weatherData);
  } catch (error) {
    console.error("Error calculating SIQS:", error);
    // Return default result
    return {
      siqs: 5.0,
      score: 5.0,
      isViable: true
    };
  }
}

// Re-export from the main SIQS service
export { calculateRealTimeSiqs, generateSiqsCacheKey };

export * from './realTimeSiqs/siqsCache';
