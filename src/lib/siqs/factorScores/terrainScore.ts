
/**
 * Terrain and elevation factor score calculations
 */
import { getElevationBortleAdjustment } from "@/utils/terrainData";

/**
 * Calculate the terrain factor score based on elevation
 * @param elevation Elevation in meters
 * @returns Score on a 0-100 scale
 */
export function calculateTerrainFactor(elevation: number): number {
  // Validate input
  if (typeof elevation !== 'number' || isNaN(elevation)) {
    console.warn('Invalid elevation value:', elevation);
    return 50; // Default to moderate score for invalid input
  }
  
  // Ensure elevation is not negative
  const validElevation = Math.max(0, elevation);
  
  // Elevation impact calculation
  // 0-300m: Minimal impact (50-55)
  // 300-1000m: Modest improvement (55-70)
  // 1000-2000m: Significant improvement (70-85)
  // 2000-3000m: Major improvement (85-95)
  // 3000m+: Excellent (95-100)
  
  if (validElevation <= 300) return 50 + (validElevation / 60);           // 50-55
  if (validElevation <= 1000) return 55 + ((validElevation - 300) / 35);  // 55-70
  if (validElevation <= 2000) return 70 + ((validElevation - 1000) / 75); // 70-85
  if (validElevation <= 3000) return 85 + ((validElevation - 2000) / 200); // 85-95
  
  return Math.min(100, 95 + ((validElevation - 3000) / 500));            // 95-100
}

/**
 * Calculate Bortle scale adjustment based on terrain features
 * @param elevation Elevation in meters
 * @param distance Distance from nearest city in km
 * @param population Nearest city population (optional)
 * @returns Adjustment to apply to Bortle scale
 */
export function calculateTerrainBortleAdjustment(
  elevation: number,
  distance: number = 0,
  population: number = 0
): number {
  // Get elevation adjustment
  const elevationAdjustment = getElevationBortleAdjustment(elevation);
  
  // Calculate distance adjustment - farther from cities = darker skies
  let distanceAdjustment = 0;
  if (distance > 100) distanceAdjustment = -1.0;
  else if (distance > 50) distanceAdjustment = -0.7;
  else if (distance > 25) distanceAdjustment = -0.5;
  else if (distance > 10) distanceAdjustment = -0.2;
  
  // Calculate population adjustment - smaller cities = less light pollution
  let populationAdjustment = 0;
  if (population > 0) {
    if (population < 10000) populationAdjustment = -0.3;
    else if (population < 50000) populationAdjustment = -0.1;
    else if (population > 1000000) populationAdjustment = 0.3;
    else if (population > 500000) populationAdjustment = 0.2;
  }
  
  // Total adjustment cannot improve Bortle scale by more than 2 points
  const totalAdjustment = Math.max(-2.0, 
    elevationAdjustment + distanceAdjustment + populationAdjustment);
  
  return totalAdjustment;
}
