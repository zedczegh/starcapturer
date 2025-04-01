
/**
 * Service for real-time SIQS calculation with optimized performance
 */

import { fetchWeatherData } from "@/lib/api/weather";
import { fetchLightPollutionData } from "@/lib/api/pollution";
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { calculateSIQSWithWeatherData } from "@/hooks/siqs/siqsCalculationUtils";

// Create a cache to avoid redundant API calls
const siqsCache = new Map<string, {
  siqs: number;
  timestamp: number;
  isViable: boolean;
}>();

// Invalidate cache entries older than 15 minutes
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes in milliseconds

// Maximum time to wait for SIQS calculation before using fallback
const CALCULATION_TIMEOUT = 3000; // 3 seconds

/**
 * Calculate real-time SIQS for a given location with timeout and error handling
 * @param latitude Latitude of the location
 * @param longitude Longitude of the location
 * @param bortleScale Bortle scale of the location (light pollution)
 * @returns Promise resolving to SIQS score and viability
 */
export async function calculateRealTimeSiqs(
  latitude: number, 
  longitude: number, 
  bortleScale: number
): Promise<{ siqs: number; isViable: boolean }> {
  // Generate cache key
  const cacheKey = `${latitude.toFixed(4)}-${longitude.toFixed(4)}`;
  
  // Check cache first
  const cachedData = siqsCache.get(cacheKey);
  if (cachedData && (Date.now() - cachedData.timestamp) < CACHE_DURATION) {
    console.log(`Using cached SIQS data for ${latitude.toFixed(4)}, ${longitude.toFixed(4)}, score: ${cachedData.siqs.toFixed(1)}`);
    return {
      siqs: cachedData.siqs,
      isViable: cachedData.isViable
    };
  }
  
  console.log(`Calculating real-time SIQS for ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
  
  // Create a promise that will timeout after a set time
  const timeoutPromise = new Promise<{ siqs: number; isViable: boolean }>((resolve) => {
    setTimeout(() => {
      console.log(`SIQS calculation timeout for ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
      resolve({ siqs: 5, isViable: true }); // Fallback values
    }, CALCULATION_TIMEOUT);
  });
  
  // Actual calculation promise
  const calculationPromise = new Promise<{ siqs: number; isViable: boolean }>(async (resolve) => {
    try {
      // Fetch weather data
      const weatherData = await fetchWeatherData({
        latitude,
        longitude
      });
      
      // For light pollution, use provided Bortle scale or fetch it
      let finalBortleScale = bortleScale;
      if (!finalBortleScale || finalBortleScale <= 0) {
        try {
          const pollutionData = await fetchLightPollutionData(latitude, longitude);
          finalBortleScale = pollutionData?.bortleScale || 5;
        } catch (err) {
          console.error("Error fetching light pollution data:", err);
          finalBortleScale = 5; // Default fallback
        }
      }
      
      // Calculate SIQS using optimized method
      const siqsResult = await calculateSIQSWithWeatherData(
        weatherData || { cloudCover: 30, humidity: 50, precipitation: 0 },
        finalBortleScale,
        3, // Default seeing conditions
        0.5, // Default moon phase
        null // No forecast for quick calculation
      );
      
      console.log(`Calculated SIQS for ${latitude.toFixed(4)}, ${longitude.toFixed(4)}: ${siqsResult.score.toFixed(1)}`);
      
      // Store in cache
      siqsCache.set(cacheKey, {
        siqs: siqsResult.score,
        isViable: siqsResult.isViable,
        timestamp: Date.now()
      });
      
      resolve({
        siqs: siqsResult.score,
        isViable: siqsResult.isViable
      });
    } catch (error) {
      console.error("Error calculating real-time SIQS:", error);
      // Use a reasonable default value on error
      resolve({ siqs: 5, isViable: true });
    }
  });
  
  // Race between timeout and actual calculation
  return Promise.race([calculationPromise, timeoutPromise]);
}

/**
 * Batch process multiple locations for SIQS calculation
 * with smart prioritization and parallelization
 * @param locations Array of locations to process
 * @param maxParallel Maximum number of parallel requests
 * @returns Promise resolving to locations with updated SIQS
 */
export async function batchCalculateSiqs(
  locations: SharedAstroSpot[],
  maxParallel: number = 3
): Promise<SharedAstroSpot[]> {
  if (!locations || locations.length === 0) return [];
  
  console.log(`Batch calculating SIQS for ${locations.length} locations`);
  
  // Clone the locations array to avoid mutating the original
  const updatedLocations = [...locations];
  
  // Process locations in chunks to avoid too many parallel requests
  for (let i = 0; i < updatedLocations.length; i += maxParallel) {
    const chunk = updatedLocations.slice(i, i + maxParallel);
    const promises = chunk.map(async (location) => {
      if (!location.latitude || !location.longitude) return location;
      
      const result = await calculateRealTimeSiqs(
        location.latitude,
        location.longitude,
        location.bortleScale || 5
      );
      
      // Update the location object with real-time SIQS
      return {
        ...location,
        siqs: result.siqs,
        isViable: result.isViable
      };
    });
    
    // Wait for the current chunk to complete before processing next chunk
    const results = await Promise.all(promises);
    
    // Update the locations array with the results
    results.forEach((result, idx) => {
      updatedLocations[i + idx] = result;
    });
  }
  
  return updatedLocations;
}

/**
 * Clear the SIQS cache for testing or debugging
 */
export function clearSiqsCache(): void {
  const size = siqsCache.size;
  siqsCache.clear();
  console.log(`SIQS cache cleared (${size} entries removed)`);
}

/**
 * Get the current SIQS cache size
 * @returns Number of cached entries
 */
export function getSiqsCacheSize(): number {
  return siqsCache.size;
}
