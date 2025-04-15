
import { calculateRealTimeSiqs } from './realTimeSiqs/siqsCalculator';
import { batchCalculateSiqs } from './realTimeSiqs/batchProcessor';
import { 
  clearSiqsCache, 
  clearLocationSiqsCache, 
  getSiqsCacheSize,
  cleanupExpiredCache 
} from './realTimeSiqs/siqsCache';

// Export all the main functions to maintain API compatibility
export { 
  calculateRealTimeSiqs,
  batchCalculateSiqs,
  clearSiqsCache,
  clearLocationSiqsCache,
  getSiqsCacheSize,
  cleanupExpiredCache
};

// Helper function to clear all caches for external use
export function clearLocationCache(): void {
  clearSiqsCache();
  cleanupExpiredCache();
  console.log("All location caches cleared");
}
