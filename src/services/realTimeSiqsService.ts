
// Re-export the simplified SIQS calculator
export { calculateRealTimeSiqs } from './siqsCalculator';
export { clearSiqsCache } from './siqsCache';
export { 
  updateLocationsWithRealTimeSiqs,
  clearLocationCache 
} from './locationUpdateService';

// Helper function to clear the location cache for external use
export function clearSiqsCache(): void {
  clearSiqsCache();
  console.log("Location cache cleared");
}
