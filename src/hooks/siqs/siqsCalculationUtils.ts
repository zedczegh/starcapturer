
import { calculateSIQS } from "@/lib/calculateSIQS";
import { calculateNighttimeSIQS } from "@/utils/nighttimeSIQS";

/**
 * Ensure SIQS value is always on a 0-10 scale
 * Optimized for better precision
 */
export const normalizeScore = (score: number): number => {
  if (score < 0) return 0;
  if (score <= 10) return Math.max(0, Math.min(10, score)); // Ensure it's within 0-10 range
  return Math.round((score / 10) * 10) / 10; // Round to 1 decimal place if it's over 10
};

/**
 * Optimized function to calculate SIQS with weather data
 */
export async function calculateSIQSWithWeatherData(
  weatherData: any,
  bortleScale: number,
  seeingConditions: number,
  moonPhase: number,
  forecastData: any | null
): Promise<any> {
  // First try to calculate SIQS using nighttime forecast data
  if (forecastData && forecastData.hourly) {
    try {
      const locationWithWeather = {
        weatherData,
        bortleScale,
        seeingConditions,
        moonPhase
      };
      
      const nighttimeSIQS = calculateNighttimeSIQS(locationWithWeather, forecastData, null);
      if (nighttimeSIQS) {
        console.log("Using nighttime forecast for SIQS calculation:", nighttimeSIQS.score);
        return nighttimeSIQS;
      }
    } catch (error) {
      console.error("Error calculating nighttime SIQS:", error);
    }
  }
  
  // Fall back to standard calculation if nighttime calculation failed
  console.log("Falling back to standard SIQS calculation");
  return calculateSIQS({
    cloudCover: weatherData.cloudCover,
    bortleScale,
    seeingConditions,
    windSpeed: weatherData.windSpeed,
    humidity: weatherData.humidity,
    moonPhase,
    precipitation: weatherData.precipitation,
    weatherCondition: weatherData.weatherCondition,
    aqi: weatherData.aqi
  });
}

/**
 * Get descriptive text for SIQS value
 */
export function getSIQSDescription(value: number): string {
  if (value >= 8) return "Excellent";
  if (value >= 6) return "Good";  
  if (value >= 5) return "Above Average";
  if (value >= 4) return "Average";
  if (value >= 2) return "Poor";
  return "Bad";
}

/**
 * Get translated SIQS description
 */
export function getTranslatedSIQSDescription(value: number, language: 'en' | 'zh' = 'en'): string {
  if (language === 'en') {
    return getSIQSDescription(value);
  }
  
  // Chinese translations
  if (value >= 8) return "极佳";
  if (value >= 6) return "良好";  
  if (value >= 5) return "较好";
  if (value >= 4) return "一般";
  if (value >= 2) return "较差";
  return "糟糕";
}

/**
 * Get CSS color class for SIQS value
 */
export function getSIQSColorClass(value: number): string {
  if (value >= 8) return "bg-green-500/80 border-green-400/50";
  if (value >= 6) return "bg-blue-500/80 border-blue-400/50";
  if (value >= 5) return "bg-olive-500/80 border-olive-400/50"; // Olive for scores over 5
  if (value >= 4) return "bg-yellow-500/80 border-yellow-400/50";
  if (value >= 2) return "bg-orange-500/80 border-orange-400/50";
  return "bg-red-500/80 border-red-400/50";
}

/**
 * Determine if viewing conditions are good for astrophotography
 */
export function isGoodViewingCondition(value: number): boolean {
  return value >= 5.0; // Updated threshold to 5.0
}

/**
 * Format SIQS value for display with consistent decimal places
 */
export function formatSIQSScoreForDisplay(value: number): string {
  // Handle undefined or null
  if (value === undefined || value === null) return "0.0";
  
  // Always show one decimal place
  return value.toFixed(1);
}
