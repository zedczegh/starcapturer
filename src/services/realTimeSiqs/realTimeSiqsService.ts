
import { calculateRealTimeSiqs } from './siqsCalculator';
import { processBatchSiqs, batchCalculateSiqs } from './batchProcessor';
import { 
  clearSiqsCache, 
  clearLocationSiqsCache, 
  getSiqsCacheSize,
  cleanupExpiredCache 
} from './siqsCache';

// Export all the main functions to maintain API compatibility
export { 
  calculateRealTimeSiqs,
  processBatchSiqs,
  batchCalculateSiqs,
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
