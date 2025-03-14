
import React from "react";

export const formatDate = (isoTime: string): string => {
  try {
    const date = new Date(isoTime);
    if (isNaN(date.getTime())) return "--/--";
    return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
  } catch (error) {
    console.error("Error formatting date:", error);
    return "--/--";
  }
};

export const formatCondition = (cloudCover: number, t: (en: string, zh: string) => string): string => {
  if (typeof cloudCover !== 'number') return t("Unknown", "未知");
  
  if (cloudCover < 10) return t("Clear", "晴朗");
  if (cloudCover < 30) return t("Mostly Clear", "大部分晴朗");
  if (cloudCover < 70) return t("Partly Cloudy", "部分多云");
  if (cloudCover < 90) return t("Mostly Cloudy", "大部分多云");
  return t("Overcast", "阴天");
};

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
  
  // Simplified SIQS calculation for forecast that aligns with the main algorithm
  // Cloud factor is more important as per the main algorithm (30%)
  const cloudFactor = (100 - cloudCover * 2.5) / 100; // Scale 0-40% to 0-100%
  
  // Wind factor - max acceptable is 30mph/48kmh in main algorithm
  const windFactor = windSpeed > 30 ? 0 : (30 - windSpeed) / 30;
  
  // Humidity factor - lower is better
  const humidityFactor = humidity > 90 ? 0 : (90 - humidity) / 90;
  
  // Weight factors similar to main algorithm (cloud is most important)
  const score = (cloudFactor * 0.6 + windFactor * 0.2 + humidityFactor * 0.2) * 10;
  
  let quality, color;
  
  // Align quality descriptions with main SIQS scale
  if (score >= 8) {
    quality = t("Excellent", "极佳");
    color = "bg-green-500";
  } else if (score >= 6) {
    quality = t("Good", "良好");
    color = "bg-green-400";
  } else if (score >= 4) {
    quality = t("Fair", "一般");
    color = "bg-yellow-400";
  } else if (score >= 2) {
    quality = t("Poor", "较差");
    color = "bg-orange-400";
  } else {
    quality = t("Bad", "很差");
    color = "bg-red-500";
  }
  
  return { score: Math.round(score * 10) / 10, quality, color };
};

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
