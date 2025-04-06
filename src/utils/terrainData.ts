
/**
 * Terrain data and elevation utilities
 * Provides utilities for working with terrain elevation data
 */

// Default elevation database - simplified for demo
const elevationDatabase: Record<string, number> = {
  // Mountain regions
  "alps": 2500,
  "rockies": 2200,
  "himalayas": 4500,
  "andes": 3500,
  
  // High plateaus
  "tibet": 4000,
  "colorado": 2000,
  
  // Desert regions
  "sahara": 400,
  "gobi": 1000,
  "atacama": 2000,
  
  // Default elevation for different regions
  "asia": 600,
  "europe": 300,
  "north_america": 500,
  "south_america": 600,
  "africa": 600,
  "australia": 300,
  "antarctica": 2000
};

/**
 * Determines if a location is likely to be at high elevation
 * @param latitude Geographic latitude
 * @param longitude Geographic longitude
 * @returns True if the location is likely at high elevation
 */
export function isLikelyHighElevation(latitude: number, longitude: number): boolean {
  // Major mountain ranges around the world
  // Rockies in North America
  if ((latitude >= 35 && latitude <= 60) && (longitude >= -130 && longitude <= -105)) {
    return true;
  }
  
  // Andes in South America
  if ((latitude >= -55 && latitude <= 10) && (longitude >= -80 && longitude <= -65)) {
    return true;
  }
  
  // Alps in Europe
  if ((latitude >= 43 && latitude <= 48) && (longitude >= 5 && longitude <= 16)) {
    return true;
  }
  
  // Himalayas and Tibetan Plateau in Asia
  if ((latitude >= 27 && latitude <= 40) && (longitude >= 70 && longitude <= 105)) {
    return true;
  }
  
  // Ethiopian Highlands in Africa
  if ((latitude >= 5 && latitude <= 15) && (longitude >= 35 && longitude <= 40)) {
    return true;
  }
  
  // Also check for high-latitude regions which could be clearer (less atmosphere)
  return Math.abs(latitude) > 55; // Near polar regions
}

/**
 * Get the estimated terrain elevation for a location
 * This is a placeholder function that would normally call an elevation API
 * 
 * @param latitude Geographic latitude
 * @param longitude Geographic longitude
 * @returns Estimated elevation in meters, or null if unknown
 */
export async function getTerrainElevation(
  latitude: number, 
  longitude: number
): Promise<number | null> {
  try {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 10));
    
    // In a real implementation, we would call an elevation API service here
    // For this demo, we'll use some basic logic to estimate elevation
    let elevation = 0;
    
    // Check for major mountain ranges
    if (isLikelyHighElevation(latitude, longitude)) {
      if ((latitude >= 35 && latitude <= 60) && (longitude >= -130 && longitude <= -105)) {
        elevation = elevationDatabase.rockies;
      } else if ((latitude >= -55 && latitude <= 10) && (longitude >= -80 && longitude <= -65)) {
        elevation = elevationDatabase.andes;
      } else if ((latitude >= 43 && latitude <= 48) && (longitude >= 5 && longitude <= 16)) {
        elevation = elevationDatabase.alps;
      } else if ((latitude >= 27 && latitude <= 40) && (longitude >= 70 && longitude <= 105)) {
        elevation = elevationDatabase.himalayas;
      } else {
        // Generic high elevation
        elevation = 1500;
      }
    } else {
      // Determine continent for basic elevation estimation
      if ((latitude >= 30 && latitude <= 70) && (longitude >= -170 && longitude <= -30)) {
        elevation = elevationDatabase.north_america;
      } else if ((latitude >= -60 && latitude <= 30) && (longitude >= -90 && longitude <= -30)) {
        elevation = elevationDatabase.south_america;
      } else if ((latitude >= 35 && latitude <= 70) && (longitude >= -10 && longitude <= 40)) {
        elevation = elevationDatabase.europe;
      } else if ((latitude >= -40 && latitude <= 35) && (longitude >= -20 && longitude <= 55)) {
        elevation = elevationDatabase.africa;
      } else if ((latitude >= -10 && latitude <= 55) && (longitude >= 55 && longitude <= 145)) {
        elevation = elevationDatabase.asia;
      } else if ((latitude >= -50 && latitude <= -10) && (longitude >= 110 && longitude <= 155)) {
        elevation = elevationDatabase.australia;
      } else if (latitude <= -60) {
        elevation = elevationDatabase.antarctica;
      } else {
        // Default for unknown regions
        elevation = 200;
      }
    }
    
    return elevation;
  } catch (error) {
    console.error("Error getting terrain elevation:", error);
    return null;
  }
}

/**
 * Calculate elevation adjustment factor for Bortle scale
 * Higher elevations generally have clearer skies
 * 
 * @param elevation Elevation in meters
 * @returns Bortle scale adjustment (negative value means darker skies)
 */
export function getElevationBortleAdjustment(elevation: number): number {
  if (elevation <= 0) return 0;
  
  // Significant improvements start around 1000m
  if (elevation > 3000) return -1.5; // Major improvement at very high elevations
  if (elevation > 2000) return -1.0;
  if (elevation > 1000) return -0.5;
  if (elevation > 500)  return -0.3;
  if (elevation > 300)  return -0.2;
  
  return 0; // No significant impact at low elevations
}

