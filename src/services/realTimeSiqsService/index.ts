
/**
 * Central entry point for real-time SIQS calculation services
 */
import { batchCalculateSiqs } from '../realTimeSiqs/realTimeSiqsService';
import { calculateRealTimeSiqs } from '../realTimeSiqs/siqsCalculator';

export {
  batchCalculateSiqs,
  calculateRealTimeSiqs
};

/**
 * Update locations with real-time SIQS data
 */
export async function updateLocationsWithRealTimeSiqs(locations: any[]): Promise<any[]> {
  if (!locations || locations.length === 0) return [];
  
  try {
    const results = await batchCalculateSiqs(locations);
    return results;
  } catch (error) {
    console.error("Error updating locations with real-time SIQS:", error);
    return locations;
  }
}
