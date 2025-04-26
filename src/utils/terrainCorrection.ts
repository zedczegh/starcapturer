
import { fetchElevation } from '@/lib/api/elevation';
import { memoize } from '@/utils/memoization';
import { getBortleScale } from '@/services/bortleScaleService';
import { locationUtils } from '@/utils/locationUtils';

// Constants for terrain-based corrections
const ELEVATION_FACTOR = 0.05; // Correction per 100m of elevation
const MOUNTAIN_CORRECTION = 0.7; // Maximum correction for mountains
const ELEVATION_THRESHOLD = 500; // Elevation in meters considered "significant"
const TYPICAL_CITY_LIGHT_RADIUS = 50; // km - typical radius of city light pollution

// Cache for terrain correction to avoid recalculating
const terrainCorrectionCache = new Map<string, {
  correctedBortle: number;
  elevation: number;
  timestamp: number;
}>();

/**
 * Get bortle scale corrected for terrain (elevation, mountain blocking)
 * This function takes into account how terrain might affect light pollution
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
  // Generate cache key
  const cacheKey = `${latitude.toFixed(4)}-${longitude.toFixed(4)}-${baseBortleScale || 'auto'}`;
  
  // Check cache first
  const cached = terrainCorrectionCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < 24 * 60 * 60 * 1000) { // 24 hour cache
    return {
      correctedBortleScale: cached.correctedBortle,
      elevation: cached.elevation,
      correctionFactor: calculateCorrectionFactor(cached.elevation),
      reason: explainCorrection(cached.elevation, calculateCorrectionFactor(cached.elevation))
    };
  }
  
  try {
    // Get base bortle scale if not provided
    const baseScale = baseBortleScale || await getBortleScale(latitude, longitude);
    
    // Get elevation data
    const elevation = await fetchElevation(latitude, longitude);
    
    // Calculate correction factor based on elevation
    const correctionFactor = calculateCorrectionFactor(elevation);
    
    // Apply correction (lower is better for bortle scale)
    // More sophisticated correction that doesn't go below 1
    let correctedScale = Math.max(1, baseScale - (baseScale * correctionFactor));
    
    // Round to 1 decimal place
    correctedScale = Math.round(correctedScale * 10) / 10;
    
    // Cache result
    terrainCorrectionCache.set(cacheKey, {
      correctedBortle: correctedScale,
      elevation,
      timestamp: Date.now()
    });
    
    return {
      correctedBortleScale: correctedScale,
      elevation,
      correctionFactor,
      reason: explainCorrection(elevation, correctionFactor)
    };
  } catch (error) {
    console.error("Error getting terrain-corrected Bortle scale:", error);
    return {
      correctedBortleScale: baseBortleScale || 4,
      elevation: 0,
      correctionFactor: 0,
      reason: "Could not calculate terrain correction"
    };
  }
}

/**
 * Calculate correction factor based on elevation
 */
function calculateCorrectionFactor(elevation: number): number {
  if (elevation < ELEVATION_THRESHOLD) {
    return 0; // No correction for low elevations
  }
  
  // Progressive correction that increases with elevation
  const elevationCorrection = Math.min(
    MOUNTAIN_CORRECTION, 
    ((elevation - ELEVATION_THRESHOLD) / 1000) * ELEVATION_FACTOR
  );
  
  return elevationCorrection;
}

/**
 * Generate explanation for the correction
 */
function explainCorrection(elevation: number, correctionFactor: number): string {
  if (correctionFactor <= 0) {
    return "No terrain correction applied";
  }
  
  if (elevation > 2000) {
    return `High elevation (${elevation}m) significantly reduces light pollution`;
  } else if (elevation > 1000) {
    return `Moderate elevation (${elevation}m) helps reduce light pollution`;
  } else {
    return `Slight light pollution reduction due to ${elevation}m elevation`;
  }
}

/**
 * Memoized function for getting terrain-corrected bortle scale
 * This helps with performance when making multiple calls
 */
export const getMemoizedTerrainCorrectedBortleScale = memoize(
  getTerrainCorrectedBortleScale,
  (lat, lng, bortle) => `${lat.toFixed(3)}-${lng.toFixed(3)}-${bortle || 'auto'}`
);

/**
 * Estimate bortle scale for a location based on coordinates and nearby known locations
 */
export async function estimateBortleScaleWithTerrain(
  latitude: number,
  longitude: number
): Promise<number> {
  let estimatedBortleScale;
  
  try {
    // Try to find from known locations first
    estimatedBortleScale = await getBortleScale(latitude, longitude);
    
    // Apply terrain correction
    const terrainCorrected = await getTerrainCorrectedBortleScale(
      latitude,
      longitude,
      estimatedBortleScale
    );
    
    return terrainCorrected.correctedBortleScale;
  } catch (error) {
    console.error("Error estimating Bortle scale with terrain:", error);
    return 4; // Default value
  }
}
