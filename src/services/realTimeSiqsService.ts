
import { fetchForecastData } from "@/lib/api";
import { calculateSIQSWithWeatherData } from "@/hooks/siqs/siqsCalculationUtils";
import { fetchWeatherData } from "@/lib/api/weather";
import { fetchLightPollutionData } from "@/lib/api/pollution";
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { extractNightForecasts, calculateAverageCloudCover } from "@/components/forecast/NightForecastUtils";

// Create a cache to avoid redundant API calls with improved invalidation strategy
const siqsCache = new Map<string, {
  siqs: number;
  timestamp: number;
  isViable: boolean;
  factors?: any[];
}>();

// Invalidate cache entries older than 30 minutes for nighttime, 15 minutes for daytime
const NIGHT_CACHE_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds
const DAY_CACHE_DURATION = 15 * 60 * 1000; // 15 minutes in milliseconds

/**
 * Calculate real-time SIQS for a given location
 * @param latitude Latitude of the location
 * @param longitude Longitude of the location
 * @param bortleScale Bortle scale of the location (light pollution)
 * @returns Promise resolving to SIQS score and viability
 */
export async function calculateRealTimeSiqs(
  latitude: number, 
  longitude: number, 
  bortleScale: number
): Promise<{ siqs: number; isViable: boolean; factors?: any[] }> {
  // Validate inputs
  if (!isFinite(latitude) || !isFinite(longitude)) {
    console.error("Invalid coordinates provided to calculateRealTimeSiqs");
    return { siqs: 0, isViable: false };
  }
  
  // Generate cache key
  const cacheKey = `${latitude.toFixed(4)}-${longitude.toFixed(4)}`;
  
  // Determine if it's nighttime for cache duration
  const isNighttime = () => {
    const hour = new Date().getHours();
    return hour >= 18 || hour < 8; // 6 PM to 8 AM
  };
  
  const cacheDuration = isNighttime() ? NIGHT_CACHE_DURATION : DAY_CACHE_DURATION;
  
  // Check cache first with improved cache key strategy
  const cachedData = siqsCache.get(cacheKey);
  if (cachedData && (Date.now() - cachedData.timestamp) < cacheDuration) {
    console.log(`Using cached SIQS data for ${latitude.toFixed(4)}, ${longitude.toFixed(4)}, score: ${cachedData.siqs.toFixed(1)}`);
    return {
      siqs: cachedData.siqs,
      isViable: cachedData.isViable,
      factors: cachedData.factors
    };
  }
  
  console.log(`Calculating real-time SIQS for ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
  
  try {
    // Parallel data fetching for improved performance
    const [weatherData, forecastData] = await Promise.all([
      fetchWeatherData({ latitude, longitude }),
      fetchForecastData({ latitude, longitude, days: 2 })
    ]);
    
    // Default values if API calls fail
    if (!weatherData) {
      return { siqs: 0, isViable: false };
    }
    
    // For light pollution, use provided Bortle scale or fetch it
    let finalBortleScale = bortleScale;
    if (!finalBortleScale || finalBortleScale <= 0 || finalBortleScale > 9) {
      try {
        const pollutionData = await fetchLightPollutionData(latitude, longitude);
        finalBortleScale = pollutionData?.bortleScale || 5;
      } catch (err) {
        console.error("Error fetching light pollution data:", err);
        finalBortleScale = 5; // Default fallback
      }
    }
    
    // Calculate SIQS using the optimized method with nighttime forecasts
    const siqsResult = await calculateSIQSWithWeatherData(
      weatherData,
      finalBortleScale,
      3, // Default seeing conditions
      0.5, // Default moon phase
      forecastData
    );
    
    console.log(`Calculated SIQS for ${latitude.toFixed(4)}, ${longitude.toFixed(4)}: ${siqsResult.score.toFixed(1)}`);
    
    // Ensure SIQS is positive
    const finalSiqs = Math.max(0, siqsResult.score);
    const isViable = finalSiqs >= 2.0; // Consistent threshold with other parts of the app
    
    // Store in cache
    siqsCache.set(cacheKey, {
      siqs: finalSiqs,
      isViable: isViable,
      timestamp: Date.now(),
      factors: siqsResult.factors
    });
    
    return {
      siqs: finalSiqs,
      isViable: isViable,
      factors: siqsResult.factors
    };
  } catch (error) {
    console.error("Error calculating real-time SIQS:", error);
    return { siqs: 0, isViable: false };
  }
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
  
  // Enhanced error handling: filter out invalid locations
  const validLocations = updatedLocations.filter(loc => 
    loc && isFinite(loc.latitude) && isFinite(loc.longitude)
  );
  
  // Prioritize locations - process most important first
  const prioritizedLocations = [...validLocations].sort((a, b) => {
    // Prioritize dark sky reserves and certified locations
    if (a.isDarkSkyReserve && !b.isDarkSkyReserve) return -1;
    if (!a.isDarkSkyReserve && b.isDarkSkyReserve) return 1;
    if (a.certification && !b.certification) return -1;
    if (!a.certification && b.certification) return 1;
    
    // Then prioritize by darkest skies
    return (a.bortleScale || 5) - (b.bortleScale || 5);
  });
  
  // Process locations in chunks to avoid too many parallel requests with improved error handling
  for (let i = 0; i < prioritizedLocations.length; i += maxParallel) {
    const chunk = prioritizedLocations.slice(i, i + maxParallel);
    const promises = chunk.map(async (location) => {
      if (!location.latitude || !location.longitude) return location;
      
      try {
        const result = await calculateRealTimeSiqs(
          location.latitude,
          location.longitude,
          location.bortleScale || 5
        );
        
        // Update the location object with real-time SIQS
        return {
          ...location,
          siqs: result.siqs,
          isViable: result.isViable,
          siqsFactors: result.factors // Store factors for potential display
        };
      } catch (error) {
        console.error(`Error calculating SIQS for location ${location.name}:`, error);
        // Return location with fallback calculation based on bortleScale
        // This ensures we still display locations even if API fails
        const fallbackSiqs = Math.max(0, 10 - (location.bortleScale || 5));
        return {
          ...location,
          siqs: fallbackSiqs,
          isViable: fallbackSiqs >= 2.0
        };
      }
    });
    
    try {
      // Wait for the current chunk to complete before processing next chunk
      const results = await Promise.allSettled(promises);
      
      // Update the locations array with the results, handling potential rejections
      results.forEach((result, idx) => {
        if (result.status === 'fulfilled') {
          const locationIndex = updatedLocations.findIndex(loc => 
            loc.id === prioritizedLocations[i + idx].id
          );
          if (locationIndex >= 0) {
            updatedLocations[locationIndex] = result.value;
          }
        }
      });
    } catch (error) {
      console.error("Error in batch processing chunk:", error);
      // Continue with next chunk if one fails
    }
  }
  
  // Filter out any locations with SIQS = 0 and sort by SIQS (highest first)
  return updatedLocations
    .filter(loc => loc.siqs > 0)
    .sort((a, b) => (b.siqs || 0) - (a.siqs || 0));
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

/**
 * Clear specific location from the SIQS cache
 */
export function clearLocationSiqsCache(latitude: number, longitude: number): void {
  const cacheKey = `${latitude.toFixed(4)}-${longitude.toFixed(4)}`;
  if (siqsCache.has(cacheKey)) {
    siqsCache.delete(cacheKey);
    console.log(`Cleared SIQS cache for location ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
  }
}

/**
 * Clear all expired cache entries to free memory
 */
export function cleanupExpiredCache(): void {
  const now = Date.now();
  let expiredCount = 0;
  
  for (const [key, data] of siqsCache.entries()) {
    const isNighttime = () => {
      const hour = new Date().getHours();
      return hour >= 18 || hour < 8; // 6 PM to 8 AM
    };
    
    const cacheDuration = isNighttime() ? NIGHT_CACHE_DURATION : DAY_CACHE_DURATION;
    
    if (now - data.timestamp > cacheDuration) {
      siqsCache.delete(key);
      expiredCount++;
    }
  }
  
  if (expiredCount > 0) {
    console.log(`Cleaned up ${expiredCount} expired SIQS cache entries`);
  }
}
