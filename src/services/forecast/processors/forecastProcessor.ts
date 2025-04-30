
import { ForecastDayAstroData, BatchLocationData, BatchForecastResult } from '../types/forecastTypes';
import { calculateRealTimeSiqs } from '@/services/realTimeSiqs/siqsCalculator';
import { getSiqsScore } from '@/utils/siqsHelpers';

// Define the ForecastCache interface to match its actual methods
interface ForecastCache {
  getCachedForecast: (key: string) => ForecastDayAstroData | null;
  setCachedForecast: (key: string, data: ForecastDayAstroData) => void;
  clearCache: () => void;
}

// Implement the cache utility
const forecastCache: ForecastCache = {
  getCachedForecast(key: string): ForecastDayAstroData | null {
    try {
      const cached = localStorage.getItem(`forecast_${key}`);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (error) {
      console.error('Error retrieving cached forecast:', error);
    }
    return null;
  },
  
  setCachedForecast(key: string, data: ForecastDayAstroData): void {
    try {
      localStorage.setItem(`forecast_${key}`, JSON.stringify(data));
    } catch (error) {
      console.error('Error caching forecast:', error);
    }
  },
  
  clearCache(): void {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('forecast_')) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
  }
};

/**
 * Process a forecast for a single location
 * @param location The location to process
 * @returns Processed forecast data
 */
export async function processForecast(
  location: BatchLocationData
): Promise<ForecastDayAstroData> {
  const cacheKey = `${location.latitude}_${location.longitude}_${location.forecastDay || 0}`;
  
  // Try to get cached forecast first
  const cachedForecast = forecastCache.getCachedForecast(cacheKey);
  if (cachedForecast) {
    console.log(`Using cached forecast for ${location.name || 'location'}`);
    return cachedForecast;
  }
  
  // Mock implementation - simulate forecast data
  console.log(`Processing forecast for ${location.name || 'location'}`);
  
  // Create a mock forecast result
  const mockForecast: ForecastDayAstroData = {
    date: new Date().toISOString().split('T')[0],
    dayIndex: location.forecastDay || 0,
    cloudCover: Math.random() * 0.4, // 0-40% cloud cover
    siqs: Math.round(Math.random() * 70 + 20), // 20-90 siqs
    moonPhase: Math.random(),
    moonIllumination: Math.random() * 100,
    temperature: { 
      min: Math.round(Math.random() * 10 + 10), 
      max: Math.round(Math.random() * 10 + 20) 
    },
    humidity: Math.round(Math.random() * 60 + 20),
    windSpeed: Math.round(Math.random() * 20),
    isViable: Math.random() > 0.3, // 70% chance of being viable
    qualityDescription: 'Generated mock data',
    predictedSeeing: Math.random() * 5,
    precipitation: {
      probability: Math.random() * 0.3,
      amount: Math.random() * 5,
    },
    weatherCode: Math.floor(Math.random() * 10),
    reliability: Math.random() * 0.5 + 0.5, // 0.5-1.0 reliability
  };
  
  // Cache the forecast
  forecastCache.setCachedForecast(cacheKey, mockForecast);
  
  return mockForecast;
}

/**
 * Process forecasts for multiple locations in batch
 * @param locations Array of locations to process
 * @returns Array of processed forecasts with location data
 */
export async function processBatchForecasts(
  locations: BatchLocationData[]
): Promise<BatchForecastResult[]> {
  const results: BatchForecastResult[] = [];
  
  for (const location of locations) {
    try {
      const forecast = await processForecast(location);
      
      results.push({
        location,
        success: true,
        forecast
      });
    } catch (error) {
      console.error(`Error processing forecast for location: ${location.name || 'unnamed'}`, error);
      results.push({
        location,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
  
  return results;
}

/**
 * Clear all cached forecasts
 */
export function clearForecasts(): void {
  forecastCache.clearCache();
}
