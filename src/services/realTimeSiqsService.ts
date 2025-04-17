
import { calculateRealTimeSiqs } from './realTimeSiqs/siqsCalculator';
import { updateLocationsWithRealTimeSiqs, addPlaceholderSiqsScores } from './realTimeSiqsService/locationUpdateService';
import { 
  clearSiqsCache, 
  clearLocationSiqsCache, 
  getSiqsCacheSize,
  cleanupExpiredCache 
} from './realTimeSiqs/siqsCache';

// Export all the main functions
export { 
  calculateRealTimeSiqs,
  updateLocationsWithRealTimeSiqs,
  addPlaceholderSiqsScores,
  clearSiqsCache,
  clearLocationSiqsCache,
  getSiqsCacheSize,
  cleanupExpiredCache
};

// Helper function to clear the location cache for external use
export function clearLocationCache(): void {
  clearSiqsCache();
  console.log("Location cache cleared");
}
