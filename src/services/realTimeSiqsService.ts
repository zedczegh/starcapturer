import { fetchForecastData } from "@/lib/api";
import { calculateSIQSWithWeatherData } from "@/hooks/siqs/siqsCalculationUtils";
import { fetchWeatherData } from "@/lib/api/weather";
import { fetchLightPollutionData } from "@/lib/api/pollution";
import { SharedAstroSpot } from "@/lib/api/astroSpots";

// Create a cache to avoid redundant API calls
const siqsCache = new Map<string, {
  siqs: number;
  timestamp: number;
  isViable: boolean;
}>();

// Invalidate cache entries older than 30 minutes for more real-time data
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds

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
  
  try {
    // Fetch weather data
    const weatherData = await fetchWeatherData({
      latitude,
      longitude
    });
    
    // Fetch forecast data for nighttime calculation
    const forecastData = await fetchForecastData({
      latitude,
      longitude,
      days: 2
    });
    
    // Default values if API calls fail
    if (!weatherData) {
      console.error("Weather data fetch failed for SIQS calculation");
      return { siqs: 0, isViable: false };
    }
    
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
      weatherData,
      finalBortleScale,
      3, // Default seeing conditions
      0.5, // Default moon phase
      forecastData
    );
    
    console.log(`Calculated SIQS for ${latitude.toFixed(4)}, ${longitude.toFixed(4)}: ${siqsResult.score.toFixed(1)}`);
    
    // Store in cache
    siqsCache.set(cacheKey, {
      siqs: siqsResult.score,
      isViable: siqsResult.isViable,
      timestamp: Date.now()
    });
    
    return {
      siqs: siqsResult.score,
      isViable: siqsResult.isViable
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
  maxParallel: number = 5
): Promise<SharedAstroSpot[]> {
  if (!locations || locations.length === 0) return [];
  
  console.log(`Batch calculating SIQS for ${locations.length} locations`);
  
  // Clone the locations array to avoid mutating the original
  const updatedLocations = [...locations];
  
  // Sort locations by distance to process closest first
  updatedLocations.sort((a, b) => {
    const distA = typeof a.distance === 'number' ? a.distance : Infinity;
    const distB = typeof b.distance === 'number' ? b.distance : Infinity;
    return distA - distB;
  });
  
  // Process locations in chunks to avoid too many parallel requests
  for (let i = 0; i < updatedLocations.length; i += maxParallel) {
    const chunk = updatedLocations.slice(i, i + maxParallel);
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
          isViable: result.isViable
        };
      } catch (error) {
        console.error(`Error calculating SIQS for location ${location.name}:`, error);
        // Keep existing SIQS if available, otherwise default to 0
        return {
          ...location,
          siqs: location.siqs || 0,
          isViable: location.isViable !== undefined ? location.isViable : false
        };
      }
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

/**
 * Force refresh of SIQS data for a specific location
 * @param latitude Latitude of the location 
 * @param longitude Longitude of the location
 * @param bortleScale Bortle scale value
 * @returns Promise resolving to fresh SIQS data
 */
export async function refreshSiqsData(
  latitude: number,
  longitude: number,
  bortleScale: number
): Promise<{ siqs: number; isViable: boolean }> {
  // Generate cache key
  const cacheKey = `${latitude.toFixed(4)}-${longitude.toFixed(4)}`;
  
  // Remove from cache to force recalculation
  siqsCache.delete(cacheKey);
  
  // Recalculate and return fresh data
  return calculateRealTimeSiqs(latitude, longitude, bortleScale);
}
