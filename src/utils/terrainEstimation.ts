
/**
 * Utility for estimating terrain types and their impact on viewing conditions
 */

interface TerrainType {
  type: string;
  elevation: number;
  coverType: string;
  visibility: 'poor' | 'moderate' | 'good' | 'excellent';
}

/**
 * Detect terrain type from coordinates
 * @param latitude Latitude of the location
 * @param longitude Longitude of the location
 * @returns Detected terrain type string
 */
export async function detectTerrainType(
  latitude: number,
  longitude: number
): Promise<string> {
  try {
    // Here we would normally call an elevation API or terrain service
    // For now, we'll use a simplified approach to estimate terrain
    
    // Check for known mountain ranges
    const isMountainous = isInMountainRange(latitude, longitude);
    if (isMountainous) {
      return "mountain";
    }
    
    // Check for known desert regions
    const isDesert = isInDesertRegion(latitude, longitude);
    if (isDesert) {
      return "desert";
    }
    
    // Check for known plains and flat areas
    const isPlains = isInPlainsRegion(latitude, longitude);
    if (isPlains) {
      return "plains";
    }
    
    // Default to hill/rolling terrain as a moderate assumption
    return "hill";
  } catch (error) {
    console.error("Error detecting terrain type:", error);
    // Default to a neutral terrain type if detection fails
    return "unknown";
  }
}

/**
 * Get detailed terrain information from coordinates
 * @param latitude Latitude of the location
 * @param longitude Longitude of the location
 * @returns Detailed terrain information
 */
export async function getTerrainInfo(
  latitude: number,
  longitude: number
): Promise<TerrainType> {
  try {
    const terrainType = await detectTerrainType(latitude, longitude);
    
    // Default values for terrain types
    let elevation = 0;
    let coverType = "mixed";
    let visibility: TerrainType["visibility"] = "moderate";
    
    // Assign values based on terrain type
    switch (terrainType) {
      case "mountain":
        elevation = 2000 + Math.random() * 2000; // 2000-4000m
        coverType = Math.random() > 0.5 ? "forest" : "rocky";
        visibility = "excellent";
        break;
      case "desert":
        elevation = 500 + Math.random() * 1000; // 500-1500m
        coverType = "barren";
        visibility = "excellent";
        break;
      case "plains":
        elevation = 200 + Math.random() * 300; // 200-500m
        coverType = Math.random() > 0.5 ? "grassland" : "farmland";
        visibility = "good";
        break;
      case "hill":
        elevation = 500 + Math.random() * 800; // 500-1300m
        coverType = Math.random() > 0.5 ? "forest" : "mixed";
        visibility = "moderate";
        break;
      default:
        // Unknown terrain defaults
        elevation = 300 + Math.random() * 500;
        coverType = "mixed";
        visibility = "moderate";
    }
    
    return {
      type: terrainType,
      elevation,
      coverType,
      visibility
    };
  } catch (error) {
    console.error("Error getting terrain info:", error);
    // Return default values if an error occurs
    return {
      type: "unknown",
      elevation: 300,
      coverType: "mixed",
      visibility: "moderate"
    };
  }
}

/**
 * Check if coordinates are in a known mountain range
 */
function isInMountainRange(latitude: number, longitude: number): boolean {
  const mountainRanges = [
    // Rocky Mountains (North America)
    { minLat: 30, maxLat: 60, minLng: -125, maxLng: -100 },
    // Andes (South America)
    { minLat: -55, maxLat: 10, minLng: -80, maxLng: -65 },
    // Alps (Europe)
    { minLat: 43, maxLat: 48, minLng: 5, maxLng: 17 },
    // Himalayas (Asia)
    { minLat: 27, maxLat: 36, minLng: 70, maxLng: 95 },
    // Great Dividing Range (Australia)
    { minLat: -38, maxLat: -16, minLng: 145, maxLng: 153 }
  ];
  
  return mountainRanges.some(range => 
    latitude >= range.minLat && latitude <= range.maxLat && 
    longitude >= range.minLng && longitude <= range.maxLng
  );
}

/**
 * Check if coordinates are in a known desert region
 */
function isInDesertRegion(latitude: number, longitude: number): boolean {
  const desertRegions = [
    // Sahara Desert (Africa)
    { minLat: 15, maxLat: 35, minLng: -15, maxLng: 35 },
    // Arabian Desert (Middle East)
    { minLat: 15, maxLat: 30, minLng: 35, maxLng: 60 },
    // Gobi Desert (Asia)
    { minLat: 40, maxLat: 45, minLng: 100, maxLng: 115 },
    // Mojave Desert (North America)
    { minLat: 33, maxLat: 38, minLng: -118, maxLng: -113 },
    // Atacama Desert (South America)
    { minLat: -28, maxLat: -20, minLng: -71, maxLng: -67 },
    // Great Victoria Desert (Australia)
    { minLat: -32, maxLat: -26, minLng: 123, maxLng: 134 }
  ];
  
  return desertRegions.some(region => 
    latitude >= region.minLat && latitude <= region.maxLat && 
    longitude >= region.minLng && longitude <= region.maxLng
  );
}

/**
 * Check if coordinates are in a known plains/flat region
 */
function isInPlainsRegion(latitude: number, longitude: number): boolean {
  const plainRegions = [
    // Great Plains (North America)
    { minLat: 25, maxLat: 55, minLng: -105, maxLng: -95 },
    // Pampas (South America)
    { minLat: -38, maxLat: -28, minLng: -65, maxLng: -57 },
    // North European Plain (Europe)
    { minLat: 48, maxLat: 58, minLng: 2, maxLng: 26 },
    // Indo-Gangetic Plain (Asia)
    { minLat: 22, maxLat: 32, minLng: 75, maxLng: 90 },
    // Nullarbor Plain (Australia)
    { minLat: -33, maxLat: -29, minLng: 122, maxLng: 132 }
  ];
  
  return plainRegions.some(region => 
    latitude >= region.minLat && latitude <= region.maxLat && 
    longitude >= region.minLng && longitude <= region.maxLng
  );
}

/**
 * Estimate elevation from terrain type
 * @param terrainType Type of terrain
 * @returns Estimated elevation in meters
 */
export function estimateElevationFromTerrain(terrainType: string): number {
  switch (terrainType.toLowerCase()) {
    case "mountain":
      return 2500;
    case "hill":
      return 800;
    case "desert":
      return 700;
    case "plains":
      return 300;
    default:
      return 400;
  }
}
