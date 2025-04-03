
import { calculateSIQS } from "@/lib/calculateSIQS";
import { 
  extractNightForecasts, 
  formatNighttimeHoursRange, 
  calculateAverageCloudCover 
} from "@/components/forecast/NightForecastUtils";

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
    
    // Extract nighttime forecasts with improved error handling
    const nightForecasts = extractNightForecasts(forecastData.hourly);
    
    if (!nightForecasts || nightForecasts.length === 0) {
      console.log("No nighttime forecast data available");
      return null;
    }
    
    console.log(`Found ${nightForecasts.length} nighttime forecast hours (6 PM to 8 AM)`);
    
    // Validate forecast data before processing
    const validForecasts = nightForecasts.filter(forecast => 
      forecast && 
      forecast.time && 
      typeof forecast.cloudCover === 'number'
    );
    
    if (validForecasts.length === 0) {
      console.log("No valid forecast data found after validation");
      return null;
    }
    
    console.log(`Valid forecast entries after validation: ${validForecasts.length}`);
    
    // Group forecasts by time ranges with validation
    const eveningForecasts = validForecasts.filter(forecast => {
      const hour = new Date(forecast.time).getHours();
      return hour >= 18 && hour <= 23;
    });
    
    const morningForecasts = validForecasts.filter(forecast => {
      const hour = new Date(forecast.time).getHours();
      return hour >= 0 && hour < 8;
    });
    
    console.log(`Evening forecasts (6PM-12AM): ${eveningForecasts.length}, Morning forecasts (1AM-8AM): ${morningForecasts.length}`);
    
    // Calculate average cloud cover for each time range with validation
    const eveningCloudCover = calculateAverageCloudCover(eveningForecasts);
    const morningCloudCover = calculateAverageCloudCover(morningForecasts);
    
    console.log(`Average cloud cover - Evening: ${eveningCloudCover.toFixed(1)}%, Morning: ${morningCloudCover.toFixed(1)}%`);
    
    // Calculate weighted average cloud cover based on number of hours in each period
    let avgNightCloudCover;
    const totalHours = eveningForecasts.length + morningForecasts.length;
    
    if (totalHours === 0) {
      console.log("No valid hourly forecasts, using default cloud cover");
      avgNightCloudCover = locationData.weatherData?.cloudCover || 50;
    } else {
      avgNightCloudCover = (
        (eveningCloudCover * eveningForecasts.length) + 
        (morningCloudCover * morningForecasts.length)
      ) / totalHours;
    }
    
    console.log(`Weighted average cloud cover for night: ${avgNightCloudCover.toFixed(1)}%`);
    
    // Calculate average wind speed and humidity with validation
    let totalWindSpeed = 0;
    let validWindSpeedCount = 0;
    
    for (const forecast of validForecasts) {
      if (typeof forecast.windSpeed === 'number') {
        totalWindSpeed += forecast.windSpeed;
        validWindSpeedCount++;
      }
    }
    
    const avgNightWindSpeed = validWindSpeedCount > 0 
      ? totalWindSpeed / validWindSpeedCount 
      : locationData.weatherData?.windSpeed || 10;
    
    let totalHumidity = 0;
    let validHumidityCount = 0;
    
    for (const forecast of validForecasts) {
      if (typeof forecast.humidity === 'number') {
        totalHumidity += forecast.humidity;
        validHumidityCount++;
      }
    }
    
    const avgNightHumidity = validHumidityCount > 0 
      ? totalHumidity / validHumidityCount 
      : locationData.weatherData?.humidity || 50;
    
    console.log(`SIQS calculation with ${validForecasts.length} nighttime forecast items`);
    console.log(`Using nighttime forecast data for SIQS calculation`);
    console.log(`Average values - Cloud: ${avgNightCloudCover.toFixed(1)}%, Wind: ${avgNightWindSpeed.toFixed(1)}km/h, Humidity: ${avgNightHumidity.toFixed(1)}%`);
    
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
      nightForecast: validForecasts
    });
    
    // Add detailed nighttime data to the cloud cover factor
    if (siqsResult && siqsResult.factors) {
      siqsResult.factors = siqsResult.factors.map((factor: any) => {
        if (factor && (factor.name === "Cloud Cover" || (t && factor.name === t("Cloud Cover", "云层覆盖")))) {
          return {
            ...factor,
            nighttimeData: {
              average: avgNightCloudCover,
              timeRange: formatNighttimeHoursRange(),
              detail: {
                evening: eveningCloudCover,
                morning: morningCloudCover
              }
            }
          };
        }
        return factor;
      });
    }
    
    console.log(`Final SIQS score based on nighttime forecast: ${siqsResult?.score?.toFixed(1) || "N/A"}`);
    
    return siqsResult;
    
  } catch (error) {
    console.error("Error in nighttime SIQS calculation:", error);
    return null;
  }
}
