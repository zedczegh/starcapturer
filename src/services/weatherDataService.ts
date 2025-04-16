import { environmentalDataCache } from '@/services/environmentalDataService';
import { fetchClearSkyRate, clearClearSkyRateCache } from '@/lib/api/clearSkyRate';
import { fetchWeatherData } from '@/lib/api/weather';

/**
 * Comprehensive service for managing weather-related data
 * Integrates clear sky rates, real-time weather, and caching mechanisms
 */
export const WeatherDataService = {
  /**
   * Get clear sky rate data with intelligent caching
   */
  async getClearSkyRate(latitude: number, longitude: number, forceRefresh = false) {
    const cacheKey = `clear-sky-${latitude.toFixed(2)}-${longitude.toFixed(2)}`;
    
    // Only clear cache if forced refresh is requested
    if (forceRefresh) {
      clearClearSkyRateCache(latitude, longitude);
    }
    
    try {
      return await fetchClearSkyRate(latitude, longitude);
    } catch (error) {
      console.error("Error fetching clear sky rate:", error);
      
      // Try to get from cache even if fetch fails
      const cachedData = localStorage.getItem(cacheKey);
      if (cachedData) {
        return JSON.parse(cachedData);
      }
      
      return null;
    }
  },
  
  /**
   * Get current weather data with caching
   */
  async getCurrentWeather(latitude: number, longitude: number, forceRefresh = false) {
    const cacheKey = `weather-${latitude.toFixed(4)}-${longitude.toFixed(4)}`;
    
    // Check cache first if not forcing refresh
    if (!forceRefresh) {
      const cachedData = environmentalDataCache.getWeatherData(cacheKey);
      if (cachedData) {
        return cachedData;
      }
    }
    
    try {
      const weatherData = await fetchWeatherData({
        latitude,
        longitude
      });
      
      if (weatherData) {
        // Cache the fresh data
        environmentalDataCache.setWeatherData(cacheKey, weatherData);
        return weatherData;
      }
    } catch (error) {
      console.error("Error fetching weather data:", error);
    }
    
    return null;
  },
  
  /**
   * Get combined weather metrics for a location
   * This includes both clear sky rate and current weather in a single call
   */
  async getLocationWeatherMetrics(latitude: number, longitude: number) {
    const [clearSkyData, weatherData] = await Promise.all([
      this.getClearSkyRate(latitude, longitude),
      this.getCurrentWeather(latitude, longitude)
    ]);
    
    return {
      clearSky: clearSkyData,
      weather: weatherData,
      timestamp: Date.now()
    };
  },
  
  /**
   * Clear all weather related caches
   */
  clearAllCaches(latitude?: number, longitude?: number) {
    // Clear specific location if coordinates provided
    if (latitude !== undefined && longitude !== undefined) {
      clearClearSkyRateCache(latitude, longitude);
      
      const weatherCacheKey = `weather-${latitude.toFixed(4)}-${longitude.toFixed(4)}`;
      environmentalDataCache.clear('weather');
      return;
    }
    
    // Otherwise clear everything
    clearClearSkyRateCache();
    environmentalDataCache.clear('weather');
  },
  
  /**
   * Get cache statistics
   */
  getCacheStats() {
    // Count clear sky cache entries
    let clearSkyCacheCount = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('clear-sky-')) {
        clearSkyCacheCount++;
      }
    }
    
    return {
      clearSkyEntries: clearSkyCacheCount,
      weatherEntries: environmentalDataCache.getStats().weather
    };
  }
};

export default WeatherDataService;
