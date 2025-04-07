
import { fetchWeatherData } from "@/lib/api";

// Default timeout for weather API requests (in milliseconds)
const DEFAULT_TIMEOUT = 4000; // Reduced from 5000 for faster loading
// Default cache lifetime for weather data (in milliseconds)
const WEATHER_CACHE_LIFETIME = 3 * 60 * 1000; // 3 minutes cache lifetime
// Maximum retry attempts
const MAX_RETRIES = 1; // Reduced from 2 for faster error recovery

/**
 * Optimized service for retrieving weather data with better caching and error handling
 */
export const getWeatherData = async (
  latitude: number,
  longitude: number,
  cacheKey: string,
  getCachedData: (key: string, maxAge?: number) => any,
  setCachedData: (key: string, data: any) => void,
  displayOnly: boolean,
  language: string = 'en',
  setStatusMessage?: (message: string | null) => void,
  timeout: number = DEFAULT_TIMEOUT
): Promise<any> => {
  // Generate location-specific cache key to avoid using old data for new locations
  const locationSpecificKey = `${cacheKey}-${latitude.toFixed(4)}-${longitude.toFixed(4)}`;
  
  // First try to use cached data - prioritize this for speed
  const cachedWeatherData = getCachedData(locationSpecificKey, WEATHER_CACHE_LIFETIME);
  if (cachedWeatherData) {
    return cachedWeatherData;
  }
  
  // Start preloading fallback data to ensure quick display
  const fallbackData = {
    temperature: 20,
    humidity: 50,
    cloudCover: 30,
    windSpeed: 10,
    precipitation: 0,
    time: new Date().toISOString(),
    condition: "Clear",
    weatherCondition: "Clear",
    aqi: 50
  };
  
  // Set a timeout to use fallback data if fetch takes too long
  const fallbackTimer = setTimeout(() => {
    if (!displayOnly && setStatusMessage) {
      setStatusMessage(language === 'en'
        ? "Using cached weather data while updating..."
        : "使用缓存的天气数据，正在更新...");
    }
    // Cache fallback data temporarily
    setCachedData(locationSpecificKey, fallbackData);
  }, 800); // Show fallback quickly if real data is taking time
  
  try {
    // Use AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const data = await fetchWeatherData({
      latitude,
      longitude,
      days: 3
    }, controller.signal);
    
    clearTimeout(timeoutId);
    clearTimeout(fallbackTimer);
    
    if (data) {
      // Cache the weather data for future use
      setCachedData(locationSpecificKey, data);
      return data;
    }
  } catch (error) {
    clearTimeout(fallbackTimer);
    console.error("Failed to fetch weather data:", error);
  }
  
  // If we reach here, use fallback data
  // Cache fallback data to avoid repeated failed requests
  setCachedData(locationSpecificKey, fallbackData);
  
  // Show status message if needed
  if (!displayOnly && setStatusMessage) {
    setStatusMessage(language === 'en'
      ? "Using offline weather data."
      : "使用离线天气数据。");
  }
  
  return fallbackData;
};

/**
 * Get cached weather data with minimal processing
 */
export const getCachedWeatherData = (
  cacheKey: string,
  latitude: number,
  longitude: number,
  getCachedData: (key: string, maxAge?: number) => any
): any => {
  const locationSpecificKey = `${cacheKey}-${latitude.toFixed(4)}-${longitude.toFixed(4)}`;
  return getCachedData(locationSpecificKey, WEATHER_CACHE_LIFETIME);
};

/**
 * Clear weather data cache for a specific location
 */
export const clearWeatherCache = (
  cacheKey: string,
  latitude: number,
  longitude: number,
  clearCache: (key: string) => void
): void => {
  const locationSpecificKey = `${cacheKey}-${latitude.toFixed(4)}-${longitude.toFixed(4)}`;
  clearCache(locationSpecificKey);
};
