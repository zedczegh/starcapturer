
import React from "react";

/**
 * Utility functions for processing and displaying forecast data
 */

// Extract future forecast data, filtering out past times and limiting to the next 24 hours
export const extractFutureForecasts = (hourlyData: any, limit?: number) => {
  if (!hourlyData || !hourlyData.time) return [];
  
  const now = new Date();
  const futureForecasts = [];
  const twentyFourHoursLater = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  
  for (let i = 0; i < hourlyData.time.length; i++) {
    const forecastTime = new Date(hourlyData.time[i]);
    
    // Only include times in the future and within the next 24 hours by default
    if (forecastTime > now && (!limit || forecastTime <= twentyFourHoursLater)) {
      futureForecasts.push({
        time: hourlyData.time[i],
        temperature: hourlyData.temperature_2m?.[i],
        precipitation: hourlyData.precipitation?.[i] || 0,
        cloudCover: hourlyData.cloud_cover?.[i] || 0,
        windSpeed: hourlyData.wind_speed_10m?.[i] || 0,
        humidity: hourlyData.relative_humidity_2m?.[i] || 0,
        weatherCode: hourlyData.weather_code?.[i]
      });
      
      // Limit the number of forecasts if specified
      if (limit && futureForecasts.length >= limit) break;
    }
  }
  
  return futureForecasts;
};

