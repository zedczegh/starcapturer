
/**
 * Terrain correction utilities for light pollution analysis
 */

import { fetchElevation } from '@/lib/api/elevation';
import { memoize } from '@/utils/memoization';
import { getBortleScaleEnhanced } from '@/services/environmentalDataService/bortleScaleService';
import { estimateBortleScaleByLocation } from '@/utils/locationUtils';

// Define constants for terrain correction
const ELEVATION_FACTOR = 0.0002;        // How much elevation affects Bortle scale
const MOUNTAIN_CORRECTION = 0.05;       // Additional correction for mountainous regions
const ELEVATION_THRESHOLD = 1000;       // Elevation (m) considered "high" for corrections
const TYPICAL_CITY_LIGHT_RADIUS = 50;   // Typical radius of city light dome in km

// Cache for terrain correction results
const terrainCorrectionCache = new Map<string, {
  correctedBortleScale: number;
  elevation: number;
  correctionFactor: number;
  reason: string;
}>();

/**
 * Apply terrain-based correction to Bortle scale
 * Elevation and terrain can significantly impact light pollution
 * 
 * @param latitude Latitude coordinate
 * @param longitude Longitude coordinate 
 * @param baseBortleScale Base Bortle scale to correct (if known)
 * @returns Corrected Bortle scale with additional information
 */
export async function getTerrainCorrectedBortleScale(
  latitude: number,
  longitude: number,
  baseBortleScale?: number
): Promise<{
  correctedBortleScale: number;
  elevation: number;
  correctionFactor: number;
  reason: string;
}> {
  try {
    // Create cache key
    const cacheKey = `${latitude.toFixed(4)}-${longitude.toFixed(4)}-${baseBortleScale || 'auto'}`;
    
    // Check cache first
    if (terrainCorrectionCache.has(cacheKey)) {
      return terrainCorrectionCache.get(cacheKey)!;
    }
    
    // Get elevation for the location
    const elevation = await fetchElevation(latitude, longitude);
    
    // If no base Bortle scale provided, try to estimate it
    const bortleScale = baseBortleScale ?? await estimateBaseBortleScale(latitude, longitude);
    
    // Calculate correction factor based on elevation
    let correctionFactor = 0;
    let reason = '';
    
    if (elevation > ELEVATION_THRESHOLD) {
      // Higher elevations have less atmosphere to scatter light
      const elevationCorrection = (elevation - ELEVATION_THRESHOLD) * ELEVATION_FACTOR;
      correctionFactor -= elevationCorrection;
      
      reason = `Elevation ${elevation}m reduces light pollution`;
      
      // Check for mountain blocking effect
      if (isLocationProtectedByMountains(latitude, longitude)) {
        correctionFactor -= MOUNTAIN_CORRECTION;
        reason += ` and mountains block light pollution`;
      }
    } else {
      reason = `Minimal terrain impact at ${elevation}m elevation`;
    }
    
    // Apply correction, but ensure it stays in valid Bortle range
    const correctedValue = Math.max(1, Math.min(9, bortleScale + correctionFactor));
    
    // Round to one decimal
    const correctedBortleScale = Math.round(correctedValue * 10) / 10;
    
    // Cache the result
    const result = {
      correctedBortleScale,
      elevation,
      correctionFactor,
      reason
    };
    
    terrainCorrectionCache.set(cacheKey, result);
    
    return result;
  } catch (error) {
    console.error("Error applying terrain correction:", error);
    throw error;
  }
}

/**
 * Estimate if location is protected from light pollution by mountains
 * This would use digital elevation model data in a real implementation
 */
function isLocationProtectedByMountains(latitude: number, longitude: number): boolean {
  // Simplified placeholder - in reality would analyze surrounding terrain
  // This just returns true ~20% of the time randomly
  return Math.random() < 0.2;
}

/**
 * Estimate base Bortle scale if not provided
 * Uses memoization for performance
 */
const estimateBaseBortleScale = memoize(async (latitude: number, longitude: number): Promise<number> => {
  try {
    return await getBortleScaleEnhanced(latitude, longitude);
  } catch (error) {
    console.warn("Failed to get enhanced Bortle scale, using fallback estimation");
    return estimateBortleScaleByLocation("Unknown", latitude, longitude);
  }
});

/**
 * Clear the terrain correction cache
 */
export function clearTerrainCorrectionCache(): void {
  terrainCorrectionCache.clear();
}
