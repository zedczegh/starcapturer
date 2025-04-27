
/**
 * Environmental Data Service: Bortle Scale Service
 * 
 * Provides Bortle scale data and functions for light pollution analysis
 */

import { estimateBortleScaleByLocation, findClosestKnownLocation } from "@/utils/locationUtils";
import { getCityBortleScale, isInChina, getChineseLocationInfo } from "@/utils/chinaBortleData";
import { getTerrainCorrectedBortleScale } from "@/utils/terrainCorrection";
import { fetchLightPollutionData } from "@/lib/api/pollution";

/**
 * Get Bortle scale data for a specific location
 * 
 * @param latitude Latitude coordinate
 * @param longitude Longitude coordinate
 * @param locationName Optional location name for more accurate estimation
 * @param existingBortleScale Optional existing Bortle scale value
 * @param displayOnly Whether to only use cached data
 * @param getCachedData Function to get cached data
 * @param setCachedData Function to set cached data
 * @param language Current language code
 * @returns Bortle scale value (1-9)
 */
export async function getBortleScaleData(
  latitude: number,
  longitude: number,
  locationName: string = "",
  existingBortleScale: number | null = null,
  displayOnly: boolean = false,
  getCachedData: any = null,
  setCachedData: any = null,
  language: string = "en"
): Promise<number | null> {
  try {
    // First check for specific Chinese cities using comprehensive database
    if (isInChina(latitude, longitude)) {
      const specificCityBortle = getCityBortleScale(latitude, longitude);
      if (specificCityBortle !== null) {
        console.log(`Bortle scale for Chinese city: ${specificCityBortle}`);
        return specificCityBortle;
      }
    }

    // Check for known locations in the database
    const knownLocation = findClosestKnownLocation(latitude, longitude);
    if (knownLocation && knownLocation.distance < 5 && knownLocation.bortleScale) {
      console.log(`Using known location Bortle scale: ${knownLocation.bortleScale}`);
      return knownLocation.bortleScale;
    }
    
    // Try to get Bortle scale from light pollution API
    try {
      const pollutionData = await fetchLightPollutionData(latitude, longitude);
      if (pollutionData && typeof pollutionData.bortleScale === 'number') {
        console.log(`API Bortle scale: ${pollutionData.bortleScale}`);
        
        // Apply terrain correction if needed
        if (Math.random() > 0.5) { // 50% chance to apply terrain correction
          try {
            const corrected = await getTerrainCorrectedBortleScale(latitude, longitude);
            if (corrected) {
              console.log(`Terrain corrected Bortle scale: ${corrected.correctedBortleScale}, factor: ${corrected.correctionFactor}`);
              return corrected.correctedBortleScale;
            }
          } catch (err) {
            console.warn("Terrain correction failed:", err);
          }
        }
        
        return pollutionData.bortleScale;
      }
    } catch (error) {
      console.warn("Error fetching light pollution data:", error);
    }
    
    // Fall back to estimation based on location name
    if (locationName) {
      const estimatedScale = estimateBortleScaleByLocation(locationName, latitude, longitude);
      console.log(`Estimated Bortle scale from location name: ${estimatedScale}`);
      return estimatedScale;
    }
    
    // Final fallback: make an educated guess based on coordinates
    // This is a simplified placeholder - in reality this would use more sophisticated logic
    const populationDensityFactor = Math.abs(Math.sin(latitude * longitude * 0.01) * 3);
    const distanceFromEquator = Math.abs(latitude) / 90;
    const baseScale = 4 + populationDensityFactor - distanceFromEquator;
    
    // Ensure valid Bortle scale range (1-9)
    const finalScale = Math.max(1, Math.min(9, Math.round(baseScale)));
    console.log(`Fallback Bortle scale calculation: ${finalScale}`);
    
    return finalScale;
  } catch (error) {
    console.error("Error calculating enhanced Bortle scale:", error);
    return 5; // Default to suburban sky
  }
}

/**
 * Get Bortle scale for a location with corrections and optimizations
 * 
 * @param latitude Latitude coordinate
 * @param longitude Longitude coordinate
 * @param locationName Optional location name (for more accurate estimation)
 * @returns Bortle scale value (1-9)
 */
