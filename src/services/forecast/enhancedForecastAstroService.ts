
/**
 * Enhanced Forecast Astro Service
 * 
 * Improved version with better reliability, performance tracking, and batch processing
 */

import { fetchEnhancedLongRangeForecastData } from "@/lib/api/enhancedForecast";
import { calculateRealTimeSiqs } from "../realTimeSiqs/siqsCalculator";
import { SiqsCalculationOptions, SiqsResult } from "../realTimeSiqs/siqsTypes";
import { areForecastServicesReliable } from "./forecastHealthMonitor";
import { processBatchSiqs } from "../realTimeSiqs/batchProcessor";
import { toast } from "sonner";
import { BatchLocationData, ForecastDayAstroData, BatchForecastResult } from "./types/forecastTypes";

/**
 * Cache implementation for forecast results
 */
class ForecastCache {
  private cache = new Map<string, {
    data: any;
    timestamp: number;
  }>();
  
  private static CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
  
  getCachedForecast(key: string): any | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < ForecastCache.CACHE_DURATION) {
      return cached.data;
    }
    return null;
  }
  
  setCachedForecast(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }
  
  invalidateCache(keyPattern?: string): void {
    if (keyPattern) {
      // Delete matching keys
      for (const key of this.cache.keys()) {
        if (key.includes(keyPattern)) {
          this.cache.delete(key);
        }
      }
    } else {
      // Clear all cache
      this.cache.clear();
    }
  }
}

// Create singleton cache instance
export const forecastCache = new ForecastCache();

/**
 * Enhanced service for extracting astronomical scores from 15-day forecast data
 * with improved reliability and batch processing
 */
