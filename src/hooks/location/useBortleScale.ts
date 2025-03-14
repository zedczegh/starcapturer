
import { fetchLightPollutionData } from "@/lib/api";
import { findClosestKnownLocation, estimateBortleScaleByLocation } from "@/utils/locationUtils";

export const getBortleScaleForLocation = async (
  latitude: number, 
  longitude: number, 
  locationName: string,
  setCachedData: (key: string, data: any) => void
): Promise<number> => {
  console.log("Getting Bortle scale for:", latitude, longitude, locationName);
  
  const cacheKey = `bortle-${latitude.toFixed(4)}-${longitude.toFixed(4)}`;
  
  // Try to get Bortle scale from our database first (works without API)
  const closestLocation = findClosestKnownLocation(latitude, longitude);
  
  if (closestLocation.distance <= 100) {
    console.log("Using Bortle scale from database:", closestLocation.bortleScale, "for", closestLocation.name);
    // Cache this for future use
    setCachedData(cacheKey, { 
      bortleScale: closestLocation.bortleScale, 
      source: 'database',
      name: closestLocation.name,
      distance: closestLocation.distance
    });
    return closestLocation.bortleScale;
  }
  
  // Only try API as a fallback (with a timeout to prevent hanging)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const lightPollutionData = await fetchLightPollutionData(
      latitude, 
      longitude
    );
    
    clearTimeout(timeoutId);
    
    if (lightPollutionData && typeof lightPollutionData.bortleScale === 'number') {
      console.log("Got Bortle scale from API:", lightPollutionData.bortleScale);
      setCachedData(cacheKey, { 
        bortleScale: lightPollutionData.bortleScale, 
        source: 'api' 
      });
      return lightPollutionData.bortleScale;
    }
  } catch (error) {
    console.error("Error fetching light pollution data:", error);
    // Continue to fallback method
  }
  
  // If all else fails, estimate based on name and coordinates
  const estimatedScale = estimateBortleScaleByLocation(locationName, latitude, longitude);
  console.log("Using estimated Bortle scale:", estimatedScale);
  setCachedData(cacheKey, { 
    bortleScale: estimatedScale, 
    source: 'estimated' 
  });
  
  return estimatedScale;
};
