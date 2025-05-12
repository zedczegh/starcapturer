
import { fetchLongRangeForecastData } from "@/lib/api/forecast";
import { SiqsResult } from "../realTimeSiqs/siqsTypes";
import { calculateRealTimeSiqs } from "../realTimeSiqs/siqsCalculator";
import { SiqsCalculationOptions } from "../realTimeSiqs/siqsTypes";

/**
 * Interface for forecast day astronomical data
 */
export interface ForecastDayAstroData {
  date: string;
  dayIndex: number;
  cloudCover: number;
  siqs: number | null;
  isViable: boolean;
  temperature: {
    min: number;
    max: number;
  };
  precipitation: {
    probability: number;
    amount: number | null;
  };
  humidity: number;
  windSpeed: number;
  weatherCode: number;
  siqsResult?: SiqsResult | null;
}

/**
 * Service for extracting astronomical scores from 15-day forecast data
 */
export const forecastAstroService = {
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
      // Fetch the long range forecast data (16 days)
      const longRangeForecast = await fetchLongRangeForecastData({ 
        latitude, 
        longitude, 
        days: 16  // Ensure we get full forecast
      });

      if (!longRangeForecast || !longRangeForecast.daily) {
        console.error("Failed to fetch long range forecast data");
        return [];
      }

      const { daily } = longRangeForecast;
      const result: ForecastDayAstroData[] = [];

      // Process all days in parallel for better performance
      const processPromises = Array.from({ length: daily.time.length }, async (_, i) => {
        const defaultBortleScale = bortleScale || 4;
        
        // Extract daily weather parameters
        const cloudCover = daily.cloud_cover_mean[i] || 0;
        const minTemp = daily.temperature_2m_min[i];
        const maxTemp = daily.temperature_2m_max[i];
        const precipProb = daily.precipitation_probability_max[i] || 0;
        const precipAmount = daily.precipitation_sum[i] || 0;
        const humidity = daily.relative_humidity_2m_mean[i] || 0;
        const windSpeed = daily.wind_speed_10m_max[i] || 0;
        const weatherCode = daily.weather_code[i];
        const date = daily.time[i];
        
        // Calculate SIQS for this forecast day
        let siqsResult: SiqsResult | null = null;
        
        try {
          // Use specialized options for forecast calculation
          const options: SiqsCalculationOptions = {
            useForecasting: true,
            forecastDay: i,
            forecastData: longRangeForecast,
            useSingleHourSampling: true,
            targetHour: 1, // 1 AM for optimal night viewing
            cacheDurationMins: 60
          };

          // Calculate SIQS for this specific date using forecast data
          const siqsData = await calculateRealTimeSiqs(
            latitude,
            longitude,
            defaultBortleScale,
            options
          );
          
          siqsResult = siqsData || null;
        } catch (err) {
          console.error(`Error calculating SIQS for forecast day ${i}:`, err);
        }
        
        // Return forecast data for this day
        return {
          date,
          dayIndex: i,
          cloudCover,
          siqs: siqsResult ? siqsResult.siqs : null,
          isViable: siqsResult ? siqsResult.isViable : false,
          temperature: {
            min: minTemp,
            max: maxTemp,
          },
          precipitation: {
            probability: precipProb,
            amount: precipAmount,
          },
          humidity,
          windSpeed,
          weatherCode,
          siqsResult
        };
      });
      
      // Wait for all days to process, but with concurrency limit
      const chunkSize = 5; // Process 5 days at a time
      for (let i = 0; i < processPromises.length; i += chunkSize) {
        const chunk = processPromises.slice(i, i + chunkSize);
        const chunkResults = await Promise.all(chunk);
        result.push(...chunkResults);
      }
      
      return result;
    } catch (error) {
      console.error("Error fetching forecast astro data:", error);
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
    const allDays = await forecastAstroService.getFullForecastAstroData(
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
   * Get forecast data for a specific day
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
    
    // Optimize for single day fetch by adding a parameter to only calculate for one specific day
    const options: SiqsCalculationOptions = {
      useForecasting: true,
      forecastDay: dayIndex,
      useSingleHourSampling: true,
      targetHour: 1,
      cacheDurationMins: 60
    };
    
    try {
      const longRangeForecast = await fetchLongRangeForecastData({ 
        latitude, 
        longitude, 
        days: 16
      });
      
      if (!longRangeForecast || !longRangeForecast.daily || !longRangeForecast.daily.time[dayIndex]) {
        console.error("Failed to fetch forecast data for the specified day");
        return null;
      }
      
      const { daily } = longRangeForecast;
      const defaultBortleScale = bortleScale || 4;
      
      // Extract data for the specific day
      const cloudCover = daily.cloud_cover_mean[dayIndex] || 0;
      const minTemp = daily.temperature_2m_min[dayIndex];
      const maxTemp = daily.temperature_2m_max[dayIndex];
      const precipProb = daily.precipitation_probability_max[dayIndex] || 0;
      const precipAmount = daily.precipitation_sum[dayIndex] || 0;
      const humidity = daily.relative_humidity_2m_mean[dayIndex] || 0;
      const windSpeed = daily.wind_speed_10m_max[dayIndex] || 0;
      const weatherCode = daily.weather_code[dayIndex];
      const date = daily.time[dayIndex];
      
      // Calculate SIQS with forecast data already loaded
      options.forecastData = longRangeForecast;
      const siqsResult = await calculateRealTimeSiqs(
        latitude,
        longitude,
        defaultBortleScale,
        options
      );
      
      return {
        date,
        dayIndex,
        cloudCover,
        siqs: siqsResult ? siqsResult.siqs : null,
        isViable: siqsResult ? siqsResult.isViable : false,
        temperature: {
          min: minTemp,
          max: maxTemp,
        },
        precipitation: {
          probability: precipProb,
          amount: precipAmount,
        },
        humidity,
        windSpeed,
        weatherCode,
        siqsResult
      };
    } catch (error) {
      console.error(`Error fetching specific day (${dayIndex}) data:`, error);
      return null;
    }
  },
  
  /**
   * Batch process multiple locations for forecast data
   * 
   * @param locations Array of location coordinates with bortle scale
   * @param dayIndex Optional specific day to forecast (all days if not specified)
   * @returns Promise resolving to array of forecast results by location
   */
  batchProcessLocations: async (
    locations: Array<{ latitude: number; longitude: number; bortleScale?: number }>,
    dayIndex?: number
  ): Promise<Array<{ location: { latitude: number; longitude: number }, forecast: ForecastDayAstroData[] | ForecastDayAstroData | null }>> => {
    // Use a concurrency limit to prevent overloading APIs
    const concurrencyLimit = 3;
    const results = [];
    
    // Process locations in batches
    for (let i = 0; i < locations.length; i += concurrencyLimit) {
      const batch = locations.slice(i, i + concurrencyLimit);
      const batchPromises = batch.map(async location => {
        try {
          if (dayIndex !== undefined) {
            // Process specific day only
            const forecast = await forecastAstroService.getSpecificDayAstroData(
              location.latitude,
              location.longitude,
              dayIndex,
              location.bortleScale
            );
            
            return { location, forecast };
          } else {
            // Process all days
            const forecast = await forecastAstroService.getFullForecastAstroData(
              location.latitude,
              location.longitude,
              location.bortleScale
            );
            
            return { location, forecast };
          }
        } catch (error) {
          console.error(`Error processing location (${location.latitude}, ${location.longitude}):`, error);
          return { location, forecast: null };
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }
    
    return results;
  }
};
