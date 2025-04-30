
/**
 * Location validator for forecast services
 * Checks if locations are valid (not water, etc.)
 */
import { BatchLocationData } from "../types/forecastTypes";

// Cache for validated locations
const validationCache = new Map<string, {
  isValid: boolean;
  isWater: boolean;
  timestamp: number;
}>();

// Cache duration (24 hours in milliseconds)
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000;

/**
 * Validates if a location is suitable for forecasting
 * Checks if it's on land (not water) and performs other validations
 * 
 * @param location Location data to validate
 * @returns Promise resolving to validation result
 */
export const validateForecastLocation = async (
  location: BatchLocationData
): Promise<{
  isValid: boolean;
  isWater: boolean;
}> => {
  // Generate cache key from coordinates
  const cacheKey = `${location.latitude.toFixed(6)}-${location.longitude.toFixed(6)}`;
  
  // Check cache first
  const cachedValidation = validationCache.get(cacheKey);
  if (cachedValidation && Date.now() - cachedValidation.timestamp < CACHE_DURATION_MS) {
    return {
      isValid: cachedValidation.isValid,
      isWater: cachedValidation.isWater
    };
  }
  
  // Mock implementation - in real world would check APIs
  const isWater = false; // Assume it's not water
  const isValid = true;  // Assume it's valid
  
  // Cache the result
  validationCache.set(cacheKey, {
    isValid,
    isWater,
    timestamp: Date.now()
  });
  
  return { isValid, isWater };
};

/**
 * Filter an array of locations to only include valid ones
 * 
 * @param locations Array of locations to filter
 * @returns Promise resolving to array of valid locations
 */
export const filterValidLocations = async (
  locations: BatchLocationData[]
): Promise<BatchLocationData[]> => {
  // Process all locations in parallel
  const validationResults = await Promise.all(
    locations.map(async loc => {
      // Skip validation if already validated
      if (loc.isValidated !== undefined) {
        return {
          location: loc,
          isValid: !loc.isWater // If we know it's not water, it's valid
        };
      }
      
      const validation = await validateForecastLocation(loc);
      return {
        location: {
          ...loc,
          isValidated: true, // Mark as validated
          isWater: validation.isWater
        },
        isValid: validation.isValid
      };
    })
  );
  
  // Return only valid locations
  return validationResults
    .filter(result => result.isValid)
    .map(result => result.location);
};
