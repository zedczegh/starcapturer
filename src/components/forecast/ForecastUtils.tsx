
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
  
  // Optimized SIQS calculation with better performance
  // Cloud factor is more important (60% weight)
  const cloudFactor = (100 - cloudCover * 2.5) / 100; // Scale 0-40% to 0-100%
  
  // Wind factor - max acceptable is 30mph/48kmh
  const windFactor = Math.max(0, Math.min(1, (30 - windSpeed) / 30));
  
  // Humidity factor - lower is better
  const humidityFactor = Math.max(0, Math.min(1, (90 - humidity) / 90));
  
  // Calculate weighted score
  const score = (cloudFactor * 0.6 + windFactor * 0.2 + humidityFactor * 0.2) * 10;
  const roundedScore = Math.round(score * 10) / 10;
  
  // Determine quality rating and color
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
    forecastTime.setHours(now.getHours() + (i * 3));
    
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