/**
 * Detect terrain type based on coordinates
 * @param latitude Latitude of the location
 * @param longitude Longitude of the location
 * @returns Promise resolving to terrain type
 */
export async function detectTerrainType(
  latitude: number,
  longitude: number
): Promise<string> {
  // Use elevation data to help determine terrain type
  const elevation = await getTerrainElevation(latitude, longitude);
  
  // Check for known mountain regions
  if (isLikelyHighElevation(latitude, longitude)) {
    if (elevation && elevation > 2500) {
      return 'mountain';
    } else if (elevation && elevation > 1500) {
      return 'plateau';
    } else {
      return 'hill';
    }
  }
  
  // Check for coastal areas (simplified)
  // Distance to coastline would be more accurate, but we use known coastal regions
  const isCoastal = isLikelyCoastal(latitude, longitude);
  if (isCoastal) {
    return 'coast';
  }
  
  // Check for urban areas (simplified)
  // We'd use population density data in a real implementation
  const isUrban = isLikelyUrban(latitude, longitude);
  if (isUrban) {
    return 'urban';
  }
  
  // Check elevation for other terrain types
  if (elevation) {
    if (elevation > 1000) return 'plateau';
    if (elevation > 500) return 'hill';
    if (elevation < 100) return 'plain';
  }
  
  // Default to most common terrain type
  return 'plain';
}

/**
 * Simple check for coastal regions
 */
function isLikelyCoastal(latitude: number, longitude: number): boolean {
  // Major coastal areas (simplified for demo)
  
  // US East Coast
  if ((latitude >= 25 && latitude <= 45) && (longitude >= -82 && longitude <= -65)) {
    return true;
  }
  
  // US West Coast
  if ((latitude >= 32 && latitude <= 48) && (longitude >= -125 && longitude <= -117)) {
    return true;
  }
  
  // European Atlantic Coast
  if ((latitude >= 36 && latitude <= 60) && (longitude >= -10 && longitude <= 0)) {
    return true;
  }
  
  // Mediterranean Coast
  if ((latitude >= 30 && latitude <= 45) && (longitude >= 0 && longitude <= 40)) {
    return true;
  }
  
  // East Asian Coast
  if ((latitude >= 20 && latitude <= 45) && (longitude >= 110 && longitude <= 145)) {
    return true;
  }
  
  return false;
}

/**
 * Simple check for urban regions
 */
function isLikelyUrban(latitude: number, longitude: number): boolean {
  // Major urban areas (simplified for demo)
  
  // North American major cities
  if ((Math.abs(latitude - 40.7) < 1 && Math.abs(longitude - (-74.0)) < 1) || // NYC
      (Math.abs(latitude - 34.0) < 1 && Math.abs(longitude - (-118.2)) < 1) || // LA
      (Math.abs(latitude - 41.8) < 1 && Math.abs(longitude - (-87.6)) < 1) || // Chicago
      (Math.abs(latitude - 37.7) < 1 && Math.abs(longitude - (-122.4)) < 1)) { // SF
    return true;
  }
  
  // European major cities
  if ((Math.abs(latitude - 51.5) < 0.8 && Math.abs(longitude - (-0.1)) < 0.8) || // London
      (Math.abs(latitude - 48.9) < 0.8 && Math.abs(longitude - 2.3) < 0.8) || // Paris
      (Math.abs(latitude - 52.5) < 0.8 && Math.abs(longitude - 13.4) < 0.8)) { // Berlin
    return true;
  }
  
  // Asian major cities
  if ((Math.abs(latitude - 35.7) < 1 && Math.abs(longitude - 139.7) < 1) || // Tokyo
      (Math.abs(latitude - 39.9) < 1 && Math.abs(longitude - 116.4) < 1) || // Beijing
      (Math.abs(latitude - 31.2) < 1 && Math.abs(longitude - 121.5) < 1) || // Shanghai
      (Math.abs(latitude - 19.0) < 1 && Math.abs(longitude - 72.8) < 1)) { // Mumbai
    return true;
  }
  
  return false;
}

/**
 * Get terrain adjustment factor for Bortle scale
 * @param terrainType Type of terrain
 * @returns Adjustment factor for Bortle scale
 */
export function getTerrainAdjustmentFactor(terrainType: string): number {
  switch (terrainType) {
    case 'mountain':
      return -1.0;  // Mountains block light pollution
    case 'plateau':
      return -0.7;  // High plateaus have clearer skies
    case 'hill':
      return -0.4;  // Hills provide some blocking
    case 'valley':
      return 0.2;   // Valleys can trap light pollution
    case 'urban':
      return 0.8;   // Urban areas have more light pollution
    case 'coast':
      return -0.1;  // Coastal areas often have clearer air
    default:
      return 0;     // No adjustment for plains
  }
}

/**
 * Estimate the air clarity based on elevation
 * @param elevation Elevation in meters
 * @returns Air clarity score (0-10, higher is better)
 */
export function getAirClarityFromElevation(elevation: number): number {
  if (elevation <= 0) return 5; // Default average
  
  // Higher elevations generally have clearer air
  if (elevation > 3000) return 9.5; // Very clear at high mountains
  if (elevation > 2000) return 8.5;
  if (elevation > 1500) return 8.0;
  if (elevation > 1000) return 7.5;
  if (elevation > 500) return 6.5;
  if (elevation > 300) return 6.0;
  
  return 5.5; // Slightly better than average
}
