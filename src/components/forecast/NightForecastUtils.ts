
/**
 * Utility functions for extracting nighttime forecasts
 */

/**
 * Extract nighttime forecasts from hourly forecasts
 * Specifically targeting hours from 6 PM to 8 AM of the next day
 * @param hourlyData Hourly forecast data
 * @returns Array of forecast objects during nighttime
 */
export function extractNightForecasts(hourlyData: any) {
  if (!hourlyData || !hourlyData.time || !Array.isArray(hourlyData.time)) {
    return [];
  }
  
  const nightForecasts = [];
  
  for (let i = 0; i < hourlyData.time.length; i++) {
    // Create date object from forecast time
    const date = new Date(hourlyData.time[i]);
    const hour = date.getHours();
    
    // Include hours that are after 6 PM (18:00) or before 8 AM (8:00)
    if (hour >= 18 || hour < 8) {
      // Extract all available data for this hour
      const forecast = {
        time: hourlyData.time[i],
        cloudCover: hourlyData.cloud_cover?.[i] !== undefined ? hourlyData.cloud_cover[i] : null,
        windSpeed: hourlyData.wind_speed_10m?.[i] !== undefined ? hourlyData.wind_speed_10m[i] : null,
        humidity: hourlyData.relative_humidity_2m?.[i] !== undefined ? hourlyData.relative_humidity_2m[i] : null,
        precipitation: hourlyData.precipitation?.[i] !== undefined ? hourlyData.precipitation[i] : 0,
        weatherCode: hourlyData.weather_code?.[i] !== undefined ? hourlyData.weather_code[i] : null,
        temperature: hourlyData.temperature_2m?.[i] !== undefined ? hourlyData.temperature_2m[i] : null
      };
      
      // Add forecast to array if it has cloud cover data
      if (forecast.cloudCover !== null) {
        nightForecasts.push(forecast);
      }
    }
  }
  
  return nightForecasts;
}

/**
 * Calculate average cloud cover from nighttime forecasts
 * @param forecasts Array of forecast objects
 * @returns Average cloud cover percentage
 */
export function calculateAverageCloudCover(forecasts: any[]): number {
  if (!forecasts || forecasts.length === 0) {
    return 0;
  }
  
  // Filter for forecasts with valid cloud cover data
  const validForecasts = forecasts.filter(f => 
    f.cloudCover !== null && 
    f.cloudCover !== undefined &&
    !isNaN(f.cloudCover)
  );
  
  if (validForecasts.length === 0) {
    return 0;
  }
  
  // Calculate average cloud cover
  const sum = validForecasts.reduce((acc, f) => acc + f.cloudCover, 0);
  return sum / validForecasts.length;
}

/**
 * Calculate average wind speed from nighttime forecasts
 * @param forecasts Array of forecast objects
 * @returns Average wind speed in km/h
 */
export function calculateAverageWindSpeed(forecasts: any[]): number {
  if (!forecasts || forecasts.length === 0) {
    return 0;
  }
  
  // Filter for forecasts with valid wind speed data
  const validForecasts = forecasts.filter(f => 
    f.windSpeed !== null && 
    f.windSpeed !== undefined &&
    !isNaN(f.windSpeed)
  );
  
  if (validForecasts.length === 0) {
    return 0;
  }
  
  // Calculate average wind speed
  const sum = validForecasts.reduce((acc, f) => acc + f.windSpeed, 0);
  return sum / validForecasts.length;
}

/**
 * Calculate average humidity from nighttime forecasts
 * @param forecasts Array of forecast objects
 * @returns Average humidity percentage
 */
export function calculateAverageHumidity(forecasts: any[]): number {
  if (!forecasts || forecasts.length === 0) {
    return 0;
  }
  
  // Filter for forecasts with valid humidity data
  const validForecasts = forecasts.filter(f => 
    f.humidity !== null && 
    f.humidity !== undefined &&
    !isNaN(f.humidity)
  );
  
  if (validForecasts.length === 0) {
    return 0;
  }
  
  // Calculate average humidity
  const sum = validForecasts.reduce((acc, f) => acc + f.humidity, 0);
  return sum / validForecasts.length;
}

/**
 * Format the nighttime hours range for display in UI
 * @returns Formatted string showing time range
 */
export function formatNighttimeHoursRange(): string {
  return "6PM to 8AM";
}

/**
 * Format the nighttime hours range in the current language
 * @param language Current language code
 * @returns Localized time range string
 */
export function formatLocalizedNighttimeRange(language: 'en' | 'zh'): string {
  return language === 'en' ? "6PM to 8AM" : "18:00至次日08:00";
}

/**
 * Determine if a specific hour is considered nighttime
 * @param hour Hour in 24-hour format (0-23)
 * @returns Boolean indicating if it's nighttime
 */
export function isNighttimeHour(hour: number): boolean {
  return hour >= 18 || hour < 8;
}

/**
 * Calculate percentage of nighttime hours with good viewing conditions
 * @param forecasts Array of forecast objects
 * @param maxCloudCover Maximum cloud cover percentage for good conditions
 * @returns Percentage of good viewing hours
 */
export function calculateGoodViewingHoursPercentage(
  forecasts: any[], 
  maxCloudCover: number = 30
): number {
  if (!forecasts || forecasts.length === 0) {
    return 0;
  }
  
  // Count hours with cloud cover below threshold
  const goodHours = forecasts.filter(f => 
    f.cloudCover !== null && 
    f.cloudCover !== undefined &&
    f.cloudCover <= maxCloudCover
  ).length;
  
  return (goodHours / forecasts.length) * 100;
}
