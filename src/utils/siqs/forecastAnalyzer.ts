
/**
 * Utility functions for analyzing forecast data for SIQS calculations
 */

/**
 * Determines if a time is within astronomical night hours (6 PM to 8 AM)
 * @param dateTime The time to check
 * @returns boolean indicating if it's night time
 */
export function isNightTime(dateTime: Date): boolean {
  const hour = dateTime.getHours();
  return hour >= 18 || hour < 8;
}

/**
 * Extract nighttime forecast items from forecast data
 * @param forecastData Forecast data with hourly items
 * @param startHour Starting hour for night (default: 18 / 6 PM)
 * @param endHour Ending hour for night (default: 6 / 6 AM)
 * @returns Object with extracted nighttime data
 */
export function extractNighttimeForecast(
  forecastData: any,
  startHour: number = 18,
  endHour: number = 6
): {
  nighttimeItems: any[];
  eveningItems: any[];
  morningItems: any[];
} {
  if (!forecastData || 
      !forecastData.hourly || 
      !Array.isArray(forecastData.hourly.time) || 
      forecastData.hourly.time.length === 0) {
    return {
      nighttimeItems: [],
      eveningItems: [],
      morningItems: []
    };
  }

  const nighttimeItems: any[] = [];
  const eveningItems: any[] = [];
  const morningItems: any[] = [];

  const times = forecastData.hourly.time;
  
  for (let i = 0; i < times.length; i++) {
    try {
      const time = new Date(times[i]);
      const hour = time.getHours();
      
      // Check if this is nighttime
      if (hour >= startHour || hour <= endHour) {
        // Create forecast item with all available hourly data
        const item: any = { time };
        
        // Copy all available hourly data for this time index
        Object.keys(forecastData.hourly).forEach(key => {
          if (key !== 'time' && Array.isArray(forecastData.hourly[key]) && i < forecastData.hourly[key].length) {
            item[key] = forecastData.hourly[key][i];
          }
        });
        
        // Add to nighttime items
        nighttimeItems.push(item);
        
        // Also categorize as evening or morning
        if (hour >= startHour) {
          eveningItems.push(item);
        } else {
          morningItems.push(item);
        }
      }
    } catch (error) {
      console.error("Error processing forecast time:", error);
    }
  }
  
  return {
    nighttimeItems,
    eveningItems,
    morningItems
  };
}

/**
 * Calculate average value for a property across forecast items
 * @param items Array of forecast items
 * @param property Property name to calculate average for
 * @param defaultValue Default value if no valid data found
 * @returns Average value
 */
export function calculateAverageValue(
  items: any[],
  property: string,
  defaultValue: number
): number {
  if (!items || !items.length) return defaultValue;
  
  let sum = 0;
  let count = 0;
  
  for (const item of items) {
    const value = item[property];
    if (value !== undefined && value !== null && !isNaN(Number(value))) {
      sum += Number(value);
      count++;
    }
  }
  
  return count > 0 ? sum / count : defaultValue;
}

/**
 * Get cloud cover information from forecast items
 * @param nighttimeItems Array of nighttime forecast items
 * @param eveningItems Array of evening forecast items
 * @param morningItems Array of morning forecast items
 * @returns Object with cloud cover averages
 */
export function getCloudCoverInfo(
  nighttimeItems: any[],
  eveningItems: any[],
  morningItems: any[]
): {
  avgNightCloudCover: number;
  avgEveningCloudCover: number;
  avgMorningCloudCover: number;
} {
  const avgNightCloudCover = calculateAverageValue(nighttimeItems, 'cloudcover', 50);
  const avgEveningCloudCover = calculateAverageValue(eveningItems, 'cloudcover', avgNightCloudCover);
  const avgMorningCloudCover = calculateAverageValue(morningItems, 'cloudcover', avgNightCloudCover);
  
  return {
    avgNightCloudCover,
    avgEveningCloudCover,
    avgMorningCloudCover
  };
}

/**
 * Get a descriptive string for cloud cover percentage
 * @param cloudCover Cloud cover percentage (0-100)
 * @param t Translation function (optional)
 * @returns Description string
 */
export function getCloudCoverDescription(cloudCover: number, t?: any): string {
  if (cloudCover <= 10) {
    return t 
      ? t("Clear skies (0-10%), excellent for imaging", "晴朗天空 (0-10%)，非常适合拍摄")
      : "Clear skies (0-10%), excellent for imaging";
  } else if (cloudCover <= 20) {
    return t 
      ? t("Mostly clear (10-20%), very good for imaging", "大部分清晰 (10-20%)，很适合拍摄")
      : "Mostly clear (10-20%), very good for imaging";
  } else if (cloudCover <= 40) {
    return t 
      ? t("Partly cloudy (20-40%), good for imaging", "部分多云 (20-40%)，适合拍摄")
      : "Partly cloudy (20-40%), good for imaging";
  } else if (cloudCover <= 60) {
    return t 
      ? t("Considerable clouds (40-60%), fair for imaging", "相当多云 (40-60%)，一般适合拍摄")
      : "Considerable clouds (40-60%), fair for imaging";
  } else if (cloudCover <= 80) {
    return t 
      ? t("Mostly cloudy (60-80%), poor for imaging", "大部分多云 (60-80%)，不太适合拍摄")
      : "Mostly cloudy (60-80%), poor for imaging";
  } else {
    return t 
      ? t("Heavy cloud cover (80-100%), not recommended for imaging", "浓密云层 (80-100%)，不建议拍摄")
      : "Heavy cloud cover (80-100%), not recommended for imaging";
  }
}
