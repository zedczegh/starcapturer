
import { fetchWeatherForecast } from '@/services/weatherService';

// Cache for forecast data to reduce API calls
const forecastCache = new Map<string, {
  data: any;
  timestamp: number;
}>();

// Cache lifetime (15 minutes)
const CACHE_LIFETIME = 15 * 60 * 1000;

/**
 * Fetch forecast data with caching
 * @param latitude Location latitude
 * @param longitude Location longitude
 * @param forceFresh Force fresh data fetch ignoring cache
 * @returns Promise resolving to forecast data
 */
export async function fetchForecast(
  latitude: number, 
  longitude: number, 
  forceFresh: boolean = false
): Promise<any> {
  const cacheKey = `${latitude.toFixed(4)}-${longitude.toFixed(4)}`;
  
  // Check cache first
  if (!forceFresh) {
    const cachedData = forecastCache.get(cacheKey);
    if (cachedData && (Date.now() - cachedData.timestamp) < CACHE_LIFETIME) {
      console.log(`Using cached forecast for ${latitude.toFixed(2)}, ${longitude.toFixed(2)}`);
      return cachedData.data;
    }
  }
  
  try {
    console.log(`Fetching fresh forecast for ${latitude.toFixed(2)}, ${longitude.toFixed(2)}`);
    const data = await fetchWeatherForecast(latitude, longitude);
    
    // Update cache
    forecastCache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });
    
    return data;
  } catch (error) {
    console.error("Error fetching forecast:", error);
    throw error;
  }
}
