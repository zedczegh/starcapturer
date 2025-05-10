
/**
 * Improved SIQS calculation algorithm with better performance and accuracy
 */

import { SiqsCalculationOptions, SiqsCalculationResult } from './types';
import { normalizeToSiqsScale } from '../siqsHelpers';
import { siqsCalculationCache } from './calculation/siqs-cache';
import { 
  calculateTemperatureScore,
  calculateHumidityScore,
  calculateWindScore,
  calculateCloudCoverScore,
  calculatePrecipitationScore,
  calculateBortleScaleScore,
  calculateWeightedScore
} from './calculation/weatherScoring';
import { 
  fetchWeatherData, 
  fetchForecastData 
} from './calculation/weatherFetcher';

/**
 * Enhanced SIQS calculation with improved caching and accuracy
 * 
 * @param latitude Location latitude
 * @param longitude Location longitude
 * @param bortleScale Light pollution Bortle scale (1-9)
 * @param options Optional calculation configuration
 * @returns SIQS calculation result
 */
export async function calculateSiqs(
  latitude: number,
  longitude: number,
  bortleScale: number = 4,
  options: SiqsCalculationOptions = {}
): Promise<SiqsCalculationResult> {
  // Parameter validation
  if (!isFinite(latitude) || !isFinite(longitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    console.error("Invalid coordinates provided to calculateSiqs");
    return { siqs: 0, isViable: false };
  }
  
  // Default options
  const {
    useSingleHourSampling = true,
    targetHour = 1, // Default to 1 AM for best astronomical viewing
    cacheDurationMins = 5,
    skipCache = false
  } = options;
  
  // Generate cache key
  const cacheKey = `siqs-${latitude.toFixed(4)}-${longitude.toFixed(4)}-${bortleScale.toFixed(1)}`;
  
  // Check cache if not skipped
  if (!skipCache) {
    const cachedResult = siqsCalculationCache.getCached(cacheKey);
    if (cachedResult) {
      return {
        ...cachedResult,
        source: 'cached'
      };
    }
  }
  
  try {
    // Simplify API calls structure for better maintainability
    const [weatherData, forecastData] = await Promise.all([
      fetchWeatherData({ latitude, longitude }),
      fetchForecastData({ latitude, longitude })
    ]);
    
    if (!weatherData) {
      return { siqs: 0, isViable: false };
    }
    
    // Calculate SIQS using optimized algorithm
    const siqsResult = await performSiqsCalculation(
      weatherData, 
      forecastData,
      bortleScale,
      { useSingleHourSampling, targetHour }
    );
    
    // Cache the result
    siqsCalculationCache.setCached(cacheKey, siqsResult);
    
    return {
      ...siqsResult,
      source: 'realtime'
    };
  } catch (error) {
    console.error("Error calculating SIQS:", error);
    
    // Graceful degradation - try to provide a basic SIQS even with limited data
    return provideFallbackSiqs(latitude, longitude, bortleScale);
  }
}

/**
 * Core SIQS calculation algorithm
 */
async function performSiqsCalculation(
  weatherData: any,
  forecastData: any,
  bortleScale: number,
  options: { useSingleHourSampling: boolean; targetHour: number }
): Promise<SiqsCalculationResult> {
  // Extract cloud cover for the target hour if available
  let effectiveCloudCover = weatherData.cloudCover;
  let nighttimeCloudData = null;
  
  if (options.useSingleHourSampling && forecastData?.hourly) {
    try {
      const hourlyData = forecastData.hourly;
      const times = hourlyData.time;
      const cloudCovers = hourlyData.cloud_cover;
      
      if (times && cloudCovers && times.length === cloudCovers.length) {
        // Find the target hour data for today or tomorrow night
        const now = new Date();
        const targetHour = options.targetHour;
        
        for (let i = 0; i < times.length; i++) {
          const time = new Date(times[i]);
          if (time.getHours() === targetHour && time > now) {
            effectiveCloudCover = cloudCovers[i];
            nighttimeCloudData = {
              average: cloudCovers[i],
              timeRange: `${targetHour}:00-${targetHour + 1}:00`,
              sourceType: 'forecast'
            };
            break;
          }
        }
      }
    } catch (error) {
      console.error("Error extracting hourly cloud cover:", error);
    }
  }
  
  // Calculate individual factor scores
  const cloudCoverScore = calculateCloudCoverScore(effectiveCloudCover);
  const bortleScaleScore = calculateBortleScaleScore(bortleScale);
  const temperatureScore = calculateTemperatureScore(weatherData.temperature);
  const humidityScore = calculateHumidityScore(weatherData.humidity);
  const windScore = calculateWindScore(weatherData.windSpeed);
  const precipitationScore = calculatePrecipitationScore(weatherData.precipitation);
  
  // Apply intelligent scoring algorithm
  const rawScore = calculateWeightedScore({
    cloud: { score: cloudCoverScore, weight: 0.35 },
    light: { score: bortleScaleScore, weight: 0.25 },
    temp: { score: temperatureScore, weight: 0.1 },
    humidity: { score: humidityScore, weight: 0.1 },
    wind: { score: windScore, weight: 0.1 },
    precipitation: { score: precipitationScore, weight: 0.1 }
  });
  
  // Normalize to 0-10 scale
  const normalizedScore = normalizeToSiqsScale(rawScore);
  
  // Create factor descriptions for detailed output
  const factors = [
    { name: 'Cloud Cover', score: cloudCoverScore, description: `Cloud Cover: ${effectiveCloudCover}%` },
    { name: 'Light Pollution', score: bortleScaleScore, description: `Bortle Scale: ${bortleScale}` },
    { name: 'Temperature', score: temperatureScore, description: `Temperature: ${weatherData.temperature}°C` },
    { name: 'Humidity', score: humidityScore, description: `Humidity: ${weatherData.humidity}%` },
    { name: 'Wind', score: windScore, description: `Wind Speed: ${weatherData.windSpeed} km/h` },
    { name: 'Precipitation', score: precipitationScore, description: `Precipitation: ${weatherData.precipitation} mm` }
  ];
  
  return {
    siqs: normalizedScore,
    isViable: normalizedScore >= 4.0,
    factors,
    metadata: {
      calculatedAt: new Date().toISOString(),
      sources: {
        weather: true,
        forecast: !!forecastData,
        singleHourSampling: !!nighttimeCloudData
      },
      reliability: {
        score: 8,
        issues: []
      }
    },
    weatherData,
    forecastData
  };
}

/**
 * Provide fallback SIQS calculation with minimal data
 */
function provideFallbackSiqs(latitude: number, longitude: number, bortleScale: number): SiqsCalculationResult {
  // Calculate a basic score based on just Bortle Scale
  const bortleScoreComponent = calculateBortleScaleScore(bortleScale);
  
  // Add latitude adjustment (higher latitudes tend to have clearer skies)
  const latitudeAdjustment = Math.abs(latitude) > 45 ? 1 : 0;
  
  // Calculate basic score
  const score = Math.min(10, bortleScoreComponent + latitudeAdjustment);
  
  return {
    siqs: score,
    isViable: score >= 4.0,
    factors: [
      { name: 'Light Pollution', score: bortleScoreComponent, description: `Bortle Scale: ${bortleScale}` }
    ],
    source: 'default',
    metadata: {
      calculatedAt: new Date().toISOString(),
      sources: {
        weather: false,
        forecast: false
      },
      reliability: {
        score: 3,
        issues: ['Using fallback calculation with limited data']
      }
    }
  };
}

// Make the calculate method available
export { calculateSiqs as calculateRealTimeSiqs };
