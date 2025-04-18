
import { calculateRealTimeSiqs as fetchRealTimeSiqs } from './realTimeSiqs/siqsCalculator';

// Re-export all SIQS functionality
export * from './realTimeSiqs/siqsCalculator';
export { clearSiqsCache } from './realTimeSiqs/siqsCache';
export { 
  updateLocationsWithRealTimeSiqs,
  clearLocationCache 
} from './realTimeSiqs/locationUpdateService';

// Helper function to clear the location cache for external use
export function clearLocationCache(): void {
  clearSiqsCache();
  console.log("Location cache cleared");
}

// Re-export the simplified SIQS calculator
export { calculateRealTimeSiqs } from './realTimeSiqs/siqsCalculator';
