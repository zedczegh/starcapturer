
/**
 * Terrain data and utilities for astronomical calculations
 */

/**
 * Detect the terrain type at a given location
 * @param latitude Location latitude
 * @param longitude Location longitude 
 * @returns Promise resolving to terrain type or null
 */
export async function detectTerrainType(
  latitude: number,
  longitude: number
): Promise<string | null> {
  try {
    // For now, we'll use a simplified approach based on coordinates
    // In a full implementation, this would call an external API or use local data
    
    // Check for water bodies (oceans, large lakes) using simplified boundaries
    if (isOverWater(latitude, longitude)) {
      console.log("Location appears to be over water, using Bortle scale: 2.5");
      return "water";
    }
    
    // Check for mountains using elevation data
    const elevation = await getElevation(latitude, longitude);
    if (elevation > 2000) {
      return "mountain";
    } else if (elevation > 1000) {
      return "hill";
    } else if (elevation > 500) {
      return "plateau";
    }
    
    // Default to plain for now
    return "plain";
  } catch (error) {
    console.error("Error detecting terrain type:", error);
    return null;
  }
}

/**
 * Get elevation at a specific location
 * @param latitude Location latitude
 * @param longitude Location longitude
 * @returns Promise resolving to elevation in meters or null
 */
export async function getElevation(
  latitude: number,
  longitude: number
): Promise<number | null> {
  try {
    // In a full implementation, this would call an elevation API
    // For now, return a default value based on location
    
    // High elevation areas
    if ((latitude > 28 && latitude < 40 && longitude > 75 && longitude < 105) || // Himalayas, Tibet
        (latitude > 35 && latitude < 50 && longitude > -125 && longitude < -105)) { // Rocky Mountains
      return 3000;
    }
    
    // Medium elevation
    if ((latitude > 15 && latitude < 50 && longitude > -110 && longitude < -90) || // US mountain ranges
        (latitude > 40 && latitude < 50 && longitude > 0 && longitude < 20) || // Alps
        (latitude > -40 && latitude < -20 && longitude > -75 && longitude < -65)) { // Andes
      return 1500;
    }
    
    // Default low elevation
    return 300;
  } catch (error) {
    console.error("Error getting elevation:", error);
    return null;
  }
}

/**
 * Check if a location is over water
 * @param latitude Location latitude
 * @param longitude Location longitude
 * @returns Boolean indicating if location is over water
 */
function isOverWater(latitude: number, longitude: number): boolean {
  // Pacific Ocean
  if ((longitude < -70 && longitude > -180 && latitude < 60 && latitude > -60) || 
      (longitude > 120 && longitude < 180 && latitude < 60 && latitude > -60)) {
    return true;
  }
  
  // Atlantic Ocean
  if (longitude < -30 && longitude > -70 && latitude < 60 && latitude > -60) {
    return true;
  }
  
  // Indian Ocean
  if (longitude > 40 && longitude < 120 && latitude < 20 && latitude > -60) {
    return true;
  }
  
  // Mediterranean Sea
  if (longitude > 0 && longitude < 40 && latitude > 30 && latitude < 45) {
    return true;
  }
  
  return false;
}

/**
 * Get terrain adjustment factor for Bortle scale calculation
 * @param terrainType Type of terrain
 * @param elevation Elevation in meters
 * @returns Adjustment factor (negative values improve Bortle scale)
 */
export function getTerrainAdjustmentFactor(terrainType: string, elevation: number): number {
  // Higher elevations and certain terrain types improve viewing conditions
  let adjustmentFactor = 0;
  
  // Elevation adjustments (higher = better skies)
  if (elevation > 3000) {
    adjustmentFactor -= 1.2;
  } else if (elevation > 2000) {
    adjustmentFactor -= 0.9;
  } else if (elevation > 1000) {
    adjustmentFactor -= 0.6;
  } else if (elevation > 500) {
    adjustmentFactor -= 0.3;
  }
  
  // Terrain type adjustments
  switch (terrainType) {
    case "mountain":
      adjustmentFactor -= 0.8;
      break;
    case "water":
      adjustmentFactor -= 0.5;
      break;
    case "plateau":
      adjustmentFactor -= 0.4;
      break;
    case "hill":
      adjustmentFactor -= 0.2;
      break;
    case "valley":
      adjustmentFactor += 0.3; // Valleys can trap light pollution
      break;
    case "plain":
      // No adjustment
      break;
  }
  
  return adjustmentFactor;
}

/**
 * Get elevation-based Bortle scale adjustment
 * @param elevation Elevation in meters
 * @returns Adjustment factor (negative values improve Bortle scale)
 */
export function getElevationBortleAdjustment(elevation: number | null): number {
  if (elevation === null || elevation === undefined) return 0;
  
  // Higher elevations generally have better sky conditions
  if (elevation > 3000) return -1.0;
  if (elevation > 2000) return -0.7;
  if (elevation > 1000) return -0.4;
  if (elevation > 500) return -0.2;
  
  return 0;
}

/**
 * Get terrain elevation at a given location
 * @param latitude Location latitude
 * @param longitude Location longitude
 * @returns Promise resolving to elevation in meters
 */
export async function getTerrainElevation(
  latitude: number,
  longitude: number
): Promise<number | null> {
  return getElevation(latitude, longitude);
}
