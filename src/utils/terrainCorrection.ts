
/**
 * Utility for terrain-corrected Bortle scale calculations
 * Takes into account elevation and surrounding topography
 */

// Constants for terrain adjustments
const ELEVATION_FACTOR = 0.18; // Higher elevations have better sky clarity (increased from 0.15)
const MOUNTAIN_CORRECTION = 0.9; // Mountains block light pollution from cities (increased from 0.8)
const ELEVATION_THRESHOLD = 800; // Meters above which terrain is considered mountainous
const TYPICAL_CITY_LIGHT_RADIUS = 30; // Km that city light pollution typically extends

/**
 * Cache to store recent terrain-corrected Bortle scale values
 * Key: latitude-longitude, Value: correction data
 */
const terrainCorrectionCache = new Map<string, {
  bortleScale: number;
  confidence: 'high' | 'medium' | 'low';
  timestamp: number;
  elevation?: number;
  terrain?: string;
}>();

/**
 * Get terrain-corrected Bortle scale based on location
 * @param latitude Latitude of the location
 * @param longitude Longitude of the location
 * @param locationName Optional location name for additional context
 * @returns Corrected Bortle scale or null if correction not possible
 */
export async function getTerrainCorrectedBortleScale(
  latitude: number,
  longitude: number,
  locationName?: string
): Promise<number | null> {
  const cacheKey = `${latitude.toFixed(4)}-${longitude.toFixed(4)}`;
  
  // Check cache first (valid for 30 days since terrain doesn't change)
  const cachedData = terrainCorrectionCache.get(cacheKey);
  if (cachedData && (Date.now() - cachedData.timestamp) < 30 * 24 * 60 * 60 * 1000) {
    console.log(`Using cached terrain-corrected Bortle: ${cachedData.bortleScale} (${cachedData.terrain || 'unknown terrain'})`);
    return cachedData.bortleScale;
  }
  
  try {
    // Attempt to get elevation data
    const elevation = await getElevationData(latitude, longitude);
    
    if (elevation === null) {
      return null;
    }
    
    // Get base Bortle scale estimate
    const baseBortleScale = await getBaseBortleScale(latitude, longitude, locationName);
    
    if (baseBortleScale === null) {
      return null;
    }
    
    // Determine terrain type for more accurate corrections
    const terrainType = await determineTerrainType(latitude, longitude, elevation, locationName);
    
    // Apply terrain corrections
    let correctedScale = applyTerrainCorrections(
      baseBortleScale,
      elevation,
      latitude,
      longitude,
      terrainType,
      locationName
    );
    
    // Advanced feature: Consider urban development within viewing range
    correctedScale = await adjustForUrbanProximity(correctedScale, latitude, longitude, elevation);
    
    // Cache the result with terrain information
    terrainCorrectionCache.set(cacheKey, {
      bortleScale: correctedScale,
      confidence: 'medium',
      timestamp: Date.now(),
      elevation,
      terrain: terrainType
    });
    
    console.log(`Terrain-corrected Bortle scale: ${correctedScale} (base: ${baseBortleScale}, elevation: ${elevation}m, terrain: ${terrainType})`);
    return correctedScale;
  } catch (error) {
    console.error("Error in terrain correction:", error);
    return null;
  }
}

/**
 * Determine terrain type based on elevation and location data
 */
async function determineTerrainType(
  latitude: number,
  longitude: number,
  elevation: number,
  locationName?: string
): Promise<string> {
  // Check if location name contains terrain indicators
  if (locationName) {
    const lowerName = locationName.toLowerCase();
    if (/mountain|mount|peak|ridge|alps|highland/i.test(lowerName)) {
      return 'mountain';
    } else if (/desert|dune|sand|arid/i.test(lowerName)) {
      return 'desert';
    } else if (/forest|wood|jungle|rainforest/i.test(lowerName)) {
      return 'forest';
    } else if (/coast|beach|shore|ocean|sea/i.test(lowerName)) {
      return 'coastal';
    } else if (/city|urban|downtown|metro/i.test(lowerName)) {
      return 'urban';
    } else if (/plain|grassland|prairie|steppe/i.test(lowerName)) {
      return 'plains';
    }
  }
  
  // If name doesn't give enough information, use elevation and location data
  if (elevation > ELEVATION_THRESHOLD) {
    return 'mountain';
  }
  
  // Use the location classifier as fallback
  try {
    const { estimateTerrainType } = await import('./locationClassifier');
    return estimateTerrainType(latitude, longitude);
  } catch (error) {
    console.warn("Could not use location classifier:", error);
    return elevation > 400 ? 'highland' : 'lowland';
  }
}

