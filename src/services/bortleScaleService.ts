
/**
 * Services related to Bortle Scale calculations
 */

import { haversine } from '@/utils/haversine';

// Map of known dark sky areas with their Bortle Scale values
const knownDarkSkyAreas = [
  { name: "Natural Bridges National Monument", latitude: 37.6047, longitude: -109.9754, bortleScale: 1 },
  { name: "Big Bend National Park", latitude: 29.2498, longitude: -103.2502, bortleScale: 1 },
  { name: "Cherry Springs State Park", latitude: 41.6626, longitude: -77.8233, bortleScale: 2 },
  { name: "Death Valley National Park", latitude: 36.5323, longitude: -116.9325, bortleScale: 1 },
  { name: "Atacama Desert", latitude: -24.5000, longitude: -69.2500, bortleScale: 1 },
  { name: "NamibRand Nature Reserve", latitude: -24.7292, longitude: 16.0952, bortleScale: 1 },
  { name: "Aoraki Mackenzie", latitude: -44.0025, longitude: 170.4764, bortleScale: 1 },
  { name: "Mont-Mégantic", latitude: 45.4573, longitude: -71.1533, bortleScale: 2 },
  // Urban areas
  { name: "New York City", latitude: 40.7128, longitude: -74.0060, bortleScale: 9 },
  { name: "Los Angeles", latitude: 34.0522, longitude: -118.2437, bortleScale: 9 },
  { name: "London", latitude: 51.5074, longitude: -0.1278, bortleScale: 8 },
  { name: "Tokyo", latitude: 35.6762, longitude: 139.6503, bortleScale: 9 },
  { name: "Shanghai", latitude: 31.2304, longitude: 121.4737, bortleScale: 9 },
  // Suburban areas
  { name: "Average Suburb", latitude: 0, longitude: 0, bortleScale: 6 }
];

/**
 * Estimate Bortle scale for a given location based on known dark sky areas
 * and urban centers
 * @param latitude Location latitude
 * @param longitude Location longitude
 * @param defaultValue Default Bortle scale if estimation fails
 * @returns Estimated Bortle scale (1-9)
 */
export function getBortleScale(
  latitude: number, 
  longitude: number,
  defaultValue: number = 4
): number {
  try {
    // Calculate distances to all known reference points
    const distances = knownDarkSkyAreas.map(area => {
      if (area.name === "Average Suburb") return { area, distance: Infinity };
      
      const distance = haversine(latitude, longitude, area.latitude, area.longitude);
      return { area, distance };
    });
    
    // Sort by distance
    distances.sort((a, b) => a.distance - b.distance);
    
    // If very close to a known area (within 50km), use its value
    if (distances[0].distance < 50) {
      return distances[0].area.bortleScale;
    }
    
    // For areas between 50-200km from dark sites, interpolate
    if (distances[0].distance < 200 && distances[0].area.bortleScale <= 3) {
      const baseScale = distances[0].area.bortleScale;
      const distanceFactor = (distances[0].distance - 50) / 150;
      
      // Gradually increase Bortle scale with distance
      // Add between 0-3 points depending on distance
      return Math.min(9, Math.round(baseScale + (3 * distanceFactor)));
    }
    
    // For areas between 50-200km from urban centers, interpolate
    if (distances[0].distance < 200 && distances[0].area.bortleScale >= 7) {
      const baseScale = distances[0].area.bortleScale;
      const distanceFactor = (distances[0].distance - 50) / 150;
      
      // Gradually decrease Bortle scale with distance
      // Subtract between 0-3 points depending on distance
      return Math.max(1, Math.round(baseScale - (3 * distanceFactor)));
    }
    
    // Default to medium-high Bortle scale for unknown areas
    return defaultValue;
    
  } catch (error) {
    console.error("Error estimating Bortle scale:", error);
    return defaultValue;
  }
}

/**
 * Get a description of the Bortle Scale value
 * @param bortleScale Bortle scale number (1-9)
 * @returns Human-readable description
 */
export function getBortleScaleDescription(bortleScale: number): string {
  switch (bortleScale) {
    case 1: return "Excellent dark-sky site";
    case 2: return "Typical truly dark site";
    case 3: return "Rural sky";
    case 4: return "Rural/suburban transition";
    case 5: return "Suburban sky";
    case 6: return "Bright suburban sky";
    case 7: return "Suburban/urban transition";
    case 8: return "City sky";
    case 9: return "Inner-city sky";
    default: return "Unknown";
  }
}

/**
 * Check if a site has exceptional dark sky quality
 * @param bortleScale Bortle scale value
 * @returns Boolean indicating exceptional quality
 */
export function isExceptionalDarkSky(bortleScale: number): boolean {
  return bortleScale <= 2;
}
