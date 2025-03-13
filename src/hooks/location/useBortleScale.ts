
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
  // Try to get Bortle scale from API first
  try {
    const lightPollutionData = await fetchLightPollutionData(latitude, longitude);
    if (lightPollutionData && lightPollutionData.bortleScale) {
      console.log("Got Bortle scale from API:", lightPollutionData.bortleScale);
      return lightPollutionData.bortleScale;
    }
  } catch (error) {
    console.error("Error fetching light pollution data:", error);
  }
  
  // Use our database as fallback
  const closestLocation = findClosestKnownLocation(latitude, longitude);
  if (closestLocation.distance <= 50) {
    console.log("Using Bortle scale from database:", closestLocation.bortleScale);
    return closestLocation.bortleScale;
  }
  
  // If all else fails, estimate based on name
  return estimateBortleScale(locationName);
};
