
import { clearLocationCache } from '@/services/realTimeSiqsService/locationUpdateService';
import { 
  generateSiqsCacheKey, 
  getCacheDuration, 
  isNighttime,
  validateBortleScale
} from './realTimeSiqsUtils';
import { calculateNighttimeSIQS } from '@/utils/nighttimeSIQS';

// Cache for storing SIQS calculation results to avoid redundant API calls
const siqsCache: Record<string, { value: number; timestamp: number; data: any }> = {};

/**
 * Calculate real-time SIQS for a specific location
 * 
 * @param latitude Location latitude
 * @param longitude Location longitude
 * @param bortleScale Optional Bortle scale (1-9) to use in calculation
 * @returns Object with SIQS score and calculation metadata
 */
export const calculateRealTimeSiqs = async (
  latitude: number, 
  longitude: number,
  bortleScale?: number
): Promise<{ siqs: number; factors?: any[] }> => {
  try {
    console.log(`Calculating real-time SIQS for ${latitude}, ${longitude}`);
    
    // Generate cache key based on coordinates
    const cacheKey = generateSiqsCacheKey(latitude, longitude);
    
    // Check cache for recent calculation
    const cachedResult = siqsCache[cacheKey];
    const now = Date.now();
    const cacheDuration = getCacheDuration();
    
    if (cachedResult && (now - cachedResult.timestamp) < cacheDuration) {
      console.log(`Using cached SIQS for ${latitude}, ${longitude}: ${cachedResult.value}`);
      return { 
        siqs: cachedResult.value,
        factors: cachedResult.data?.factors
      };
    }
    
    // Validate bortle scale
    const validBortleScale = validateBortleScale(bortleScale);
    
    // Fetch weather data for the location
    const weatherResponse = await fetch(`/api/weather?lat=${latitude}&lon=${longitude}`);
    const weatherData = await weatherResponse.json();
    
    // Fetch forecast data for nighttime SIQS calculation
    const forecastResponse = await fetch(`/api/forecast?lat=${latitude}&lon=${longitude}`);
    const forecastData = await forecastResponse.json();
    
    // Prepare location data for SIQS calculation
    const locationData = {
      latitude,
      longitude,
      bortleScale: validBortleScale,
      weatherData: weatherData?.weatherConditions || {},
      moonPhase: weatherData?.moonPhase || 0.5
    };
    
    // Calculate nighttime SIQS if forecast data is available
    let siqsResult;
    if (forecastData?.hourly) {
      siqsResult = calculateNighttimeSIQS(locationData, forecastData, null);
      
      // If nighttime calculation succeeded
      if (siqsResult && typeof siqsResult.score === 'number') {
        console.log(`Using nighttime forecast for SIQS calculation: ${siqsResult.score}`);
      }
    }
    
    // Fallback to regular calculation if nighttime calculation failed
    if (!siqsResult || typeof siqsResult.score !== 'number') {
      // Use current cloud cover if available
      const cloudCover = locationData.weatherData?.cloudcover || locationData.weatherData?.cloudCover || 50;
      const siqsValue = Math.max(0, 10 - (cloudCover / 10));
      
      siqsResult = {
        score: siqsValue,
        factors: [{
          name: "Cloud Cover",
          score: siqsValue
        }]
      };
      
      console.log(`Using fallback SIQS calculation: ${siqsValue}`);
    }
    
    // Cache the result
    siqsCache[cacheKey] = {
      value: siqsResult.score,
      timestamp: now,
      data: siqsResult
    };
    
    console.log(`Calculated SIQS for ${latitude}, ${longitude}: ${siqsResult.score.toFixed(1)}`);
    
    return {
      siqs: siqsResult.score,
      factors: siqsResult.factors
    };
  } catch (error) {
    console.error("Error calculating real-time SIQS:", error);
    return { siqs: 0 };
  }
};

/**
 * Clear the SIQS calculation cache
 */
export const clearSiqsCache = (): void => {
  Object.keys(siqsCache).forEach(key => {
    delete siqsCache[key];
  });
  console.log("SIQS cache cleared");
};

/**
 * Calculate SIQS for multiple locations in batch
 * @param locations Array of locations to calculate SIQS for
 * @returns Updated locations with SIQS values
 */
export const batchCalculateSiqs = async (
  locations: any[]
): Promise<any[]> => {
  if (!locations || locations.length === 0) return [];
  
  const updatedLocations = [...locations];
  
  for (let i = 0; i < updatedLocations.length; i++) {
    const location = updatedLocations[i];
    if (!location.latitude || !location.longitude) continue;
    
    try {
      const { siqs } = await calculateRealTimeSiqs(
        location.latitude,
        location.longitude,
        location.bortleScale
      );
      
      updatedLocations[i] = {
        ...location,
        siqs
      };
    } catch (error) {
      console.error(`Error calculating SIQS for location ${i}:`, error);
    }
  }
  
  return updatedLocations;
};

// Re-export other SIQS functionality
export { 
  updateLocationsWithRealTimeSiqs, 
  clearLocationCache as clearSiqsLocationCache 
} from './realTimeSiqsService/locationUpdateService';
