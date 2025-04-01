
/**
 * Bortle scale service
 */
import { fetchLightPollutionData } from "@/lib/api";

/**
 * Get Bortle scale value for a location
 */
export async function getBortleScaleValue(
  latitude: number,
  longitude: number
): Promise<number | null> {
  try {
    const pollutionData = await fetchLightPollutionData(latitude, longitude);
    return pollutionData?.bortleScale || null;
  } catch (error) {
    console.error("Error getting Bortle scale value:", error);
    return null;
  }
}

/**
 * Get Bortle scale data with caching
 */
export async function getBortleScaleData(
  latitude: number,
  longitude: number,
  locationName: string,
  defaultBortleScale: number,
  displayOnly: boolean = false,
  getCachedData: (key: string, maxAge?: number) => any,
  setCachedData: (key: string, data: any) => void,
  language: string = 'en',
  setStatusMessage?: (message: string | null) => void
): Promise<number> {
  try {
    // Check cache first
    const cacheKey = `bortle-${latitude.toFixed(4)}-${longitude.toFixed(4)}`;
    const maxCacheAge = 24 * 60 * 60 * 1000; // 24 hours
    const cachedData = getCachedData(cacheKey, maxCacheAge);
    
    if (cachedData !== null && typeof cachedData === 'number') {
      console.log("Using cached Bortle scale data:", cachedData);
      return cachedData;
    }
    
    // Set status message if loading
    if (!displayOnly) {
      setStatusMessage && setStatusMessage(
        language === 'en' 
          ? "Retrieving light pollution data..." 
          : "正在获取光污染数据..."
      );
    }
    
    // Fetch new data
    const pollutionData = await fetchLightPollutionData(latitude, longitude);
    
    if (pollutionData && typeof pollutionData.bortleScale === 'number') {
      // Cache the result
      setCachedData(cacheKey, pollutionData.bortleScale);
      return pollutionData.bortleScale;
    }
    
    // If we couldn't get data, use the default
    return defaultBortleScale;
  } catch (error) {
    console.error("Error getting Bortle scale data:", error);
    return defaultBortleScale;
  }
}
