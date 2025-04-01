
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
  factors?: any[];
}>();

// Invalidate cache entries older than 15 minutes
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes in milliseconds

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
  // Generate cache key
  const cacheKey = `${latitude.toFixed(4)}-${longitude.toFixed(4)}`;
  
  // Check cache first
  const cachedData = siqsCache.get(cacheKey);
  if (cachedData && (Date.now() - cachedData.timestamp) < CACHE_DURATION) {
    console.log(`Using cached SIQS data for ${latitude.toFixed(4)}, ${longitude.toFixed(4)}, score: ${cachedData.siqs.toFixed(1)}`);
    return {
      siqs: cachedData.siqs,
      isViable: cachedData.isViable,
      factors: cachedData.factors
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
      return { siqs: 0, isViable: false };
    }
    
    // For light pollution, use provided Bortle scale or fetch it
    let finalBortleScale = bortleScale;
    
    // Always try to fetch fresh light pollution data if Bortle scale is missing or invalid
    if (!finalBortleScale || finalBortleScale <= 0 || finalBortleScale > 9) {
      try {
        const pollutionData = await fetchLightPollutionData(latitude, longitude);
        
        if (pollutionData?.bortleScale && pollutionData.bortleScale > 0 && pollutionData.bortleScale <= 9) {
          finalBortleScale = pollutionData.bortleScale;
          console.log(`Updated Bortle scale from API: ${finalBortleScale}`);
        } else {
          // Use default if API returns invalid value
          finalBortleScale = 5; // Default fallback
          console.log(`Using default Bortle scale: ${finalBortleScale}`);
        }
      } catch (err) {
        console.error("Error fetching light pollution data:", err);
        finalBortleScale = 5; // Default fallback
      }
    } else {
      console.log(`Using provided Bortle scale: ${finalBortleScale}`);
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
    
    // Wait for the current chunk to complete before processing next chunk
    const results = await Promise.all(promises);
    
    // Update the locations array with the results
    results.forEach((result, idx) => {
      updatedLocations[i + idx] = result;
    });
  }
  
  // Filter out any locations with SIQS = 0 and water locations
  return updatedLocations.filter(loc => loc.siqs > 0);
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
