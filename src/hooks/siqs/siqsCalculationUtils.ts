
import { calculateSIQS } from "@/lib/calculateSIQS";
import { extractNightForecasts } from "@/components/forecast/ForecastUtils";

/**
 * Normalize a SIQS score to ensure it's within 0-10 range
 */
export const normalizeScore = (score: number): number => {
  // Ensure score is within 0-10 range
  return Math.max(0, Math.min(10, score));
};

/**
 * Calculate SIQS score using weather data and other factors
 */
export const calculateSIQSWithWeatherData = async (
  weatherData: any,
  bortleScale: number,
  seeingConditions: number,
  moonPhase: number,
  forecastData: any | null
) => {
  // Extract night forecasts if available
  const nightForecast = forecastData?.hourly ? 
    extractNightForecasts(forecastData.hourly) : 
    undefined;
  
  // Calculate SIQS score
  const siqsResult = calculateSIQS({
    cloudCover: weatherData.cloudCover,
    bortleScale,
    seeingConditions,
    windSpeed: weatherData.windSpeed,
    humidity: weatherData.humidity,
    moonPhase,
    aqi: weatherData.aqi,
    weatherCondition: weatherData.condition,
    precipitation: weatherData.precipitation,
    nightForecast
  });
  
  return siqsResult;
};
