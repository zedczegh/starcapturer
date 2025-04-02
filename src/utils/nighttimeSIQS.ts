
import { calculateSIQS } from "@/lib/calculateSIQS";
import { normalizeScore } from "@/lib/siqs/factors";
import { normalizeFactorScores, validateCloudCover } from "@/lib/siqs/utils";
import { extractHourlyForecastData, filterNighttimeForecasts, getForecastSIQSFromArray } from "./forecastUtils";

/**
 * Calculate SIQS based on nighttime forecasts
 * @param locationData Current location data with weather information
 * @param forecastData Hourly forecast data
 * @param t Translation function
 * @returns Updated SIQS score and factors
 */
export const calculateNighttimeSIQS = (locationData: any, forecastData: any, t: any) => {
  console.log("Starting nighttime SIQS calculation");
  if (!locationData || !forecastData?.hourly) {
    console.log("Missing required data for nighttime SIQS calculation");
    return null;
  }
  
  try {
    // Extract and standardize hourly forecast data
    const allHourlyForecasts = extractHourlyForecastData(forecastData);
    
    // Filter to nighttime hours only
    const nightForecasts = filterNighttimeForecasts(allHourlyForecasts);
    
    if (nightForecasts.length === 0) {
      console.log("No nighttime forecasts found in data");
      return null;
    }
    
    console.log(`Found ${nightForecasts.length} nighttime forecast hours`);
    
    // Calculate average values for cloud cover, wind speed, and humidity
    const avgCloudCover = validateCloudCover(
      nightForecasts.reduce((sum, item) => sum + (item.cloudCover || 0), 0) / nightForecasts.length
    );
    console.log(`Average cloud cover: ${avgCloudCover}%`);
    
    const avgWindSpeed = nightForecasts.reduce((sum, item) => sum + item.windSpeed, 0) / nightForecasts.length;
    const avgHumidity = nightForecasts.reduce((sum, item) => sum + item.humidity, 0) / nightForecasts.length;
    
    // Calculate if any precipitation is expected
    const hasPrecipitation = nightForecasts.some(f => f.precipitation > 0);
    
    // Get current weather data for more accurate calculations
    const currentWeather = locationData.weatherData || {};
    
    // Log calculation inputs for better debugging
    console.log("SIQS calculation with", nightForecasts.length, "nighttime forecast items");
    console.log("Using nighttime forecast data for SIQS calculation");
    console.log(`Average values - Cloud: ${avgCloudCover.toFixed(1)}%, Wind: ${avgWindSpeed.toFixed(1)}km/h, Humidity: ${avgHumidity.toFixed(1)}%`);
    
    // Calculate SIQS with emphasis on nighttime conditions
    const siqs = calculateSIQS({
      cloudCover: avgCloudCover,
      bortleScale: locationData.bortleScale || 5,
      seeingConditions: locationData.seeingConditions || 3,
      windSpeed: avgWindSpeed,
      humidity: avgHumidity,
      moonPhase: locationData.moonPhase || 0,
      precipitation: hasPrecipitation ? 0.1 : 0,
      aqi: currentWeather.aqi,
      weatherCondition: nightForecasts[0]?.weatherCode || 0,
      nightForecast: nightForecasts
    });
    
    console.log("Final SIQS score based on nighttime forecast:", siqs.score.toFixed(1));
    console.log("Calculated nighttime SIQS:", siqs.score);
    
    // Normalize all factor scores to 0-10 scale for consistent display
    const normalizedFactors = normalizeFactorScores(siqs.factors);
    
    return {
      ...siqs,
      factors: normalizedFactors
    };
  } catch (error) {
    console.error("Error calculating nighttime SIQS:", error);
    return null;
  }
};

/**
 * Get the average SIQS score from the forecast row SIQS values
 * @param forecastData Daily forecast data with SIQS ratings
 * @returns Average SIQS score from nighttime hours (0-10 scale)
 */
export const getAverageForecastSIQS = (forecastData: any): number => {
  if (!forecastData) {
    return 0;
  }
  
  try {
    // If forecastData is an object with daily arrays instead of an array itself
    if (forecastData && typeof forecastData === 'object' && forecastData.time && Array.isArray(forecastData.time)) {
      // Check if we have SIQS values in the data structure
      if (forecastData.siqs && Array.isArray(forecastData.siqs)) {
        const validScores = forecastData.siqs.filter((score: any) => 
          typeof score === 'number' && !isNaN(score)
        );
        
        if (validScores.length > 0) {
          return validScores.reduce((sum: number, score: number) => sum + score, 0) / validScores.length;
        }
      }
      
      // If no siqs array, check if we have a time array to match with
      const forecasts = [];
      for (let i = 0; i < forecastData.time.length; i++) {
        const forecast = {
          date: forecastData.time[i],
          siqs: { score: null } as { score: number | null }
        };
        
        // Calculate pseudo SIQS score based on cloud cover if available
        if (forecastData.cloud_cover_mean && Array.isArray(forecastData.cloud_cover_mean) && 
            forecastData.cloud_cover_mean[i] !== undefined) {
          const cloudCover = forecastData.cloud_cover_mean[i];
          if (cloudCover < 50) {
            forecast.siqs.score = Math.max(0, 10 - (cloudCover * 0.2));
          } else {
            forecast.siqs.score = 0;
          }
        }
        
        forecasts.push(forecast);
      }
      
      return getForecastSIQSFromArray(forecasts);
    }
    
    // Standard array format processing
    if (Array.isArray(forecastData)) {
      return getForecastSIQSFromArray(forecastData);
    }
    
    return 0;
  } catch (error) {
    console.error("Error in getAverageForecastSIQS:", error);
    return 0;
  }
};
