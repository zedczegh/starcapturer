
import { fetchLightPollutionData } from "@/lib/api";
import { findClosestKnownLocation, estimateBortleScaleByLocation } from "@/utils/locationUtils";

// Export this function for other modules to use
export const estimateBortleScale = (locationName: string): number | null => {
  if (!locationName || locationName.length < 3) {
    return null;
  }
  
  try {
    // Default estimate based on location name
    const estimate = estimateBortleScaleByLocation(locationName, 0, 0);
    
    // Only return the estimate if it's within valid range
    if (estimate >= 1 && estimate <= 9) {
      return estimate;
    }
    return null;
  } catch (error) {
    console.error("Error estimating Bortle scale:", error);
    return null;
  }
};

export const getBortleScaleForLocation = async (
  latitude: number, 
  longitude: number, 
  locationName: string,
  setCachedData: (key: string, data: any) => void
): Promise<number | null> => {
  console.log("Getting Bortle scale for:", latitude, longitude, locationName);
  
  if (!isFinite(latitude) || !isFinite(longitude)) {
    return null;
  }
  
  const cacheKey = `bortle-${latitude.toFixed(4)}-${longitude.toFixed(4)}`;
  
  // First try our local database - this is most reliable
  try {
    const { findClosestLocation } = await import("@/data/locationDatabase");
    const closestLocation = findClosestLocation(latitude, longitude);
    
    if (closestLocation && typeof closestLocation.bortleScale === 'number' && 
        closestLocation.bortleScale >= 1 && closestLocation.bortleScale <= 9 && 
        closestLocation.distance < 100) {
      console.log("Using Bortle scale from primary database:", closestLocation.bortleScale, "for", closestLocation.name);
      setCachedData(cacheKey, { 
        bortleScale: closestLocation.bortleScale, 
        source: 'database',
        name: closestLocation.name,
        distance: closestLocation.distance
      });
      return closestLocation.bortleScale;
    }
  } catch (error) {
    console.error("Error using primary database for Bortle scale:", error);
  }
  
  // Try our secondary database
  const closestLocation = findClosestKnownLocation(latitude, longitude);
  
  if (closestLocation && typeof closestLocation.bortleScale === 'number' && 
      closestLocation.bortleScale >= 1 && closestLocation.bortleScale <= 9 && 
      closestLocation.distance <= 100) {
    console.log("Using Bortle scale from secondary database:", closestLocation.bortleScale, "for", closestLocation.name);
    setCachedData(cacheKey, { 
      bortleScale: closestLocation.bortleScale, 
      source: 'secondary-database',
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
    
    if (lightPollutionData && typeof lightPollutionData.bortleScale === 'number' && 
        lightPollutionData.bortleScale >= 1 && lightPollutionData.bortleScale <= 9) {
      console.log("Got Bortle scale from API:", lightPollutionData.bortleScale);
      setCachedData(cacheKey, { 
        bortleScale: lightPollutionData.bortleScale, 
        source: 'api' 
      });
      return lightPollutionData.bortleScale;
    }
  } catch (error) {
    console.error("Error fetching light pollution data:", error);
  }
  
  // If we still don't have valid data, try estimation
  if (locationName && locationName.length > 3) {
    const estimatedScale = estimateBortleScaleByLocation(locationName, latitude, longitude);
    
    if (estimatedScale >= 1 && estimatedScale <= 9) {
      console.log("Using estimated Bortle scale:", estimatedScale);
      setCachedData(cacheKey, { 
        bortleScale: estimatedScale, 
        source: 'estimated' 
      });
      return estimatedScale;
    }
  }
  
  // If all attempts fail, return null
  console.log("Could not determine Bortle scale for this location");
  setCachedData(cacheKey, { 
    bortleScale: null, 
    source: 'unknown' 
  });
  
  return null;
};
