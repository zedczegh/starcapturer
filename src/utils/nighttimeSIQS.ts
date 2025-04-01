
import { calculateSIQS } from "@/lib/calculateSIQS";
import { calculateAverageCloudCover, calculateAverageWindSpeed } from "@/components/forecast/NightForecastUtils";

// Cache for computationally expensive operations
const nighttimeSIQSCache = new Map<string, {
  result: any;
  timestamp: number;
}>();

// Cache expiry time (15 minutes)
const CACHE_EXPIRY = 15 * 60 * 1000;

/**
 * Filter forecast data to include only nighttime hours (6 PM to 7 AM)
 * @param forecasts Array of forecast items
 * @returns Array of nighttime forecast items
 */
export const filterNighttimeForecasts = (forecasts: any[]): any[] => {
  if (!forecasts || !Array.isArray(forecasts) || forecasts.length === 0) return [];
  
  return forecasts.filter(item => {
    if (!item.time) return false;
    const date = new Date(item.time);
    const hour = date.getHours();
    return hour >= 18 || hour < 7; // 6 PM to 7 AM
  });
};

/**
 * Calculate SIQS based on nighttime forecasts with caching
 * @param locationData Current location data with weather information
 * @param forecastData Hourly forecast data
 * @param t Translation function
 * @returns Updated SIQS score and factors
 */
export const calculateNighttimeSIQS = (locationData: any, forecastData: any, t: any) => {
  if (!locationData?.weatherData || !forecastData?.hourly) {
    return null;
  }
  
  // Generate a cache key based on location and forecast data
  const cacheKey = `${locationData.latitude?.toFixed(4)}-${locationData.longitude?.toFixed(4)}-${forecastData.hourly.time?.[0] || ''}`;
  
  // Check if we have a valid cached result
  const cachedResult = nighttimeSIQSCache.get(cacheKey);
  if (cachedResult && (Date.now() - cachedResult.timestamp) < CACHE_EXPIRY) {
    console.log("Using cached SIQS data for", locationData.latitude?.toFixed(4), locationData.longitude?.toFixed(4), "score:", cachedResult.result.score.toFixed(1));
    return cachedResult.result;
  }
  
  try {
    // Extract nighttime forecasts from hourly data
    const nightForecasts = [];
    const hourlyData = forecastData.hourly;
    
    // Safely check if we have time data available
    if (Array.isArray(hourlyData.time)) {
      for (let i = 0; i < hourlyData.time.length; i++) {
        const time = hourlyData.time[i];
        const date = new Date(time);
        const hour = date.getHours();
        
        // Include hours between 6 PM (18) and 7 AM (7)
        if (hour >= 18 || hour < 7) {
          nightForecasts.push({
            time,
            cloudCover: hourlyData.cloud_cover?.[i] ?? 0,
            windSpeed: hourlyData.wind_speed_10m?.[i] ?? 0,
            humidity: hourlyData.relative_humidity_2m?.[i] ?? 0,
            precipitation: hourlyData.precipitation?.[i] ?? 0,
            weatherCondition: hourlyData.weather_code?.[i] ?? 0
          });
        }
      }
    }
    
    if (nightForecasts.length === 0) {
      return null;
    }
    
    // Calculate average values for cloud cover, wind speed, and humidity
    const avgCloudCover = calculateAverageCloudCover(nightForecasts);
    
    // Check if cloud cover is too high to make imaging possible
    if (avgCloudCover > 40) {
      const result = {
        score: 0,
        isViable: false,
        factors: [
          {
            name: t ? t("Cloud Cover", "云层覆盖") : "Cloud Cover",
            score: 0,
            description: t ? 
              t(`Cloud cover of ${Math.round(avgCloudCover)}% makes imaging impossible`, 
                `${Math.round(avgCloudCover)}%的云量使成像不可能`) : 
              `Cloud cover of ${Math.round(avgCloudCover)}% makes imaging impossible`
          }
        ]
      };
      
      // Cache the result
      nighttimeSIQSCache.set(cacheKey, {
        result,
        timestamp: Date.now()
      });
      
      return result;
    }
    
    const avgWindSpeed = calculateAverageWindSpeed(nightForecasts);
    const avgHumidity = nightForecasts.reduce((sum, item) => sum + (item.humidity || 0), 0) / nightForecasts.length;
    
    // Calculate if any precipitation is expected
    const hasPrecipitation = nightForecasts.some(f => f.precipitation > 0);
    
    // Calculate SIQS with emphasis on nighttime conditions
    const siqs = calculateSIQS({
      cloudCover: avgCloudCover,
      bortleScale: locationData.bortleScale || 5,
      seeingConditions: locationData.seeingConditions || 3,
      windSpeed: avgWindSpeed,
      humidity: avgHumidity,
      moonPhase: locationData.moonPhase || 0,
      precipitation: hasPrecipitation ? 0.1 : 0,
      aqi: locationData.weatherData.aqi,
      nightForecast: nightForecasts
    });
    
    // Cache the result
    nighttimeSIQSCache.set(cacheKey, {
      result: siqs,
      timestamp: Date.now()
    });
    
    return siqs;
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
    // If forecastData is an object with daily arrays
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
      
      // Calculate from cloud cover as fallback
      if (forecastData.cloud_cover && Array.isArray(forecastData.cloud_cover)) {
        const nightIndices = [];
        
        // Find night hours
        for (let i = 0; i < forecastData.time.length; i++) {
          const date = new Date(forecastData.time[i]);
          const hour = date.getHours();
          if (hour >= 18 || hour < 7) {
            nightIndices.push(i);
          }
        }
        
        // If we have night hours, calculate average cloud cover
        if (nightIndices.length > 0) {
          let totalCloud = 0;
          for (const idx of nightIndices) {
            totalCloud += forecastData.cloud_cover[idx] || 0;
          }
          const avgCloud = totalCloud / nightIndices.length;
          
          // Convert to SIQS scale (very simple formula)
          return Math.max(0, Math.min(10, 10 - (avgCloud / 10)));
        }
      }
    }
    
    return 0;
  } catch (error) {
    console.error("Error calculating average forecast SIQS:", error);
    return 0;
  }
};

// Clear cache when no longer needed
export const clearNighttimeSIQSCache = () => {
  nighttimeSIQSCache.clear();
};
