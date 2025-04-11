
import { SharedAstroSpot } from "@/lib/types/sharedTypes";
import { getConsistentSiqsValue } from "@/utils/nighttimeSIQS";
import { calculateSIQSWithWeatherData } from "@/hooks/siqs/siqsCalculationUtils";

// Cache for SIQS calculations to improve performance
const siqsCache = new Map<string, {
  siqs: number;
  timestamp: number;
}>();

// Cache lifetime in milliseconds (10 minutes)
const SIQS_CACHE_LIFETIME = 10 * 60 * 1000;

/**
 * Calculate real-time SIQS for a location
 * @param latitude Location latitude
 * @param longitude Location longitude 
 * @param radius Search radius in km
 * @returns Promise resolving to location with SIQS data
 */
export async function calculateRealTimeSiqs(
  latitude: number,
  longitude: number,
  radius: number = 100
): Promise<SharedAstroSpot> {
  try {
    // Basic implementation that returns a location with a simple SIQS value
    return {
      id: `loc-${latitude.toFixed(6)}-${longitude.toFixed(6)}`,
      name: `Location at ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
      latitude,
      longitude,
      siqs: 6.5, // Default value
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error("Error calculating real-time SIQS:", error);
    return {
      id: `loc-${latitude.toFixed(6)}-${longitude.toFixed(6)}`,
      name: `Location at ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
      latitude,
      longitude,
      siqs: 0,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Batch calculate SIQS for multiple locations
 * @param locations Array of locations to calculate SIQS for
 * @returns Promise resolving to locations with SIQS data
 */
export async function batchCalculateSiqs(
  locations: SharedAstroSpot[]
): Promise<SharedAstroSpot[]> {
  if (!locations || !Array.isArray(locations) || locations.length === 0) {
    return [];
  }
  
  // Return the original locations for now - in a real implementation
  // this would calculate SIQS for each location
  return locations.map(location => ({
    ...location,
    siqs: location.siqs || 5.5
  }));
}

/**
 * Clear the SIQS cache
 */
export function clearSiqsCache(): void {
  siqsCache.clear();
  console.log("SIQS cache cleared");
}
