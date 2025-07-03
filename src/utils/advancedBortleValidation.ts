
/**
 * Advanced Bortle scale validation and correction utilities
 * Provides cross-validation and confidence scoring for measurements
 */

interface BortleValidationResult {
  validatedScale: number;
  confidence: 'high' | 'medium' | 'low';
  sources: string[];
  adjustments: string[];
}

/**
 * Validate and improve Bortle scale measurements using multiple sources
 */
export async function validateBortleScale(
  latitude: number,
  longitude: number,
  locationName: string,
  initialMeasurement?: number
): Promise<BortleValidationResult> {
  const sources: string[] = [];
  const adjustments: string[] = [];
  const measurements: number[] = [];
  
  try {
    // Get measurements from different sources
    
    // 1. Star count analysis
    try {
      const { getStarCountBortleScale } = await import('@/utils/starAnalysis');
      const starBortle = await getStarCountBortleScale(latitude, longitude);
      if (starBortle !== null) {
        measurements.push(starBortle);
        sources.push('star_count');
      }
    } catch (error) {
      console.warn("Star count validation unavailable:", error);
    }
    
    // 2. Terrain-corrected measurement
    try {
      const { getTerrainCorrectedBortleScale } = await import('@/utils/terrainCorrection');
      const terrainBortle = await getTerrainCorrectedBortleScale(latitude, longitude, locationName);
      if (terrainBortle !== null) {
        measurements.push(terrainBortle);
        sources.push('terrain_corrected');
      }
    } catch (error) {
      console.warn("Terrain correction validation unavailable:", error);
    }
    
    // 3. API measurement
    try {
      const { fetchLightPollutionData } = await import('@/lib/api');
      const apiData = await fetchLightPollutionData(latitude, longitude);
      if (apiData?.bortleScale && apiData.bortleScale >= 1 && apiData.bortleScale <= 9) {
        measurements.push(apiData.bortleScale);
        sources.push('api');
      }
    } catch (error) {
      console.warn("API validation unavailable:", error);
    }
    
    // 4. Historical measurements from local storage
    try {
      const historicalMeasurement = getHistoricalMeasurement(latitude, longitude);
      if (historicalMeasurement !== null) {
        measurements.push(historicalMeasurement);
        sources.push('historical');
      }
    } catch (error) {
      console.warn("Historical validation unavailable:", error);
    }
    
    // 5. Include initial measurement if provided
    if (initialMeasurement && initialMeasurement >= 1 && initialMeasurement <= 9) {
      measurements.push(initialMeasurement);
      sources.push('initial');
    }
    
    // Calculate validated result
    if (measurements.length === 0) {
      // No measurements available, return default
      return {
        validatedScale: 5,
        confidence: 'low',
        sources: [],
        adjustments: ['No reliable measurements available, using default value']
      };
    }
    
    // Apply validation algorithm
    const validationResult = calculateValidatedScale(measurements, sources, adjustments);
    
    // Apply final adjustments based on location characteristics
    const finalResult = applyLocationAdjustments(
      validationResult.validatedScale,
      latitude,
      longitude,
      locationName,
      adjustments
    );
    
    return {
      validatedScale: Number(finalResult.toFixed(1)),
      confidence: determineConfidence(measurements, sources),
      sources,
      adjustments
    };
    
  } catch (error) {
    console.error("Error in Bortle scale validation:", error);
    return {
      validatedScale: initialMeasurement || 5,
      confidence: 'low',
      sources: ['fallback'],
      adjustments: ['Validation failed, using fallback value']
    };
  }
}

/**
 * Calculate validated scale from multiple measurements
 */
function calculateValidatedScale(
  measurements: number[],
  sources: string[],
  adjustments: string[]
): { validatedScale: number } {
  if (measurements.length === 1) {
    return { validatedScale: measurements[0] };
  }
  
  // Weight different sources
  const weights = measurements.map((_, index) => {
    const source = sources[index];
    switch (source) {
      case 'star_count': return 3.0; // Highest weight - direct measurement
      case 'terrain_corrected': return 2.5; // High weight - sophisticated algorithm
      case 'api': return 2.0; // Medium-high weight - external validation
      case 'historical': return 1.5; // Medium weight - past data
      case 'initial': return 1.0; // Lower weight - unvalidated
      default: return 1.0;
    }
  });
  
  // Calculate weighted average
  const weightedSum = measurements.reduce((sum, measurement, index) => {
    return sum + (measurement * weights[index]);
  }, 0);
  
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  const weightedAverage = weightedSum / totalWeight;
  
  // Detect and handle outliers
  const outlierThreshold = 1.5;
  const filteredMeasurements = measurements.filter(measurement => 
    Math.abs(measurement - weightedAverage) <= outlierThreshold
  );
  
  if (filteredMeasurements.length < measurements.length) {
    adjustments.push(`Removed ${measurements.length - filteredMeasurements.length} outlier measurements`);
  }
  
  // Recalculate if outliers were removed
  if (filteredMeasurements.length > 0 && filteredMeasurements.length < measurements.length) {
    const filteredSum = filteredMeasurements.reduce((sum, val) => sum + val, 0);
    return { validatedScale: filteredSum / filteredMeasurements.length };
  }
  
  return { validatedScale: weightedAverage };
}

