import { calculateSIQS } from "@/lib/calculateSIQS";
import { calculateMoonPhase } from "@/utils/siqsValidation";

/**
 * Format SIQS score for display
 * @param score Raw SIQS score
 * @returns Formatted score string
 */
export const formatSIQSScoreForDisplay = (score: number): string => {
  // For scores below 1.5, show one decimal place
  if (score < 1.5) {
    return score.toFixed(1);
  }
  
  // For scores 1.5 and above, round to nearest 0.5
  const roundedScore = Math.round(score * 2) / 2;
  
  // If the rounded score has no decimal part, show as integer
  if (roundedScore === Math.floor(roundedScore)) {
    return roundedScore.toFixed(0);
  }
  
  // Otherwise show with one decimal place
  return roundedScore.toFixed(1);
};

/**
 * Normalize score to 0-10 scale for consistent display
 * @param score Score value that might be on different scale
 * @returns Normalized score on 0-10 scale
 */
export const normalizeScore = (score: number): number => {
  // If score is already on 0-10 scale, return as is
  if (score >= 0 && score <= 10) return score;
  
  // If score is on 0-100 scale, normalize to 0-10
  if (score > 10 && score <= 100) return score / 10;
  
  // Cap at 10 for any value over 100
  if (score > 100) return 10;
  
  // Handle negative scores
  return 0;
};

/**
 * Optimized function to calculate SIQS based on weather data
 * @param weatherData Weather data with various metrics
 * @param bortleScale Bortle scale value (light pollution)
 * @param seeingConditions Visual seeing conditions (1-5)
 * @param moonPhase Current moon phase (0-1)
 * @param forecastData Optional forecast data for better nighttime calculation
 * @returns SIQS result object with score and factors
 */
export const calculateSIQSWithWeatherData = async (
  weatherData: any,
  bortleScale: number,
  seeingConditions: number,
  moonPhase: number = calculateMoonPhase(),
  forecastData?: any
): Promise<any> => {
  // Extract necessary data from weather data
  const {
    cloudCover = 0,
    windSpeed = 0,
    humidity = 50,
    precipitation = 0,
    weatherCondition = "",
    aqi
  } = weatherData || {};
  
  // Prepare nighttime forecast data if available
  let nightForecast: any[] = [];
  
  if (forecastData?.hourly?.time && Array.isArray(forecastData.hourly.time)) {
    // Extract nighttime forecast data (between 6 PM and 6 AM)
    const hourly = forecastData.hourly;
    
    nightForecast = hourly.time.map((time: string, index: number) => {
      const date = new Date(time);
      const hour = date.getHours();
      
      // Only include night hours (6 PM to 6 AM)
      if (hour >= 18 || hour < 6) {
        return {
          time,
          cloudCover: hourly.cloud_cover?.[index] || 0,
          windSpeed: hourly.wind_speed_10m?.[index] || 0,
          humidity: hourly.relative_humidity_2m?.[index] || 0,
          temperature: hourly.temperature_2m?.[index],
          weatherCode: hourly.weather_code?.[index]
        };
      }
      return null;
    }).filter(Boolean);
  }
  
  // Special case for 100% cloud cover
  if (cloudCover === 100) {
    // Generate a random score between 1.1 and 1.3
    const randomScore = 1.1 + (Math.random() * 0.2);
    return {
      score: randomScore,
      isViable: false,
      factors: [
        {
          name: "Cloud Cover",
          score: 15, // Normalized to 0-100 scale
          description: "Complete cloud cover severely limits visibility"
        }
      ]
    };
  }
  
  // Calculate SIQS using all available data
  const result = calculateSIQS({
    cloudCover,
    bortleScale,
    seeingConditions,
    windSpeed,
    humidity,
    moonPhase,
    precipitation,
    nightForecast,
    weatherCondition,
    aqi
  });
  
  return result;
};
