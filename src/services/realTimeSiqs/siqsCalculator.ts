
import { SiqsResult, WeatherDataWithClearSky } from './siqsTypes';
import { getCachedSiqs, cacheSiqsResult } from './siqsCache';
import { getClimateAdjustmentFactor } from './climateRegions';

/**
 * Calculate real-time SIQS score for a location
 * @param latitude Location latitude
 * @param longitude Location longitude
 * @param bortleScale Bortle scale value for the location (1-9)
 * @returns Promise resolving to SiqsResult
 */
export async function calculateRealTimeSiqs(
  latitude: number,
  longitude: number,
  bortleScale: number
): Promise<SiqsResult> {
  // Try to get from cache first
  const cachedResult = getCachedSiqs(latitude, longitude, bortleScale);
  if (cachedResult) {
    console.log(`Using cached SIQS result for ${latitude}, ${longitude}`);
    return cachedResult;
  }
  
  // Prepare weather data (in a real implementation, this would fetch from API)
  // For this simplified version, we'll create synthetic data
  const weatherData = await fetchOrGenerateWeatherData(latitude, longitude);
  
  // Calculate SIQS based on Bortle scale and weather data
  const siqsScore = calculateSiqsFromBortleAndWeather(bortleScale, weatherData);
  
  // Get climate adjustment for the current month
  const currentMonth = new Date().getMonth();
  const climateAdjustment = getClimateAdjustmentFactor(latitude, longitude, currentMonth);
  
  // Apply climate adjustment
  const adjustedScore = siqsScore * climateAdjustment;
  
  // Determine if conditions are viable for astrophotography
  const isViable = adjustedScore >= 5.0 && weatherData.cloudCover! < 50;
  
  // Create result object
  const result: SiqsResult = {
    siqs: adjustedScore,
    isViable,
    factors: [
      {
        name: "Light Pollution",
        score: convertBortleToSiqsComponent(bortleScale),
        description: `Bortle scale ${bortleScale}`
      },
      {
        name: "Weather",
        score: calculateWeatherScore(weatherData),
        description: weatherData.cloudCover 
          ? `Cloud cover: ${weatherData.cloudCover}%` 
          : "Weather data unavailable"
      },
      {
        name: "Climate",
        score: climateAdjustment * 10,
        description: climateAdjustment > 1 
          ? "Favorable seasonal conditions" 
          : "Less favorable seasonal conditions"
      }
    ],
    metadata: {
      calculatedAt: new Date().toISOString(),
      sources: {
        weather: !!weatherData.cloudCover,
        forecast: !!weatherData._forecast,
        clearSky: !!weatherData.clearSkyRate,
        lightPollution: true
      }
    }
  };
  
  // Cache the result for future use
  cacheSiqsResult(latitude, longitude, bortleScale, result);
  
  return result;
}

/**
 * Generate synthetic weather data for testing
 */
async function fetchOrGenerateWeatherData(
  latitude: number,
  longitude: number
): Promise<WeatherDataWithClearSky> {
  // In a real implementation, this would fetch from weather API
  return {
    latitude,
    longitude,
    cloudCover: Math.min(100, Math.max(0, 30 + Math.sin(latitude) * 20 + Math.cos(longitude) * 20)),
    humidity: 50 + Math.cos(latitude + longitude) * 10,
    temperature: 15 + Math.sin(latitude) * 5,
    clearSkyRate: 70 + Math.sin(latitude + longitude) * 10
  };
}

/**
 * Convert Bortle scale to SIQS component (0-10)
 */
function convertBortleToSiqsComponent(bortleScale: number): number {
  // Transform Bortle scale (1-9, where 1 is best) to SIQS (0-10, where 10 is best)
  return Math.max(0, Math.min(10, 10 - (bortleScale - 1)));
}

/**
 * Calculate SIQS from Bortle scale and weather data
 */
function calculateSiqsFromBortleAndWeather(
  bortleScale: number, 
  weatherData: WeatherDataWithClearSky
): number {
  // Base score from Bortle scale (60% of total)
  const bortleScore = convertBortleToSiqsComponent(bortleScale) * 0.6;
  
  // Weather contribution (40% of total)
  const weatherScore = calculateWeatherScore(weatherData) * 0.4;
  
  // Combine scores
  return Math.min(10, bortleScore + weatherScore);
}

/**
 * Calculate weather score component (0-10)
 */
function calculateWeatherScore(weatherData: WeatherDataWithClearSky): number {
  if (!weatherData.cloudCover && weatherData.cloudCover !== 0) {
    // Default score if cloud data not available
    return 7;
  }
  
  // Cloud cover has biggest impact (0-100% -> 10-0 points)
  const cloudScore = Math.max(0, 10 - (weatherData.cloudCover / 10));
  
  // Clear sky rate bonus (if available)
  const clearSkyBonus = weatherData.clearSkyRate 
    ? (weatherData.clearSkyRate / 100) * 2 
    : 0;
  
  // Humidity penalty (if available)
  const humidityPenalty = weatherData.humidity 
    ? (weatherData.humidity / 100) * 1.5 
    : 0;
  
  // Combine factors
  return Math.max(0, Math.min(10, cloudScore + clearSkyBonus - humidityPenalty));
}
