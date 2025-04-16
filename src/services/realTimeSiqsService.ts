
import { calculateRealTimeSiqs } from './realTimeSiqs/siqsCalculator';
import { batchCalculateSiqs } from './realTimeSiqs/batchProcessor';
import { 
  clearSiqsCache, 
  getSiqsCacheSize,
  cleanupExpiredCache 
} from './realTimeSiqs/siqsCache';
import { clearLocationCache as clearLocationCacheInternal } from './realTimeSiqsService/locationUpdateService';

// Export all the main functions to maintain API compatibility
export { 
  calculateRealTimeSiqs,
  batchCalculateSiqs,
  clearSiqsCache,
  getSiqsCacheSize,
  cleanupExpiredCache
};

// Helper function to clear the location cache for external use
export function clearLocationCache(): void {
  clearLocationCacheInternal();
  clearSiqsCache();
  console.log("Location cache cleared");
}
