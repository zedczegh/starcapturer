/**
 * Population Density-Based Bortle Scale Estimation
 * Uses the Advanced Light Pollution Model (proprietary algorithm)
 * Based on research correlating population density with light pollution
 */

import { BortleDataSource } from "@/utils/bortleCalculation/dataFusion";
import {
  CITY_LIGHT_DATABASE,
  CityLightProfile,
  calculateDistance,
  calculateAdvancedLightPollution,
  calculateMultiCityInterference
} from "./advancedLightPollutionModel";

// Remove old population centers and calculation functions - replaced by advanced model

/**
 * Get population-density based Bortle scale using advanced algorithm
 */
export async function getPopulationBasedBortle(
  latitude: number,
  longitude: number,
  elevation: number = 0
): Promise<BortleDataSource | null> {
  try {
    console.log(`\n=== Advanced Light Pollution Analysis ===`);
    console.log(`Location: ${latitude.toFixed(4)}°N, ${longitude.toFixed(4)}°E`);
    console.log(`Elevation: ${elevation}m`);
    
    // Find all cities within influence range
    const cityInfluences: Array<{
      city: CityLightProfile;
      distance: number;
      bortle: number;
      confidence: number;
      contribution: number;
    }> = [];
    
    for (const city of CITY_LIGHT_DATABASE) {
      const distance = calculateDistance(latitude, longitude, city.lat, city.lon);
      
      // Only consider cities within their influence range
      if (distance <= city.radiusInfluence) {
        const result = calculateAdvancedLightPollution(
          latitude,
          longitude,
          elevation,
          city
        );
        
        if (result.contribution > 0.05) { // Minimum 5% contribution
          cityInfluences.push({
            city,
            distance,
            bortle: result.bortle,
            confidence: result.confidence,
            contribution: result.contribution
          });
        }
      }
    }
    
    // If no nearby cities found, return null
    if (cityInfluences.length === 0) {
      console.log(`No cities within influence range.`);
      return null;
    }
    
    // Sort by contribution (strongest first)
    cityInfluences.sort((a, b) => b.contribution - a.contribution);
    
    console.log(`\nInfluencing Cities (${cityInfluences.length}):`);
    cityInfluences.slice(0, 5).forEach((inf, i) => {
      console.log(`${i + 1}. ${inf.city.name}: ${inf.distance.toFixed(1)}km, ` +
                  `Bortle ${inf.bortle.toFixed(2)}, ` +
                  `Contribution ${(inf.contribution * 100).toFixed(1)}%`);
    });
    
    // Use multi-city interference model
    const contributions = cityInfluences.map(inf => ({
      bortle: inf.bortle,
      weight: inf.contribution
    }));
    
    const finalBortle = calculateMultiCityInterference(contributions);
    
    // Calculate final confidence as weighted average
    let totalWeight = 0;
    let weightedConfidence = 0;
    for (const inf of cityInfluences) {
      weightedConfidence += inf.confidence * inf.contribution;
      totalWeight += inf.contribution;
    }
    const finalConfidence = weightedConfidence / totalWeight;
    
    console.log(`\n✓ Final Bortle: ${finalBortle.toFixed(2)} (Confidence: ${(finalConfidence * 100).toFixed(0)}%)`);
    console.log(`Primary influence: ${cityInfluences[0].city.name} (${cityInfluences[0].city.nameZh || 'N/A'})`);
    console.log(`==========================================\n`);
    
    return {
      bortleScale: Math.round(finalBortle * 10) / 10,
      confidence: finalConfidence,
      source: 'advanced_population_model',
      timestamp: Date.now(),
      metadata: {
        primaryCity: cityInfluences[0].city.name,
        primaryCityZh: cityInfluences[0].city.nameZh,
        distance: cityInfluences[0].distance,
        citiesAnalyzed: cityInfluences.length,
        totalCitiesInDatabase: CITY_LIGHT_DATABASE.length,
        elevation: elevation,
        modelVersion: '2.0'
      }
    };
  } catch (error) {
    console.error('Advanced population-based Bortle calculation failed:', error);
    return null;
  }
}

/**
 * Enhanced estimation for remote areas
 * Uses geographic patterns and terrain analysis
 */
export function getRemoteAreaBortle(
  latitude: number,
  longitude: number,
  locationName?: string
): BortleDataSource {
  // High-altitude remote areas (Tibet, Andes, etc.)
  const isHighAltitude = 
    (latitude >= 27 && latitude <= 36 && longitude >= 78 && longitude <= 99) || // Tibet
    (latitude >= -30 && latitude <= -10 && longitude >= -75 && longitude <= -65); // Andes
  
  // Polar regions
  const isPolar = Math.abs(latitude) >= 60;
  
  // Desert regions
  const isDesert = 
    (latitude >= 15 && latitude <= 35 && longitude >= -10 && longitude <= 60) || // Sahara/Arabian
    (latitude >= -30 && latitude <= -20 && longitude >= 110 && longitude <= 140) || // Australian
    (latitude >= 35 && latitude <= 50 && longitude >= 75 && longitude <= 95); // Central Asian
  
  let baseBortle = 4.0; // Default rural
  let confidence = 0.60;
  
  if (isHighAltitude) {
    baseBortle = 2.5;
    confidence = 0.70;
  } else if (isPolar) {
    baseBortle = 1.5;
    confidence = 0.75;
  } else if (isDesert) {
    baseBortle = 2.0;
    confidence = 0.65;
  }
  
  // Check location name for keywords
  if (locationName) {
    const lowerName = locationName.toLowerCase();
    if (lowerName.includes('mountain') || lowerName.includes('peak') || lowerName.includes('观测')) {
      baseBortle = Math.max(1.5, baseBortle - 1.0);
      confidence += 0.05;
    }
    if (lowerName.includes('desert') || lowerName.includes('沙漠')) {
      baseBortle = Math.max(2.0, baseBortle - 0.5);
      confidence += 0.05;
    }
  }
  
  return {
    bortleScale: baseBortle,
    confidence,
    source: 'remote_area_estimation',
    timestamp: Date.now(),
    metadata: {
      isHighAltitude,
      isPolar,
      isDesert
    }
  };
}
