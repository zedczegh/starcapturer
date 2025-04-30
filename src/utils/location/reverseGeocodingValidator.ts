
import { getEnhancedLocationDetails } from '@/services/geocoding/enhancedReverseGeocoding';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { isWaterLocationSync } from '@/utils/validation';

// Cache for validation results to prevent repeated API calls
const VALIDATION_CACHE = new Map<string, { result: boolean, timestamp: number }>();
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Validates if a location is on land (not water) using reverse geocoding
 * Improved with better water detection and caching
 * 
 * @param location The location to validate
 * @param language Language preference for results
 * @returns Promise<boolean> - true if location is valid (on land), false if it's water
 */
export async function validateLocationWithReverseGeocoding(
  location: SharedAstroSpot,
  language: 'en' | 'zh' = 'en'
): Promise<boolean> {
  // Skip validation for certified locations - they're always valid
  if (location.isDarkSkyReserve || location.certification) {
    return true;
  }

  const cacheKey = `${location.latitude.toFixed(4)},${location.longitude.toFixed(4)}`;
  
  // Check cache first for faster response
  if (VALIDATION_CACHE.has(cacheKey)) {
    const cached = VALIDATION_CACHE.get(cacheKey)!;
    const now = Date.now();
    
    // Only use cache if it hasn't expired
    if (now - cached.timestamp < CACHE_EXPIRY) {
      return cached.result;
    }
    // If expired, remove from cache and continue to validation
    VALIDATION_CACHE.delete(cacheKey);
  }
  
  try {
    // Get enhanced details with improved water detection
    const details = await getEnhancedLocationDetails(location.latitude, location.longitude, language);
    
    // Location is invalid if it's water or doesn't have proper location data
    const isValid = !details.isWater && Boolean(
      details.formattedName && 
      !details.formattedName.includes("°") && // Not just coordinates
      (details.townName || details.cityName || details.countyName || details.stateName)
    );
    
    // Cache the result with timestamp
    VALIDATION_CACHE.set(cacheKey, { 
      result: isValid, 
      timestamp: Date.now() 
    });
    
    // Clean cache if it's getting too large
    if (VALIDATION_CACHE.size > 1000) {
      clearOldCacheEntries();
    }
    
    return isValid;
  } catch (error) {
    console.warn('Error validating location with reverse geocoding:', error);
    return true; // Allow location if validation fails
  }
}

/**
 * Removes expired entries from the validation cache
 */
function clearOldCacheEntries(): void {
  const now = Date.now();
  
  VALIDATION_CACHE.forEach((value, key) => {
    if (now - value.timestamp > CACHE_EXPIRY) {
      VALIDATION_CACHE.delete(key);
    }
  });
}