/**
 * Get base Bortle scale for location
 * This serves as the starting point before terrain corrections
 */
async function getBaseBortleScale(
  latitude: number, 
  longitude: number,
  locationName?: string
): Promise<number | null> {
  try {
    // Try to get light pollution data from API
    const { fetchLightPollutionData } = await import('@/lib/api');
    const lightPollutionData = await fetchLightPollutionData(latitude, longitude);
    
    if (lightPollutionData?.bortleScale !== undefined && 
        lightPollutionData.bortleScale >= 1 && 
        lightPollutionData.bortleScale <= 9) {
      return lightPollutionData.bortleScale;
    }
    
    // Fall back to estimation based on location name if API fails
    if (locationName) {
      const { estimateBortleScaleByLocation } = await import('@/utils/locationUtils');
      return estimateBortleScaleByLocation(locationName, latitude, longitude);
    }
  } catch (error) {
    console.error("Error getting base Bortle scale:", error);
  }
  
  return null;
}

/**
 * Apply terrain-based corrections to Bortle scale
 * This improves accuracy by considering topographical features
 */
function applyTerrainCorrections(
  baseBortleScale: number,
  elevation: number,
  latitude: number,
  longitude: number,
  terrainType: string,
  locationName?: string
): number {
  // Start with base Bortle scale
  let correctedScale = baseBortleScale;
  
  // Higher elevations have clearer skies due to less atmospheric interference
  // Elevation adjustment: Each 500m reduces Bortle
  const elevationAdjustment = -Math.min(1.2, (elevation / 500) * ELEVATION_FACTOR);
  correctedScale += elevationAdjustment;
  
  // Apply terrain-specific corrections
  switch(terrainType) {
    case 'mountain':
      // Mountains provide more shielding from light pollution
      if (baseBortleScale > 3) {
        // More effective shielding in more polluted areas
        const mountainShieldingEffect = -MOUNTAIN_CORRECTION * (baseBortleScale / 9);
        correctedScale += mountainShieldingEffect;
      }
      break;
      
    case 'desert':
      // Deserts often have clear air but can be affected by dust
      // Clearer skies but offset slightly by particulate matter
      correctedScale -= 0.3;
      break;
      
    case 'forest':
      // Forests provide some shielding from distant light sources
      if (baseBortleScale > 4) {
        correctedScale -= 0.4;
      }
      break;
      
    case 'coastal':
      // Coastal areas can have clearer air due to sea breezes
      // But often have more development
      if (baseBortleScale < 5) {
        // Only improve if not heavily developed coast
        correctedScale -= 0.2;
      }
      break;
      
    case 'urban':
      // Ensure urban areas don't get incorrectly adjusted to be darker
      if (correctedScale < baseBortleScale) {
        correctedScale = baseBortleScale;
      }
      break;
      
    case 'plains':
      // Plains have unobstructed sky views but often lack shielding
      // No specific adjustment needed
      break;
  }
  
  // National parks & reserves often have dark sky protection policies
  const isProtectedArea = locationName ? 
    /national park|reserve|wilderness|conservation|forest|natural|protected/i.test(locationName) : 
    false;
  
  if (isProtectedArea) {
    // Protected areas typically have at least one Bortle scale unit improvement
    // but the effect is smaller in already dark locations
    const protectionEffect = -Math.min(1.2, Math.max(0.4, baseBortleScale / 8));
    correctedScale += protectionEffect;
  }
  
  // Ensure corrected scale stays within valid range
  correctedScale = Math.max(1, Math.min(9, correctedScale));
  
  // Round to nearest 0.1 for precision
  return Math.round(correctedScale * 10) / 10;
}

/**
 * Adjust Bortle scale based on proximity to urban areas
 */
async function adjustForUrbanProximity(
  correctedScale: number,
  latitude: number,
  longitude: number,
  elevation: number
): Promise<number> {
  try {
    // Get distances to nearest cities (would be implemented with real data)
    const nearbyUrbanCenters = await getNearbyUrbanCenters(latitude, longitude);
    
    if (nearbyUrbanCenters.length === 0) {
      return correctedScale;
    }
    
    let finalScale = correctedScale;
    
    // Consider each urban center's impact
    for (const city of nearbyUrbanCenters) {
      // Calculate how much city light affects this location
      // Higher elevations see city lights from farther away
      const elevationFactor = 1 + (elevation / 2000); // Increase viewing distance with elevation
      const visibilityRadius = TYPICAL_CITY_LIGHT_RADIUS * elevationFactor;
      
      // If city is within visibility radius, it affects the Bortle scale
      if (city.distance < visibilityRadius) {
        // Calculate impact based on city size and distance
        const impact = (city.population / 1000000) * (1 - (city.distance / visibilityRadius));
        
        // Light domes from cities increase Bortle scale (worsen light pollution)
        const cityImpact = Math.min(1.5, Math.max(0.1, impact));
        
        // If there's terrain shielding, reduce the impact
        const shieldingFactor = city.shielded ? 0.3 : 1;
        
        finalScale += cityImpact * shieldingFactor;
      }
    }
    
    // Ensure scale remains in valid range and maintain precision
    return Math.round(Math.max(1, Math.min(9, finalScale)) * 10) / 10;
  } catch (error) {
    console.warn("Could not adjust for urban proximity:", error);
    return correctedScale;
  }
}