/**
 * Apply location-specific adjustments
 */
function applyLocationAdjustments(
  bortleScale: number,
  latitude: number,
  longitude: number,
  locationName: string,
  adjustments: string[]
): number {
  let adjustedScale = bortleScale;
  
  // Time zone and seasonal adjustments
  const currentDate = new Date();
  const month = currentDate.getMonth() + 1;
  
  // Summer months tend to have more haze and humidity
  if (month >= 6 && month <= 8 && latitude > 20 && latitude < 60) {
    adjustedScale += 0.2;
    adjustments.push('Summer haze adjustment (+0.2)');
  }
  
  // Winter months can have clearer air in some regions
  if ((month <= 2 || month >= 11) && latitude > 30) {
    adjustedScale -= 0.1;
    adjustments.push('Winter clarity adjustment (-0.1)');
  }
  
  // High latitude adjustments (Aurora zones)
  if (Math.abs(latitude) > 60) {
    adjustedScale -= 0.3; // Generally darker skies but potential aurora
    adjustments.push('High latitude adjustment (-0.3)');
  }
  
  // Desert region adjustments (typically clearer)
  if (isInDesertRegion(latitude, longitude)) {
    adjustedScale -= 0.4;
    adjustments.push('Desert region adjustment (-0.4)');
  }
  
  // Island adjustments (cleaner air)
  if (isIslandLocation(latitude, longitude)) {
    adjustedScale -= 0.2;
    adjustments.push('Island location adjustment (-0.2)');
  }
  
  // Ensure final result is within valid range
  return Math.max(1, Math.min(9, adjustedScale));
}

/**
 * Determine confidence level based on available data
 */
function determineConfidence(measurements: number[], sources: string[]): 'high' | 'medium' | 'low' {
  if (measurements.length >= 3 && sources.includes('star_count')) {
    return 'high';
  } else if (measurements.length >= 2) {
    return 'medium';
  } else {
    return 'low';
  }
}

/**
 * Get historical measurement for location
 */
function getHistoricalMeasurement(latitude: number, longitude: number): number | null {
  try {
    const measurements = JSON.parse(localStorage.getItem('bortleMeasurements') || '[]');
    
    // Find measurements within 10km of the location
    const nearbyMeasurements = measurements.filter((m: any) => {
      const distance = calculateDistance(latitude, longitude, m.latitude, m.longitude);
      return distance < 10; // Within 10km
    });
    
    if (nearbyMeasurements.length === 0) return null;
    
    // Get the most recent measurement
    const sortedMeasurements = nearbyMeasurements.sort((a: any, b: any) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    
    return sortedMeasurements[0].bortleScale;
  } catch (error) {
    return null;
  }
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
 * Check if location is in desert region
 */
function isInDesertRegion(latitude: number, longitude: number): boolean {
  return (
    // Sahara
    (latitude > 15 && latitude < 35 && longitude > -15 && longitude < 35) ||
    // Arabian Desert
    (latitude > 15 && latitude < 35 && longitude > 35 && longitude < 60) ||
    // Atacama
    (latitude > -30 && latitude < -15 && longitude > -75 && longitude < -65) ||
    // Australian Outback
    (latitude > -35 && latitude < -15 && longitude > 110 && longitude < 155) ||
    // Southwestern US
    (latitude > 30 && latitude < 40 && longitude > -120 && longitude < -105)
  );
}

/**
 * Check if location is on an island
 */
function isIslandLocation(latitude: number, longitude: number): boolean {
  return (
    // Hawaiian Islands
    (latitude > 18 && latitude < 23 && longitude > -162 && longitude < -154) ||
    // Canary Islands
    (latitude > 27 && latitude < 30 && longitude > -19 && longitude < -13) ||
    // New Zealand
    (latitude > -48 && latitude < -34 && longitude > 165 && longitude < 179) ||
    // Japanese Islands
    (latitude > 30 && latitude < 46 && longitude > 129 && longitude < 146) ||
    // British Isles
    (latitude > 49 && latitude < 61 && longitude > -11 && longitude < 2)
  );
}
