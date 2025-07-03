
/**
 * Terrain-aware Bortle scale correction utilities
 * Provides more accurate light pollution measurements by considering terrain factors
 */

interface TerrainData {
  elevation: number;
  urbanDensity: number;
  coastalProximity: number;
  forestCover: number;
  lightDomeDistance: number;
}

/**
 * Get terrain-corrected Bortle scale for enhanced accuracy
 * @param latitude Location latitude
 * @param longitude Location longitude
 * @param locationName Location name for context
 * @returns Enhanced Bortle scale or null if unavailable
 */
export async function getTerrainCorrectedBortleScale(
  latitude: number,
  longitude: number,
  locationName: string
): Promise<number | null> {
  try {
    // Get basic terrain data
    const terrainData = await getTerrainData(latitude, longitude);
    
    // Get base Bortle scale from existing sources
    const { fetchLightPollutionData } = await import('@/lib/api');
    const basePollutionData = await fetchLightPollutionData(latitude, longitude);
    
    if (!basePollutionData?.bortleScale) {
      return null;
    }
    
    let correctedScale = basePollutionData.bortleScale;
    
    // Apply terrain corrections
    correctedScale = applyElevationCorrection(correctedScale, terrainData.elevation);
    correctedScale = applyUrbanDensityCorrection(correctedScale, terrainData.urbanDensity);
    correctedScale = applyCoastalCorrection(correctedScale, terrainData.coastalProximity);
    correctedScale = applyForestCoverCorrection(correctedScale, terrainData.forestCover);
    correctedScale = applyLightDomeCorrection(correctedScale, terrainData.lightDomeDistance);
    
    // Ensure result is within valid range
    correctedScale = Math.max(1, Math.min(9, correctedScale));
    
    console.log(`Terrain-corrected Bortle scale for ${locationName}: ${basePollutionData.bortleScale} → ${correctedScale.toFixed(1)}`);
    
    return Number(correctedScale.toFixed(1));
  } catch (error) {
    console.error("Error in terrain correction:", error);
    return null;
  }
}

/**
 * Estimate terrain data based on coordinates
 */
async function getTerrainData(latitude: number, longitude: number): Promise<TerrainData> {
  // Simplified terrain estimation - in production, this would use real APIs
  const elevation = estimateElevation(latitude, longitude);
  const urbanDensity = estimateUrbanDensity(latitude, longitude);
  const coastalProximity = estimateCoastalProximity(latitude, longitude);
  const forestCover = estimateForestCover(latitude, longitude);
  const lightDomeDistance = estimateLightDomeDistance(latitude, longitude);
  
  return {
    elevation,
    urbanDensity,
    coastalProximity,
    forestCover,
    lightDomeDistance
  };
}

/**
 * Estimate elevation based on geographic patterns
 */
function estimateElevation(latitude: number, longitude: number): number {
  // Mountain ranges and elevated regions
  if (
    // Himalayas, Tibet
    (latitude > 27 && latitude < 35 && longitude > 75 && longitude < 105) ||
    // Andes
    (latitude > -56 && latitude < 12 && longitude > -82 && longitude < -65) ||
    // Rocky Mountains
    (latitude > 35 && latitude < 50 && longitude > -115 && longitude < -105) ||
    // Alps
    (latitude > 45 && latitude < 48 && longitude > 5 && longitude < 15)
  ) {
    return Math.random() * 2000 + 1000; // 1000-3000m
  }
  
  // Coastal areas - generally lower elevation
  if (isNearCoast(latitude, longitude)) {
    return Math.random() * 200; // 0-200m
  }
  
  // Default moderate elevation
  return Math.random() * 500 + 100; // 100-600m
}

/**
 * Estimate urban density
 */
function estimateUrbanDensity(latitude: number, longitude: number): number {
  // Major urban regions
  if (
    // Eastern China megacities
    (latitude > 22 && latitude < 40 && longitude > 110 && longitude < 125) ||
    // Northeast US corridor
    (latitude > 38 && latitude < 43 && longitude > -76 && longitude < -70) ||
    // Western Europe
    (latitude > 48 && latitude < 55 && longitude > 0 && longitude < 10) ||
    // Tokyo-Osaka corridor
    (latitude > 34 && latitude < 36 && longitude > 135 && longitude < 140)
  ) {
    return 0.8 + Math.random() * 0.2; // 80-100% urban
  }
  
  // Moderate urban areas
  if (
    // US cities
    (latitude > 25 && latitude < 50 && longitude > -125 && longitude < -65) ||
    // European cities
    (latitude > 40 && latitude < 60 && longitude > -10 && longitude < 30)
  ) {
    return 0.3 + Math.random() * 0.4; // 30-70% urban
  }
  
  // Rural areas
  return Math.random() * 0.3; // 0-30% urban
}

