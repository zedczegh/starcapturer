
/**
 * Forecast processor service
 */
import { ForecastDayAstroData, BatchLocationData, BatchForecastResult } from '../types/forecastTypes';
import enhancedForecastAstroAdapter from '../enhancedForecastAstroAdapter';
import { forecastCache } from '../utils/forecastCache';

// Default cache time (30 minutes)
const DEFAULT_CACHE_TIME_MS = 30 * 60 * 1000;

export const forecastProcessor = {
  /**
   * Process a batch of locations for forecast data
   * @param locations Array of locations to process
   * @param useCaching Whether to use caching
   * @returns Promise with results array
   */
  processBatchForecast: async (
    locations: BatchLocationData[],
    useCaching: boolean = true
  ): Promise<BatchForecastResult[]> => {
    if (!locations || locations.length === 0) {
      return [];
    }
    
    const results: BatchForecastResult[] = [];
    
    for (const location of locations) {
      try {
        // Generate cache key if caching is enabled
        const cacheKey = useCaching
          ? `forecast_${location.latitude.toFixed(4)}_${location.longitude.toFixed(4)}_${location.forecastDay || 0}`
          : null;
        
        let forecast: ForecastDayAstroData | ForecastDayAstroData[] | null = null;
        
        // Check cache if enabled
        if (cacheKey) {
          forecast = forecastCache.getCachedForecast<ForecastDayAstroData | ForecastDayAstroData[]>(cacheKey);
        }
        
        if (!forecast) {
          // Get forecast data
          if (location.forecastDay !== undefined) {
            // Get specific day forecast
            forecast = await enhancedForecastAstroAdapter.getForecastDay(location);
          } else {
            // Get all forecast days
            forecast = await enhancedForecastAstroAdapter.getForecastData(location);
          }
          
          // Cache result if enabled
          if (cacheKey && forecast) {
            forecastCache.cacheForecast(cacheKey, forecast);
          }
        }
        
        results.push({
          location: {
            latitude: location.latitude,
            longitude: location.longitude,
            bortleScale: location.bortleScale,
            name: location.name,
            forecastDay: location.forecastDay
          },
          forecast,
          success: !!forecast
        });
      } catch (error) {
        console.error(`Error processing forecast for location ${location.name || '(unnamed)'}:`, error);
        results.push({
          location: {
            latitude: location.latitude,
            longitude: location.longitude,
            bortleScale: location.bortleScale,
            name: location.name,
            forecastDay: location.forecastDay
          },
          forecast: null,
          success: false
        });
      }
    }
    
    return results;
  },
  
  /**
   * Clear all forecast processor caches
   */
  clearCache: (): void => {
    forecastCache.clearAllCache();
  }
};

export default forecastProcessor;
