
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
  async getClearSkyRate(
    latitude: number, 
    longitude: number, 
    forceRefresh = false,
    includeHistoricalData = true
  ) {
    const cacheKey = `clear-sky-${latitude.toFixed(2)}-${longitude.toFixed(2)}`;
    
    // Only clear cache if forced refresh is requested
    if (forceRefresh) {
      clearClearSkyRateCache(latitude, longitude);
    }
    
    try {
      // Pass the historical data flag to the fetch function
      return await fetchClearSkyRate(latitude, longitude, includeHistoricalData);
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
   * Get historical weather patterns for a location
   * This is especially useful for certified locations
   */
  async getHistoricalWeatherPatterns(latitude: number, longitude: number) {
    const cacheKey = `historical-patterns-${latitude.toFixed(4)}-${longitude.toFixed(4)}`;
    
    // Check cache first
    const cachedData = localStorage.getItem(cacheKey);
    if (cachedData) {
      try {
        const data = JSON.parse(cachedData);
        if (data && data.expiryTime > Date.now()) {
          return data.patterns;
        }
      } catch (e) {
        // Cache parse error, continue to fetch
      }
    }
    
    try {
      // Attempt to load from our certified locations service first
      const certifiedLocationService = await import('@/services/realTimeSiqsService/certifiedLocationService');
      const certifiedLocations = await fetch('/api/certified-locations.json').catch(() => null);
      
      // If we have access to certified locations data
      if (certifiedLocations) {
        const locationsData = await certifiedLocations.json();
        
        // Find the closest certified location
        const closestLocation = locationsData.find((loc: any) => {
          if (!loc.latitude || !loc.longitude) return false;
          
          // Calculate distance using Haversine formula
          const R = 6371; // Earth radius in km
          const dLat = (loc.latitude - latitude) * Math.PI / 180;
          const dLon = (loc.longitude - longitude) * Math.PI / 180;
          const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(latitude * Math.PI / 180) * Math.cos(loc.latitude * Math.PI / 180) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
          const distance = R * c;
          
          // Within 50km radius
          return distance < 50;
        });
        
        if (closestLocation) {
          // We found a certified location near our coordinates
          const patterns = {
            seasonalTrends: closestLocation.seasonalTrends || this.getDefaultSeasonalTrends(),
            clearestMonths: closestLocation.clearestMonths || this.getDefaultClearestMonths(),
            visibility: closestLocation.averageVisibility || 'good',
            annualPrecipitationDays: closestLocation.annualPrecipitationDays || 80,
          };
          
          // Cache for one week
          localStorage.setItem(cacheKey, JSON.stringify({
            patterns,
            expiryTime: Date.now() + 7 * 24 * 60 * 60 * 1000
          }));
          
          return patterns;
        }
      }
      
      // Fall back to location database if no certified location found
      const { findClosestLocation } = await import('@/data/locationDatabase');
      const closestKnownLocation = findClosestLocation(latitude, longitude);
      
      if (closestKnownLocation) {
        // Generate patterns based on location type and Bortle scale
        const patterns = this.generatePatternsFromLocation(closestKnownLocation);
        
        // Cache for one week
        localStorage.setItem(cacheKey, JSON.stringify({
          patterns,
          expiryTime: Date.now() + 7 * 24 * 60 * 60 * 1000
        }));
        
        return patterns;
      }
      
      // Fall back to default patterns
      return this.getDefaultHistoricalPatterns(latitude, longitude);
      
    } catch (error) {
      console.error("Error fetching historical weather patterns:", error);
      return this.getDefaultHistoricalPatterns(latitude, longitude);
    }
  },
  
  /**
   * Generate weather patterns based on location information
   */
  generatePatternsFromLocation(location: any) {
    // Default patterns
    const patterns = {
      seasonalTrends: this.getDefaultSeasonalTrends(),
      clearestMonths: this.getDefaultClearestMonths(),
      visibility: 'average',
      annualPrecipitationDays: 100,
    };
    
    // Adjust based on location type
    if (location.type === 'dark-site') {
      patterns.visibility = 'excellent';
      patterns.annualPrecipitationDays = 60;
    } else if (location.type === 'rural') {
      patterns.visibility = 'good';
      patterns.annualPrecipitationDays = 80;
    } else if (location.type === 'urban') {
      patterns.visibility = 'poor';
      patterns.annualPrecipitationDays = 120;
    }
    
    // Adjust based on Bortle scale
    if (location.bortleScale <= 3) {
      patterns.visibility = 'excellent';
    } else if (location.bortleScale <= 6) {
      patterns.visibility = 'good';
    } else {
      patterns.visibility = 'poor';
    }
    
    return patterns;
  },
  
  /**
   * Get default seasonal trends based on hemisphere
   */
  getDefaultSeasonalTrends() {
    return {
      spring: { clearSkyRate: 60, averageTemperature: 15 },
      summer: { clearSkyRate: 70, averageTemperature: 25 },
      fall: { clearSkyRate: 65, averageTemperature: 15 },
      winter: { clearSkyRate: 55, averageTemperature: 5 }
    };
  },
  
  /**
   * Get default clearest months (typical for northern hemisphere)
   */
  getDefaultClearestMonths() {
    return ['Jun', 'Jul', 'Aug'];
  },
  
  /**
   * Get default historical patterns based on latitude
   * Uses latitude to determine hemisphere and adjust accordingly
   */
  getDefaultHistoricalPatterns(latitude: number, longitude: number) {
    // Determine hemisphere
    const isNorthernHemisphere = latitude >= 0;
    
    return {
      seasonalTrends: isNorthernHemisphere ? {
        spring: { clearSkyRate: 60, averageTemperature: 15 },
        summer: { clearSkyRate: 75, averageTemperature: 25 },
        fall: { clearSkyRate: 65, averageTemperature: 15 },
        winter: { clearSkyRate: 50, averageTemperature: 5 }
      } : {
        spring: { clearSkyRate: 65, averageTemperature: 20 },
        summer: { clearSkyRate: 50, averageTemperature: 10 },
        fall: { clearSkyRate: 60, averageTemperature: 20 },
        winter: { clearSkyRate: 70, averageTemperature: 30 }
      },
      clearestMonths: isNorthernHemisphere ? 
        ['Jun', 'Jul', 'Aug'] : 
        ['Dec', 'Jan', 'Feb'],
      visibility: 'average',
      annualPrecipitationDays: 90
    };
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
