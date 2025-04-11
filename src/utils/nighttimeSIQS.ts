
import { calculateSIQS } from "@/lib/calculateSIQS";
import { 
  extractNightForecasts, 
  formatNighttimeHoursRange, 
  calculateAverageCloudCover 
} from "@/components/forecast/NightForecastUtils";
import { SharedAstroSpot } from '@/lib/siqs/types'; // Import the correct type definition

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
      // Prioritize evening hours for astrophotography (they're more valuable)
      avgNightCloudCover = (
        (eveningCloudCover * eveningForecasts.length * 1.5) + 
        (morningCloudCover * morningForecasts.length)
      ) / (eveningForecasts.length * 1.5 + morningForecasts.length);
    }
    
    console.log(`Weighted average cloud cover for night: ${avgNightCloudCover.toFixed(1)}%`);
    
    // Calculate average wind speed for the night (prioritize evening data)
    let totalWindSpeed = 0;
    let validWindSpeedCount = 0;
    
    // First add evening wind speeds with higher weight
    for (const forecast of eveningForecasts) {
      if (typeof forecast.windSpeed === 'number') {
        totalWindSpeed += forecast.windSpeed * 1.5; // Higher weight for evening
        validWindSpeedCount += 1.5;
      }
    }
    
    // Then add morning wind speeds
    for (const forecast of morningForecasts) {
      if (typeof forecast.windSpeed === 'number') {
        totalWindSpeed += forecast.windSpeed;
        validWindSpeedCount += 1;
      }
    }
    
    const avgNightWindSpeed = validWindSpeedCount > 0 
      ? totalWindSpeed / validWindSpeedCount 
      : 10; // Default if no data
    
    // Calculate average humidity for the night with similar evening priority
    let totalHumidity = 0;
    let validHumidityCount = 0;
    
    for (const forecast of eveningForecasts) {
      if (typeof forecast.humidity === 'number') {
        totalHumidity += forecast.humidity * 1.5; // Higher weight for evening
        validHumidityCount += 1.5;
      }
    }
    
    for (const forecast of morningForecasts) {
      if (typeof forecast.humidity === 'number') {
        totalHumidity += forecast.humidity;
        validHumidityCount += 1;
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
      nightForecast: nightForecasts,
      isNighttimeCalculation: true // Flag to indicate this is a nighttime calculation
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
    
    // Store nighttime calculation metadata for consistency checks
    if (siqsResult) {
      siqsResult.metadata = {
        calculationType: 'nighttime',
        eveningCloudCover,
        morningCloudCover,
        avgNightCloudCover,
        timestamp: new Date().toISOString()
      };
    }
    
    console.log(`Final SIQS score based on nighttime forecast: ${siqsResult.score.toFixed(1)}`);
    
    return siqsResult;
    
  } catch (error) {
    console.error("Error in nighttime SIQS calculation:", error);
    return null;
  }
}

/**
 * Helper function to determine if a given SIQS result is from a nighttime calculation
 * @param siqsResult SIQS result to check
 * @returns Boolean indicating if it's a nighttime calculation
 */
export function isNighttimeSiqsCalculation(siqsResult: any): boolean {
  if (!siqsResult) return false;
  
  // Check for nighttime metadata
  if (siqsResult.metadata?.calculationType === 'nighttime') return true;
  
  // Check for nighttime data in factors
  return siqsResult.factors?.some((factor: any) => 
    factor.nighttimeData && typeof factor.nighttimeData.average === 'number'
  ) || false;
}

/**
 * Ensure SIQS consistency between different views
 * @param location Location object that may have SIQS data
 * @returns Consistent SIQS value
 */
export function getConsistentSiqsValue(location: SharedAstroSpot | any): number {
  if (!location) return 0;
  
  // If location has a siqsResult property with nighttime calculation, prioritize that
  if (location.siqsResult && isNighttimeSiqsCalculation(location.siqsResult)) {
    console.log("Using nighttime SIQS calculation:", location.siqsResult.score);
    return location.siqsResult.score;
  }
  
  // If location has a regular siqsResult, use that
  if (location.siqsResult && typeof location.siqsResult.score === 'number') {
    console.log("Using regular SIQS calculation:", location.siqsResult.score);
    return location.siqsResult.score;
  }
  
  // If location has just a siqs property, use that
  if (typeof location.siqs === 'number') {
    console.log("Using direct SIQS value:", location.siqs);
    return location.siqs;
  }
  
  // Default fallback based on bortle scale if available
  if (typeof location.bortleScale === 'number') {
    const fallbackSiqs = Math.max(0, 10 - location.bortleScale);
    console.log("Using fallback SIQS from Bortle scale:", fallbackSiqs);
    return fallbackSiqs;
  }
  
  return 0;
}