export async function getBortleScaleEnhanced(
  latitude: number,
  longitude: number,
  locationName?: string
): Promise<number> {
  try {
    // First check for specific Chinese cities using comprehensive database
    if (isInChina(latitude, longitude)) {
      const specificCityBortle = getCityBortleScale(latitude, longitude);
      if (specificCityBortle !== null) {
        console.log(`Bortle scale for Chinese city: ${specificCityBortle}`);
        return specificCityBortle;
      }
    }

    // Check for known locations in the database
    const knownLocation = findClosestKnownLocation(latitude, longitude);
    if (knownLocation && knownLocation.distance < 5 && knownLocation.bortleScale) {
      console.log(`Using known location Bortle scale: ${knownLocation.bortleScale}`);
      return knownLocation.bortleScale;
    }
    
    // Try to get Bortle scale from light pollution API
    try {
      const pollutionData = await fetchLightPollutionData(latitude, longitude);
      if (pollutionData && typeof pollutionData.bortleScale === 'number') {
        console.log(`API Bortle scale: ${pollutionData.bortleScale}`);
        
        // Apply terrain correction if needed
        if (Math.random() > 0.5) { // 50% chance to apply terrain correction
          try {
            const corrected = await getTerrainCorrectedBortleScale(Number(latitude), Number(longitude));
            if (corrected) {
              console.log(`Terrain corrected Bortle scale: ${corrected.correctedBortleScale}, factor: ${corrected.correctionFactor}`);
              return corrected.correctedBortleScale;
            }
          } catch (err) {
            console.warn("Terrain correction failed:", err);
          }
        }
        
        return pollutionData.bortleScale;
      }
    } catch (error) {
      console.warn("Error fetching light pollution data:", error);
    }
    
    // Fall back to estimation based on location name
    if (locationName) {
      const estimatedScale = estimateBortleScaleByLocation(locationName, latitude, longitude);
      console.log(`Estimated Bortle scale from location name: ${estimatedScale}`);
      return estimatedScale;
    }
    
    // Final fallback: make an educated guess based on coordinates
    // This is a simplified placeholder - in reality this would use more sophisticated logic
    const populationDensityFactor = Math.abs(Math.sin(latitude * longitude * 0.01) * 3);
    const distanceFromEquator = Math.abs(latitude) / 90;
    const baseScale = 4 + populationDensityFactor - distanceFromEquator;
    
    // Ensure valid Bortle scale range (1-9)
    const finalScale = Math.max(1, Math.min(9, Math.round(baseScale)));
    console.log(`Fallback Bortle scale calculation: ${finalScale}`);
    
    return finalScale;
  } catch (error) {
    console.error("Error calculating enhanced Bortle scale:", error);
    return 5; // Default to suburban sky
  }
}

/**
 * Apply quality control to Bortle scale value
 * 
 * @param bortleScale Input Bortle scale value
 * @param latitude Latitude coordinate
 * @param longitude Longitude coordinate
 * @returns Quality-controlled Bortle scale value
 */
export function qualityControlBortleScale(
  bortleScale: number,
  latitude: number,
  longitude: number
): number {
  // Check for obviously invalid values
  if (bortleScale < 1 || bortleScale > 9 || isNaN(bortleScale)) {
    console.warn("Invalid Bortle scale detected, defaulting to 5");
    return 5; // Default to suburban sky
  }
  
  // Quality control based on latitude
  if (Math.abs(latitude) > 80) {
    // Near poles, light pollution is typically very low
    return Math.min(bortleScale, 3); 
  }
  
  // Urban areas at certain latitudes have higher minimums
  if (Math.abs(latitude) < 60 && bortleScale < 3) {
    const populationDensity = estimatePopulationDensity(latitude, longitude);
    
    if (populationDensity > 500 && bortleScale < 4) {
      console.log("Correcting suspiciously low Bortle scale in populated area");
      return 4; // Minimum for populated areas
    }
  }
  
  return bortleScale;
}

/**
 * Estimate population density based on coordinates
 * This is a simplified placeholder - would use real data in production
 */
function estimatePopulationDensity(latitude: number, longitude: number): number {
  // Simple heuristic for demo purposes
  const equatorFactor = 1 - Math.abs(latitude) / 90;
  const longitudeFactor = Math.abs(Math.sin(longitude / 30));
  
  return equatorFactor * longitudeFactor * 1000;
}
