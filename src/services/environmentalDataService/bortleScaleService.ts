
import { fetchLightPollutionData } from "@/lib/api";
import { estimateBortleScaleByLocation } from "@/utils/locationUtils";

// Default timeout for light pollution API requests (in milliseconds)
const DEFAULT_TIMEOUT = 5000;
// Default cache lifetime for Bortle scale data (in milliseconds)
const BORTLE_CACHE_LIFETIME = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Optimized service for retrieving and calculating Bortle scale data
 */
export const getBortleScaleData = async (
  latitude: number,
  longitude: number,
  locationName: string,
  bortleScale: number,
  displayOnly: boolean,
  getCachedData: (key: string, maxAge?: number) => any,
  setCachedData: (key: string, data: any) => void,
  language: string = 'en',
  setStatusMessage?: (message: string | null) => void,
  timeout: number = DEFAULT_TIMEOUT
): Promise<number> => {
  // If in display-only mode and a valid bortleScale is provided, use it
  if (displayOnly && bortleScale >= 1 && bortleScale <= 9) {
    return bortleScale;
  }
  
  // Check for cached Bortle scale data
  const bortleCacheKey = `bortle-${latitude.toFixed(4)}-${longitude.toFixed(4)}`;
  const cachedBortleData = getCachedData(bortleCacheKey, BORTLE_CACHE_LIFETIME);
  
  if (cachedBortleData?.bortleScale && 
      typeof cachedBortleData.bortleScale === 'number' &&
      cachedBortleData.bortleScale >= 1 && 
      cachedBortleData.bortleScale <= 9) {
    return cachedBortleData.bortleScale;
  }
  
  // Use local database (fastest and works in all regions)
  const { findClosestKnownLocation } = await import("@/utils/locationUtils");
  const closestLocation = findClosestKnownLocation(latitude, longitude);
  
  if (closestLocation.distance <= 50) {
    // Cache the valid Bortle scale data
    setCachedData(bortleCacheKey, { 
      bortleScale: closestLocation.bortleScale, 
      source: 'database' 
    });
    return closestLocation.bortleScale;
  }
  
  try {
    // Attempt to fetch Bortle scale from API with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const lightPollutionData = await fetchLightPollutionData(
      latitude, 
      longitude,
      controller.signal
    );
    
    clearTimeout(timeoutId);
    
    if (lightPollutionData?.bortleScale && 
        typeof lightPollutionData.bortleScale === 'number' && 
        lightPollutionData.bortleScale >= 1 && 
        lightPollutionData.bortleScale <= 9) {
      
      // Cache the valid Bortle scale data
      setCachedData(bortleCacheKey, lightPollutionData);
      return lightPollutionData.bortleScale;
    }
  } catch (error) {
    console.error("Error fetching light pollution data:", error);
    // Continue to fallback method
  }
  
  // If API returned invalid data or failed, use location-based estimation
  const estimatedScale = estimateBortleScaleByLocation(locationName);
  
  // Cache the estimated data
  setCachedData(bortleCacheKey, { 
    bortleScale: estimatedScale, 
    estimated: true 
  });
  
  if (!displayOnly && setStatusMessage) {
    setStatusMessage(language === 'en'
      ? "Using location-based light pollution estimation."
      : "使用基于位置的光污染估算。");
  }
  
  return estimatedScale;
};
