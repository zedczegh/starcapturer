
/**
 * Terrain-based correction for Bortle scale estimates
 * This improves accuracy by incorporating elevation, terrain features, and atmospheric effects
 */

// Elevation impact on light pollution
// Higher elevations generally have less atmospheric scattering
const ELEVATION_CORRECTION_FACTORS = [
  { minElevation: 3000, maxElevation: Infinity, factor: -1.2 }, // High mountains (>3000m): significant improvement
  { minElevation: 2000, maxElevation: 3000, factor: -0.9 },     // Mountains (2000-3000m): major improvement
  { minElevation: 1000, maxElevation: 2000, factor: -0.6 },     // Hills/low mountains (1000-2000m): moderate improvement
  { minElevation: 500, maxElevation: 1000, factor: -0.3 },      // Hills (500-1000m): slight improvement
  { minElevation: 100, maxElevation: 500, factor: -0.1 },       // Low hills (100-500m): minimal improvement
  { minElevation: 0, maxElevation: 100, factor: 0 }             // Flat land (0-100m): no change
];

// Terrain features with special light pollution characteristics
type TerrainFeature = {
  name: string;
  keywords: string[];
  bortleAdjustment: number;
};

const TERRAIN_FEATURES: TerrainFeature[] = [
  // Natural barriers that block light pollution
  { name: "Mountain range", keywords: ["mountain", "mountains", "range", "peak", "山脉", "山峰"], bortleAdjustment: -0.8 },
  { name: "Valley", keywords: ["valley", "canyon", "gorge", "谷", "峡谷"], bortleAdjustment: -0.5 },
  { name: "Forest", keywords: ["forest", "woods", "woodland", "森林"], bortleAdjustment: -0.3 },
  { name: "Desert", keywords: ["desert", "沙漠"], bortleAdjustment: -0.7 },
  { name: "National Park", keywords: ["national park", "park", "reserve", "国家公园", "保护区"], bortleAdjustment: -0.6 },
  
  // Features that worsen light pollution
  { name: "Industrial zone", keywords: ["industrial", "factory", "plant", "工业", "工厂"], bortleAdjustment: 1.0 },
  { name: "Airport", keywords: ["airport", "机场"], bortleAdjustment: 0.8 },
  { name: "Commercial center", keywords: ["mall", "shopping", "commercial", "商场", "购物"], bortleAdjustment: 0.7 },
  { name: "Sports complex", keywords: ["stadium", "arena", "sports", "体育场"], bortleAdjustment: 0.9 },
  { name: "Port", keywords: ["port", "harbor", "dock", "港口"], bortleAdjustment: 0.6 }
];

/**
 * Detect terrain features from location name
 * @param locationName The name of the location
 * @returns Adjustment to Bortle scale
 */
function detectTerrainFeatures(locationName: string): number {
  if (!locationName) return 0;
  
  const lowercaseName = locationName.toLowerCase();
  let totalAdjustment = 0;
  let matchCount = 0;
  
  for (const feature of TERRAIN_FEATURES) {
    for (const keyword of feature.keywords) {
      if (lowercaseName.includes(keyword.toLowerCase())) {
        totalAdjustment += feature.bortleAdjustment;
        matchCount++;
        break; // Only count each feature once
      }
    }
  }
  
  // If multiple features match, average the adjustment
  return matchCount > 0 ? totalAdjustment / matchCount : 0;
}

/**
 * Get elevation data for a location
 * In a real implementation, this would query an elevation API
 * @param latitude Location latitude
 * @param longitude Location longitude
 * @returns Elevation in meters
 */
async function getElevation(latitude: number, longitude: number): Promise<number> {
  // This is a placeholder function
  // In a real implementation, this would call an elevation API service
  
  try {
    // Simplified elevation estimation for demonstration
    // This would be replaced with actual API calls
    
    // Rough estimation for mountain ranges worldwide
    // Himalayas
    if (latitude > 25 && latitude < 40 && longitude > 70 && longitude < 95) {
      return 4000 + Math.random() * 2000;
    }
    
    // Alps
    if (latitude > 43 && latitude < 48 && longitude > 5 && longitude < 15) {
      return 2000 + Math.random() * 1500;
    }
    
    // Rockies
    if (latitude > 35 && latitude < 60 && longitude > -125 && longitude < -105) {
      return 2500 + Math.random() * 1500;
    }
    
    // Andes
    if (latitude > -55 && latitude < 10 && longitude > -80 && longitude < -65) {
      return 3000 + Math.random() * 2000;
    }
    
    // Default to slightly random low elevation for other areas
    return Math.random() * 300;
  } catch (error) {
    console.error("Error getting elevation data:", error);
    return 0; // Default to sea level if error
  }
}

