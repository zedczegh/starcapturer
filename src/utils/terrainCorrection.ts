
/**
 * Utility for terrain-corrected Bortle scale calculations
 * Takes into account elevation and surrounding topography
 */

import { getTerrainElevation, detectTerrainType } from '@/utils/terrainData';

// Constants for terrain adjustments
const ELEVATION_FACTOR = 0.15; // Higher elevations have better sky clarity
const MOUNTAIN_CORRECTION = 0.8; // Mountains block light pollution from cities

/**
 * Cache to store recent terrain-corrected Bortle scale values
 * Key: latitude-longitude, Value: correction data
 */
const terrainCorrectionCache = new Map<string, {
  bortleScale: number;
  confidence: 'high' | 'medium' | 'low';
  timestamp: number;
}>();

/**
 * Get terrain-corrected Bortle scale based on location
 * @param latitude Latitude of the location
 * @param longitude Longitude of the location
 * @param locationName Optional location name for additional context
 * @returns Corrected Bortle scale or null if correction not possible
 */
export async function getTerrainCorrectedBortleScale(
  latitude: number,
  longitude: number,
  locationName?: string
): Promise<number | null> {
  const cacheKey = `${latitude.toFixed(4)}-${longitude.toFixed(4)}`;
  
  // Check cache first (valid for 30 days since terrain doesn't change)
  const cachedData = terrainCorrectionCache.get(cacheKey);
  if (cachedData && (Date.now() - cachedData.timestamp) < 30 * 24 * 60 * 60 * 1000) {
    console.log(`Using cached terrain-corrected Bortle: ${cachedData.bortleScale}`);
    return cachedData.bortleScale;
  }
  
  try {
    // Get elevation data using the new terrainData module
    const elevation = await getTerrainElevation(latitude, longitude);
    
    if (elevation === null) {
      return null;
    }
    
    // Get base Bortle scale estimate
    const baseBortleScale = await getBaseBortleScale(latitude, longitude, locationName);
    
    if (baseBortleScale === null) {
      return null;
    }
    
    // Apply terrain corrections with detected terrain type
    const terrainType = await detectTerrainType(latitude, longitude);
    
    let correctedScale = applyTerrainCorrections(
      baseBortleScale,
      elevation,
      latitude,
      longitude,
      terrainType,
      locationName
    );
    
    // Cache the result
    terrainCorrectionCache.set(cacheKey, {
      bortleScale: correctedScale,
      confidence: 'medium',
      timestamp: Date.now()
    });
    
    console.log(`Terrain-corrected Bortle scale: ${correctedScale} (base: ${baseBortleScale}, elevation: ${elevation}m, terrain: ${terrainType})`);
    return correctedScale;
  } catch (error) {
    console.error("Error in terrain correction:", error);
    return null;
  }
}

/**
 * Get base Bortle scale for location
 * This serves as the starting point before terrain corrections
 */
async function getBaseBortleScale(
  latitude: number, 
  longitude: number,
  locationName?: string
): Promise<number | null> {
  try {
    // Try to get light pollution data from API
    const { fetchLightPollutionData } = await import('@/lib/api');
    const lightPollutionData = await fetchLightPollutionData(latitude, longitude);
    
    if (lightPollutionData?.bortleScale !== undefined && 
        lightPollutionData.bortleScale >= 1 && 
        lightPollutionData.bortleScale <= 9) {
      return lightPollutionData.bortleScale;
    }
    
    // Fall back to estimation based on location name if API fails
    if (locationName) {
      const { estimateBortleScaleByLocation } = await import('@/utils/locationUtils');
      return estimateBortleScaleByLocation(locationName, latitude, longitude);
    }
  } catch (error) {
    console.error("Error getting base Bortle scale:", error);
  }
  
  return null;
}

/**
 * Apply terrain-based corrections to Bortle scale
 * This improves accuracy by considering topographical features
 */
function applyTerrainCorrections(
  baseBortleScale: number,
  elevation: number,
  latitude: number,
  longitude: number,
  terrainType: string = 'unknown',
  locationName?: string
): number {
  // Start with base Bortle scale
  let correctedScale = baseBortleScale;
  
  // Higher elevations have clearer skies due to less atmospheric interference
  // Elevation adjustment: Each 500m reduces Bortle by ELEVATION_FACTOR
  const elevationAdjustment = -Math.min(1, (elevation / 500) * ELEVATION_FACTOR);
  correctedScale += elevationAdjustment;
  
  // Apply terrain type specific adjustments
  if (terrainType === 'mountain' || terrainType === 'hill') {
    // Mountain regions often have better sky quality due to natural shielding
    const mountainShieldingEffect = -MOUNTAIN_CORRECTION * (baseBortleScale / 9);
    correctedScale += mountainShieldingEffect;
  } else if (terrainType === 'plateau') {
    // Plateaus usually have good sky quality too
    correctedScale += -MOUNTAIN_CORRECTION * 0.6 * (baseBortleScale / 9);
  } else if (terrainType === 'valley') {
    // Valleys can trap pollution
    if (baseBortleScale > 3) {
      correctedScale += 0.3; // Slight worsening for polluted valleys
    }
  }
  
  // National parks & reserves often have dark sky protection policies
  const isProtectedArea = locationName ? 
    /national park|reserve|wilderness|conservation|forest|natural|protected/i.test(locationName) : 
    false;
  
  if (isProtectedArea) {
    // Protected areas typically have at least one Bortle scale unit improvement
    // but the effect is smaller in already dark locations
    const protectionEffect = -Math.min(1.0, Math.max(0.3, baseBortleScale / 9));
    correctedScale += protectionEffect;
  }
  
  // Ensure corrected scale stays within valid range
  correctedScale = Math.max(1, Math.min(9, correctedScale));
  
  // Round to nearest 0.1 for precision
  return Math.round(correctedScale * 10) / 10;
}

/**
 * Clear terrain correction cache
 */
export function clearTerrainCorrectionCache(): void {
  terrainCorrectionCache.clear();
  console.log("Terrain correction cache cleared");
}
