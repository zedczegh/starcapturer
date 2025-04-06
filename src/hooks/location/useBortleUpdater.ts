
import { useCallback } from "react";
import { isInChina } from "@/utils/chinaBortleData";
import { detectTerrainType } from "@/utils/terrainData"; 
import { getEnhancedBortleScale } from "@/utils/bortleScaleFactory";
import { findNearbyUserBortleMeasurement } from "@/lib/api/pollution";

/**
 * Hook for optimized Bortle scale updates with enhanced accuracy
 */
export function useBortleUpdater() {
  /**
   * Multi-source Bortle scale calculation with sophisticated validation
   * Prioritizes precision data sources and applies machine learning derived adjustments
   */
  const updateBortleScale = useCallback(async (
    latitude: number,
    longitude: number,
    locationName: string,
    existingBortleScale: number | null
  ): Promise<number | null> => {
    try {
      // Check if coordinates are valid
      if (!isFinite(latitude) || !isFinite(longitude)) {
        return existingBortleScale;
      }
      
      // Check for user-provided measurements first (highest priority)
      const userMeasurement = findNearbyUserBortleMeasurement(latitude, longitude);
      if (userMeasurement) {
        console.log(`Using user-provided Bortle measurement: ${userMeasurement.bortleScale}`);
        return userMeasurement.bortleScale;
      }
      
      // Get enhanced Bortle scale using all available methods
      const enhancedResult = await getEnhancedBortleScale(latitude, longitude, locationName);
      
      console.log(`Enhanced Bortle scale calculation: ${enhancedResult.bortleScale} (source: ${enhancedResult.confidenceSource})`);
      
      // If we get a valid result, use it
      if (enhancedResult.bortleScale >= 1 && enhancedResult.bortleScale <= 9) {
        return enhancedResult.bortleScale;
      }
      
      // If we already have a valid Bortle scale, don't change it
      if (existingBortleScale !== null && 
          existingBortleScale !== undefined && 
          existingBortleScale >= 1 && 
          existingBortleScale <= 9) {
        return existingBortleScale;
      }
      
      // Fallback to terrain-aware estimation
      try {
        console.log(`Using terrain-aware estimation for ${locationName}`);
        
        // Get terrain type for more accurate analysis
        const terrainType = await detectTerrainType(latitude, longitude);
        console.log(`Detected terrain type: ${terrainType}`);
        
        // Basic estimate based on terrain type
        let baseBortle = 4; // Default mid-range value
        
        switch (terrainType) {
          case 'mountain':
            baseBortle = 3;
            break;
          case 'plateau':
            baseBortle = 3.5;
            break;
          case 'hill':
            baseBortle = 4;
            break;
          case 'valley':
            baseBortle = 4.5;
            break;
          case 'plain':
            baseBortle = 4;
            break;
          case 'coast':
            baseBortle = 4;
            break;
          case 'urban':
            baseBortle = 6;
            break;
        }
        
        // Adjust for China regions which tend to have higher light pollution
        if (isInChina(latitude, longitude)) {
          baseBortle += 1;
        }
        
        return baseBortle;
      } catch (error) {
        console.warn("Terrain estimation failed:", error);
      }
      
      // Ultimate fallback is middle of the scale
      return 4.5;
    } catch (error) {
      console.error("Error updating Bortle scale:", error);
      return existingBortleScale;
    }
  }, []);

  return { updateBortleScale };
}
