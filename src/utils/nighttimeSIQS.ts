
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
 * Extract hourly forecast data and convert to a standard format for processing
 * @param forecastData Raw forecast data from API
 * @returns Array of standardized forecast items
 */
export const extractHourlyForecastData = (forecastData: any): any[] => {
  if (!forecastData?.hourly || !Array.isArray(forecastData.hourly.time)) {
    return [];
  }
  
  const hourlyData = forecastData.hourly;
  const forecasts = [];
  
  for (let i = 0; i < hourlyData.time.length; i++) {
    forecasts.push({
      time: hourlyData.time[i],
      cloudCover: hourlyData.cloud_cover?.[i] ?? 0,
      windSpeed: hourlyData.wind_speed_10m?.[i] ?? 0,
      humidity: hourlyData.relative_humidity_2m?.[i] ?? 0,
      precipitation: hourlyData.precipitation?.[i] ?? 0,
      weatherCode: hourlyData.weather_code?.[i] ?? 0
    });
  }
  
  return forecasts;
};

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
    const avgCloudCover = nightForecasts.reduce((sum, item) => sum + item.cloudCover, 0) / nightForecasts.length;
    console.log(`Average cloud cover: ${avgCloudCover}%`);
    
    // Check if cloud cover is too high to make imaging possible (threshold at 50%)
    if (avgCloudCover > 50) {
      console.log(`Average cloud cover is ${avgCloudCover}%, which exceeds 50% threshold. SIQS score = 0`);
      return {
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
    }
    
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
    const normalizedFactors = siqs.factors.map(factor => ({
      ...factor,
      score: factor.score > 10 ? factor.score / 10 : factor.score
    }));
    
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

/**
 * Helper function to calculate SIQS from an array of forecasts
 */
function getForecastSIQSFromArray(forecasts: any[]): number {
  if (!Array.isArray(forecasts) || forecasts.length === 0) {
    return 0;
  }
  
  // Filter to only include the first day's forecast (tonight)
  const today = new Date();
  const todayForecasts = forecasts.filter(forecast => {
    if (!forecast.date) return false;
    
    const forecastDate = new Date(forecast.date);
    return forecastDate.getDate() === today.getDate() || 
           (forecastDate.getDate() === today.getDate() + 1 && 
            new Date(forecast.date).getHours() < 7);
  });
  
  if (todayForecasts.length === 0) return 0;
  
  // Calculate average SIQS from forecast rows
  let totalSIQS = 0;
  let count = 0;
  
  todayForecasts.forEach(forecast => {
    // Check different possible locations for SIQS data
    const siqs = forecast.siqs?.score || forecast.siqsScore || forecast.siqs;
    
    if (siqs !== undefined && siqs !== null && !isNaN(parseFloat(siqs))) {
      totalSIQS += parseFloat(siqs);
      count++;
    } else if (forecast.cloudCover !== undefined || forecast.cloud_cover !== undefined) {
      // Fallback: calculate from cloud cover if available
      const cloudCover = forecast.cloudCover || forecast.cloud_cover;
      if (cloudCover < 50) {
        // Adjusted formula to match our new threshold
        // 0% clouds = 10, 50% clouds = 0
        const cloudScore = Math.max(0, 10 - (cloudCover * 0.2));
        totalSIQS += cloudScore;
        count++;
      }
    }
  });
  
  return count > 0 ? totalSIQS / count : 0;
}
