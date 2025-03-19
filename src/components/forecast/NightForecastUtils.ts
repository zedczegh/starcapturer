
/**
 * Utility functions for extracting and processing night forecast data
 * This file contains optimized functions for working with forecast data during nighttime hours
 */

// Extract nighttime forecasts between 6 PM and 8 AM
export const extractNightForecasts = (hourlyData: any) => {
  const nightForecast = [];
  
  if (!hourlyData || !hourlyData.time || !hourlyData.time.length) {
    return [];
  }
  
  for (let i = 0; i < hourlyData.time.length; i++) {
    const date = new Date(hourlyData.time[i]);
    const hour = date.getHours();
    
    // Include hours between 6 PM (18) and 8 AM (8)
    if (hour >= 18 || hour < 8) {
      // Skip entries with missing data
      if (hourlyData.cloud_cover === undefined || hourlyData.wind_speed_10m === undefined) {
        continue;
      }
      
      nightForecast.push({
        time: hourlyData.time[i],
        cloudCover: hourlyData.cloud_cover?.[i] ?? 0,
        windSpeed: hourlyData.wind_speed_10m?.[i] ?? 0,
        humidity: hourlyData.relative_humidity_2m?.[i] ?? 0,
        precipitation: hourlyData.precipitation?.[i] ?? 0,
        weatherCondition: hourlyData.weather_code?.[i] ?? 0
      });
    }
  }
  
  return nightForecast;
};

// Calculate average cloud cover from nighttime forecasts
export const calculateAverageCloudCover = (nightForecasts: any[]) => {
  if (!nightForecasts || nightForecasts.length === 0) {
    return 0;
  }
  
  const sum = nightForecasts.reduce((total, forecast) => total + (forecast.cloudCover || 0), 0);
  return sum / nightForecasts.length;
};

// Calculate average wind speed from nighttime forecasts
export const calculateAverageWindSpeed = (nightForecasts: any[]) => {
  if (!nightForecasts || nightForecasts.length === 0) {
    return 0;
  }
  
  const sum = nightForecasts.reduce((total, forecast) => total + (forecast.windSpeed || 0), 0);
  return sum / nightForecasts.length;
};

// Check if any forecast period has high cloud cover (over threshold)
export const hasHighCloudCover = (nightForecasts: any[], threshold: number = 40) => {
  if (!nightForecasts || nightForecasts.length === 0) {
    return false;
  }
  
  return nightForecasts.some(forecast => (forecast.cloudCover || 0) > threshold);
};

// Get an array of cloud cover values for each nighttime hour
export const getNightCloudCoverValues = (nightForecasts: any[]) => {
  if (!nightForecasts || nightForecasts.length === 0) {
    return [];
  }
  
  return nightForecasts.map(forecast => forecast.cloudCover || 0);
};
