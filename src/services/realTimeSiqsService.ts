
import { SharedAstroSpot } from "@/lib/api/astroSpots";

// Cache TTL in milliseconds (3 minutes)
const CACHE_TTL = 3 * 60 * 1000;

// Cache for SIQS calculations
const siqsCache = new Map<string, {
  timestamp: number;
  siqs: number;
  isViable: boolean;
}>();

/**
 * Generate a cache key for SIQS calculation
 */
const generateSiqsCacheKey = (latitude: number, longitude: number): string => {
  return `${latitude.toFixed(4)}-${longitude.toFixed(4)}`;
};

/**
 * Calculate real-time SIQS for a location
 * @param location Location to calculate SIQS for
 * @returns Location with SIQS data
 */
export const calculateRealTimeSiqs = async (
  location: SharedAstroSpot
): Promise<SharedAstroSpot> => {
  // Generate cache key
  const cacheKey = generateSiqsCacheKey(location.latitude, location.longitude);
  
  // Check cache
  const cached = siqsCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
    console.info(`Using cached SIQS data for ${location.latitude.toFixed(4)} ${location.longitude.toFixed(4)} score: ${cached.siqs.toFixed(1)}`);
    return {
      ...location,
      siqs: cached.siqs,
      isViable: cached.isViable
    };
  }
  
  // Simulate API call to calculate SIQS
  // In a real implementation, this would make actual API calls for weather and sky quality
  await new Promise(resolve => setTimeout(resolve, 100)); // Quick response for better UX
  
  // Generate a realistic SIQS score based on Bortle scale
  const baseSiqs = 10 - location.bortleScale;
  // Add some variability to the score
  const siqs = Math.max(1, Math.min(9.5, baseSiqs + (Math.random() * 2 - 1)));
  const isViable = siqs >= 5;
  
  // Cache the result
  siqsCache.set(cacheKey, {
    timestamp: Date.now(),
    siqs,
    isViable
  });
  
  return {
    ...location,
    siqs,
    isViable
  };
};

/**
 * Batch calculate SIQS for multiple locations
 * @param locations Array of locations
 * @returns Promise with locations with SIQS data
 */
export const batchCalculateSiqs = async (
  locations: SharedAstroSpot[]
): Promise<SharedAstroSpot[]> => {
  // Use Promise.all for parallel processing
  return Promise.all(
    locations.map(location => calculateRealTimeSiqs(location))
  );
};

/**
 * Clear the SIQS cache
 */
export const clearSiqsCache = (): void => {
  siqsCache.clear();
};

/**
 * Get the current size of the SIQS cache
 */
export const getSiqsCacheSize = (): number => {
  return siqsCache.size;
};
