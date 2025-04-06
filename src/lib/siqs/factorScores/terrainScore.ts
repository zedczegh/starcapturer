
/**
 * Terrain factor score calculations for SIQS
 * Accounts for elevation, terrain type, and geographical features
 */

/**
 * Calculate terrain factor score
 * @param elevation Elevation in meters
 * @param terrainType Optional terrain type classification
 * @param latitude Location latitude (for regional adjustments)
 * @returns Score on 0-10 scale
 */
export function calculateTerrainFactor(
  elevation: number | undefined,
  terrainType?: string,
  latitude?: number
): number {
  // Base score from elevation
  const elevationScore = calculateElevationScore(elevation);
  
  // Add terrain type adjustment if provided
  let terrainAdjustment = 0;
  
  if (terrainType) {
    switch (terrainType.toLowerCase()) {
      case 'mountain':
        terrainAdjustment = 1.5;
        break;
      case 'plateau':
        terrainAdjustment = 1.0;
        break;
      case 'hill':
        terrainAdjustment = 0.5;
        break;
      case 'desert':
        terrainAdjustment = 1.0;
        break;
      case 'valley':
        terrainAdjustment = -0.5;
        break;
      case 'coast':
        terrainAdjustment = 0;
        break;
      case 'urban':
        terrainAdjustment = -1.0;
        break;
      case 'water':
        terrainAdjustment = -0.5;
        break;
      default:
        terrainAdjustment = 0;
    }
  }
  
  // Apply latitude adjustment for polar or equatorial regions
  let latitudeAdjustment = 0;
  if (latitude !== undefined) {
    const absLatitude = Math.abs(latitude);
    
    // Polar regions tend to have clearer air
    if (absLatitude > 60) {
      latitudeAdjustment = 0.5;
    } 
    // Tropical regions often have more humidity and atmospheric interference
    else if (absLatitude < 23.5) {
      latitudeAdjustment = -0.3;
    }
  }
  
  // Calculate final score with all adjustments
  const adjustedScore = elevationScore + terrainAdjustment + latitudeAdjustment;
  
  // Ensure score stays in valid range
  return Math.max(0, Math.min(10, adjustedScore));
}

/**
 * Calculate score based on elevation
 * @param elevation Elevation in meters
 * @returns Base elevation score
 */
function calculateElevationScore(elevation: number | undefined): number {
  // If no data available, return neutral score
  if (elevation === undefined || elevation === null) {
    return 5;
  }
  
  // Validate input
  const validElevation = Math.max(0, elevation);
  
  // Elevation scoring: higher elevation = better score, with diminishing returns
  // 0m = 5, 500m = 6, 1000m = 7, 2000m = 8, 3000m+ = 9
  
  if (validElevation < 500) {
    return 5 + (validElevation * (1 / 500));
  } else if (validElevation < 1000) {
    return 6 + ((validElevation - 500) * (1 / 500));
  } else if (validElevation < 2000) {
    return 7 + ((validElevation - 1000) * (1 / 1000));
  } else if (validElevation < 3000) {
    return 8 + ((validElevation - 2000) * (1 / 1000));
  } else {
    return 9;
  }
}
