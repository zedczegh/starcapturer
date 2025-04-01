
import { fetchWeatherData } from "@/lib/api";

// Default timeout for weather API requests (in milliseconds)
const DEFAULT_TIMEOUT = 8000;
// Default cache lifetime for weather data (in milliseconds)
const WEATHER_CACHE_LIFETIME = 5 * 60 * 1000; // 5 minutes
// Maximum retry attempts
const MAX_RETRIES = 3;

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
  // First try to use cached data
  const cachedWeatherData = getCachedData(cacheKey, WEATHER_CACHE_LIFETIME);
  if (cachedWeatherData) {
    return cachedWeatherData;
  }
  
  // Implement retry logic for better resilience
  let lastError: Error | null = null;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      // Use the improved options
      const data = await fetchWeatherData({
        latitude,
        longitude,
        days: 3
      }, controller.signal);
      
      clearTimeout(timeoutId);
      
      if (data) {
        // Cache the weather data for future use
        setCachedData(cacheKey, data);
        return data;
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.warn(`Weather data fetch attempt ${attempt + 1}/${MAX_RETRIES + 1} failed:`, lastError.message);
      
      // If this isn't our last attempt, try again with exponential backoff
      if (attempt < MAX_RETRIES) {
        const backoffDelay = Math.min(500 * Math.pow(1.5, attempt), 3000);
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
      }
    }
  }
  
  // All attempts failed - use fallback data
  console.error("Failed to fetch weather data after retries:", lastError);
  
  // Use fallback weather data
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
  
  // Show status message if needed
  if (!displayOnly && setStatusMessage) {
    setStatusMessage(language === 'en'
      ? "Could not fetch real-time weather. Using offline data instead."
      : "无法获取实时天气数据，使用离线数据替代。");
  }
  
  // Even fallback data should be cached to prevent repeated failed requests
  setCachedData(cacheKey, fallbackData);
  return fallbackData;
};

/**
 * Get cached weather data with minimal processing
 */
export const getCachedWeatherData = (
  cacheKey: string,
  getCachedData: (key: string, maxAge?: number) => any
): any => {
  return getCachedData(cacheKey, WEATHER_CACHE_LIFETIME);
};
