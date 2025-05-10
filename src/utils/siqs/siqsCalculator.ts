
/**
 * Improved SIQS calculation algorithm with better performance and accuracy
 */

import { SiqsCalculationOptions, SiqsCalculationResult } from '../siqs/types';
import { normalizeToSiqsScale } from '../siqsHelpers';

// LRU cache for calculation results
class SiqsCache {
  private cache = new Map<string, {result: SiqsCalculationResult, timestamp: number}>();
  private maxSize = 100;
  private defaultTTL = 5 * 60 * 1000; // 5 minutes
  
  getCached(key: string): SiqsCalculationResult | null {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    // Check if expired
    if (Date.now() - cached.timestamp > this.defaultTTL) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.result;
  }
  
  setCached(key: string, result: SiqsCalculationResult): void {
    // Clear old entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
    
    this.cache.set(key, {
      result,
      timestamp: Date.now()
    });
  }
  
  clearCache(): void {
    this.cache.clear();
  }
}

// Global cache instance
const siqsCalculationCache = new SiqsCache();

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
 * Simplified API to fetch weather data
 */
async function fetchWeatherData({ latitude, longitude }: { latitude: number; longitude: number }): Promise<any> {
  try {
    const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,precipitation,cloud_cover,wind_speed_10m&timezone=auto`);
    
    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    return {
      temperature: data.current?.temperature_2m || 15,
      humidity: data.current?.relative_humidity_2m || 50,
      precipitation: data.current?.precipitation || 0,
      cloudCover: data.current?.cloud_cover || 50,
      windSpeed: data.current?.wind_speed_10m || 5,
      latitude,
      longitude
    };
  } catch (error) {
    console.error("Error fetching weather data:", error);
    return null;
  }
}

/**
 * Simplified API to fetch forecast data
 */
async function fetchForecastData({ latitude, longitude }: { latitude: number; longitude: number; days?: number }): Promise<any> {
  try {
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m,cloud_cover,precipitation_probability&forecast_days=2&timezone=auto`
    );
    
    if (!response.ok) {
      throw new Error(`Forecast API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error fetching forecast data:", error);
    return null;
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
  const cloudCoverScore = 10 - effectiveCloudCover / 10;
  const bortleScaleScore = Math.max(0, 10 - bortleScale * 0.9);
  const temperatureScore = calculateTemperatureScore(weatherData.temperature);
  const humidityScore = calculateHumidityScore(weatherData.humidity);
  const windScore = calculateWindScore(weatherData.windSpeed);
  const precipitationScore = weatherData.precipitation > 0 ? 0 : 10;
  
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
 * Calculate weighted score from factor components
 */
function calculateWeightedScore(factors: { [key: string]: { score: number; weight: number } }): number {
  let weightedSum = 0;
  let totalWeight = 0;
  
  for (const key in factors) {
    const factor = factors[key];
    weightedSum += factor.score * factor.weight;
    totalWeight += factor.weight;
  }
  
  return totalWeight > 0 ? weightedSum / totalWeight : 0;
}

/**
 * Calculate temperature score - ideal temp is around 15°C
 */
function calculateTemperatureScore(temperature: number): number {
  // Assume 15°C is ideal, and score decreases as temp deviates
  return 10 - Math.min(10, Math.abs(temperature - 15) / 2);
}

/**
 * Calculate humidity score - lower humidity is better
 */
function calculateHumidityScore(humidity: number): number {
  // Lower humidity is better for viewing
  return 10 - (humidity / 10);
}

/**
 * Calculate wind score - lower wind is better
 */
function calculateWindScore(windSpeed: number): number {
  // Lower wind is better for viewing stability
  if (windSpeed < 5) return 10;
  if (windSpeed < 10) return 8;
  if (windSpeed < 15) return 6;
  if (windSpeed < 20) return 4;
  if (windSpeed < 30) return 2;
  return 0;
}

/**
 * Provide fallback SIQS calculation with minimal data
 */
function provideFallbackSiqs(latitude: number, longitude: number, bortleScale: number): SiqsCalculationResult {
  // Calculate a basic score based on just Bortle Scale
  const bortleScoreComponent = Math.max(0, 10 - bortleScale * 0.9);
  
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