// Extract nighttime forecasts (6 PM to 8 AM)
export const extractNightForecasts = (hourlyData: any) => {
  const nightForecast = [];
  
  if (!hourlyData || !hourlyData.time || !hourlyData.time.length) {
    return [];
  }
  
  const now = new Date();
  const twentyFourHoursLater = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  
  for (let i = 0; i < hourlyData.time.length; i++) {
    const date = new Date(hourlyData.time[i]);
    
    // Only include forecasts within the next 24 hours
    if (date > now && date <= twentyFourHoursLater) {
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
  }
  
  return nightForecast;
};

// Group forecasts by date for better presentation
export const groupForecastsByDate = (forecasts: any[]) => {
  const grouped: Record<string, any[]> = {};
  
  forecasts.forEach(forecast => {
    const date = new Date(forecast.time);
    const dateString = date.toLocaleDateString();
    
    if (!grouped[dateString]) {
      grouped[dateString] = [];
    }
    
    grouped[dateString].push({
      ...forecast,
      hour: date.getHours()
    });
  });
  
  return grouped;
};

// Check if a forecast is during nighttime (6 PM to 8 AM)
export const isNightForecast = (forecastTime: string) => {
  const date = new Date(forecastTime);
  const hour = date.getHours();
  return hour >= 18 || hour < 8;
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

// Format time for display with time zone consideration
export const formatTime = (isoTime: string, latitude?: number, longitude?: number) => {
  try {
    const date = new Date(isoTime);
    if (isNaN(date.getTime())) return "--:--";
    
    // If we have coordinates, use time zone-aware formatting
    if (latitude !== undefined && longitude !== undefined) {
      const { formatDateForTimeZone } = require('@/utils/timeZoneUtils');
      return formatDateForTimeZone(date, latitude, longitude, 'HH:mm');
    }
    
    // Fallback to browser's locale
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch (error) {
    console.error("Error formatting time:", error);
    return "--:--";
  }
};

// Format date for display with time zone consideration
export const formatDate = (isoTime: string, latitude?: number, longitude?: number) => {
  try {
    const date = new Date(isoTime);
    if (isNaN(date.getTime())) return "--/--";
    
    // If we have coordinates, use time zone-aware formatting
    if (latitude !== undefined && longitude !== undefined) {
      const { formatDateForTimeZone } = require('@/utils/timeZoneUtils');
      return formatDateForTimeZone(date, latitude, longitude, 'MMM d');
    }
    
    // Fallback to browser's locale
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  } catch (error) {
    console.error("Error formatting date:", error);
    return "--/--";
  }
};

// Generate fallback forecasts when API data is not available
export const generateFallbackForecasts = () => {
  const now = new Date();
  const forecasts = [];
  
  for (let i = 0; i < 15; i++) {
    const forecastDate = new Date(now);
    forecastDate.setDate(now.getDate() + i);
    
    forecasts.push({
      date: forecastDate.toISOString(),
      temperature_max: 25 + Math.round(Math.random() * 10 - 5),
      temperature_min: 15 + Math.round(Math.random() * 10 - 5),
      humidity: 60 + Math.round(Math.random() * 30),
      cloudCover: Math.round(Math.random() * 100),
      windSpeed: 5 + Math.round(Math.random() * 15),
      precipitation: Math.random() * 0.5,
      precipitation_probability: Math.round(Math.random() * 100)
    });
  }
  
  return forecasts;
};

// Calculate SIQS rating based on weather conditions
export const getSIQSRating = (cloudCover: number, windSpeed: number, humidity: number, t: any) => {
  let score = 10;
  let colorClass = "bg-green-500";
  
  // Cloud cover has the biggest impact (0-5 points)
  if (cloudCover >= 40) {
    score = 0; // Auto fail with cloud cover >= 40%
  } else if (cloudCover >= 30) {
    score -= 4;
  } else if (cloudCover >= 20) {
    score -= 2.5;
  } else if (cloudCover >= 10) {
    score -= 1;
  }
  
  // Only apply other factors if we haven't already failed
  if (score > 0) {
    // Wind speed (0-3 points)
    if (windSpeed >= 25) {
      score -= 3;
    } else if (windSpeed >= 15) {
      score -= 2;
    } else if (windSpeed >= 8) {
      score -= 1;
    }
    
    // Humidity (0-2 points)
    if (humidity >= 90) {
      score -= 2;
    } else if (humidity >= 75) {
      score -= 1;
    }
  }
  
  // Ensure score stays in range 0-10
  score = Math.max(0, Math.min(10, score));
  
  // Determine color class based on score
  if (score <= 3) {
    colorClass = "bg-red-500";
  } else if (score <= 5) {
    colorClass = "bg-orange-500";
  } else if (score <= 7) {
    colorClass = "bg-yellow-500";
  } else if (score <= 9) {
    colorClass = "bg-green-500";
  } else {
    colorClass = "bg-teal-500";
  }
  
  return { score, color: colorClass };
};

// Format condition text based on cloud cover
export const formatCondition = (cloudCover: number, t: any) => {
  if (cloudCover >= 80) {
    return t("Overcast", "阴天");
  } else if (cloudCover >= 50) {
    return t("Cloudy", "多云");
  } else if (cloudCover >= 25) {
    return t("Partly Cloudy", "局部多云");
  } else if (cloudCover > 10) {
    return t("Mostly Clear", "大部分晴朗");
  } else {
    return t("Clear", "晴朗");
  }
};

// Detect extreme weather conditions for alerts
export const detectExtremeWeatherConditions = (forecasts: any[], t: any) => {
  const alerts = [];
  
  // Check for dangerous weather codes
  const dangerousCodes = [95, 96, 99]; // Thunderstorms and hail
  const severeCodes = [71, 73, 75, 77, 85, 86]; // Heavy snow, blizzards
  const fogCodes = [48, 56, 57, 66, 67]; // Fog and freezing fog
  
  for (const forecast of forecasts) {
    const { weatherCode, windSpeed, precipitation } = forecast;
    
    // Check severe thunderstorms
    if (dangerousCodes.includes(weatherCode)) {
      alerts.push({
        type: "severe",
        message: t("Thunderstorm with possible hail detected", "检测到雷暴可能伴有冰雹"),
        time: forecast.time,
        icon: "thunderstorm"
      });
    }
    
    // Check heavy snow conditions
    if (severeCodes.includes(weatherCode)) {
      alerts.push({
        type: "warning",
        message: t("Heavy snow or blizzard conditions expected", "预计有大雪或暴风雪"),
        time: forecast.time,
        icon: "snow"
      });
    }
    
    // Check fog conditions
    if (fogCodes.includes(weatherCode)) {
      alerts.push({
        type: "warning",
        message: t("Fog or freezing conditions expected", "预计有雾或结冰情况"),
        time: forecast.time,
        icon: "fog"
      });
    }
    
    // Check extreme wind
    if (windSpeed > 60) {
      alerts.push({
        type: "severe",
        message: t("Dangerous wind conditions detected", "检测到危险的风力条件"),
        time: forecast.time,
        icon: "wind"
      });
    }
    
    // Check heavy rain
    if (precipitation > 10) {
      alerts.push({
        type: "warning",
        message: t("Heavy rainfall expected", "预计有大雨"),
        time: forecast.time,
        icon: "rain"
      });
    }
  }
  
  // Return unique alerts (avoid duplicates)
  return alerts.filter((alert, index, self) => 
    index === self.findIndex(a => a.message === alert.message)
  );
};