export const enhancedForecastAstroService = {
  /**
   * Extracts astronomical data for each day in the 15-day forecast
   * 
   * @param latitude - Location latitude
   * @param longitude - Location longitude
   * @param bortleScale - Optional bortle scale value (1-9)
   * @returns Promise resolving to array of forecast day astronomical data
   */
  getFullForecastAstroData: async (
    latitude: number,
    longitude: number,
    bortleScale?: number
  ): Promise<ForecastDayAstroData[]> => {
    try {
      // Check service reliability before making request
      if (!areForecastServicesReliable()) {
        console.warn("Forecast services currently unreliable, using cached data if available");
      }
      
      // Check cache first
      const cacheKey = `forecast-astro-${latitude.toFixed(4)}-${longitude.toFixed(4)}`;
      const cachedData = forecastCache.getCachedForecast(cacheKey);
      if (cachedData) {
        return cachedData;
      }
      
      // Fetch the long range forecast data (16 days)
      const enhancedForecast = await fetchEnhancedLongRangeForecastData({ 
        latitude, 
        longitude, 
        days: 16  // Ensure we get full forecast
      });

      if (!enhancedForecast || !enhancedForecast.forecast || !enhancedForecast.forecast.daily) {
        console.error("Failed to fetch long range forecast data");
        toast.error("Couldn't retrieve forecast data", {
          description: "Using estimated values instead"
        });
        return [];
      }

      const { daily } = enhancedForecast.forecast;
      
      // Process days in optimal batch size for performance
      const locations: BatchLocationData[] = Array.from({ length: daily.time.length }, (_, i) => ({
        latitude,
        longitude,
        bortleScale: bortleScale || 4,
        priority: daily.time.length - i, // Higher priority for closer dates
        forecastDay: i,
        cloudCover: daily.cloud_cover_mean[i] || 0
      }));
      
      // Use batch processor for efficient parallel calculation
      const batchResults = await processBatchSiqs(locations, {
        concurrencyLimit: 5,
        useSingleHourSampling: true,
        targetHour: 1,
        cacheDurationMins: 60,
        useForecasting: true,
        timeout: 15000 // 15 second timeout for batch
      });
      
      // Map batch results to forecast days
      const result: ForecastDayAstroData[] = daily.time.map((date: string, i: number) => {
        // Find corresponding batch result
        const batchResult = batchResults.find(r => 
          r.location.latitude === latitude && 
          r.location.longitude === longitude && 
          r.location.forecastDay === i
        );
        
        const siqsResult = batchResult?.siqsResult || null;
        const reliability = enhancedForecast.reliability * 0.01 * (batchResult?.confidence || 5) / 10;
        
        return {
          date,
          dayIndex: i,
          cloudCover: daily.cloud_cover_mean[i] || 0,
          siqs: siqsResult ? siqsResult.siqs : null,
          isViable: siqsResult ? siqsResult.isViable : false,
          temperature: {
            min: daily.temperature_2m_min[i],
            max: daily.temperature_2m_max[i],
          },
          precipitation: {
            probability: daily.precipitation_probability_max[i] || 0,
            amount: daily.precipitation_sum[i] || 0,
          },
          humidity: daily.relative_humidity_2m_mean[i] || 0,
          windSpeed: daily.wind_speed_10m_max[i] || 0,
          weatherCode: daily.weather_code[i],
          siqsResult,
          reliability
        };
      });
      
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
   * Get the best astronomical viewing days from the forecast
   * 
   * @param latitude - Location latitude
   * @param longitude - Location longitude
   * @param bortleScale - Optional bortle scale value (1-9)
   * @param minQuality - Minimum quality threshold (0-10)
   * @returns Promise resolving to array of best forecast days
   */
  getBestAstroDays: async (
    latitude: number,
    longitude: number,
    bortleScale?: number,
    minQuality: number = 5
  ): Promise<ForecastDayAstroData[]> => {
    const allDays = await enhancedForecastAstroService.getFullForecastAstroData(
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
   * Get forecast data for a specific day with improved reliability
   * 
   * @param latitude - Location latitude
   * @param longitude - Location longitude 
   * @param dayIndex - Index of the day (0-15)
   * @param bortleScale - Optional bortle scale value (1-9)
   * @returns Promise resolving to forecast day astronomical data
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
      const allDays = await enhancedForecastAstroService.getFullForecastAstroData(
        latitude,
        longitude,
        bortleScale
      );
      
      if (allDays && allDays.length > dayIndex) {
        return allDays[dayIndex];
      }
      
      // Fallback to direct calculation if full forecast failed
      const options: SiqsCalculationOptions = {
        useForecasting: true,
        forecastDay: dayIndex,
        useSingleHourSampling: true,
        targetHour: 1,
        cacheDurationMins: 60
      };
      
      // Fetch forecast data
      const enhancedForecast = await fetchEnhancedLongRangeForecastData({ 
        latitude, 
        longitude, 
        days: 16
      });
      
      if (!enhancedForecast?.forecast?.daily?.time[dayIndex]) {
        console.error("Failed to fetch forecast data for the specified day");
        return null;
      }
      
      const { daily } = enhancedForecast.forecast;
      const defaultBortleScale = bortleScale || 4;
      
      // Use optimized calculation options
      options.forecastData = enhancedForecast.forecast;
      const siqsResult = await calculateRealTimeSiqs(
        latitude,
        longitude,
        defaultBortleScale,
        options
      );
      
      return {
        date: daily.time[dayIndex],
        dayIndex,
        cloudCover: daily.cloud_cover_mean[dayIndex] || 0,
        siqs: siqsResult ? siqsResult.siqs : null,
        isViable: siqsResult ? siqsResult.isViable : false,
        temperature: {
          min: daily.temperature_2m_min[dayIndex],
          max: daily.temperature_2m_max[dayIndex],
        },
        precipitation: {
          probability: daily.precipitation_probability_max[dayIndex] || 0,
          amount: daily.precipitation_sum[dayIndex] || 0,
        },
        humidity: daily.relative_humidity_2m_mean[dayIndex] || 0,
        windSpeed: daily.wind_speed_10m_max[dayIndex] || 0,
        weatherCode: daily.weather_code[dayIndex],
        siqsResult,
        reliability: enhancedForecast.reliability * 0.01 * 8
      };
    } catch (error) {
      console.error(`Error fetching specific day (${dayIndex}) data:`, error);
      return null;
    }
  },
  
  /**
   * Batch process multiple locations for forecast data with improved reliability
   * 
   * @param locations Array of location coordinates with bortle scale
   * @param dayIndex Optional specific day to forecast (all days if not specified)
   * @returns Promise resolving to array of forecast results by location
   */
  batchProcessLocations: async (
    locations: Array<{ latitude: number; longitude: number; bortleScale?: number; name?: string }>,
    dayIndex?: number
  ): Promise<BatchForecastResult[]> => {
    // Use batch processor directly for best performance
    try {
      if (dayIndex !== undefined) {
        // Transform locations into BatchLocationData array with explicit type annotation
        const batchLocations: BatchLocationData[] = locations.map(loc => {
          // Create a new object with all properties we need
          return {
            latitude: loc.latitude,
            longitude: loc.longitude,
            bortleScale: loc.bortleScale,
            name: loc.name,
            forecastDay: dayIndex,
            priority: 10 // High priority
          };
        });
        
        // Use SIQS batch processor for parallel processing
        const batchResults = await processBatchSiqs(batchLocations, {
          concurrencyLimit: 5,
          useSingleHourSampling: true,
          targetHour: 1,
          cacheDurationMins: 60,
          useForecasting: true,
          timeout: 30000 // 30 second timeout
        });
        
        // Map batch results back to the expected format
        return await Promise.all(locations.map(async location => {
          const batchResult = batchResults.find(
            r => r.location.latitude === location.latitude && 
                r.location.longitude === location.longitude
          );
          
          if (!batchResult) {
            return { 
              location, 
              forecast: null, 
              success: false 
            };
          }
          
          try {
            // Get specific day data using the batch result
            const forecast = await enhancedForecastAstroService.getSpecificDayAstroData(
              location.latitude,
              location.longitude,
              dayIndex,
              location.bortleScale
            );
            
            return { 
              location, 
              forecast, 
              success: !!forecast 
            };
          } catch (error) {
            console.error(`Error processing location specific day:`, error);
            return { 
              location, 
              forecast: null, 
              success: false 
            };
          }
        }));
      } else {
        // For all days, process each location sequentially but with internal parallelism
        return await Promise.all(locations.map(async location => {
          try {
            const forecast = await enhancedForecastAstroService.getFullForecastAstroData(
              location.latitude,
              location.longitude,
              location.bortleScale
            );
            
            return { 
              location, 
              forecast, 
              success: forecast.length > 0 
            };
          } catch (error) {
            console.error(`Error processing location full forecast:`, error);
            return { 
              location, 
              forecast: [], 
              success: false 
            };
          }
        }));
      }
    } catch (error) {
      console.error(`Error in batch processing locations:`, error);
      // Return failed results
      return locations.map(location => ({
        location,
        forecast: null,
        success: false
      }));
    }
  },
  
  /**
   * Clear forecast cache
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
   * Get current forecast system health metrics
   */
  getServiceHealth: () => {
    return areForecastServicesReliable();
  }
};
