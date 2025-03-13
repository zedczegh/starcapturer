import { fetchWeatherData, fetchLightPollutionData } from "@/lib/api";
import { estimateBortleScaleByLocation } from "@/utils/locationUtils";

/**
 * Get weather data with fallback for errors
 */
export const getWeatherData = async (
  latitude: number,
  longitude: number,
  cacheKey: string,
  getCachedData: (key: string, maxAge?: number) => any,
  setCachedData: (key: string, data: any) => void,
  displayOnly: boolean,
  language: string = 'en',
  setStatusMessage?: (message: string | null) => void
): Promise<any> => {
  const cachedWeatherData = !displayOnly ? null : getCachedData(cacheKey, 2 * 60 * 1000); // 2 minute cache for weather
  
  if (cachedWeatherData) {
    return cachedWeatherData;
  }
  
  try {
    const data = await fetchWeatherData({
      latitude,
      longitude,
    });
    
    if (data) {
      // Cache the weather data for future use
      setCachedData(cacheKey, data);
      return data;
    }
  } catch (weatherError) {
    console.error("Failed to fetch weather data:", weatherError);
    
    // Use fallback weather data
    const fallbackData = {
      temperature: 20,
      humidity: 50,
      cloudCover: 30,
      windSpeed: 10,
      precipitation: 0,
      time: new Date().toISOString(),
      condition: "Clear",
      weatherCondition: "Clear",
      aqi: 50
    };
    
    // Show status message if not in display-only mode
    if (!displayOnly && setStatusMessage) {
      setStatusMessage(language === 'en'
        ? "Could not fetch real-time weather. Using offline data instead."
        : "无法获取实时天气数据，使用离线数据替代。");
    }
    
    return fallbackData;
  }
  
  return null;
};

/**
 * Get Bortle scale data with fallbacks
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
  setStatusMessage?: (message: string | null) => void
): Promise<number> => {
  if (!displayOnly || bortleScale === 4) {
    // Check if we have cached Bortle scale data
    const bortleCacheKey = `bortle-${latitude.toFixed(4)}-${longitude.toFixed(4)}`;
    const cachedBortleData = getCachedData(bortleCacheKey, 24 * 60 * 60 * 1000); // 24 hour cache for Bortle scale
    
    if (cachedBortleData && typeof cachedBortleData.bortleScale === 'number') {
      return cachedBortleData.bortleScale;
    }
    
    try {
      // Attempt to fetch Bortle scale from API
      const lightPollutionData = await fetchLightPollutionData(latitude, longitude);
      
      if (lightPollutionData && 
          typeof lightPollutionData.bortleScale === 'number' && 
          lightPollutionData.bortleScale >= 1 && 
          lightPollutionData.bortleScale <= 9) {
        
        // Cache the valid Bortle scale data
        setCachedData(bortleCacheKey, lightPollutionData);
        return lightPollutionData.bortleScale;
      }
    } catch (error) {
      console.error("Error fetching light pollution data:", error);
    }
    
    // If API returned invalid data or failed, use location-based estimation
    const estimatedScale = estimateBortleScaleByLocation(locationName, latitude, longitude);
    
    // Cache the estimated data
    setCachedData(bortleCacheKey, { bortleScale: estimatedScale, estimated: true });
    
    if (!displayOnly && setStatusMessage) {
      setStatusMessage(language === 'en'
        ? "Could not fetch precise light pollution data. Using location-based estimation."
        : "无法获取精确的光污染数据。使用基于位置的估算。");
    }
    
    return estimatedScale;
  }
  
  // Use the provided bortleScale value if displayOnly and not a default value
  return bortleScale;
};