/**
 * Get elevation-based Bortle scale adjustment
 * @param elevation Elevation in meters
 * @returns Adjustment factor for Bortle scale
 */
function getElevationAdjustment(elevation: number): number {
  for (const range of ELEVATION_CORRECTION_FACTORS) {
    if (elevation >= range.minElevation && elevation < range.maxElevation) {
      return range.factor;
    }
  }
  return 0; // Default to no adjustment
}

/**
 * Apply atmospheric condition adjustments
 * @param latitude Location latitude
 * @param longitude Location longitude
 * @returns Adjustment factor for Bortle scale
 */
async function getAtmosphericAdjustment(latitude: number, longitude: number): Promise<number> {
  // This would use weather API data in a real implementation
  // For now, use a simple estimation
  
  // Simplified logic: higher latitudes tend to have clearer air
  const latitudeAbs = Math.abs(latitude);
  
  if (latitudeAbs > 60) {
    return -0.4; // Very clear air near poles
  } else if (latitudeAbs > 45) {
    return -0.2; // Clearer air in higher latitudes
  }
  
  // No adjustment for mid-latitudes
  return 0;
}

/**
 * Get terrain-corrected Bortle scale
 * Combines elevation, terrain features, and atmospheric data
 * @param latitude Location latitude
 * @param longitude Location longitude
 * @param locationName Location name
 * @returns Corrected Bortle scale or null if data unavailable
 */
export async function getTerrainCorrectedBortleScale(
  latitude: number,
  longitude: number,
  locationName: string
): Promise<number | null> {
  try {
    // First get base Bortle scale from API
    const { fetchLightPollutionData } = await import('@/lib/api/pollution');
    const pollutionData = await fetchLightPollutionData(latitude, longitude);
    
    if (!pollutionData || pollutionData.bortleScale === null) {
      return null; // Can't apply corrections without base value
    }
    
    const baseBortleScale = pollutionData.bortleScale;
    
    // Get elevation data
    const elevation = await getElevation(latitude, longitude);
    const elevationAdjustment = getElevationAdjustment(elevation);
    
    // Get terrain feature adjustment
    const terrainAdjustment = detectTerrainFeatures(locationName);
    
    // Get atmospheric adjustment
    const atmosphericAdjustment = await getAtmosphericAdjustment(latitude, longitude);
    
    // Combine all adjustments
    const totalAdjustment = elevationAdjustment + terrainAdjustment + atmosphericAdjustment;
    
    // Apply adjustment with bounds checking
    const correctedBortleScale = Math.max(1, Math.min(9, baseBortleScale + totalAdjustment));
    
    console.log(`Terrain-corrected Bortle scale calculation:
      Base: ${baseBortleScale}
      Elevation (${elevation}m): ${elevationAdjustment}
      Terrain features: ${terrainAdjustment}
      Atmospheric: ${atmosphericAdjustment}
      Final: ${correctedBortleScale}`);
    
    return Number(correctedBortleScale.toFixed(1)); // Round to 1 decimal place
  } catch (error) {
    console.error("Error applying terrain correction:", error);
    return null;
  }
}

/**
 * Quick estimate of terrain-corrected Bortle scale without API calls
 * Used for faster results when needed
 */
export function quickTerrainEstimate(
  baseBortleScale: number,
  locationName: string,
  latitude: number,
  longitude: number
): number {
  try {
    // Skip detailed computation to speed up response
    // Only apply terrain feature detection
    const terrainAdjustment = detectTerrainFeatures(locationName);
    
    // Latitude adjustment (higher latitudes tend to have clearer skies)
    const latitudeAbs = Math.abs(latitude);
    let latitudeAdjustment = 0;
    
    if (latitudeAbs > 60) {
      latitudeAdjustment = -0.3;
    } else if (latitudeAbs > 45) {
      latitudeAdjustment = -0.1;
    }
    
    // Simple mountain check based on keywords in location name
    const isMountainous = locationName.toLowerCase().includes("mountain") || 
                          locationName.toLowerCase().includes("mt ") ||
                          locationName.toLowerCase().includes("mt.") ||
                          locationName.toLowerCase().includes("山");
    
    const mountainAdjustment = isMountainous ? -0.5 : 0;
    
    // Combine adjustments
    const totalAdjustment = terrainAdjustment + latitudeAdjustment + mountainAdjustment;
    
    // Apply adjustment with bounds checking
    return Math.max(1, Math.min(9, baseBortleScale + totalAdjustment));
  } catch (error) {
    console.error("Error in quick terrain estimate:", error);
    return baseBortleScale; // Return original value if error
  }
}
