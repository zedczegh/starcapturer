
import { calculateNighttimeSIQS, clearNighttimeSIQSCache } from "@/utils/nighttimeSIQS";
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { fetchWeatherData, fetchForecastData } from "@/lib/api";

// Extend the SharedAstroSpot type to include SIQS properties
declare module '@/lib/api/astroSpots' {
  interface SharedAstroSpot {
    siqs?: number;
    isViable?: boolean;
    siqsFactors?: any[];
  }
}

// Cache for SIQS calculations
const siqsCache = new Map<string, {
  siqs: number;
  isViable: boolean;
  timestamp: number;
  factors?: any[];
}>();

// Cache expiry time (15 minutes)
const CACHE_EXPIRY = 15 * 60 * 1000;

/**
 * Calculate real-time SIQS for a single location
 * @param location Location to calculate SIQS for
 * @returns Promise resolving to location with SIQS data
 */
export const calculateRealTimeSiqs = async (
  location: SharedAstroSpot
): Promise<SharedAstroSpot> => {
  try {
    const cacheKey = `siqs-${location.latitude.toFixed(4)}-${location.longitude.toFixed(4)}`;
    const cachedSiqs = siqsCache.get(cacheKey);
    
    // Return cached value if available and not expired
    if (cachedSiqs && (Date.now() - cachedSiqs.timestamp) < CACHE_EXPIRY) {
      return {
        ...location,
        siqs: cachedSiqs.siqs,
        isViable: cachedSiqs.isViable,
        siqsFactors: cachedSiqs.factors
      };
    }
    
    // Get weather data
    const weatherData = await fetchWeatherData({
      latitude: location.latitude,
      longitude: location.longitude
    });
    
    if (!weatherData) {
      return {
        ...location,
        siqs: 0,
        isViable: false
      };
    }
    
    // Get forecast data
    const forecastData = await fetchForecastData({
      latitude: location.latitude,
      longitude: location.longitude,
      days: 1
    });
    
    // Calculate SIQS
    const locationWithWeather = {
      ...location,
      weatherData,
      bortleScale: location.bortleScale || 5
    };
    
    const siqsResult = calculateNighttimeSIQS(locationWithWeather, forecastData, null);
    
    const siqs = siqsResult?.score || 0;
    const isViable = siqsResult?.isViable !== false;
    const factors = siqsResult?.factors;
    
    // Cache the result
    siqsCache.set(cacheKey, {
      siqs,
      isViable,
      factors,
      timestamp: Date.now()
    });
    
    return {
      ...location,
      siqs,
      isViable,
      siqsFactors: factors
    };
  } catch (error) {
    console.error(`Error calculating real-time SIQS for location ${location.name}:`, error);
    return {
      ...location,
      siqs: 0,
      isViable: false
    };
  }
};

/**
 * Calculate SIQS for a batch of locations with optimized caching
 * @param locations Array of locations to calculate SIQS for
 * @returns Locations with SIQS values
 */
export const batchCalculateSiqs = async (
  locations: SharedAstroSpot[]
): Promise<SharedAstroSpot[]> => {
  if (!locations || locations.length === 0) {
    return [];
  }
  
  const result: SharedAstroSpot[] = [];
  const uncachedLocations: SharedAstroSpot[] = [];
  
  // First pass: use cached values when available
  for (const location of locations) {
    const cacheKey = `siqs-${location.latitude.toFixed(4)}-${location.longitude.toFixed(4)}`;
    const cachedSiqs = siqsCache.get(cacheKey);
    
    if (cachedSiqs && (Date.now() - cachedSiqs.timestamp) < CACHE_EXPIRY) {
      // Use cached value
      result.push({
        ...location,
        siqs: cachedSiqs.siqs,
        isViable: cachedSiqs.isViable,
        siqsFactors: cachedSiqs.factors
      });
    } else {
      // Mark for calculation
      uncachedLocations.push(location);
    }
  }
  
  // Second pass: calculate SIQS for uncached locations
  if (uncachedLocations.length > 0) {
    // Process in batches to avoid overwhelming the API
    const batchSize = 5;
    for (let i = 0; i < uncachedLocations.length; i += batchSize) {
      const batch = uncachedLocations.slice(i, i + batchSize);
      const promises = batch.map(async location => {
        try {
          // Get weather data
          const weatherData = await fetchWeatherData({
            latitude: location.latitude,
            longitude: location.longitude
          });
          
          if (!weatherData) {
            return {
              ...location,
              siqs: 0,
              isViable: false
            };
          }
          
          // Get forecast data
          const forecastData = await fetchForecastData({
            latitude: location.latitude,
            longitude: location.longitude,
            days: 1
          });
          
          // Calculate SIQS
          const locationWithWeather = {
            ...location,
            weatherData,
            bortleScale: location.bortleScale || 5
          };
          
          const siqsResult = calculateNighttimeSIQS(locationWithWeather, forecastData, null);
          
          const siqs = siqsResult?.score || 0;
          const isViable = siqsResult?.isViable !== false;
          const factors = siqsResult?.factors;
          
          // Cache the result
          const cacheKey = `siqs-${location.latitude.toFixed(4)}-${location.longitude.toFixed(4)}`;
          siqsCache.set(cacheKey, {
            siqs,
            isViable,
            factors,
            timestamp: Date.now()
          });
          
          return {
            ...location,
            siqs,
            isViable,
            siqsFactors: factors
          };
        } catch (error) {
          console.error(`Error calculating SIQS for location ${location.name}:`, error);
          return {
            ...location,
            siqs: 0,
            isViable: false
          };
        }
      });
      
      const batchResults = await Promise.all(promises);
      result.push(...batchResults);
      
      // Add a small delay between batches to prevent rate limiting
      if (i + batchSize < uncachedLocations.length) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }
  }
  
  // Sort locations by SIQS score (higher is better)
  result.sort((a, b) => {
    const siqsA = typeof a.siqs === 'number' ? a.siqs : 0;
    const siqsB = typeof b.siqs === 'number' ? b.siqs : 0;
    return siqsB - siqsA;
  });
  
  return result;
};

/**
 * Clear the SIQS cache
 */
export const clearSiqsCache = () => {
  siqsCache.clear();
  clearNighttimeSIQSCache();
};

/**
 * Get the size of the SIQS cache
 * @returns Number of entries in the cache
 */
export const getSiqsCacheSize = () => {
  return siqsCache.size;
};