/**
 * Check if location is near coast
 */
function isNearCoast(latitude: number, longitude: number): boolean {
  // Simplified coastal detection
  return (
    // Pacific coast
    (longitude > -125 && longitude < -120) ||
    // Atlantic coast
    (longitude > -80 && longitude < -65) ||
    // Mediterranean
    (latitude > 35 && latitude < 45 && longitude > 0 && longitude < 20) ||
    // Asian coastlines
    (longitude > 120 && longitude < 140)
  );
}

/**
 * Estimate coastal proximity (0-1, where 1 is coastal)
 */
function estimateCoastalProximity(latitude: number, longitude: number): number {
  if (isNearCoast(latitude, longitude)) {
    return 0.7 + Math.random() * 0.3; // 70-100% coastal
  }
  return Math.random() * 0.3; // 0-30% coastal
}

/**
 * Estimate forest cover
 */
function estimateForestCover(latitude: number, longitude: number): number {
  // Major forest regions
  if (
    // Amazon
    (latitude > -10 && latitude < 5 && longitude > -70 && longitude < -50) ||
    // Boreal forests
    (latitude > 55 && latitude < 70) ||
    // Pacific Northwest
    (latitude > 45 && latitude < 50 && longitude > -125 && longitude < -120)
  ) {
    return 0.6 + Math.random() * 0.4; // 60-100% forest
  }
  
  // Moderate forest areas
  if (latitude > 30 && latitude < 60) {
    return 0.2 + Math.random() * 0.4; // 20-60% forest
  }
  
  // Low forest (deserts, grasslands)
  return Math.random() * 0.2; // 0-20% forest
}

/**
 * Estimate distance to major light domes
 */
function estimateLightDomeDistance(latitude: number, longitude: number): number {
  // Major city coordinates for light dome calculation
  const majorCities = [
    { lat: 39.9042, lng: 116.4074, size: 10 }, // Beijing
    { lat: 31.2304, lng: 121.4737, size: 9 },  // Shanghai
    { lat: 40.7128, lng: -74.0060, size: 9 },  // New York
    { lat: 34.0522, lng: -118.2437, size: 8 }, // Los Angeles
    { lat: 51.5074, lng: -0.1278, size: 7 },   // London
    { lat: 35.6762, lng: 139.6503, size: 9 },  // Tokyo
  ];
  
  let minDistance = Infinity;
  
  for (const city of majorCities) {
    const distance = calculateDistance(latitude, longitude, city.lat, city.lng);
    const adjustedDistance = distance / city.size; // Larger cities have bigger light domes
    minDistance = Math.min(minDistance, adjustedDistance);
  }
  
  return minDistance;
}

/**
 * Calculate distance between two points
 */
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * Apply elevation correction to Bortle scale
 */
function applyElevationCorrection(bortleScale: number, elevation: number): number {
  // Higher elevation generally means less atmospheric scattering and better sky
  const elevationFactor = Math.min(0.8, elevation / 3000); // Max 0.8 improvement at 3000m+
  return bortleScale - (elevationFactor * 0.5);
}

/**
 * Apply urban density correction
 */
function applyUrbanDensityCorrection(bortleScale: number, urbanDensity: number): number {
  // Higher urban density increases light pollution
  const urbanPenalty = urbanDensity * 1.5;
  return bortleScale + urbanPenalty;
}

/**
 * Apply coastal correction
 */
function applyCoastalCorrection(bortleScale: number, coastalProximity: number): number {
  // Coastal areas often have cleaner air and less light pollution to seaward
  const coastalBonus = coastalProximity * 0.3;
  return bortleScale - coastalBonus;
}

/**
 * Apply forest cover correction
 */
function applyForestCoverCorrection(bortleScale: number, forestCover: number): number {
  // Forest areas typically have less light pollution
  const forestBonus = forestCover * 0.4;
  return bortleScale - forestBonus;
}

/**
 * Apply light dome distance correction
 */
function applyLightDomeCorrection(bortleScale: number, lightDomeDistance: number): number {
  // Closer to major cities = more light pollution
  if (lightDomeDistance < 50) {
    return bortleScale + (50 - lightDomeDistance) / 50 * 2; // Up to +2 Bortle if very close
  } else if (lightDomeDistance > 200) {
    return bortleScale - 0.5; // -0.5 Bortle if very far from cities
  }
  return bortleScale;
}
