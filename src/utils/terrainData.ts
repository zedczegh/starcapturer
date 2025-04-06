
/**
 * Terrain data utilities for enhanced Bortle scale calculations
 * Provides elevation data and terrain type detection based on coordinates
 */

// Simple terrain type classification
export type TerrainType = 'mountain' | 'hill' | 'plateau' | 'valley' | 'plain' | 'coast' | 'urban' | 'unknown';

// Elevation database for major mountain ranges (simplified for performance)
const mountainRanges = [
  // Himalayas
  { name: "Himalayas", minLat: 27, maxLat: 36, minLng: 70, maxLng: 95, minElevation: 5000, terrainType: 'mountain' },
  // Rocky Mountains
  { name: "Rocky Mountains", minLat: 30, maxLat: 60, minLng: -125, maxLng: -105, minElevation: 2000, terrainType: 'mountain' },
  // Andes
  { name: "Andes", minLat: -55, maxLat: 12, minLng: -80, maxLng: -65, minElevation: 2500, terrainType: 'mountain' },
  // Alps
  { name: "Alps", minLat: 44, maxLat: 48, minLng: 5, maxLng: 16, minElevation: 3000, terrainType: 'mountain' },
  // Tibetan Plateau
  { name: "Tibetan Plateau", minLat: 28, maxLat: 40, minLng: 78, maxLng: 103, minElevation: 4500, terrainType: 'plateau' },
  // Chinese mountain ranges
  { name: "Tian Shan", minLat: 40, maxLat: 45, minLng: 75, maxLng: 95, minElevation: 3500, terrainType: 'mountain' },
  { name: "Kunlun Mountains", minLat: 35, maxLat: 37, minLng: 80, maxLng: 105, minElevation: 5000, terrainType: 'mountain' },
  { name: "Hengduan Mountains", minLat: 25, maxLat: 32, minLng: 97, maxLng: 102, minElevation: 4000, terrainType: 'mountain' }
];

// Elevation cache for performance
const elevationCache = new Map<string, number>();

/**
 * Get terrain elevation for coordinates
 * @param latitude Geographical latitude
 * @param longitude Geographical longitude
 * @returns Elevation in meters, or null if unknown
 */
export async function getTerrainElevation(latitude: number, longitude: number): Promise<number | null> {
  // Validate inputs
  if (!isFinite(latitude) || !isFinite(longitude)) {
    return null;
  }
  
  // Generate cache key with 2 decimal precision (about 1km resolution)
  const cacheKey = `${latitude.toFixed(2)},${longitude.toFixed(2)}`;
  
  // Check cache first
  if (elevationCache.has(cacheKey)) {
    return elevationCache.get(cacheKey) || null;
  }
  
  // Check if coordinates are in known mountain range
  for (const range of mountainRanges) {
    if (latitude >= range.minLat && latitude <= range.maxLat &&
        longitude >= range.minLng && longitude <= range.maxLng) {
      // Approximation based on mountain range
      const approximateElevation = range.minElevation * (0.8 + Math.random() * 0.4); // Add some variance
      
      // Cache the result
      elevationCache.set(cacheKey, approximateElevation);
      
      return approximateElevation;
    }
  }

  // Elevation estimate based on latitude/longitude
  let estimatedElevation: number;
  
  // Use regional estimation
  if (latitude >= 28 && latitude <= 40 && longitude >= 78 && longitude <= 103) {
    // Tibetan plateau
    estimatedElevation = 4500 + Math.random() * 1000;
  } else if (latitude >= 36 && latitude <= 44 && longitude >= -124 && longitude <= -116) {
    // Sierra Nevada
    estimatedElevation = 2000 + Math.random() * 1500;
  } else if (Math.abs(latitude) >= 60) {
    // Polar regions are often near sea level
    estimatedElevation = 200 + Math.random() * 300;
  } else if (Math.abs(longitude) <= 5 || Math.abs(longitude - 180) <= 5) {
    // Near prime meridian or date line - often coastal
    estimatedElevation = 100 + Math.random() * 200;
  } else {
    // Default estimate based on distance from equator
    estimatedElevation = 300 + Math.abs(latitude) * 15 + Math.random() * 500;
  }
  
  // Cache the result
  elevationCache.set(cacheKey, estimatedElevation);
  
  return estimatedElevation;
}

/**
 * Detect terrain type based on coordinates
 * @param latitude Geographical latitude
 * @param longitude Geographical longitude
 * @returns Terrain type classification
 */
export async function detectTerrainType(latitude: number, longitude: number): Promise<TerrainType> {
  if (!isFinite(latitude) || !isFinite(longitude)) {
    return 'unknown';
  }
  
  // First check if we're in a known mountain range
  for (const range of mountainRanges) {
    if (latitude >= range.minLat && latitude <= range.maxLat &&
        longitude >= range.minLng && longitude <= range.maxLng) {
      return range.terrainType;
    }
  }
  
  // Get elevation to help determine terrain type
  const elevation = await getTerrainElevation(latitude, longitude);
  
  if (!elevation) return 'unknown';
  
  // Classify based on elevation
  if (elevation > 3000) return 'mountain';
  if (elevation > 1500) return 'hill';
  if (elevation > 800) return 'plateau';
  if (elevation <= 100 && (Math.abs(longitude) > 175 || Math.abs(longitude) < 5)) return 'coast';
  
  // Default to plain for moderate elevation
  return 'plain';
}

/**
 * Get terrain adjustment factor for Bortle scale
 * @param terrainType Type of terrain
 * @param elevation Elevation in meters
 * @returns Adjustment factor (negative values improve Bortle scale)
 */
export function getTerrainAdjustmentFactor(terrainType: TerrainType, elevation: number): number {
  let adjustmentFactor = 0;
  
  // Higher elevations improve sky quality
  if (elevation > 3000) {
    adjustmentFactor -= 1.2;
  } else if (elevation > 2000) {
    adjustmentFactor -= 0.8;
  } else if (elevation > 1000) {
    adjustmentFactor -= 0.4;
  } else if (elevation > 500) {
    adjustmentFactor -= 0.2;
  }
  
  // Different terrain types have different effects
  switch (terrainType) {
    case 'mountain':
      adjustmentFactor -= 0.5; // Mountains have clearer air
      break;
    case 'plateau':
      adjustmentFactor -= 0.3;
      break;
    case 'hill':
      adjustmentFactor -= 0.2;
      break;
    case 'valley':
      adjustmentFactor += 0.2; // Valleys can trap pollution
      break;
    case 'urban':
      adjustmentFactor += 0.5; // Urban areas have more light pollution
      break;
  }
  
  return adjustmentFactor;
}

/**
 * Clear elevation cache
 */
export function clearElevationCache(): void {
  const size = elevationCache.size;
  elevationCache.clear();
  console.log(`Cleared elevation cache (${size} entries)`);
}
