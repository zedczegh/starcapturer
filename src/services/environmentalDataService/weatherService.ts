
/**
 * Weather data service
 */
import { fetchWeatherData } from "@/lib/api/weather";

export interface WeatherData {
  temperature: number;
  cloudCover: number;
  humidity: number;
  precipitation: number;
  windSpeed: number;
  weatherCode: number;
  timestamp: string;
}

export interface WeatherApiResponse {
  current: {
    temperature_2m: number;
    cloud_cover: number;
    relative_humidity_2m: number;
    precipitation: number;
    wind_speed_10m: number;
    weather_code: number;
    time: string;
  };
}

/**
 * Get weather data for a specific location
 */
export async function getWeatherData(
  latitude: number,
  longitude: number,
  cacheKey: string,
  getCachedData: (key: string, maxAge?: number) => any,
  setCachedData: (key: string, data: any) => void,
  displayOnly: boolean = false,
  language: string = 'en',
  setStatusMessage?: (message: string | null) => void
): Promise<WeatherData | null> {
  try {
    // Check if we have cached data first
    const maxCacheAge = 15 * 60 * 1000; // 15 minutes
    const cachedData = getCachedData(cacheKey, maxCacheAge);
    
    if (cachedData) {
      console.log("Using cached weather data");
      return cachedData;
    }
    
    // Set status message if loading
    if (!displayOnly) {
      setStatusMessage && setStatusMessage(
        language === 'en' 
          ? "Retrieving weather data..." 
          : "正在获取天气数据..."
      );
    }
    
    // Fetch weather data
    const weatherResponse = await fetchWeatherData({
      latitude,
      longitude
    }) as WeatherApiResponse;
    
    if (!weatherResponse) {
      throw new Error("Could not fetch weather data");
    }
    
    // Format weather data
    const formattedData: WeatherData = {
      temperature: weatherResponse.current?.temperature_2m || 0,
      cloudCover: weatherResponse.current?.cloud_cover || 0,
      humidity: weatherResponse.current?.relative_humidity_2m || 0,
      precipitation: weatherResponse.current?.precipitation || 0,
      windSpeed: weatherResponse.current?.wind_speed_10m || 0,
      weatherCode: weatherResponse.current?.weather_code || 0,
      timestamp: weatherResponse.current?.time || new Date().toISOString()
    };
    
    // Cache the data
    setCachedData(cacheKey, formattedData);
    
    return formattedData;
  } catch (error) {
    console.error("Error getting weather data:", error);
    return null;
  }
}
