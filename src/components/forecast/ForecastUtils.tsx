
import { formatDateForTimeZone } from "@/utils/timeZoneUtils";

/**
 * Extract future forecasts starting from current time
 * @param data Original forecast hourly array
 * @returns Filtered forecasts
 */
export const extractFutureForecasts = (data: any[]): any[] => {
  if (!data || !Array.isArray(data)) return [];
  
  const now = new Date();
  
  return data.filter(item => {
    const forecastTime = new Date(item.time);
    return forecastTime >= now;
  }).slice(0, 24); // Show next 24 hours only
};

/**
 * Extract nighttime forecasts (6PM-7AM hours)
 * @param data Original forecast hourly array
 * @returns Filtered forecasts for nighttime hours
 */
export const extractNightForecasts = (data: any[]): any[] => {
  if (!data || !Array.isArray(data)) return [];
  
  const now = new Date();
  
  return data.filter(item => {
    const forecastTime = new Date(item.time);
    if (forecastTime < now) return false;
    
    const hour = forecastTime.getHours();
    // Night hours between 6 PM and 7 AM
    return hour >= 18 || hour < 7;
  }).slice(0, 24); // Show next 24 night hours only
};

/**
 * Checks if cloud cover is too high for night sky observation
 * @param cloudCover Cloud cover percentage
 * @returns Boolean indicating if cloud cover is too high
 */
export const hasHighCloudCover = (cloudCover: number): boolean => {
  return cloudCover >= 40;
};

/**
 * Format date for display
 * @param dateString ISO date string
 * @param latitude Location latitude
 * @param longitude Location longitude
 * @returns Formatted date string
 */
export const formatDate = (
  dateString: string, 
  latitude?: number, 
  longitude?: number
): string => {
  try {
    const date = new Date(dateString);
    
    // If we have coordinates, use the location's time zone
    if (latitude && longitude) {
      return formatDateForTimeZone(date, latitude, longitude, 'MMM d');
    }
    
    // Fallback to local formatting
    return new Intl.DateTimeFormat('en-US', { 
      month: 'short', 
      day: 'numeric' 
    }).format(date);
  } catch (error) {
    console.error("Error formatting date:", error);
    return dateString;
  }
};

/**
 * Format time for display
 * @param dateString ISO date string
 * @param latitude Location latitude
 * @param longitude Location longitude
 * @returns Formatted time string
 */
export const formatTime = (
  dateString: string, 
  latitude?: number, 
  longitude?: number
): string => {
  try {
    const date = new Date(dateString);
    
    // If we have coordinates, use the location's time zone
    if (latitude && longitude) {
      return formatDateForTimeZone(date, latitude, longitude, 'HH:mm');
    }
    
    // Fallback to local formatting
    return new Intl.DateTimeFormat('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: false
    }).format(date);
  } catch (error) {
    console.error("Error formatting time:", error);
    return dateString;
  }
};

/**
 * Generate fallback forecasts when no data is available
 * @returns Array of fallback forecast objects
 */
export const generateFallbackForecasts = (): any[] => {
  const forecasts = [];
  const now = new Date();
  
  for (let i = 0; i < 15; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() + i);
    
    forecasts.push({
      date: date.toISOString(),
      temperature_max: 25,
      temperature_min: 15,
      humidity: 60,
      cloudCover: 30,
      windSpeed: 5,
      precipitation: 0,
      precipitation_probability: 0,
      temperature: 25
    });
  }
  
  return forecasts;
};

/**
 * Calculate SIQS rating based on weather conditions
 * @param cloudCover Cloud cover percentage
 * @param windSpeed Wind speed in km/h
 * @param humidity Humidity percentage
 * @returns SIQS rating object
 */
