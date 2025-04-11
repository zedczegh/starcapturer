
import { extractNightForecasts, calculateAverageCloudCover } from '@/components/forecast/NightForecastUtils';

/**
 * Extract and process nighttime forecast data
 * @param forecastData Hourly forecast data from API
 * @returns Processed nighttime data or null if not available
 */
export function extractNightForecastData(forecastData: any): any {
  if (!forecastData?.hourly) {
    return null;
  }
  
  try {
    // Extract nighttime forecasts (6 PM to 8 AM)
    const nightForecasts = extractNightForecasts(forecastData.hourly);
    
    if (nightForecasts.length === 0) {
      return null;
    }
    
    // Group forecasts by time ranges - evening (6pm-12am) and early morning (1am-8am)
    const eveningForecasts = nightForecasts.filter(forecast => {
      const hour = new Date(forecast.time).getHours();
      return hour >= 18 && hour <= 23;
    });
    
    const morningForecasts = nightForecasts.filter(forecast => {
      const hour = new Date(forecast.time).getHours();
      return hour >= 0 && hour < 8;
    });
    
    // Calculate average cloud cover for each time range
    const eveningCloudCover = calculateAverageCloudCover(eveningForecasts);
    const morningCloudCover = calculateAverageCloudCover(morningForecasts);
    
    // Weight the cloud cover based on actual number of hours in each period
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
      
    return {
      nightForecasts,
      eveningForecasts,
      morningForecasts,
      eveningCloudCover,
      morningCloudCover,
      avgNightCloudCover,
      avgNightWindSpeed,
      avgNightHumidity
    };
  } catch (error) {
    console.error("Error in extractNightForecastData:", error);
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
export function getConsistentSiqsValue(location: any): number {
  if (!location) return 0;
  
  // If location has a siqsResult property with nighttime calculation, prioritize that
  if (location.siqsResult && isNighttimeSiqsCalculation(location.siqsResult)) {
    return location.siqsResult.score;
  }
  
  // If location has a regular siqsResult, use that
  if (location.siqsResult && typeof location.siqsResult.score === 'number') {
    return location.siqsResult.score;
  }
  
  // If location has just a siqs property, use that
  if (typeof location.siqs === 'number') {
    return location.siqs;
  }
  
  // Default fallback based on bortle scale if available
  if (typeof location.bortleScale === 'number') {
    return Math.max(0, 10 - location.bortleScale);
  }
  
  return 0;
}
