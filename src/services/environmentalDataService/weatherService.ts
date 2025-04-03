
import { fetchWeatherData } from "@/lib/api";
import { fetchClearSkyRate } from "@/lib/api/clearSkyRate";

// Default timeout for weather API requests (in milliseconds)
const DEFAULT_TIMEOUT = 5000;
// Default cache lifetime for weather data (in milliseconds)
const WEATHER_CACHE_LIFETIME = 3 * 60 * 1000; // Reduced from 5 to 3 minutes for faster refreshes
// Maximum retry attempts
const MAX_RETRIES = 2;

// Define an extended weather data interface that includes clearSkyRate
interface EnhancedWeatherData {
  temperature: number;
  humidity: number;
  cloudCover: number;
  windSpeed: number;
  precipitation: number;
  time: string;
  condition: string;
  weatherCondition?: string;
  aqi?: number;
  clearSkyRate?: number;
}

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
): Promise<EnhancedWeatherData> => {
  // Generate location-specific cache key to avoid using old data for new locations
  const locationSpecificKey = `${cacheKey}-${latitude.toFixed(4)}-${longitude.toFixed(4)}`;
  
  // First try to use cached data
  const cachedWeatherData = getCachedData(locationSpecificKey, WEATHER_CACHE_LIFETIME);
  if (cachedWeatherData) {
    return cachedWeatherData as EnhancedWeatherData;
  }
  
  // Implement retry logic for better resilience
  let lastError: Error | null = null;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      // Fetch weather data and clear sky rate in parallel
      const [weatherData, clearSkyData] = await Promise.all([
        fetchWeatherData({
          latitude,
          longitude,
          days: 3
        }, controller.signal),
        fetchClearSkyRate(latitude, longitude)
      ]);
      
      clearTimeout(timeoutId);
      
      if (weatherData) {
        // Create a new object to include clearSkyRate
        const enhancedWeatherData: EnhancedWeatherData = { ...weatherData };
        
        // Add clear sky rate to weather data if available
        if (clearSkyData && typeof clearSkyData.annualRate === 'number') {
          enhancedWeatherData.clearSkyRate = clearSkyData.annualRate;
          console.log(`Added clear sky rate to weather data: ${clearSkyData.annualRate}%`);
        }
        
        // Cache the weather data for future use
        setCachedData(locationSpecificKey, enhancedWeatherData);
        return enhancedWeatherData;
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // If this isn't our last attempt, try again with a slight delay
      if (attempt < MAX_RETRIES) {
        await new Promise(resolve => setTimeout(resolve, 500 * (attempt + 1)));
      }
    }
  }
  
  // All attempts failed - use fallback data
  console.error("Failed to fetch weather data after retries:", lastError);
  
  // Try to get clear sky rate even if weather data failed
  let clearSkyRate: number | undefined;
  try {
    const clearSkyData = await fetchClearSkyRate(latitude, longitude);
    if (clearSkyData) {
      clearSkyRate = clearSkyData.annualRate;
    }
  } catch (e) {
    console.error("Failed to fetch clear sky rate:", e);
  }
  
  // Use fallback weather data
  const fallbackData: EnhancedWeatherData = {
    temperature: 20,
    humidity: 50,
    cloudCover: 30,
    windSpeed: 10,
    precipitation: 0,
    time: new Date().toISOString(),
    condition: "Clear",
    weatherCondition: "Clear",
    aqi: 50,
    clearSkyRate: clearSkyRate || 65 // Add fallback clear sky rate
  };
  
  // Show status message if needed
  if (!displayOnly && setStatusMessage) {
    setStatusMessage(language === 'en'
      ? "Could not fetch real-time weather. Using offline data instead."
      : "无法获取实时天气数据，使用离线数据替代。");
  }
  
  // Even fallback data should be cached to prevent repeated failed requests
  setCachedData(locationSpecificKey, fallbackData);
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
