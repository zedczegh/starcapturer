
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
    
    // Extract nighttime forecasts
    const nightForecasts = extractNightForecasts(forecastData.hourly);
    
    if (nightForecasts.length === 0) {
      console.log("No nighttime forecast data available");
      return null;
    }
    
    console.log(`Found ${nightForecasts.length} nighttime forecast hours (6 PM to 8 AM)`);
    
    // Group forecasts by time ranges - evening (6pm-12am) and early morning (1am-8am)
    const eveningForecasts = nightForecasts.filter(forecast => {
      const hour = new Date(forecast.time).getHours();
      return hour >= 18 && hour <= 23;
    });
    
    const morningForecasts = nightForecasts.filter(forecast => {
      const hour = new Date(forecast.time).getHours();
      return hour >= 0 && hour < 8;
    });
    
    console.log(`Evening forecasts (6PM-12AM): ${eveningForecasts.length}, Morning forecasts (1AM-8AM): ${morningForecasts.length}`);
    
    // Calculate average cloud cover for each time range - only count valid entries
    const eveningCloudCover = calculateAverageCloudCover(eveningForecasts);
    const morningCloudCover = calculateAverageCloudCover(morningForecasts);
    
    console.log(`Average cloud cover - Evening: ${eveningCloudCover.toFixed(1)}%, Morning: ${morningCloudCover.toFixed(1)}%`);
    
    // Weight the cloud cover based on actual number of hours in each period
    const totalHours = eveningForecasts.length + morningForecasts.length;
    
    // Calculate weighted average - if one period has no data, use the other
    let avgNightCloudCover;
    if (eveningForecasts.length === 0 && morningForecasts.length === 0) {
      avgNightCloudCover = 50; // Default if no data
    } else if (eveningForecasts.length === 0) {
      avgNightCloudCover = morningCloudCover;
    } else if (morningForecasts.length === 0) {
      avgNightCloudCover = eveningCloudCover;
    } else {
      // Correctly weight by number of hours in each period
      avgNightCloudCover = (
        (eveningCloudCover * eveningForecasts.length) + 
        (morningCloudCover * morningForecasts.length)
      ) / totalHours;
    }
    
    console.log(`Weighted average cloud cover for night: ${avgNightCloudCover.toFixed(1)}%`);
    
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
    
    // Add detailed nighttime data to the cloud cover factor
    if (siqsResult && siqsResult.factors) {
      siqsResult.factors = siqsResult.factors.map((factor: any) => {
        if (factor.name === "Cloud Cover" || (t && factor.name === t("Cloud Cover", "云层覆盖"))) {
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
    
    console.log(`Final SIQS score based on nighttime forecast: ${siqsResult.score.toFixed(1)}`);
    
    return siqsResult;
    
  } catch (error) {
    console.error("Error in nighttime SIQS calculation:", error);
    return null;
  }
}
