
import { fetchLightPollutionData } from "@/lib/api";
import { estimateBortleScaleByLocation, findClosestKnownLocation } from "@/utils/locationUtils";

// Default timeout for light pollution API requests (in milliseconds)
const DEFAULT_TIMEOUT = 5000;
// Default cache lifetime for Bortle scale data (in milliseconds)
const BORTLE_CACHE_LIFETIME = 12 * 60 * 60 * 1000; // 12 hours
// Memory cache to avoid repeated database lookups
const memoryCache = new Map<string, {
  bortleScale: number | null;
  source: string;
  timestamp: number;
  confidence: 'high' | 'medium' | 'low' | 'none';
}>();

/**
 * Enhanced service for retrieving and calculating Bortle scale data
 * Prioritizes star count measurements, then local database, then API data
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
  
  // Check memory cache first (fastest)
  const memoryCacheKey = `bortle-${latitude.toFixed(4)}-${longitude.toFixed(4)}`;
  const memoryCachedData = memoryCache.get(memoryCacheKey);
  
  if (memoryCachedData && 
      Date.now() - memoryCachedData.timestamp < BORTLE_CACHE_LIFETIME && 
      typeof memoryCachedData.bortleScale === 'number' && 
      memoryCachedData.bortleScale >= 1 && 
      memoryCachedData.bortleScale <= 9) {
    console.log(`Using memory-cached Bortle scale: ${memoryCachedData.bortleScale}, source: ${memoryCachedData.source}`);
    return memoryCachedData.bortleScale;
  }
  
  // Check persistent cache next
  const bortleCacheKey = `bortle-${latitude.toFixed(4)}-${longitude.toFixed(4)}`;
  const cachedBortleData = getCachedData(bortleCacheKey, BORTLE_CACHE_LIFETIME);
  
  if (cachedBortleData?.bortleScale && 
      typeof cachedBortleData.bortleScale === 'number' &&
      cachedBortleData.bortleScale >= 1 && 
      cachedBortleData.bortleScale <= 9) {
    console.log("Using cached Bortle scale:", cachedBortleData.bortleScale, "source:", cachedBortleData.source);
    
    // Update memory cache for faster future lookups
    memoryCache.set(memoryCacheKey, {
      ...cachedBortleData,
      timestamp: Date.now()
    });
    
    return cachedBortleData.bortleScale;
  }
  
  try {
    // Check for star count data first (highest accuracy)
    try {
      const { getStarCountBortleScale } = await import('@/utils/starAnalysis');
      const starBortleScale = await getStarCountBortleScale(latitude, longitude);
      
      if (starBortleScale !== null) {
        console.log("Using star count data for Bortle scale:", starBortleScale);
        
        const result = {
          bortleScale: starBortleScale, 
          source: 'star_count',
          confidence: 'high' as const,
          timestamp: Date.now()
        };
        
        // Update both caches
        setCachedData(bortleCacheKey, result);
        memoryCache.set(memoryCacheKey, result);
        
        return starBortleScale;
      }
    } catch (error) {
      console.warn("Star count analysis unavailable:", error);
    }
    
    // Next try terrain-corrected data for enhanced accuracy
    try {
      const { getTerrainCorrectedBortleScale } = await import('@/utils/terrainCorrection');
      const terrainCorrectedScale = await getTerrainCorrectedBortleScale(latitude, longitude, locationName);
      
      if (terrainCorrectedScale !== null) {
        console.log("Using terrain-corrected Bortle scale:", terrainCorrectedScale);
        
        const result = {
          bortleScale: terrainCorrectedScale, 
          source: 'terrain_corrected',
          confidence: 'high' as const,
          timestamp: Date.now()
        };
        
        // Update both caches
        setCachedData(bortleCacheKey, result);
        memoryCache.set(memoryCacheKey, result);
        
        return terrainCorrectedScale;
      }
    } catch (error) {
      console.warn("Terrain correction unavailable:", error);
    }
    
    // Try direct database lookup (still high accuracy)
    const { findClosestLocation } = await import("@/data/locationDatabase");
    const closestLocation = findClosestLocation(latitude, longitude);
    
    if (closestLocation && typeof closestLocation.bortleScale === 'number' && 
        closestLocation.bortleScale >= 1 && closestLocation.bortleScale <= 9 && 
        closestLocation.distance < 100) {
      console.log("Using database Bortle scale:", closestLocation.bortleScale, "for", closestLocation.name);
      
      const result = {
        bortleScale: closestLocation.bortleScale, 
        source: 'database',
        name: closestLocation.name,
        distance: closestLocation.distance,
        confidence: 'high' as const,
        timestamp: Date.now()
      };
      
      // Update both caches
      setCachedData(bortleCacheKey, result);
      memoryCache.set(memoryCacheKey, result);
      
      return closestLocation.bortleScale;
    }
  } catch (error) {
    console.error("Error using local database for Bortle scale:", error);
  }
  
  // Use Promise.race to implement API timeout
  try {
    const apiPromise = fetchLightPollutionData(latitude, longitude);
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("API timeout")), timeout);
    });
    
    const lightPollutionData = await Promise.race([apiPromise, timeoutPromise]) as any;
    
    if (lightPollutionData?.bortleScale !== null && 
        typeof lightPollutionData.bortleScale === 'number' && 
        lightPollutionData.bortleScale >= 1 && 
        lightPollutionData.bortleScale <= 9) {
      
      console.log("Using API Bortle scale:", lightPollutionData.bortleScale);
      
      const result = {
        bortleScale: lightPollutionData.bortleScale,
        source: 'api',
        confidence: 'medium' as const,
        timestamp: Date.now()
      };
      
      // Update both caches
      setCachedData(bortleCacheKey, result);
      memoryCache.set(memoryCacheKey, result);
      
      return lightPollutionData.bortleScale;
    }
  } catch (error) {
    console.error("Error or timeout fetching light pollution data:", error);
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
      
      const result = {
        bortleScale: closestKnownLocation.bortleScale,
        source: 'utility',
        distance: closestKnownLocation.distance,
        confidence: 'medium' as const,
        timestamp: Date.now()
      };
      
      // Update both caches
      setCachedData(bortleCacheKey, result);
      memoryCache.set(memoryCacheKey, result);
      
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
        
        const result = {
          bortleScale: estimatedScale, 
          estimated: true,
          source: 'estimation',
          confidence: 'low' as const,
          timestamp: Date.now()
        };
        
        // Update both caches
        setCachedData(bortleCacheKey, result);
        memoryCache.set(memoryCacheKey, result);
        
        if (!displayOnly && setStatusMessage) {
          setStatusMessage(language === 'en'
            ? "Unable to get accurate light pollution data. Using estimate based on location name."
            : "无法获取准确的光污染数据。使用基于位置名称的估算。");
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
  const unknownResult = { 
    bortleScale: null, 
    unknown: true,
    source: 'unknown',
    confidence: 'none' as const,
    timestamp: Date.now()
  };
  
  setCachedData(bortleCacheKey, unknownResult);
  memoryCache.set(memoryCacheKey, unknownResult);
  
  // Return null to indicate unknown Bortle scale
  return null;
};

/**
 * Clear expired entries from memory cache
 */
export const clearBortleMemoryCache = (maxAge = BORTLE_CACHE_LIFETIME): void => {
  const now = Date.now();
  let count = 0;
  
  for (const [key, value] of memoryCache.entries()) {
    if (now - value.timestamp > maxAge) {
      memoryCache.delete(key);
      count++;
    }
  }
  
  if (count > 0) {
    console.log(`Cleared ${count} expired Bortle scale entries from memory cache`);
  }
};

// Set up automatic memory cache cleanup
setInterval(() => {
  clearBortleMemoryCache();
}, 60 * 60 * 1000); // Clean up once per hour
