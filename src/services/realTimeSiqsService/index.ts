
/**
 * Real-time SIQS calculation service
 * Optimized for performance with caching and batched processing
 */

import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { estimateBortleScaleByLocation } from "@/utils/locationUtils";
import { calculateSIQS } from "@/lib/calculateSIQS";

// Cache for SIQS calculations
interface SiqsCache {
  [key: string]: {
    siqs: number;
    timestamp: number;
  };
}

// Calculation options
interface CalculationOptions {
  forceRefresh?: boolean;
  cacheTimeoutMinutes?: number;
}

// Configuration
const DEFAULT_CACHE_TIMEOUT = 15; // minutes
const SIQS_CACHE: SiqsCache = {};

/**
 * Get SIQS calculation cache key
 */
function getSiqsCacheKey(location: SharedAstroSpot): string {
  return `${location.latitude.toFixed(4)},${location.longitude.toFixed(4)}_${location.id || 'unknown'}`;
}

/**
 * Calculate SIQS for a single location with caching
 */
export async function calculateLocationSiqs(
  location: SharedAstroSpot,
  options: CalculationOptions = {}
): Promise<number> {
  // Skip empty or invalid locations
  if (!location || !location.latitude || !location.longitude) {
    return 0;
  }
  
  const {
    forceRefresh = false,
    cacheTimeoutMinutes = DEFAULT_CACHE_TIMEOUT
  } = options;
  
  const cacheKey = getSiqsCacheKey(location);
  const cacheEntry = SIQS_CACHE[cacheKey];
  const now = Date.now();
  
  // Use cached value if available and not expired or forced refresh
  if (
    !forceRefresh &&
    cacheEntry &&
    now - cacheEntry.timestamp < cacheTimeoutMinutes * 60 * 1000
  ) {
    return cacheEntry.siqs;
  }
  
  // Get Bortle scale if not provided
  const bortleScale = location.bortleScale || estimateBortleScaleByLocation(
    location.name,
    location.latitude,
    location.longitude
  );
  
  // Calculate SIQS
  let siqs: number;
  try {
    siqs = calculateSIQS({
      bortleScale,
      seeingIndex: location.seeingIndex || 2,
      cloudCover: location.cloudCover || 0,
      humidity: location.humidity || 0.5,
      moonPhase: location.moonPhase || 0,
      moonElevation: location.moonElevation || 0,
      temperature: location.temperature || 15,
      isViable: location.isViable !== undefined ? location.isViable : true
    });
    
    // Cache the result
    SIQS_CACHE[cacheKey] = {
      siqs,
      timestamp: now
    };
    
    return siqs;
  } catch (error) {
    console.error("Error calculating SIQS:", error);
    return 0;
  }
}

/**
 * Calculate SIQS for multiple locations efficiently in batches
 */
export async function batchCalculateSiqs(
  locations: SharedAstroSpot[],
  options: CalculationOptions = {}
): Promise<SharedAstroSpot[]> {
  if (!locations || locations.length === 0) {
    return [];
  }
  
  // Process in parallel for improved performance
  const locationsWithSiqs: SharedAstroSpot[] = await Promise.all(
    locations.map(async (location) => {
      try {
        const siqs = await calculateLocationSiqs(location, options);
        
        // Only return locations with valid SIQS scores
        if (siqs > 0) {
          return {
            ...location,
            siqs
          };
        } else {
          return null;
        }
      } catch (error) {
        console.error(`Error processing location ${location.id}:`, error);
        return null;
      }
    })
  );
  
  // Filter out null entries and sort by SIQS
  return locationsWithSiqs
    .filter(Boolean) as SharedAstroSpot[];
}

/**
 * Prefetch SIQS data for locations to improve UX
 * This doesn't block the UI and runs in the background
 */
export async function prefetchSiqsData(
  locations: SharedAstroSpot[],
  options: CalculationOptions = {}
): Promise<void> {
  if (!locations || locations.length === 0) {
    return;
  }
  
  // Use a small delay to avoid blocking the main thread
  setTimeout(() => {
    batchCalculateSiqs(locations, options).catch(error => {
      console.error("Error prefetching SIQS data:", error);
    });
  }, 100);
}

/**
 * Clear SIQS cache to force fresh calculations
 */
export function clearSiqsCache(): void {
  Object.keys(SIQS_CACHE).forEach(key => {
    delete SIQS_CACHE[key];
  });
  console.log("SIQS cache cleared");
}
