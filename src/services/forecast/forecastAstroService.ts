
import { fetchLongRangeForecastData } from "@/lib/api/forecast";
import { SIQSResult } from "@/lib/siqs/types";
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
  siqsResult?: SIQSResult | null;
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

      // Process each day in the forecast
      for (let i = 0; i < daily.time.length; i++) {
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
        let siqsResult: SIQSResult | null = null;
        
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
          
          siqsResult = siqsData?.siqsResult || null;
        } catch (err) {
          console.error(`Error calculating SIQS for forecast day ${i}:`, err);
        }
        
        // Add to result array
        result.push({
          date,
          dayIndex: i,
          cloudCover,
          siqs: siqsResult ? siqsResult.score : null,
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
        });
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
    
    const allDays = await forecastAstroService.getFullForecastAstroData(
      latitude,
      longitude,
      bortleScale
    );
    
    return allDays[dayIndex] || null;
  }
};
