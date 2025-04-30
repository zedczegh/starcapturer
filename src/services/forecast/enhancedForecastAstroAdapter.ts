
/**
 * Enhanced Forecast Astro Adapter
 * Maintains full compatibility with the existing API while using refactored components
 */

import { forecastCache } from "./utils/forecastCache";
import { processForecastData, processSpecificDay, enhancedForecastProcessor } from "./processors/forecastProcessor";
import { forecastMapService } from "./integration/mapIntegration";
import { ForecastDayAstroData, BatchLocationData, BatchForecastResult } from "./types/forecastTypes";
import { fetchEnhancedLongRangeForecastData } from "@/lib/api/enhancedForecast";
import { areForecastServicesReliable } from "./forecastHealthMonitor";
import { processBatchSiqs } from "../realTimeSiqs/batchProcessor";
import { toast } from "sonner";

/**
 * Enhanced forecast astro service with improved reliability and map integration
 */
export const enhancedForecastAstroAdapter = {
  /**
   * Get full forecast astronomical data - compatible with original API
   */
  getFullForecastAstroData: async (
    latitude: number,
    longitude: number,
    bortleScale?: number
  ): Promise<ForecastDayAstroData[]> => {
    try {
      // Check service reliability
      if (!areForecastServicesReliable()) {
        console.warn("Forecast services currently unreliable, using cached data if available");
      }
      
      // Check cache first
      const cacheKey = `forecast-astro-${latitude.toFixed(4)}-${longitude.toFixed(4)}`;
      const cachedData = forecastCache.getCachedForecast(cacheKey);
      if (cachedData) {
        return cachedData;
      }
      
      // Fetch the forecast data
      const enhancedForecast = await fetchEnhancedLongRangeForecastData({ 
        latitude, 
        longitude, 
        days: 16
      });

      if (!enhancedForecast || !enhancedForecast.forecast || !enhancedForecast.forecast.daily) {
        console.error("Failed to fetch long range forecast data");
        toast.error("Couldn't retrieve forecast data", {
          description: "Using estimated values instead"
        });
        return [];
      }
      
      // Process the forecast data
      const result = await processForecastData(
        latitude, 
        longitude, 
        enhancedForecast, 
        bortleScale || 4
      );
      
      // Cache the results
      forecastCache.setCachedForecast(cacheKey, result);
      
      return result;
    } catch (error) {
      console.error("Error fetching enhanced forecast astro data:", error);
      toast.error("Error getting forecast data", {
        description: "There was a problem retrieving the forecast"
      });
      return [];
    }
  },
  
  /**
   * Get best astronomical viewing days - compatible with original API
   */
  getBestAstroDays: async (
    latitude: number,
    longitude: number,
    bortleScale?: number,
    minQuality: number = 5
  ): Promise<ForecastDayAstroData[]> => {
    const allDays = await enhancedForecastAstroAdapter.getFullForecastAstroData(
      latitude,
      longitude,
      bortleScale
    );
    
    // Filter and sort by quality
    return allDays
      .filter(day => day.siqs !== null && day.siqs >= minQuality)
      .sort((a, b) => {
        const siqsA = a.siqs || 0;
        const siqsB = b.siqs || 0;
        return siqsB - siqsA; // Sort by highest quality first
      });
  },
  
  /**
   * Get specific day astronomical data - compatible with original API
   */
  getSpecificDayAstroData: async (
    latitude: number,
    longitude: number,
    dayIndex: number,
    bortleScale?: number
  ): Promise<ForecastDayAstroData | null> => {
    if (dayIndex < 0 || dayIndex > 15) {
      console.error("Day index out of range (0-15):", dayIndex);
      return null;
    }
    
    try {
      // Try to get from full forecast data first (more efficient)
      const allDays = await enhancedForecastAstroAdapter.getFullForecastAstroData(
        latitude,
        longitude,
        bortleScale
      );
      
      if (allDays && allDays.length > dayIndex) {
        return allDays[dayIndex];
      }
      
      // Fallback to direct calculation
      const enhancedForecast = await fetchEnhancedLongRangeForecastData({ 
        latitude, 
        longitude, 
        days: 16
      });
      
      if (!enhancedForecast?.forecast?.daily?.time[dayIndex]) {
        console.error("Failed to fetch forecast data for the specified day");
        return null;
      }
      
      return processSpecificDay(
        latitude,
        longitude,
        dayIndex,
        enhancedForecast,
        bortleScale || 4
      );
    } catch (error) {
      console.error(`Error fetching specific day (${dayIndex}) data:`, error);
      return null;
    }
  },
  
  /**
   * Batch process locations - compatible with original API
   */
  batchProcessLocations: async (
    locations: Array<{ latitude: number; longitude: number; bortleScale?: number; name?: string }>,
    dayIndex?: number
  ): Promise<BatchForecastResult[]> => {
    try {
      if (dayIndex !== undefined) {
        // Transform locations into BatchLocationData
        const batchLocations: BatchLocationData[] = locations.map(loc => ({
          latitude: loc.latitude,
          longitude: loc.longitude,
          bortleScale: loc.bortleScale,
          name: loc.name,
          forecastDay: dayIndex,
          priority: 10 // High priority
        }));
        
        // Process batch
        const batchResults = await processBatchSiqs(batchLocations, {
          concurrencyLimit: 5,
          useSingleHourSampling: true,
          targetHour: 1,
          cacheDurationMins: 60,
          useForecasting: true,
          timeout: 30000
        });
        
        // Map results
        return await Promise.all(locations.map(async location => {
          const batchResult = batchResults.find(
            r => r.location.latitude === location.latitude && 
                r.location.longitude === location.longitude
          );
          
          if (!batchResult) {
            return { location, forecast: null, success: false };
          }
          
          try {
            const forecast = await enhancedForecastAstroAdapter.getSpecificDayAstroData(
              location.latitude,
              location.longitude,
              dayIndex,
              location.bortleScale
            );
            
            return { location, forecast, success: !!forecast };
          } catch (error) {
            console.error(`Error processing location specific day:`, error);
            return { location, forecast: null, success: false };
          }
        }));
      } else {
        // Process for all days
        return await Promise.all(locations.map(async location => {
          try {
            const forecast = await enhancedForecastAstroAdapter.getFullForecastAstroData(
              location.latitude,
              location.longitude,
              location.bortleScale
            );
            
            return { location, forecast, success: forecast.length > 0 };
          } catch (error) {
            console.error(`Error processing location full forecast:`, error);
            return { location, forecast: [], success: false };
          }
        }));
      }
    } catch (error) {
      console.error(`Error in batch processing locations:`, error);
      return locations.map(location => ({
        location,
        forecast: null,
        success: false
      }));
    }
  },
  
  /**
   * Cache management - compatible with original API
   */
  clearCache: (latitude?: number, longitude?: number) => {
    if (latitude !== undefined && longitude !== undefined) {
      const keyPattern = `forecast-astro-${latitude.toFixed(4)}-${longitude.toFixed(4)}`;
      forecastCache.invalidateCache(keyPattern);
    } else {
      forecastCache.invalidateCache();
    }
  },
  
  /**
   * Health check - compatible with original API
   */
  getServiceHealth: () => {
    return areForecastServicesReliable();
  },
  
  /**
   * Enhanced map integration methods - new functionality 
   */
  map: {
    /**
     * Get quality heatmap for a region
     */
    getQualityHeatmap: forecastMapService.getQualityHeatmapData,
    
    /**
     * Generate potential spots based on forecast data
     */
    generatePotentialSpots: forecastMapService.generatePotentialSpots
  }
};

// Export the adapter as the enhanced service to maintain compatibility
export const enhancedForecastAstroService = enhancedForecastAstroAdapter;

// Additional exports for the new modular architecture
export { forecastCache } from './utils/forecastCache';
export { enhancedForecastProcessor } from './processors/forecastProcessor';
export { forecastMapService } from './integration/mapIntegration';
export * from './types/forecastTypes';
