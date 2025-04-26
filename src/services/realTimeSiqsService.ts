
import { calculateSIQS, SiqsResult, SiqsCalculationOptions } from './realTimeSiqs/siqsCalculator';
import { batchCalculateSiqs } from './realTimeSiqs/batchProcessor';
import { 
  clearSiqsCache, 
  clearLocationSiqsCache, 
  getSiqsCacheSize,
  cleanupExpiredCache 
} from './realTimeSiqs/siqsCache';

// This function should be available in all places that import calculateRealTimeSiqs
export async function calculateRealTimeSiqs(
  latitude: number,
  longitude: number,
  bortleScale: number,
  options?: SiqsCalculationOptions
): Promise<SiqsResult> {
  // Implementation (placeholder for now)
  return {
    siqs: 7.5,  // Return a reasonable default value
    isViable: true,
    factors: [
      {
        name: "Cloud Cover",
        score: 8.0,
        description: "Clear skies provide excellent visibility"
      },
      {
        name: "Light Pollution",
        score: 7.0,
        description: "Low light pollution in this area"
      }
    ],
    metadata: {
      calculatedAt: new Date().toISOString(),
      sources: {
        weather: true,
        forecast: false,
        clearSky: true,
        lightPollution: true
      }
    }
  };
}

// Export all the main functions to maintain API compatibility
export { 
  calculateSIQS,
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
