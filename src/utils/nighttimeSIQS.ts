
import { calculateSIQS } from "@/lib/calculateSIQS";
import { calculateAverageCloudCover, calculateAverageWindSpeed } from "@/components/forecast/NightForecastUtils";

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
 * Calculate SIQS based on nighttime forecasts
 * @param locationData Current location data with weather information
 * @param forecastData Hourly forecast data
 * @param t Translation function
 * @returns Updated SIQS score and factors
 */
export const calculateNighttimeSIQS = (locationData: any, forecastData: any, t: any) => {
  if (!locationData?.weatherData || !forecastData?.hourly || !forecastData.hourly.time) {
    console.log("Missing required data for nighttime SIQS calculation");
    return null;
  }
  
  try {
    // Extract nighttime forecasts from hourly data
    const nightForecasts = [];
    
    for (let i = 0; i < forecastData.hourly.time.length; i++) {
      const time = forecastData.hourly.time[i];
      const date = new Date(time);
      const hour = date.getHours();
      
      // Include hours between 6 PM (18) and 7 AM (7)
      if (hour >= 18 || hour < 7) {
        nightForecasts.push({
          time,
          cloudCover: forecastData.hourly.cloud_cover?.[i] ?? 0,
          windSpeed: forecastData.hourly.wind_speed_10m?.[i] ?? 0,
          humidity: forecastData.hourly.relative_humidity_2m?.[i] ?? 0,
          precipitation: forecastData.hourly.precipitation?.[i] ?? 0,
          weatherCondition: forecastData.hourly.weather_code?.[i] ?? 0
        });
      }
    }
    
    if (nightForecasts.length === 0) {
      console.log("No nighttime forecasts found in data");
      return null;
    }
    
    console.log(`Found ${nightForecasts.length} nighttime forecast hours`);
    
    // Calculate average values for cloud cover, wind speed, and humidity
    const avgCloudCover = calculateAverageCloudCover(nightForecasts);
    const avgWindSpeed = calculateAverageWindSpeed(nightForecasts);
    const avgHumidity = nightForecasts.reduce((sum, item) => sum + (item.humidity || 0), 0) / nightForecasts.length;
    
    // Calculate SIQS with emphasis on nighttime conditions
    const siqs = calculateSIQS({
      cloudCover: avgCloudCover,
      bortleScale: locationData.bortleScale || 5,
      seeingConditions: locationData.seeingConditions || 3,
      windSpeed: avgWindSpeed,
      humidity: avgHumidity,
      moonPhase: locationData.moonPhase || 0,
      precipitation: nightForecasts.some(f => f.precipitation > 0) ? 0.1 : 0,
      aqi: locationData.weatherData.aqi,
      nightForecast: nightForecasts
    });
    
    console.log("Calculated nighttime SIQS:", siqs.score);
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
export const getAverageForecastSIQS = (forecastData: any[]): number => {
  if (!forecastData || !Array.isArray(forecastData) || forecastData.length === 0) {
    return 0;
  }
  
  // Filter to only include the first day's forecast (tonight)
  const todayForecasts = forecastData.filter(forecast => {
    const forecastDate = new Date(forecast.date);
    const today = new Date();
    return forecastDate.getDate() === today.getDate() || 
           (forecastDate.getDate() === today.getDate() + 1 && 
            new Date(forecast.date).getHours() < 7);
  });
  
  if (todayForecasts.length === 0) return 0;
  
  // Calculate average SIQS from forecast rows
  let totalSIQS = 0;
  let count = 0;
  
  todayForecasts.forEach(forecast => {
    const siqs = forecast.siqs?.score;
    if (siqs !== undefined && siqs !== null) {
      totalSIQS += parseFloat(siqs);
      count++;
    }
  });
  
  return count > 0 ? totalSIQS / count : 0;
};
