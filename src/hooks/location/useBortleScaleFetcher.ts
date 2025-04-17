
import { fetchLightPollutionData } from "@/lib/api";
import { estimateBortleScale } from "@/hooks/location/useBortleScale";

interface CachedLocationData {
  name?: string;
  formattedName?: string;
  bortleScale?: number | null;
}

type CacheHandler = {
  getCachedData: (key: string, maxAge?: number) => CachedLocationData | null;
  setCachedData: (key: string, data: CachedLocationData) => void;
};

export const fetchBortleScaleForLocation = async (
  location: { name: string; latitude: number; longitude: number },
  cacheHandler: CacheHandler,
  language: string
): Promise<number | null> => {
  const { name, latitude, longitude } = location;
  const cacheKey = `loc-${latitude.toFixed(4)}-${longitude.toFixed(4)}`;
  const cachedData = cacheHandler.getCachedData(cacheKey);
  
  if (cachedData && cachedData.bortleScale !== undefined) {
    return cachedData.bortleScale;
  }
  
  try {
    const lightPollutionData = await fetchLightPollutionData(latitude, longitude);
    
    if (lightPollutionData && lightPollutionData.bortleScale !== undefined) {
      cacheHandler.setCachedData(cacheKey, {
        name: location.name,
        bortleScale: lightPollutionData.bortleScale
      });
      
      return lightPollutionData.bortleScale;
    }
    
    // If we couldn't get light pollution data, set to null
    cacheHandler.setCachedData(cacheKey, {
      name: location.name,
      bortleScale: null
    });
    
    return null;
  } catch (error) {
    console.error("Error fetching light pollution data:", error);
    
    // Try to estimate based on location name
    try {
      const estimatedBortleScale = estimateBortleScale(name);
      if (estimatedBortleScale >= 1 && estimatedBortleScale <= 9) {
        cacheHandler.setCachedData(cacheKey, {
          name: name,
          bortleScale: estimatedBortleScale
        });
        return estimatedBortleScale;
      }
    } catch (estimationError) {
      console.error("Error estimating Bortle scale:", estimationError);
    }
    
    cacheHandler.setCachedData(cacheKey, {
      name: name,
      bortleScale: null
    });
    
    return null;
  }
};
