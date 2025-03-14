
import { useCallback } from "react";
import { identifyRemoteRegion } from "@/services/geocoding/remoteRegionResolver";
import { fetchLightPollutionData } from "@/lib/api";

/**
 * Hook for optimized Bortle scale updates with better handling of remote regions
 */
export function useBortleUpdater() {
  /**
   * Updates Bortle scale with proper handling for remote regions
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
      
      // Determine if we're in a remote region
      const remoteRegion = identifyRemoteRegion(latitude, longitude);
      
      // For remote regions, force a fresh fetch to ensure accuracy
      if (remoteRegion && (existingBortleScale === null || existingBortleScale === undefined)) {
        const pollution = await fetchLightPollutionData(latitude, longitude);
        if (pollution && typeof pollution.bortleScale === 'number') {
          return pollution.bortleScale;
        }
      }
      
      // If we already have a valid Bortle scale and we're not in a remote region,
      // don't update it unnecessarily
      if (existingBortleScale !== null && 
          existingBortleScale !== undefined && 
          existingBortleScale >= 1 && 
          existingBortleScale <= 9 &&
          !remoteRegion) {
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
