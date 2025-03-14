
import { fetchLightPollutionData } from "@/lib/api";
import { estimateBortleScaleByLocation, findClosestKnownLocation } from "@/utils/locationUtils";

// Default timeout for light pollution API requests (in milliseconds)
const DEFAULT_TIMEOUT = 5000;
// Default cache lifetime for Bortle scale data (in milliseconds)
const BORTLE_CACHE_LIFETIME = 12 * 60 * 60 * 1000; // 12 hours

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
  console.log("Getting Bortle scale data for", latitude, longitude, locationName);
  
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
    console.log("Using cached Bortle scale:", cachedBortleData.bortleScale);
    return cachedBortleData.bortleScale;
  }
  
  try {
    // Try direct database lookup first (fastest and most reliable)
    const { findClosestLocation } = await import("@/data/locationDatabase");
    const closestLocation = findClosestLocation(latitude, longitude);
    
    if (closestLocation && typeof closestLocation.bortleScale === 'number') {
      console.log("Using database Bortle scale:", closestLocation.bortleScale);
      // Cache the valid Bortle scale data
      setCachedData(bortleCacheKey, { 
        bortleScale: closestLocation.bortleScale, 
        source: 'database' 
      });
      return closestLocation.bortleScale;
    }
  } catch (error) {
    console.error("Error using local database for Bortle scale:", error);
  }
  
  try {
    // Attempt to fetch Bortle scale from API with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const lightPollutionData = await fetchLightPollutionData(
      latitude, 
      longitude
    );
    
    clearTimeout(timeoutId);
    
    if (lightPollutionData?.bortleScale && 
        typeof lightPollutionData.bortleScale === 'number' && 
        lightPollutionData.bortleScale >= 1 && 
        lightPollutionData.bortleScale <= 9) {
      
      console.log("Using API Bortle scale:", lightPollutionData.bortleScale);
      // Cache the valid Bortle scale data
      setCachedData(bortleCacheKey, { 
        bortleScale: lightPollutionData.bortleScale,
        source: 'api'
      });
      return lightPollutionData.bortleScale;
    }
  } catch (error) {
    console.error("Error fetching light pollution data:", error);
  }
  
  // If still no valid data, use the backup utility
  try {
    const closestKnownLocation = findClosestKnownLocation(latitude, longitude);
    if (closestKnownLocation && closestKnownLocation.bortleScale) {
      console.log("Using utility Bortle scale:", closestKnownLocation.bortleScale);
      setCachedData(bortleCacheKey, { 
        bortleScale: closestKnownLocation.bortleScale,
        source: 'utility' 
      });
      return closestKnownLocation.bortleScale;
    }
  } catch (error) {
    console.error("Error using fallback utility for Bortle scale:", error);
  }
  
  // Last resort: Use location-based estimation
  const estimatedScale = estimateBortleScaleByLocation(locationName, latitude, longitude);
  console.log("Using estimated Bortle scale:", estimatedScale);
  
  // Cache the estimated data
  setCachedData(bortleCacheKey, { 
    bortleScale: estimatedScale, 
    estimated: true,
    source: 'estimation'
  });
  
  if (!displayOnly && setStatusMessage) {
    setStatusMessage(language === 'en'
      ? "Using location-based light pollution estimation."
      : "使用基于位置的光污染估算。");
  }
  
  return estimatedScale;
};
