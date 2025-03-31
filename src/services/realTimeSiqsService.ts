
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
// Maximum number of concurrent SIQS calculations
const MAX_CONCURRENT_CALCULATIONS = 3;
// Current active calculations (to prevent duplicate requests)
const activeCalculations = new Set<string>();

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
    return {
      siqs: cachedData.siqs,
      isViable: cachedData.isViable
    };
  }
  
  // Check if this calculation is already in progress
  if (activeCalculations.has(cacheKey)) {
    // Wait for a short time and check cache again
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Check cache again after waiting
    const cachedDataAfterWait = siqsCache.get(cacheKey);
    if (cachedDataAfterWait) {
      return {
        siqs: cachedDataAfterWait.siqs,
        isViable: cachedDataAfterWait.isViable
      };
    }
    
    // If still no data, return a default value
    return { siqs: 0, isViable: false };
  }
  
  // Mark this calculation as active
  activeCalculations.add(cacheKey);
  
  try {
    // Try to get weather data from sessionStorage first
    const weatherCacheKey = `weather-${latitude.toFixed(4)}-${longitude.toFixed(4)}`;
    let weatherData = null;
    
    try {
      const cachedWeather = sessionStorage.getItem(weatherCacheKey);
      if (cachedWeather) {
        const { data, timestamp } = JSON.parse(cachedWeather);
        if (Date.now() - timestamp < 30 * 60 * 1000) {
          weatherData = data;
        }
      }
    } catch (e) {
      console.error("Error retrieving cached weather data:", e);
    }
    
    // Fetch weather data if not in cache
    if (!weatherData) {
      weatherData = await fetchWeatherData({
        latitude,
        longitude
      });
      
      // Cache the weather data
      try {
        sessionStorage.setItem(weatherCacheKey, JSON.stringify({
          data: weatherData,
          timestamp: Date.now()
        }));
      } catch (e) {
        console.error("Error caching weather data:", e);
      }
    }
    
    // Return default values if API calls fail
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
    
    // Fast path: If cloud cover > 70%, return poor SIQS without further calculation
    if (weatherData.cloudCover > 70) {
      const poorSiqs = Math.max(0, 3 - (weatherData.cloudCover - 70) / 10);
      
      // Store in cache
      siqsCache.set(cacheKey, {
        siqs: poorSiqs,
        isViable: false,
        timestamp: Date.now()
      });
      
      return {
        siqs: poorSiqs,
        isViable: false
      };
    }
    
    // Try to use cached forecast data
    let forecastData = null;
    const forecastCacheKey = `forecast-${latitude.toFixed(4)}-${longitude.toFixed(4)}`;
    
    try {
      const cachedForecast = sessionStorage.getItem(forecastCacheKey);
      if (cachedForecast) {
        const { data, timestamp } = JSON.parse(cachedForecast);
        if (Date.now() - timestamp < 60 * 60 * 1000) { // 1 hour cache for forecast
          forecastData = data;
        }
      }
    } catch (e) {
      console.error("Error retrieving cached forecast data:", e);
    }
    
    // Fetch forecast if not in cache (only for locations with good potential)
    if (!forecastData && weatherData.cloudCover < 40) {
      try {
        forecastData = await fetchForecastData({
          latitude,
          longitude,
          days: 2
        });
        
        // Cache the forecast data
        try {
          sessionStorage.setItem(forecastCacheKey, JSON.stringify({
            data: forecastData,
            timestamp: Date.now()
          }));
        } catch (e) {
          console.error("Error caching forecast data:", e);
        }
      } catch (err) {
        console.error("Error fetching forecast data:", err);
      }
    }
    
    // Calculate SIQS
    const siqsResult = await calculateSIQSWithWeatherData(
      weatherData,
      finalBortleScale,
      3, // Default seeing conditions
      0.5, // Default moon phase
      forecastData
    );
    
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
  } finally {
    // Remove from active calculations
    activeCalculations.delete(cacheKey);
  }
}

/**
 * Optimized batch processing for multiple locations with parallel processing
 * @param locations Array of locations to process
 * @param maxParallel Maximum number of parallel requests
 * @returns Promise resolving to locations with updated SIQS
 */
export async function batchCalculateSiqs(
  locations: SharedAstroSpot[],
  maxParallel: number = MAX_CONCURRENT_CALCULATIONS
): Promise<SharedAstroSpot[]> {
  if (!locations || locations.length === 0) return [];
  
  // Clone the locations array to avoid mutating the original
  const updatedLocations = [...locations];
  
  // First check which locations already have SIQS data
  const locationsNeedingSiqs = updatedLocations.filter(
    loc => loc.siqs === undefined && loc.latitude && loc.longitude
  );
  
  if (locationsNeedingSiqs.length === 0) {
    return updatedLocations;
  }
  
  // Sort by distance, prioritizing closer locations
  locationsNeedingSiqs.sort((a, b) => {
    const distA = typeof a.distance === 'number' ? a.distance : Infinity;
    const distB = typeof b.distance === 'number' ? b.distance : Infinity;
    return distA - distB;
  });
  
  // Process in batches
  const batchSize = Math.min(maxParallel, 5); // Limit batch size
  const batches = Math.ceil(locationsNeedingSiqs.length / batchSize);
  
  for (let i = 0; i < batches; i++) {
    const startIdx = i * batchSize;
    const endIdx = Math.min((i + 1) * batchSize, locationsNeedingSiqs.length);
    const batch = locationsNeedingSiqs.slice(startIdx, endIdx);
    
    // Process this batch in parallel
    await Promise.all(
      batch.map(async location => {
        try {
          if (!location.latitude || !location.longitude) return;
          
          const result = await calculateRealTimeSiqs(
            location.latitude,
            location.longitude, 
            location.bortleScale || 5
          );
          
          // Find this location in the original array and update it
          const locIndex = updatedLocations.findIndex(
            loc => loc.id === location.id || 
                  (loc.latitude === location.latitude && 
                   loc.longitude === location.longitude)
          );
          
          if (locIndex >= 0) {
            updatedLocations[locIndex].siqs = result.siqs;
            updatedLocations[locIndex].isViable = result.isViable;
          }
        } catch (error) {
          console.error(`Error calculating SIQS for location ${location.name}:`, error);
        }
      })
    );
    
    // Small delay between batches to avoid overwhelming the browser
    if (i < batches - 1) {
      await new Promise(resolve => setTimeout(resolve, 300));
    }
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
 * and update the cache
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
  
  // Also clear related weather cache
  try {
    sessionStorage.removeItem(`weather-${latitude.toFixed(4)}-${longitude.toFixed(4)}`);
  } catch (e) {
    console.error("Error clearing weather cache:", e);
  }
  
  // Recalculate and return fresh data
  return calculateRealTimeSiqs(latitude, longitude, bortleScale);
}
