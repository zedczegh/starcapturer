
import { getEnhancedLocationDetails } from '@/services/geocoding/enhancedReverseGeocoding';
import { SharedAstroSpot } from '@/lib/api/astroSpots';

const VALIDATION_CACHE = new Map<string, boolean>();
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

export async function validateLocationWithReverseGeocoding(
  location: SharedAstroSpot,
  language: 'en' | 'zh' = 'en'
): Promise<boolean> {
  const cacheKey = `${location.latitude.toFixed(4)},${location.longitude.toFixed(4)}`;
  
  // Check cache first
  if (VALIDATION_CACHE.has(cacheKey)) {
    return VALIDATION_CACHE.get(cacheKey)!;
  }
  
  try {
    const details = await getEnhancedLocationDetails(location.latitude, location.longitude, language);
    
    // Location is invalid if it's water
    const isValid = !details.isWater;
    
    // Cache the result
    VALIDATION_CACHE.set(cacheKey, isValid);
    
    // Clear old cache entries periodically
    if (VALIDATION_CACHE.size > 1000) {
      clearOldCacheEntries();
    }
    
    return isValid;
  } catch (error) {
    console.warn('Error validating location with reverse geocoding:', error);
    return true; // Allow location if validation fails
  }
}

function clearOldCacheEntries() {
  const now = Date.now();
  for (const [key, timestamp] of VALIDATION_CACHE.entries()) {
    if (now - timestamp > CACHE_EXPIRY) {
      VALIDATION_CACHE.delete(key);
    }
  }
}