/**
 * Get nearby urban centers that might affect light pollution
 * This is a simplified implementation - would use a real database in production
 */
async function getNearbyUrbanCenters(latitude: number, longitude: number): Promise<Array<{
  name: string;
  distance: number; // km
  population: number;
  shielded: boolean; // whether there's terrain shielding
}>> {
  // Simple simulation function - this would be replaced by a real database lookup
  // Just returning a simple estimate based on latitude bands
  // In a real implementation, this would query city databases
  
  // Major cities concentrate in certain latitude bands
  const urbanizationFactor = Math.abs(latitude) >= 20 && Math.abs(latitude) <= 60 ? 0.8 : 0.2;
  
  // Simplified simulation of nearby cities
  const hasMajorCity = Math.random() < urbanizationFactor;
  const hasMediumCity = Math.random() < urbanizationFactor * 1.5;
  const hasSmallTown = Math.random() < 0.9;
  
  const cities = [];
  
  if (hasMajorCity) {
    // Major city within 50-150km
    cities.push({
      name: "Major City",
      distance: 50 + Math.random() * 100,
      population: 1000000 + Math.random() * 9000000,
      shielded: Math.random() > 0.7 // 30% chance of terrain shielding
    });
  }
  
  if (hasMediumCity) {
    // Medium city within 20-70km
    cities.push({
      name: "Medium City",
      distance: 20 + Math.random() * 50,
      population: 100000 + Math.random() * 900000,
      shielded: Math.random() > 0.6 // 40% chance of terrain shielding
    });
  }
  
  if (hasSmallTown) {
    // Small town within 5-30km
    cities.push({
      name: "Small Town",
      distance: 5 + Math.random() * 25,
      population: 5000 + Math.random() * 95000,
      shielded: Math.random() > 0.5 // 50% chance of terrain shielding
    });
  }
  
  return cities;
}

/**
 * Get elevation data for a location
 * Returns elevation in meters or null if not available
 */
async function getElevationData(latitude: number, longitude: number): Promise<number | null> {
  try {
    // Check if we have stored elevation data
    const elevationCacheKey = `elevation-${latitude.toFixed(2)}-${longitude.toFixed(2)}`;
    const cachedElevation = localStorage.getItem(elevationCacheKey);
    
    if (cachedElevation) {
      return parseFloat(cachedElevation);
    }
    
    // For demo purposes - use a simple elevation model based on location
    // This would be replaced by a proper elevation API
    
    // Simple elevation model:
    // - Higher latitude = more variance (mountains)
    // - Higher longitude = more chance of highlands
    const latFactor = Math.abs(latitude) / 90; // 0-1
    const lonFactor = (longitude + 180) / 360; // 0-1
    
    // Generate semi-realistic elevation
    let elevation;
    
    // Mountain regions have more elevation variation
    const isMountainRegion = 
      (Math.abs(latitude) > 35 && Math.abs(latitude) < 55) || // Alps, Rockies latitude bands
      (Math.abs(latitude) > 25 && Math.abs(latitude) < 35 && Math.abs(longitude) > 65 && Math.abs(longitude) < 95); // Himalayas
    
    if (isMountainRegion) {
      // Higher elevation in mountain regions
      elevation = Math.random() * 2500 + 500;
    } else {
      // More moderate elevation elsewhere
      elevation = Math.random() * 800;
    }
    
    // Add some randomness
    elevation *= (0.5 + Math.random());
    
    // Round to nearest 10m for realism
    elevation = Math.round(elevation / 10) * 10;
    
    // Cache the result
    localStorage.setItem(elevationCacheKey, elevation.toString());
    
    return elevation;
  } catch (error) {
    console.error("Error getting elevation data:", error);
    return null;
  }
}

/**
 * Clear terrain correction cache
 */
export function clearTerrainCorrectionCache(): void {
  terrainCorrectionCache.clear();
  console.log("Terrain correction cache cleared");
}