export const getSIQSRating = (cloudCover: number, windSpeed: number, humidity: number, t: any): {
  score: number;
  color: string;
  description?: string;
} => {
  // Don't calculate SIQS if cloud cover is too high
  if (cloudCover >= 40) {
    return {
      score: 0,
      color: 'text-red-500',
      description: t ? t("Poor", "很差") : "Poor"
    };
  }

  // Base score from clear sky
  let score = 5.0;
  
  // Reduce score based on cloud cover (most important factor)
  score -= (cloudCover / 20.0);
  
  // Reduce score based on wind (affects seeing)
  if (windSpeed > 15) {
    score -= Math.min(2.0, (windSpeed - 15) / 10.0);
  }
  
  // Reduce score based on humidity (affects transparency)
  if (humidity > 70) {
    score -= Math.min(1.0, (humidity - 70) / 30.0);
  }
  
  // Ensure score is between 0 and 5
  score = Math.max(0, Math.min(5, score));
  
  // Get color based on score
  let color = 'text-red-500';
  let description = t ? t("Poor", "很差") : "Poor";
  
  if (score >= 4.5) {
    color = 'text-emerald-500';
    description = t ? t("Excellent", "极佳") : "Excellent";
  } else if (score >= 3.5) {
    color = 'text-green-500';
    description = t ? t("Very Good", "很好") : "Very Good";
  } else if (score >= 2.5) {
    color = 'text-yellow-500';
    description = t ? t("Good", "好") : "Good";
  } else if (score >= 1.5) {
    color = 'text-orange-400';
    description = t ? t("Fair", "一般") : "Fair";
  }
  
  return { score, color, description };
};

/**
 * Check if a date is in night hours
 * @param dateStr Date string to check
 * @returns Boolean indicating if this is a night hour
 */
export const isNightHour = (dateStr: string): boolean => {
  const date = new Date(dateStr);
  const hour = date.getHours();
  // Night hours between 6 PM and 7 AM
  return hour >= 18 || hour < 7;
};

/**
 * Detect extreme weather conditions from forecast data
 * @param forecasts Forecast data array
 * @param t Translation function
 * @returns Array of weather alerts
 */
export const detectExtremeWeatherConditions = (forecasts: any[], t: any): any[] => {
  if (!forecasts || forecasts.length === 0) return [];
  
  const alerts = [];
  
  // Look for high wind
  const highWindForecasts = forecasts.filter(f => f.windSpeed > 30);
  if (highWindForecasts.length > 0) {
    alerts.push({
      type: "wind",
      title: t ? t("High Wind Alert", "强风预警") : "High Wind Alert",
      description: t ? 
        t("Strong winds expected that may affect observation conditions.", "预计将有强风，可能影响观测条件。") : 
        "Strong winds expected that may affect observation conditions.",
      time: highWindForecasts[0].time
    });
  }
  
  // Look for heavy precipitation
  const heavyRainForecasts = forecasts.filter(f => f.precipitation > 5);
  if (heavyRainForecasts.length > 0) {
    alerts.push({
      type: "rain",
      title: t ? t("Heavy Precipitation Alert", "强降水预警") : "Heavy Precipitation Alert",
      description: t ? 
        t("Significant precipitation expected that will affect visibility.", "预计将有明显降水，将影响能见度。") : 
        "Significant precipitation expected that will affect visibility.",
      time: heavyRainForecasts[0].time
    });
  }
  
  // Look for extreme weather codes (thunderstorms, etc)
  const extremeWeatherForecasts = forecasts.filter(f => {
    // WMO weather codes for extreme conditions
    const extremeCodes = [95, 96, 97, 98, 99]; // Thunderstorms with hail, etc.
    return extremeCodes.includes(f.weatherCode);
  });
  
  if (extremeWeatherForecasts.length > 0) {
    alerts.push({
      type: "storm",
      title: t ? t("Severe Weather Alert", "恶劣天气预警") : "Severe Weather Alert",
      description: t ? 
        t("Thunderstorms or extreme conditions expected.", "预计将有雷暴或极端天气情况。") : 
        "Thunderstorms or extreme conditions expected.",
      time: extremeWeatherForecasts[0].time
    });
  }
  
  return alerts;
};
