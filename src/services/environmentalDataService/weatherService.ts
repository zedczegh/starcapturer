
import { fetchWeatherData } from "@/lib/api";

// Default timeout for weather API requests (in milliseconds)
const DEFAULT_TIMEOUT = 5000;
// Default cache lifetime for weather data (in milliseconds)
const WEATHER_CACHE_LIFETIME = 5 * 60 * 1000; // 5 minutes

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
  
  try {
    // Add timeout to prevent hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
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
  } catch (weatherError) {
    console.error("Failed to fetch weather data:", weatherError);
    
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
  }
  
  return null;
};
