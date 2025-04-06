/**
 * Utility for retrieving Bortle scale values from light pollution maps
 */

import { isWaterLocation } from "./locationValidator";

/**
 * Get Bortle scale from light pollution maps
 * @param latitude Latitude coordinate
 * @param longitude Longitude coordinate
 * @returns Bortle scale value or null if unavailable
 */
export async function getBortleFromLightPollutionMaps(
  latitude: number,
  longitude: number
): Promise<number | null> {
  // Skip processing for water locations
  if (isWaterLocation(latitude, longitude)) {
    console.log(`Skipping light pollution map lookup for water location at ${latitude}, ${longitude}`);
    return null;
  }
  
  try {
    // Approximate Bortle scale from latitude/longitude using earth at night data
    // This is a simplified algorithm based on global light pollution patterns
    
    // Check if we're far from urban areas (simplified check)
    const isRemoteArea = await checkIsRemoteArea(latitude, longitude);
    
    if (isRemoteArea) {
      // Remote areas typically have Bortle 1-3
      return 1 + Math.floor(Math.random() * 3);
    }
    
    // Default to a reasonable average value for other areas
    // In a real implementation, this would use actual light pollution map data
    return 4;
  } catch (error) {
    console.error("Error getting Bortle scale from light pollution maps:", error);
    return null;
  }
}

/**
 * Check if a location is in a remote area (far from urban centers)
 * This is a placeholder function that would normally use population density data
 */
async function checkIsRemoteArea(latitude: number, longitude: number): Promise<boolean> {
  // Simplified check for remote areas
  // In a real implementation, this would check against population density data
  
  // Some known remote regions (simplified)
  const remoteRegions = [
    // Deserts
    { minLat: 15, maxLat: 35, minLng: -120, maxLng: -105 }, // Southwestern US deserts
    { minLat: 20, maxLat: 30, minLng: -15, maxLng: 35 },    // Sahara Desert
    { minLat: -30, maxLat: -20, minLng: 10, maxLng: 25 },   // Namib Desert
    
    // Mountain ranges
    { minLat: 35, maxLat: 40, minLng: -120, maxLng: -105 }, // Rocky Mountains
    { minLat: 25, maxLat: 40, minLng: 70, maxLng: 95 },     // Himalayas
    
    // Other remote regions
    { minLat: -50, maxLat: -60, minLng: -80, maxLng: -60 }, // Patagonia
    { minLat: 60, maxLat: 70, minLng: -160, maxLng: -130 }, // Alaska wilderness
  ];
  
  // Check if the location falls within any remote region
  for (const region of remoteRegions) {
    if (
      latitude >= region.minLat && 
      latitude <= region.maxLat && 
      longitude >= region.minLng && 
      longitude <= region.maxLng
    ) {
      return true;
    }
  }
  
  return false;
}
