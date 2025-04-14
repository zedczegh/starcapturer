/**
 * Utility functions for working with nighttime forecast data
 */

/**
 * Extract the nighttime hours (6 PM to 7 AM) from forecast data
 * @param hourlyData Hourly forecast data
 * @returns Array of nighttime forecast entries
 */
export function extractNightForecasts(hourlyData: any): any[] {
  if (!hourlyData || !hourlyData.time || !Array.isArray(hourlyData.time)) {
    return [];
  }
  
  const nightForecasts = [];
  
  // Process each hour
  for (let i = 0; i < hourlyData.time.length; i++) {
    const timeStr = hourlyData.time[i];
    const date = new Date(timeStr);
    const hour = date.getHours();
    
    // Consider night hours from 6 PM to 7 AM
    if (hour >= 18 || hour < 7) {
      const forecast = {
        time: timeStr,
        cloudCover: hourlyData.cloud_cover?.[i] || 0,
        windSpeed: hourlyData.wind_speed_10m?.[i] || hourlyData.windspeed_10m?.[i],
        humidity: hourlyData.relative_humidity_2m?.[i],
        hour: hour // Add hour for weighted calculations
      };
      
      nightForecasts.push(forecast);
    }
  }
  
  return nightForecasts;
}

/**
 * Calculate weighted average cloud cover from forecast entries
 * Hours during prime viewing time (10PM-4AM) get higher weight
 * @param forecasts Array of forecast entries
 * @returns Weighted average cloud cover percentage
 */
export function calculateAverageCloudCover(forecasts: any[]): number {
  if (!forecasts || forecasts.length === 0) {
    return 0;
  }
  
  let totalCloudCover = 0;
  let totalWeight = 0;
  
  for (const forecast of forecasts) {
    if (forecast && typeof forecast.cloudCover === 'number') {
      // Use weighting system based on hour
      // Prime viewing hours (10PM-4AM) get double weight
      let weight = 1.0;
      const hour = forecast.hour || new Date(forecast.time).getHours();
      
      // Prime hours get double weight (10PM - 4AM)
      if ((hour >= 22 && hour <= 23) || (hour >= 0 && hour <= 4)) {
        weight = 2.0;
      }
      
      totalCloudCover += forecast.cloudCover * weight;
      totalWeight += weight;
    }
  }
  
  return totalWeight > 0 ? (totalCloudCover / totalWeight) : 0;
}

/**
 * Split nighttime forecasts into evening and morning segments
 * @param forecasts Array of nighttime forecast entries
 * @returns Object with evening and morning averages
 */
export function splitEveningMorningForecasts(forecasts: any[]): { evening: number; morning: number } {
  const eveningForecasts = forecasts.filter(forecast => {
    const hour = forecast.hour || new Date(forecast.time).getHours();
    return hour >= 18 && hour <= 23;
  });
  
  const morningForecasts = forecasts.filter(forecast => {
    const hour = forecast.hour || new Date(forecast.time).getHours();
    return hour >= 0 && hour < 7;
  });
  
  const eveningCloudCover = calculateAverageCloudCover(eveningForecasts);
  const morningCloudCover = calculateAverageCloudCover(morningForecasts);
  
  return {
    evening: eveningCloudCover,
    morning: morningCloudCover
  };
}

/**
 * Format nighttime hours range as a readable string
 * @returns Formatted time range string
 */
export function formatNighttimeHoursRange(): string {
  return "6PM-7AM";
}

/**
 * Calculate sunset and sunrise times for a location
 * @param lat Latitude
 * @param lng Longitude
 * @param date Date to calculate for
 * @returns Object with sunset and sunrise times
 */
export function calculateSunriseSunset(lat: number, lng: number, date: Date = new Date()): { 
  sunrise: Date; 
  sunset: Date;
} {
  // This is a simplified calculation that doesn't account for all factors
  // In a production app, you'd use a more precise algorithm or API
  
  // Day of year (approximate)
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = (date.getTime() - start.getTime()) + 
    ((start.getTimezoneOffset() - date.getTimezoneOffset()) * 60 * 1000);
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  // Calculate approximate sunrise/sunset times
  // This is a very simplified model
  const sunriseHour = 6 + (lat > 0 ? -1 : 1) * Math.sin(2 * Math.PI * dayOfYear / 365) * 1.5;
  const sunsetHour = 18 + (lat > 0 ? 1 : -1) * Math.sin(2 * Math.PI * dayOfYear / 365) * 1.5;
  
  const sunrise = new Date(date);
  sunrise.setHours(Math.floor(sunriseHour), Math.round((sunriseHour % 1) * 60), 0);
  
  const sunset = new Date(date);
  sunset.setHours(Math.floor(sunsetHour), Math.round((sunsetHour % 1) * 60), 0);
  
  return { sunrise, sunset };
}

/**
 * Determine if a given time is night (between sunset and sunrise)
 * @param time Time to check
 * @param lat Latitude for sunset/sunrise calculation
 * @param lng Longitude for sunset/sunrise calculation
 * @returns Boolean indicating if it's nighttime
 */
export function isNighttime(time: Date, lat: number, lng: number): boolean {
  const { sunrise, sunset } = calculateSunriseSunset(lat, lng, time);
  const hour = time.getHours();
  
  // Simplified check - between 6 PM and 8 AM
  return hour >= 18 || hour < 8;
}

/**
 * Get the time range for the next night period
 * @returns Object with start and end times for the night period
 */
export function getNextNightPeriod(): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(now);
  const end = new Date(now);
  
  const currentHour = now.getHours();
  
  // If it's before 6 PM, night starts today at 6 PM
  if (currentHour < 18) {
    start.setHours(18, 0, 0, 0);
    end.setDate(end.getDate() + 1);
    end.setHours(8, 0, 0, 0);
  } 
  // If it's after 6 PM but before midnight, night already started, ends tomorrow at 8 AM
  else if (currentHour >= 18) {
    start.setHours(18, 0, 0, 0); // Night already started at 6 PM
    end.setDate(end.getDate() + 1);
    end.setHours(8, 0, 0, 0);
  } 
  // If it's after midnight but before 8 AM, night already started yesterday, ends today at 8 AM
  else if (currentHour < 8) {
    start.setDate(start.getDate() - 1);
    start.setHours(18, 0, 0, 0);
    end.setHours(8, 0, 0, 0);
  }
  
  return { start, end };
}
