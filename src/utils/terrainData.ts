
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
