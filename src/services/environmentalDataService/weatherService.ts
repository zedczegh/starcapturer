
import { fetchWeatherData } from "@/lib/api";

/**
 * Service for retrieving weather data with fallback for errors
 */
export const getWeatherData = async (
  latitude: number,
  longitude: number,
  cacheKey: string,
  getCachedData: (key: string, maxAge?: number) => any,
  setCachedData: (key: string, data: any) => void,
  displayOnly: boolean,
  language: string = 'en',
  setStatusMessage?: (message: string | null) => void
): Promise<any> => {
  // First try to use cached data if in display-only mode
  if (displayOnly) {
    const cachedWeatherData = getCachedData(cacheKey, 5 * 60 * 1000); // 5 minute cache for weather
    if (cachedWeatherData) {
      return cachedWeatherData;
    }
  }
  
  try {
    // Add timeout to prevent hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    
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
    
    // Show status message if not in display-only mode
    if (!displayOnly && setStatusMessage) {
      setStatusMessage(language === 'en'
        ? "Could not fetch real-time weather. Using offline data instead."
        : "无法获取实时天气数据，使用离线数据替代。");
    }
    
    return fallbackData;
  }
  
  return null;
};
