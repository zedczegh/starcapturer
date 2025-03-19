
import React from "react";

/**
 * Format date with memoization capability
 */
const dateFormatters = new Map<string, Intl.DateTimeFormat>();

export const formatDate = (isoTime: string): string => {
  try {
    const date = new Date(isoTime);
    if (isNaN(date.getTime())) return "--/--";
    
    // Use cached formatter for better performance
    const localeString = navigator.language || 'en-US';
    const formatterKey = `${localeString}_short_date`;
    
    if (!dateFormatters.has(formatterKey)) {
      dateFormatters.set(
        formatterKey,
        new Intl.DateTimeFormat(localeString, { 
          weekday: 'short', 
          month: 'short', 
          day: 'numeric' 
        })
      );
    }
    
    return dateFormatters.get(formatterKey)!.format(date);
  } catch (error) {
    console.error("Error formatting date:", error);
    return "--/--";
  }
};

/**
 * Format time with memoization 
 */
export const formatTime = (isoTime: string): string => {
  try {
    const date = new Date(isoTime);
    if (isNaN(date.getTime())) return "--:--";
    
    const localeString = navigator.language || 'en-US';
    const formatterKey = `${localeString}_time`;
    
    if (!dateFormatters.has(formatterKey)) {
      dateFormatters.set(
        formatterKey,
        new Intl.DateTimeFormat(localeString, { 
          hour: '2-digit', 
          minute: '2-digit'
        })
      );
    }
    
    return dateFormatters.get(formatterKey)!.format(date);
  } catch (error) {
    console.error("Error formatting time:", error);
    return "--:--";
  }
};

/**
 * Convert cloud cover to readable condition text
 */
export const formatCondition = (cloudCover: number, t: (en: string, zh: string) => string): string => {
  if (typeof cloudCover !== 'number') return t("Unknown", "未知");
  
  if (cloudCover < 10) return t("Clear", "晴朗");
  if (cloudCover < 30) return t("Mostly Clear", "大部分晴朗");
  if (cloudCover < 70) return t("Partly Cloudy", "部分多云");
  if (cloudCover < 90) return t("Mostly Cloudy", "大部分多云");
  return t("Overcast", "阴天");
};

/**
 * Calculate SIQS rating based on weather conditions
 * This is aligned with the main calculateSIQS function
 */
export const getSIQSRating = (
  cloudCover: number, 
  windSpeed: number, 
  humidity: number, 
  t: (en: string, zh: string) => string
) => {
  if (typeof cloudCover !== 'number' || typeof windSpeed !== 'number' || typeof humidity !== 'number') {
    return { score: 0, quality: t("Unknown", "未知"), color: "bg-gray-400" };
  }
  
  // Apply the cloud cover > 40% rule - set score to 0 if cloud coverage is over 40%
  if (cloudCover > 40) {
    return { score: 0, quality: t("Bad", "很差"), color: "bg-red-500" };
  }
  
  // Calculate factor scores (same as in calculateSIQS)
  const cloudFactor = (100 - cloudCover * 2.5) / 100; // 0-40 to 0-100, then to 0-1
  const windFactor = Math.max(0, Math.min(1, (30 - windSpeed) / 30));
  const humidityFactor = Math.max(0, Math.min(1, (90 - humidity) / 90));
  
  // Apply same weights as in calculateSIQS for consistency
  const score = (cloudFactor * 0.6 + windFactor * 0.2 + humidityFactor * 0.2) * 10;
  const roundedScore = Math.round(score * 10) / 10;
  
  // Determine quality rating and color - matching SIQS display in other components
  let quality, color;
  
  if (roundedScore >= 8) {
    quality = t("Excellent", "极佳");
    color = "bg-green-500";
  } else if (roundedScore >= 6) {
    quality = t("Good", "良好");
    color = "bg-green-400";
  } else if (roundedScore >= 4) {
    quality = t("Fair", "一般");
    color = "bg-yellow-400";
  } else if (roundedScore >= 2) {
    quality = t("Poor", "较差");
    color = "bg-orange-400";
  } else {
    quality = t("Bad", "很差");
    color = "bg-red-500";
  }
  
  return { score: roundedScore, quality, color };
};

/**
 * Generate fallback forecasts when data is unavailable
 */
export const generateFallbackForecasts = (): any[] => {
  const now = new Date();
  const forecasts = [];
  
  for (let i = 0; i < 8; i++) {
    const forecastTime = new Date(now);
    forecastTime.setHours(now.getHours() + i);
    
    forecasts.push({
      time: forecastTime.toISOString(),
      temperature: 22 + Math.round(Math.random() * 8),
      humidity: 60 + Math.round(Math.random() * 30),
      cloudCover: Math.round(Math.random() * 100),
      windSpeed: 5 + Math.round(Math.random() * 15),
      precipitation: Math.random() * 0.5,
    });
  }
  
  return forecasts;
};

/**
 * Extract future forecasts from weather data
 * Only shows forecast data after the current time
 */
export function extractFutureForecasts(forecastData: any, maxHours: number = 24): any[] {
  if (!forecastData || 
      !forecastData.hourly || 
      !Array.isArray(forecastData.hourly.time) || 
      forecastData.hourly.time.length === 0) {
    return generateFallbackForecasts();
  }
  
  try {
    const result = [];
    const now = new Date();
    
    // Find the starting index for future data
    let startIndex = 0;
    for (let i = 0; i < forecastData.hourly.time.length; i++) {
      const forecastTime = new Date(forecastData.hourly.time[i]);
      if (forecastTime > now) {
        startIndex = i;
        break;
      }
    }
    
    // Get the next maxHours hours of data from the current time
    for (let i = startIndex; i < Math.min(startIndex + maxHours, forecastData.hourly.time.length); i++) {
      if (i < forecastData.hourly.time.length) {
        result.push({
          time: forecastData.hourly.time[i] || new Date().toISOString(),
          temperature: forecastData.hourly.temperature_2m?.[i] ?? 22,
          humidity: forecastData.hourly.relative_humidity_2m?.[i] ?? 60,
          cloudCover: forecastData.hourly.cloud_cover?.[i] ?? 30,
          windSpeed: forecastData.hourly.wind_speed_10m?.[i] ?? 5,
          precipitation: forecastData.hourly.precipitation?.[i] ?? 0,
          weatherCode: forecastData.hourly.weather_code?.[i] ?? 0
        });
      }
    }
    
    if (result.length > 0) {
      return result;
    }
  } catch (error) {
    console.error("Error processing forecast data:", error);
  }
  
  return generateFallbackForecasts();
}

/**
 * Detect extreme weather conditions from forecasts
 */
export function detectExtremeWeatherConditions(forecasts: any[], t: (en: string, zh: string) => string): any[] {
  const alerts = [];
  
  // Check for dangerous weather codes
  const dangerousCodes = [95, 96, 99]; // Thunderstorms and hail
  const severeCodes = [71, 73, 75, 77, 85, 86]; // Heavy snow, blizzards
  const desertStormCodes = [48, 56, 57, 66, 67]; // Sandstorms and dust storms
  
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
    
    // Check dust/sandstorms
    if (desertStormCodes.includes(weatherCode)) {
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
}
