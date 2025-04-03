
import { calculateSIQS } from "@/lib/calculateSIQS";
import { extractNightForecasts, formatNighttimeHoursRange } from "@/components/forecast/NightForecastUtils";

/**
 * Calculate SIQS based on nighttime forecasts
 * @param locationData Location data including weather and Bortle scale
 * @param forecastData Hourly forecast data
 * @param t Translation function
 * @returns SIQS result object
 */
export function calculateNighttimeSIQS(locationData: any, forecastData: any, t: any): any {
  if (!locationData || !forecastData?.hourly) {
    console.log("Insufficient data for nighttime SIQS calculation");
    return null;
  }
  
  try {
    console.log("Starting nighttime SIQS calculation");
    
    // Extract nighttime forecasts
    const nightForecasts = extractNightForecasts(forecastData.hourly);
    
    if (nightForecasts.length === 0) {
      console.log("No nighttime forecast data available");
      return null;
    }
    
    console.log(`Found ${nightForecasts.length} nighttime forecast hours (6 PM to 8 AM)`);
    
    // Calculate average cloud cover for the night
    let totalCloudCover = 0;
    let validCloudCoverCount = 0;
    
    for (const forecast of nightForecasts) {
      if (typeof forecast.cloudCover === 'number') {
        totalCloudCover += forecast.cloudCover;
        validCloudCoverCount++;
      }
    }
    
    const avgNightCloudCover = validCloudCoverCount > 0 
      ? totalCloudCover / validCloudCoverCount 
      : 50; // Default if no data
    
    console.log(`Average cloud cover during nighttime (6 PM to 8 AM): ${avgNightCloudCover}%`);
    
    // Calculate average wind speed for the night
    let totalWindSpeed = 0;
    let validWindSpeedCount = 0;
    
    for (const forecast of nightForecasts) {
      if (typeof forecast.windSpeed === 'number') {
        totalWindSpeed += forecast.windSpeed;
        validWindSpeedCount++;
      }
    }
    
    const avgNightWindSpeed = validWindSpeedCount > 0 
      ? totalWindSpeed / validWindSpeedCount 
      : 10; // Default if no data
    
    // Calculate average humidity for the night
    let totalHumidity = 0;
    let validHumidityCount = 0;
    
    for (const forecast of nightForecasts) {
      if (typeof forecast.humidity === 'number') {
        totalHumidity += forecast.humidity;
        validHumidityCount++;
      }
    }
    
    const avgNightHumidity = validHumidityCount > 0 
      ? totalHumidity / validHumidityCount 
      : 50; // Default if no data
    
    // Use SIQS calculation with nighttime averages
    const siqsResult = calculateSIQS({
      cloudCover: avgNightCloudCover,
      bortleScale: locationData.bortleScale || 5,
      seeingConditions: locationData.seeingConditions || 3,
      windSpeed: avgNightWindSpeed,
      humidity: avgNightHumidity,
      moonPhase: locationData.moonPhase || 0.5,
      precipitation: locationData.weatherData?.precipitation || 0,
      weatherCondition: locationData.weatherData?.weatherCondition || "",
      aqi: locationData.weatherData?.aqi,
      clearSkyRate: locationData.weatherData?.clearSkyRate,
      nightForecast: nightForecasts
    });
    
    // Add nighttime data to the cloud cover factor
    if (siqsResult && siqsResult.factors) {
      siqsResult.factors = siqsResult.factors.map((factor: any) => {
        if (factor.name === "Cloud Cover" || (t && factor.name === t("Cloud Cover", "云层覆盖"))) {
          return {
            ...factor,
            nighttimeData: {
              average: avgNightCloudCover,
              timeRange: formatNighttimeHoursRange()
            }
          };
        }
        return factor;
      });
    }
    
    console.log(`Final SIQS score based on nighttime forecast: ${siqsResult.score.toFixed(1)}`);
    
    return siqsResult;
    
  } catch (error) {
    console.error("Error in nighttime SIQS calculation:", error);
    return null;
  }
}
