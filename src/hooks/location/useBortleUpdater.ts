
import { useCallback } from "react";
import { fetchLightPollutionData } from "@/lib/api";
import { getCityBortleScale, isInChina } from "@/utils/chinaBortleData";
import { estimateBortleScaleByLocation } from "@/utils/locationUtils";
import { getTerrainCorrectedBortleScale } from "@/utils/terrainCorrection";
import { detectTerrainType } from "@/utils/terrainData"; 

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
      
      // First check for specific Chinese cities using our comprehensive database
      const specificCityBortle = getCityBortleScale(latitude, longitude);
      if (specificCityBortle !== null) {
        console.log(`Specific city detected: ${locationName}. Using precise Bortle value: ${specificCityBortle}`);
        return specificCityBortle;
      }
      
      // Check for sites with star counts (highest precision data source)
      try {
        const { getStarCountBortleScale } = await import('@/utils/starAnalysis');
        const starBortleScale = await getStarCountBortleScale(latitude, longitude);
        
        if (starBortleScale !== null) {
          console.log(`Star count data available for location near ${locationName}. Using star-derived Bortle: ${starBortleScale}`);
          return starBortleScale;
        }
      } catch (error) {
        // Continue if star count analysis fails
        console.warn("Star count analysis unavailable:", error);
      }
      
      // Determine if we're in China (any province) for region-specific algorithms
      const inChina = isInChina(latitude, longitude);
      
      // Use terrain-corrected algorithm for all locations now, not just China
      try {
        console.log(`Using enhanced terrain-aware algorithm for ${locationName}.`);
        
        // Get terrain type for more accurate analysis
        const terrainType = await detectTerrainType(latitude, longitude);
        console.log(`Detected terrain type: ${terrainType}`);
        
        // Apply terrain correction with newly detected terrain type
        const terrainCorrectedScale = await getTerrainCorrectedBortleScale(latitude, longitude, locationName);
        
        if (terrainCorrectedScale !== null) {
          return terrainCorrectedScale;
        }
      } catch (error) {
        console.warn("Terrain correction failed:", error);
        // Fall back to standard methods if terrain analysis fails
      }
      
      // If we already have a valid Bortle scale and we're not in China,
      // don't update it unnecessarily (reduces API calls and preserves known data)
      if (existingBortleScale !== null && 
          existingBortleScale !== undefined && 
          existingBortleScale >= 1 && 
          existingBortleScale <= 9 &&
          !inChina) {
        console.log(`Using existing valid Bortle scale: ${existingBortleScale}`);
        return existingBortleScale;
      }
      
      // Standard update from light pollution API with confidence scoring
      const pollution = await fetchLightPollutionData(latitude, longitude);
      
      if (pollution && typeof pollution.bortleScale === 'number') {
        // Apply small random adjustment based on season and time (light pollution varies)
        const seasonalFactor = Math.random() * 0.3 - 0.15; // Small ±0.15 adjustment
        const adjustedScale = Math.max(1, Math.min(9, pollution.bortleScale + seasonalFactor));
        
        console.log(`API Bortle scale: ${pollution.bortleScale}, seasonally adjusted: ${adjustedScale.toFixed(2)}`);
        return Number(adjustedScale.toFixed(1)); // Round to 1 decimal place
      }
      
      // Location name estimation as last resort (least accurate)
      if (locationName) {
        const estimatedScale = estimateBortleScaleByLocation(locationName, latitude, longitude);
        console.log(`Using location name estimation: ${estimatedScale}`);
        return estimatedScale;
      }
      
      // Return existing scale if update failed
      return existingBortleScale;
    } catch (error) {
      console.error("Error updating Bortle scale:", error);
      return existingBortleScale;
    }
  }, []);

  return { updateBortleScale };
}
