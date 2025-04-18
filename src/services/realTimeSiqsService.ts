
// Re-export the simplified SIQS calculator
export { calculateRealTimeSiqs } from './realTimeSiqs/siqsCalculator';
export { clearSiqsCache } from './realTimeSiqs/siqsCache';
export { 
  updateLocationsWithRealTimeSiqs,
  clearLocationCache 
} from './realTimeSiqs/locationUpdateService';

// Helper function to clear the location cache for external use
export function clearAllSiqsCache(): void {
  clearSiqsCache();
  console.log("Location cache cleared");
}
