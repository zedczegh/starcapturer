
/**
 * Terrain factor score calculation for SIQS with enhanced geographic awareness
 */

import { normalizeScore } from './utils';

/**
 * Enhanced terrain types with more specific classifications
 */
export type TerrainType = 
  | "mountain" 
  | "plateau"
  | "hill"
  | "plain"
  | "water"
  | "valley"
  | "urban"
  | "forest"
  | "desert"
  | "coastal"
  | "canyon"
  | "highland";

/**
 * Calculate score based on terrain type with improved algorithm
 * @param terrainType Type of terrain
 * @param elevation Optional elevation in meters
 * @returns Score on 0-10 scale
 */
export function calculateTerrainFactor(terrainType: string | null, elevation?: number): number {
  // Default score for unknown terrain
  let baseScore = 5;
  
  if (!terrainType) {
    // If we have elevation but no terrain type
    if (elevation !== undefined) {
      return calculateElevationScore(elevation);
    }
    return baseScore; // Neutral score if no terrain data
  }
  
  // Different terrain types have different impacts on viewing conditions
  switch (terrainType.toLowerCase()) {
    case "mountain":
      baseScore = 9; // Mountains typically offer excellent viewing conditions
      break;
    case "plateau":
      baseScore = 8; // Plateaus offer good elevation and stable air
      break;
    case "hill":
      baseScore = 7; // Hills provide some elevation advantage
      break;
    case "plain":
      baseScore = 6; // Plains are decent but can have more light pollution
      break;
    case "water":
      baseScore = 7.5; // Water bodies can be good for stability but may have humidity
      break;
    case "valley":
      baseScore = 4.5; // Valleys can trap moisture and light pollution
      break;
    case "urban":
      baseScore = 3; // Urban areas have significant light pollution
      break;
    case "forest":
      baseScore = 6.5; // Forests can block light but may have moisture issues
      break;
    case "desert":
      baseScore = 8.5; // Deserts typically have excellent seeing conditions
      break;
    case "coastal":
      baseScore = 7; // Coastal areas benefit from sea breezes but may have humidity
      break;
    case "canyon":
      baseScore = 6; // Canyons can provide shelter but may limit sky view
      break;
    case "highland":
      baseScore = 8; // Highlands generally have good viewing conditions
      break;
    default:
      baseScore = 5; // Default neutral score
  }
  
  // If elevation is provided, blend the terrain and elevation scores
  if (elevation !== undefined) {
    const elevationScore = calculateElevationScore(elevation);
    // Weight the terrain type more than elevation alone
    return 0.7 * baseScore + 0.3 * elevationScore;
  }
  
  return baseScore;
}

/**
 * Calculate score based on elevation
 * @param elevation Elevation in meters
 * @returns Score on 0-10 scale
 */
function calculateElevationScore(elevation: number): number {
  // Higher elevations generally have better seeing conditions
  // 0m = 5, 1000m = 7, 2000m = 8, 3000m+ = 9-10
  if (elevation < 0) {
    return 4.5; // Below sea level (rare)
  }
  
  if (elevation < 100) {
    return 5 + (elevation / 100) * 0.5;
  }
  
  if (elevation < 1000) {
    return 5.5 + (elevation / 1000) * 1.5;
  }
  
  if (elevation < 2000) {
    return 7 + ((elevation - 1000) / 1000);
  }
  
  if (elevation < 3000) {
    return 8 + ((elevation - 2000) / 1000);
  }
  
  return Math.min(10, 9 + ((elevation - 3000) / 2000));
}

/**
 * Calculate terrain correction factor for light pollution
 * @param terrainType Type of terrain
 * @param elevation Elevation in meters
 * @returns Correction factor (0-1, where lower means more correction)
 */
export function calculateTerrainCorrectionFactor(terrainType: string | null, elevation: number = 0): number {
  // Base correction from elevation
  // Higher elevations get more correction (better sky)
  let elevationFactor = 1.0;
  
  if (elevation > 0) {
    if (elevation < 500) {
      elevationFactor = 0.95 - (elevation / 500) * 0.1;
    } else if (elevation < 1500) {
      elevationFactor = 0.85 - ((elevation - 500) / 1000) * 0.15;
    } else if (elevation < 3000) {
      elevationFactor = 0.7 - ((elevation - 1500) / 1500) * 0.2;
    } else {
      elevationFactor = 0.5 - Math.min(0.2, ((elevation - 3000) / 2000) * 0.1);
    }
  }
  
  // Terrain correction
  let terrainFactor = 1.0;
  if (terrainType) {
    switch (terrainType.toLowerCase()) {
      case "mountain":
        terrainFactor = 0.5; // Mountains block light pollution significantly
        break;
      case "plateau":
        terrainFactor = 0.6;
        break;
      case "hill":
        terrainFactor = 0.8;
        break;
      case "valley":
        terrainFactor = 1.2; // Valleys can trap light pollution
        break;
      case "water":
        terrainFactor = 0.9; // Water bodies reflect less light pollution upward
        break;
      case "forest":
        terrainFactor = 0.85; // Forests absorb some light
        break;
      case "desert":
        terrainFactor = 0.7; // Clear desert air
        break;
      case "canyon":
        terrainFactor = 1.1; // Canyons can channel light pollution
        break;
      default:
        terrainFactor = 1.0; // No additional correction
    }
  }
  
  // Combined correction factor, capped between 0.3 and 1.3
  return Math.max(0.3, Math.min(1.3, elevationFactor * terrainFactor));
}
