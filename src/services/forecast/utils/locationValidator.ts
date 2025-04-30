
/**
 * Location validation service for forecast processing
 * Optimizes API calls by reusing geocoding and water detection logic
 */

import { isWaterLocation } from "@/utils/validation/waterLocationValidator";
import { validateLocationWithReverseGeocoding } from "@/utils/location/reverseGeocodingValidator";
import { getEnhancedLocationDetails } from "@/services/geocoding/enhancedReverseGeocoding";
import { BatchLocationData } from "../types/forecastTypes";

// Cache to minimize API calls
const validationCache = new Map<string, { isValid: boolean; name?: string; timestamp: number }>();
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Validates a forecast location by checking:
 * 1. If it's a water location (faster check first)
 * 2. If reverse geocoding provides valid result
 * 
 * @param location The location to validate
 * @returns Promise resolving to validation result with optional location name
 */
export async function validateForecastLocation(location: BatchLocationData): Promise<{
  isValid: boolean;
  isWater: boolean;
  name?: string;
}> {
  // Skip validation for already validated locations
  if (location.isValidated !== undefined) {
    return { 
      isValid: !location.isWater, 
      isWater: !!location.isWater,
      name: location.name 
    };
  }
  
  const cacheKey = `forecast-validate-${location.latitude.toFixed(4)}-${location.longitude.toFixed(4)}`;
  
  // Check cache first for fastest response
  const cached = validationCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp < CACHE_EXPIRY)) {
    return { 
      isValid: cached.isValid,
      isWater: !cached.isValid, // If not valid, assume it's water
      name: cached.name
    };
  }
  
  // First do the fast water check
  const isWater = isWaterLocation(location.latitude, location.longitude, false);
  
  // If it's not water, do a more thorough check with geocoding
  if (!isWater) {
    try {
      // Get detailed location information
      const details = await getEnhancedLocationDetails(location.latitude, location.longitude);
      
      // Update name if available and not already set
      if (details.name && !location.name) {
        location.name = details.name;
      }
      
      const isValid = !details.isWater;
      
      // Cache the result
      validationCache.set(cacheKey, {
        isValid,
        name: location.name,
        timestamp: Date.now()
      });
      
      // Update location object for future use
      location.isValidated = true;
      location.isWater = details.isWater;
      
      return {
        isValid,
        isWater: details.isWater || false,
        name: location.name
      };
    } catch (error) {
      console.warn('Error validating location with geocoding:', error);
      
      // Cache negative result to prevent repeated API calls
      validationCache.set(cacheKey, {
        isValid: !isWater, // Assume valid if not water
        timestamp: Date.now()
      });
      
      return {
        isValid: !isWater,
        isWater,
        name: location.name
      };
    }
  }
  
  // Cache the result for water locations
  validationCache.set(cacheKey, {
    isValid: false,
    timestamp: Date.now()
  });
  
  location.isValidated = true;
  location.isWater = true;
  
  return {
    isValid: false,
    isWater: true,
    name: location.name
  };
}

/**
 * Clean the validation cache
 */
export function cleanValidationCache(): void {
  const now = Date.now();
  validationCache.forEach((value, key) => {
    if (now - value.timestamp > CACHE_EXPIRY) {
      validationCache.delete(key);
    }
  });
}

/**
 * Filter out invalid locations (water or invalid geocoding)
 * from a batch of locations to process
 */
export async function filterValidLocations(locations: BatchLocationData[]): Promise<BatchLocationData[]> {
  // Process in parallel for efficiency
  const validationPromises = locations.map(validateForecastLocation);
  const validationResults = await Promise.all(validationPromises);
  
  // Filter out invalid locations
  return locations.filter((_, index) => validationResults[index].isValid);
}
