
/**
 * Light pollution data services
 */

import { getCityBortleScale, isInChina } from "@/utils/chinaBortleData";
import { findClosestKnownLocation, estimateBortleScaleByLocation } from "@/utils/locationUtils";
import { getTerrainCorrectedBortleScale } from "@/utils/terrainCorrection";
import { memoize } from "@/utils/memoization";

// Cache for light pollution data
const pollutionCache = new Map<string, {
  bortleScale: number;
  timestamp: number;
}>();

// Cache TTL in milliseconds
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Get light pollution data for a specific location
 */
export async function fetchLightPollutionData(
  latitude: number, 
  longitude: number
): Promise<{
  bortleScale: number;
  artificialBrightness?: number;
  lightIntensity?: number;
}> {
  try {
    // Create cache key
    const cacheKey = `${latitude.toFixed(4)}-${longitude.toFixed(4)}`;
    
    // Check cache first
    const cached = pollutionCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
      return {
        bortleScale: cached.bortleScale,
        artificialBrightness: (cached.bortleScale - 1) * 0.2,
        lightIntensity: (cached.bortleScale - 1) * 10
      };
    }
    
    // Not in cache, need to calculate or fetch
    
    // First check if the location is in China with special data
    if (isInChina(latitude, longitude)) {
      const cityBortleScale = getCityBortleScale(latitude, longitude);
      if (cityBortleScale !== null) {
        // Found in Chinese city database
        pollutionCache.set(cacheKey, {
          bortleScale: cityBortleScale,
          timestamp: Date.now()
        });
        
        return {
          bortleScale: cityBortleScale,
          artificialBrightness: (cityBortleScale - 1) * 0.2,
          lightIntensity: (cityBortleScale - 1) * 10
        };
      }
    }
    
    // Check for known location in our database
    const knownLocation = findClosestKnownLocation(latitude, longitude);
    if (knownLocation && knownLocation.distance < 5 && knownLocation.bortleScale) {
      // Found nearby known location
      pollutionCache.set(cacheKey, {
        bortleScale: knownLocation.bortleScale,
        timestamp: Date.now()
      });
      
      return {
        bortleScale: knownLocation.bortleScale,
        artificialBrightness: (knownLocation.bortleScale - 1) * 0.2,
        lightIntensity: (knownLocation.bortleScale - 1) * 10
      };
    }
    
    // In a real implementation, here we would call a light pollution API
    // For now, calculate a reasonable estimate based on location
    
    // Apply terrain correction if needed
    if (Math.random() > 0.7) { // 30% chance to apply terrain correction
      try {
        const corrected = await getTerrainCorrectedBortleScale(latitude, longitude);
        if (corrected) {
          pollutionCache.set(cacheKey, {
            bortleScale: corrected.correctedBortleScale,
            timestamp: Date.now()
          });
          
          return {
            bortleScale: corrected.correctedBortleScale,
            artificialBrightness: (corrected.correctedBortleScale - 1) * 0.2,
            lightIntensity: (corrected.correctedBortleScale - 1) * 10
          };
        }
      } catch (err) {
        console.warn("Terrain correction failed:", err);
      }
    }
    
    // Basic estimation
    // Use latitudinal position to guess light pollution (higher near equator due to population density)
    const latitudeFactor = 1 - (Math.abs(latitude) / 90); // 1 at equator, 0 at poles
    const randomFactor = Math.random() * 2 - 1; // Random variation between -1 and 1
    
    // Calculate Bortle scale: base of 4, adjusted by latitude and random factor
    // Higher values near equator due to higher population density in general
    let bortleScale = 4 + (latitudeFactor * 2) + randomFactor;
    
    // Ensure valid Bortle range (1-9)
    bortleScale = Math.max(1, Math.min(9, bortleScale));
    
    // Round to one decimal place
    bortleScale = Math.round(bortleScale * 10) / 10;
    
    // Cache the result
    pollutionCache.set(cacheKey, {
      bortleScale,
      timestamp: Date.now()
    });
    
    return {
      bortleScale,
      artificialBrightness: (bortleScale - 1) * 0.2,
      lightIntensity: (bortleScale - 1) * 10
    };
  } catch (error) {
    console.error("Error fetching light pollution data:", error);
    
    // Return a default value on error
    return {
      bortleScale: 5, // Default to suburban sky
      artificialBrightness: 0.8,
      lightIntensity: 40
    };
  }
}

/**
 * Clear the light pollution cache
 */
export function clearLightPollutionCache(): void {
  pollutionCache.clear();
}

/**
 * Memoized version of the light pollution data fetch function
 */
export const memoizedFetchLightPollutionData = memoize(fetchLightPollutionData);
