
import { calculateSIQS } from "@/lib/calculateSIQS";
import { calculateNighttimeSIQS } from "@/utils/nighttimeSIQS";

/**
 * Ensure SIQS score is always on a 0-10 scale
 */
export const normalizeScore = (score: number): number => {
  if (score <= 10) return score;
  return score / 10;
};

/**
 * Calculate SIQS with weather data
 */
export async function calculateSIQSWithWeatherData(
  weatherData: any,
  bortleScale: number,
  seeingConditions: number,
  moonPhase: number,
  forecastData: any | null
): Promise<any> {
  // First try to calculate SIQS using nighttime forecast data
  if (forecastData) {
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
