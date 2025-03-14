
import { fetchLightPollutionData } from "@/lib/api";
import { estimateBortleScaleByLocation, findClosestKnownLocation } from "@/utils/locationUtils";

// Default timeout for light pollution API requests (in milliseconds)
const DEFAULT_TIMEOUT = 5000;
// Default cache lifetime for Bortle scale data (in milliseconds)
const BORTLE_CACHE_LIFETIME = 12 * 60 * 60 * 1000; // 12 hours

/**
 * Optimized service for retrieving and calculating Bortle scale data
 * Prioritizes local database data over estimates
 */
export const getBortleScaleData = async (
  latitude: number,
  longitude: number,
  locationName: string,
  bortleScale: number | null,
  displayOnly: boolean,
  getCachedData: (key: string, maxAge?: number) => any,
  setCachedData: (key: string, data: any) => void,
  language: string = 'en',
  setStatusMessage?: (message: string | null) => void,
  timeout: number = DEFAULT_TIMEOUT
): Promise<number | null> => {
  console.log("Getting Bortle scale data for", latitude, longitude, locationName);
  
  // Skip processing if coordinates are invalid
  if (!isFinite(latitude) || !isFinite(longitude)) {
    return null;
  }
  
  // If in display-only mode and a valid bortleScale is provided, use it
  if (displayOnly && bortleScale !== null && bortleScale >= 1 && bortleScale <= 9) {
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
    
    if (closestLocation && typeof closestLocation.bortleScale === 'number' && 
        closestLocation.bortleScale >= 1 && closestLocation.bortleScale <= 9 && 
        closestLocation.distance < 100) {
      console.log("Using database Bortle scale:", closestLocation.bortleScale, "for", closestLocation.name);
      // Cache the valid Bortle scale data
      setCachedData(bortleCacheKey, { 
        bortleScale: closestLocation.bortleScale, 
        source: 'database',
        name: closestLocation.name,
        distance: closestLocation.distance
      });
      return closestLocation.bortleScale;
    }
  } catch (error) {
    console.error("Error using local database for Bortle scale:", error);
  }
  
  try {
    // Attempt to fetch Bortle scale from our API implementation with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const lightPollutionData = await fetchLightPollutionData(
      latitude, 
      longitude
    );
    
    clearTimeout(timeoutId);
    
    if (lightPollutionData?.bortleScale !== null && 
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
  
  // If still no valid data, use our backup utility
  try {
    const closestKnownLocation = findClosestKnownLocation(latitude, longitude);
    if (closestKnownLocation && 
        typeof closestKnownLocation.bortleScale === 'number' && 
        closestKnownLocation.bortleScale >= 1 && 
        closestKnownLocation.bortleScale <= 9 && 
        closestKnownLocation.distance < 100) {
      
      console.log("Using utility Bortle scale:", closestKnownLocation.bortleScale);
      setCachedData(bortleCacheKey, { 
        bortleScale: closestKnownLocation.bortleScale,
        source: 'utility',
        distance: closestKnownLocation.distance
      });
      return closestKnownLocation.bortleScale;
    }
  } catch (error) {
    console.error("Error using fallback utility for Bortle scale:", error);
  }
  
  // Last resort: Use location-based estimation but only if we have a location name
  // and make it clear this is an estimate
  if (locationName && locationName.length > 3) {
    try {
      const estimatedScale = estimateBortleScaleByLocation(locationName, latitude, longitude);
      
      // Only use estimation if it seems valid
      if (estimatedScale >= 1 && estimatedScale <= 9) {
        console.log("Using estimated Bortle scale:", estimatedScale);
        
        // Cache the estimated data
        setCachedData(bortleCacheKey, { 
          bortleScale: estimatedScale, 
          estimated: true,
          source: 'estimation'
        });
        
        if (!displayOnly && setStatusMessage) {
          setStatusMessage(language === 'en'
            ? "Unable to get accurate light pollution data. Using estimate based on location."
            : "无法获取准确的光污染数据。使用基于位置的估算。");
        }
        
        return estimatedScale;
      }
    } catch (error) {
      console.error("Error estimating Bortle scale:", error);
    }
  }
  
  // If we get here, we couldn't determine the Bortle scale
  if (!displayOnly && setStatusMessage) {
    setStatusMessage(language === 'en'
      ? "Unable to determine light pollution level for this location."
      : "无法确定此位置的光污染水平。");
  }
  
  // Store the fact that we don't know the Bortle scale
  setCachedData(bortleCacheKey, { 
    bortleScale: null, 
    unknown: true,
    source: 'unknown'
  });
  
  // Return null to indicate unknown Bortle scale
  return null;
};
