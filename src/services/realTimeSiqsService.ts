
/**
 * Central entry point for real-time SIQS calculation services
 */
import { batchCalculateSiqs, addPlaceholderSiqsScores } from './realTimeSiqs/realTimeSiqsService';
import { calculateRealTimeSiqs } from './realTimeSiqs/siqsCalculator';
import { updateLocationsWithRealTimeSiqs } from './realTimeSiqsService/locationUpdateService';

/**
 * Clear cached location data
 */
export function clearLocationCache(): void {
  console.log("Clearing location cache");
  try {
    // Clear any cached data in localStorage
    localStorage.removeItem('locationCache');
    localStorage.removeItem('siqsCache');
    localStorage.removeItem('weatherCache');
  } catch (error) {
    console.error("Error clearing location cache:", error);
  }
}

export {
  batchCalculateSiqs,
  calculateRealTimeSiqs,
  addPlaceholderSiqsScores,
  updateLocationsWithRealTimeSiqs
};
