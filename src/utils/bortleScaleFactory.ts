
/**
 * Enhanced Bortle scale calculation with multiple data sources
 */

interface BortleResult {
  bortleScale: number;
  confidence: 'high' | 'medium' | 'low' | 'none';
  confidenceSource: string;
}

/**
 * Get enhanced Bortle scale using multiple data sources
 * @param latitude Location latitude
 * @param longitude Location longitude
 * @param locationName Optional location name for better matching
 * @returns Bortle scale result with confidence level
 */
export async function getEnhancedBortleScale(
  latitude: number,
  longitude: number,
  locationName?: string
): Promise<BortleResult> {
  // Default result
  let result: BortleResult = {
    bortleScale: 5,
    confidence: 'none',
    confidenceSource: 'default'
  };
  
  try {
    // Try light pollution API first (highest accuracy)
    try {
      const { fetchLightPollutionData } = await import('@/lib/api/pollution');
      const pollutionData = await fetchLightPollutionData(latitude, longitude);
      
      if (pollutionData?.bortleScale !== null && 
          pollutionData?.bortleScale !== undefined && 
          pollutionData?.bortleScale >= 1 && 
          pollutionData?.bortleScale <= 9) {
        
        return {
          bortleScale: pollutionData.bortleScale,
          confidence: 'high',
          confidenceSource: 'light_pollution_api'
        };
      }
    } catch (error) {
      console.warn("Light pollution API unavailable:", error);
    }
    
    // Try city database lookup
    if (locationName) {
      try {
        const cityScale = await checkCityDatabase(locationName, latitude, longitude);
        
        if (cityScale !== null) {
          return {
            bortleScale: cityScale,
            confidence: 'high',
            confidenceSource: 'city_database'
          };
        }
      } catch (error) {
        console.warn("City database lookup error:", error);
      }
    }
    
    // Try light pollution map data
    try {
      const { getBortleFromLightPollutionMap } = await import('@/utils/lightPollutionMap');
      const mapBortle = await getBortleFromLightPollutionMap(latitude, longitude);
      
      if (mapBortle !== null && mapBortle >= 1 && mapBortle <= 9) {
        return {
          bortleScale: mapBortle,
          confidence: 'medium',
          confidenceSource: 'light_pollution_map'
        };
      }
    } catch (error) {
      console.warn("Light pollution map data unavailable:", error);
    }
    
    // Try terrain and population density estimation
    try {
      const { estimateBortleFromTerrainAndPopulation } = await import('@/utils/terrainEstimation');
      const estimatedBortle = await estimateBortleFromTerrainAndPopulation(latitude, longitude);
      
      if (estimatedBortle !== null) {
        return {
          bortleScale: estimatedBortle,
          confidence: 'medium',
          confidenceSource: 'terrain_and_population'
        };
      }
    } catch (error) {
      console.warn("Terrain estimation unavailable:", error);
    }
    
    // Last resort - estimate from location name
    if (locationName && locationName.length > 2) {
      try {
        const { estimateBortleScaleByLocation } = await import('@/utils/locationUtils');
        const nameBortle = estimateBortleScaleByLocation(locationName, latitude, longitude);
        
        if (nameBortle !== null && nameBortle >= 1 && nameBortle <= 9) {
          return {
            bortleScale: nameBortle,
            confidence: 'low',
            confidenceSource: 'location_name'
          };
        }
      } catch (error) {
        console.warn("Location name estimation error:", error);
      }
    }
    
    // If all else fails, use a reasonable default based on coordinates
    return getDefaultBortle(latitude, longitude);
    
  } catch (error) {
    console.error("Error in enhanced Bortle scale calculation:", error);
    return result;
  }
}

/**
 * Check city database for known Bortle values
 * @param locationName Location name
 * @param latitude Location latitude
 * @param longitude Location longitude
 * @returns Bortle scale value or null
 */
async function checkCityDatabase(
  locationName: string,
  latitude: number,
  longitude: number
): Promise<number | null> {
  // City database lookup implementation
  const lowercaseName = locationName.toLowerCase();
  
  // Common city patterns with known Bortle values
  const cityPatterns: [RegExp, number][] = [
    [/\b(new york|nyc)\b/i, 9],
    [/\btokyo\b/i, 9],
    [/\b(beijing|北京)\b/i, 8.5],
    [/\b(shanghai|上海)\b/i, 8.5],
    [/\b(london|londres)\b/i, 8.5],
    [/\b(los angeles|la)\b/i, 8],
    [/\b(paris|parís)\b/i, 8],
    [/\b(sydney|melbourne)\b/i, 7.5],
    [/\b(chicago|toronto|hong kong)\b/i, 8],
    [/\b(berlin|madrid|rome|amsterdam)\b/i, 7.5],
    [/\b(denver|phoenix|austin)\b/i, 7],
    [/\b(hohhot|呼和浩特)\b/i, 4],
    [/\b(lhasa|拉萨)\b/i, 3]
    // Add more cities as needed
  ];
  
  // Check for city matches
  for (const [pattern, bortleValue] of cityPatterns) {
    if (pattern.test(lowercaseName)) {
      return bortleValue;
    }
  }
  
  // Dark sky site patterns
  const darkSkyPatterns: [RegExp, number][] = [
    [/\b(death valley|cherry springs|natural bridges)\b/i, 1],
    [/\b(big bend|bryce canyon|glacier)\b/i, 2],
    [/\b(dark sky park|dark sky reserve)\b/i, 2],
    [/\b(national park|reserve|wilderness)\b/i, 3]
    // Add more dark sky sites as needed
  ];
  
  // Check for dark sky site matches
  for (const [pattern, bortleValue] of darkSkyPatterns) {
    if (pattern.test(lowercaseName)) {
      return bortleValue;
    }
  }
  
  return null;
}

/**
 * Get default Bortle scale based on coordinates
 * @param latitude Location latitude
 * @param longitude Location longitude
 * @returns Default Bortle result
 */
function getDefaultBortle(latitude: number, longitude: number): BortleResult {
  // Check for remote regions which typically have darker skies
  
  // Very remote locations (deep ocean, Antarctica, etc.)
  if (
    // Antarctica
    (latitude < -60) ||
    // Arctic
    (latitude > 75) ||
    // Remote Pacific
    (latitude > -30 && latitude < 30 && longitude > 170 && longitude < -140) ||
    // Central Australia
    (latitude < -25 && latitude > -30 && longitude > 130 && longitude < 140)
  ) {
    return {
      bortleScale: 1.5,
      confidence: 'low',
      confidenceSource: 'remote_coordinates'
    };
  }
  
  // Moderately remote regions
  if (
    // Sahara/Central Africa
    (latitude > 15 && latitude < 30 && longitude > 15 && longitude < 30) ||
    // Central Asia
    (latitude > 40 && latitude < 50 && longitude > 80 && longitude < 100) ||
    // Northern Canada
    (latitude > 60 && latitude < 70 && longitude > -120 && longitude < -90)
  ) {
    return {
      bortleScale: 2.5,
      confidence: 'low',
      confidenceSource: 'moderate_remote_coordinates'
    };
  }
  
  // Default mid-range value
  return {
    bortleScale: 4.5,
    confidence: 'low',
    confidenceSource: 'default_coordinates'
  };
}
