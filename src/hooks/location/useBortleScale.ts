
import { findClosestKnownLocation } from "@/utils/locationUtils";
import { fetchLightPollutionData } from "@/lib/api";

export const estimateBortleScale = (locationName: string): number => {
  if (!locationName) return 5; // Default moderate value
  
  const { estimateBortleScaleByLocation } = require("@/utils/locationUtils");
  return estimateBortleScaleByLocation(locationName);
};

export const getBortleScaleForLocation = async (
  latitude: number, 
  longitude: number, 
  locationName: string,
  setCachedData: (key: string, data: any) => void
): Promise<number> => {
  const cacheKey = `bortle-${latitude.toFixed(4)}-${longitude.toFixed(4)}`;
  
  // Try to get Bortle scale from our database first (works without API)
  const closestLocation = findClosestKnownLocation(latitude, longitude);
  if (closestLocation.distance <= 50) {
    console.log("Using Bortle scale from database:", closestLocation.bortleScale);
    // Cache this for future use
    setCachedData(cacheKey, { bortleScale: closestLocation.bortleScale, source: 'database' });
    return closestLocation.bortleScale;
  }
  
  // Only try API as a fallback (with a timeout to prevent hanging)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const lightPollutionData = await fetchLightPollutionData(
      latitude, 
      longitude, 
      { signal: controller.signal }
    );
    
    clearTimeout(timeoutId);
    
    if (lightPollutionData && lightPollutionData.bortleScale) {
      console.log("Got Bortle scale from API:", lightPollutionData.bortleScale);
      setCachedData(cacheKey, { bortleScale: lightPollutionData.bortleScale, source: 'api' });
      return lightPollutionData.bortleScale;
    }
  } catch (error) {
    console.error("Error fetching light pollution data:", error);
    // Continue to fallback method
  }
  
  // If all else fails, estimate based on name
  const estimatedScale = estimateBortleScale(locationName);
  setCachedData(cacheKey, { bortleScale: estimatedScale, source: 'estimated' });
  return estimatedScale;
};
