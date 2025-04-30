
/**
 * Optimized forecast data processing service
 */

import { ForecastDayAstroData, BatchLocationData } from "../types/forecastTypes";
import { processBatchSiqs } from "../../realTimeSiqs/batchProcessor";
import { calculateRealTimeSiqs } from "../../realTimeSiqs/siqsCalculator";
import { SiqsCalculationOptions } from "../../realTimeSiqs/siqsTypes";
import { fetchEnhancedLongRangeForecastData } from "@/lib/api/enhancedForecast";

/**
 * Process forecast data for a location and extract astronomical quality metrics
 */
export async function processForecastData(
  latitude: number,
  longitude: number,
  enhancedForecast: any,
  bortleScale: number = 4
): Promise<ForecastDayAstroData[]> {
  if (!enhancedForecast?.forecast?.daily) {
    return [];
  }
  
  const { daily } = enhancedForecast.forecast;
  
  // Prepare batch locations for processing
  const locations: BatchLocationData[] = Array.from({ length: daily.time.length }, (_, i) => ({
    latitude,
    longitude,
    bortleScale,
    priority: daily.time.length - i, // Higher priority for closer dates
    forecastDay: i,
    cloudCover: daily.cloud_cover_mean[i] || 0
  }));
  
  // Process in optimized batch
  const batchResults = await processBatchSiqs(locations, {
    concurrencyLimit: 5,
    useSingleHourSampling: true,
    targetHour: 1,
    cacheDurationMins: 60,
    useForecasting: true,
    timeout: 15000
  });
  
  // Map processed results to forecast data structure
  return daily.time.map((date: string, i: number) => {
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
}

/**
 * Process a specific day's forecast data
 */
export async function processSpecificDay(
  latitude: number,
  longitude: number,
  dayIndex: number,
  enhancedForecast: any,
  bortleScale: number = 4
): Promise<ForecastDayAstroData | null> {
  if (!enhancedForecast?.forecast?.daily?.time[dayIndex]) {
    return null;
  }
  
  const { daily } = enhancedForecast.forecast;
  
  // Setup optimized calculation options
  const options: SiqsCalculationOptions = {
    useForecasting: true,
    forecastDay: dayIndex,
    useSingleHourSampling: true,
    targetHour: 1,
    cacheDurationMins: 60,
    forecastData: enhancedForecast.forecast
  };
  
  const siqsResult = await calculateRealTimeSiqs(
    latitude,
    longitude,
    bortleScale,
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
}

/**
 * Create an enhanced forecast service with support for future map applications
 */
export const enhancedForecastProcessor = {
  /**
   * Process batch locations for map applications with optimized parallel processing
   */
  processBatchForMap: async (
    locations: BatchLocationData[],
    options?: {
      targetHour?: number;
      cacheDurationMins?: number;
      concurrencyLimit?: number;
    }
  ) => {
    const processOptions = {
      concurrencyLimit: options?.concurrencyLimit || 5,
      useSingleHourSampling: true,
      targetHour: options?.targetHour || 1,
      cacheDurationMins: options?.cacheDurationMins || 60,
      useForecasting: true,
      timeout: 30000
    };
    
    return await processBatchSiqs(locations, processOptions);
  },
  
  /**
   * Get forecast data for a specified area (useful for map-based applications)
   */
  getForecastForArea: async (
    centerLat: number,
    centerLng: number,
    radiusKm: number,
    gridSize: number = 3,
    dayIndex: number = 0
  ): Promise<Array<{ 
    latitude: number; 
    longitude: number; 
    forecast: ForecastDayAstroData | null 
  }>> => {
    // Generate a grid of points in the specified area
    const gridPoints: Array<{ latitude: number; longitude: number }> = [];
    
    // Simple grid generation algorithm (can be improved for specific map applications)
    const latStep = (radiusKm / 111) / (gridSize - 1);
    const lngStep = (radiusKm / (111 * Math.cos(centerLat * Math.PI / 180))) / (gridSize - 1);
    
    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        const lat = centerLat - (radiusKm / 222) + (latStep * i);
        const lng = centerLng - (radiusKm / (222 * Math.cos(centerLat * Math.PI / 180))) + (lngStep * j);
        gridPoints.push({ latitude: lat, longitude: lng });
      }
    }
    
    // Process each point in the grid
    const results = await Promise.all(gridPoints.map(async point => {
      try {
        const forecast = await fetchEnhancedLongRangeForecastData({ 
          latitude: point.latitude, 
          longitude: point.longitude,
          days: dayIndex + 1
        });
        
        if (!forecast) {
          return { latitude: point.latitude, longitude: point.longitude, forecast: null };
        }
        
        const forecastDay = await processSpecificDay(
          point.latitude,
          point.longitude,
          dayIndex,
          forecast
        );
        
        return { latitude: point.latitude, longitude: point.longitude, forecast: forecastDay };
      } catch (error) {
        console.error('Error processing area forecast point:', error);
        return { latitude: point.latitude, longitude: point.longitude, forecast: null };
      }
    }));
    
    return results;
  }
};
