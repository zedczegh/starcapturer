
/**
 * Utility functions for extracting and working with hourly cloud cover data
 * Centralized to avoid code duplication across components
 */

/**
 * Extract cloud cover for a specific hour from forecast data
 * @param forecastData The complete forecast data object
 * @param targetHour The specific hour (0-23) to extract cloud cover for
 * @returns Cloud cover percentage or null if not available
 */
export function extractSingleHourCloudCover(forecastData: any, targetHour: number = 1): number | null {
  if (!forecastData || !forecastData.hourly) {
    return null;
  }
  
  try {
    // Get current date at midnight
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Set target time to today at the specified hour
    const targetTime = new Date(today);
    targetTime.setHours(targetHour, 0, 0, 0);
    
    // Find closest hour in forecast data
    const hourlyData = forecastData.hourly;
    
    // If we have time property in hourly data, use it to find the target hour
    if (hourlyData[0] && 'time' in hourlyData[0]) {
      for (const hour of hourlyData) {
        const hourTime = new Date(hour.time);
        if (hourTime.getHours() === targetHour) {
          if ('cloud_cover' in hour) return hour.cloud_cover;
          if ('cloudcover' in hour) return hour.cloudcover;
          if ('clouds' in hour) return hour.clouds;
        }
      }
    }
    
    // Fallback to using the index if we can't find by time
    // Most APIs provide 24 hours of data starting at midnight
    const hourIndex = targetHour;
    
    if (hourlyData[hourIndex]) {
      if ('cloud_cover' in hourlyData[hourIndex]) return hourlyData[hourIndex].cloud_cover;
      if ('cloudcover' in hourlyData[hourIndex]) return hourlyData[hourIndex].cloudcover;
      if ('clouds' in hourlyData[hourIndex]) return hourlyData[hourIndex].clouds;
    }
    
    return null;
  } catch (error) {
    console.warn("Error extracting hourly cloud cover:", error);
    return null;
  }
}

/**
 * Determine if forecast data contains the target hour
 * @param forecastData The forecast data object
 * @param targetHour The target hour to check for
 * @returns Boolean indicating if the target hour is in the forecast
 */
export function hasForecastDataForHour(forecastData: any, targetHour: number = 1): boolean {
  return extractSingleHourCloudCover(forecastData, targetHour) !== null;
}

/**
 * Get the best hour for astronomical viewing based on cloud cover
 * @param forecastData The forecast data object
 * @returns The hour with the lowest cloud cover (0-23)
 */
export function getBestAstronomicalHour(forecastData: any): number | null {
  if (!forecastData || !forecastData.hourly) {
    return null;
  }
  
  try {
    const hourlyData = forecastData.hourly;
    let bestHour = 1; // Default to 1 AM
    let lowestCloudCover = 100;
    
    // Check hours between 10 PM and 4 AM (common dark sky hours)
    for (let hour = 22; hour <= 23; hour++) {
      const cloudCover = extractSingleHourCloudCover(forecastData, hour);
      if (cloudCover !== null && cloudCover < lowestCloudCover) {
        lowestCloudCover = cloudCover;
        bestHour = hour;
      }
    }
    
    for (let hour = 0; hour <= 4; hour++) {
      const cloudCover = extractSingleHourCloudCover(forecastData, hour);
      if (cloudCover !== null && cloudCover < lowestCloudCover) {
        lowestCloudCover = cloudCover;
        bestHour = hour;
      }
    }
    
    return bestHour;
  } catch (error) {
    console.warn("Error finding best astronomical hour:", error);
    return 1; // Default to 1 AM
  }
}
