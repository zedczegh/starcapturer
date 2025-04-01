
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
  console.log("Starting nighttime SIQS calculation");
  if (!locationData?.weatherData || !forecastData?.hourly) {
    console.log("Missing required data for nighttime SIQS calculation");
    return null;
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
      console.log("No nighttime forecasts found in data");
      return null;
    }
    
    console.log(`Found ${nightForecasts.length} nighttime forecast hours`);
    
    // Calculate average values for cloud cover, wind speed, and humidity
    const avgCloudCover = calculateAverageCloudCover(nightForecasts);
    console.log(`Average cloud cover: ${avgCloudCover}%`);
    
    // Check if cloud cover is too high to make imaging possible
    if (avgCloudCover > 40) {
      console.log(`Average cloud cover is ${avgCloudCover}%, which exceeds 40% threshold. SIQS score = 0`);
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
          if (cloudCover < 40) {
            forecast.siqs.score = Math.max(0, 10 - (cloudCover * 0.25));
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
      if (cloudCover < 40) {
        // Simple formula: 10 - (cloudCover * 0.25)
        // 0% clouds = 10, 40% clouds = 0
        const cloudScore = Math.max(0, 10 - (cloudCover * 0.25));
        totalSIQS += cloudScore;
        count++;
      }
    }
  });
  
  return count > 0 ? totalSIQS / count : 0;
}
