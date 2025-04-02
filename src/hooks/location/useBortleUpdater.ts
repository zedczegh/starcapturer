
import { useCallback } from "react";
import { fetchLightPollutionData } from "@/lib/api";
import { getCityBortleScale, isInChina } from "@/utils/chinaBortleData";
import { cameraBrightnessToBortle, rawBrightnessToMpsas } from "@/utils/darkSkyMeterUtils";

/**
 * Hook for optimized Bortle scale updates with better handling for all Chinese regions
 * and integration with device-measured sky brightness
 */
export function useBortleUpdater() {
  /**
   * Updates Bortle scale with proper handling for all Chinese regions
   * and integration with device measurements
   */
  const updateBortleScale = useCallback(async (
    latitude: number,
    longitude: number,
    locationName: string,
    existingBortleScale: number | null,
    cameraMeasurement: number | null = null
  ): Promise<number | null> => {
    try {
      // Check if coordinates are valid
      if (!isFinite(latitude) || !isFinite(longitude)) {
        return existingBortleScale;
      }
      
      // Check if we have a direct camera measurement of sky brightness
      if (cameraMeasurement !== null) {
        // Convert raw brightness (0-255) to Bortle scale using our enhanced algorithm
        const measuredBortle = cameraBrightnessToBortle(cameraMeasurement);
        const mpsas = rawBrightnessToMpsas(cameraMeasurement);
        
        console.log(`Using camera-measured sky brightness: ${mpsas.toFixed(2)} MPSAS, Bortle ${measuredBortle.toFixed(1)}`);
        
        // Always prioritize direct measurements over database/API values
        return measuredBortle;
      }
      
      // First check for specific Chinese cities using our comprehensive database
      const specificCityBortle = getCityBortleScale(latitude, longitude);
      if (specificCityBortle !== null) {
        console.log(`Specific city detected: ${locationName}. Using precise Bortle value: ${specificCityBortle}`);
        return specificCityBortle;
      }
      
      // Determine if we're in China (any province)
      const inChina = isInChina(latitude, longitude);
      
      // For locations in China, always fetch fresh data to ensure accuracy
      if (inChina) {
        console.log(`Location in China detected: ${locationName}. Fetching fresh Bortle data.`);
        const pollution = await fetchLightPollutionData(latitude, longitude);
        
        if (pollution && typeof pollution.bortleScale === 'number') {
          return pollution.bortleScale;
        }
      }
      
      // If we already have a valid Bortle scale and we're not in China,
      // don't update it unnecessarily
      if (existingBortleScale !== null && 
          existingBortleScale !== undefined && 
          existingBortleScale >= 1 && 
          existingBortleScale <= 9 &&
          !inChina) {
        return existingBortleScale;
      }
      
      // Standard update for all other cases
      const pollution = await fetchLightPollutionData(latitude, longitude);
      if (pollution && typeof pollution.bortleScale === 'number') {
        return pollution.bortleScale;
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
