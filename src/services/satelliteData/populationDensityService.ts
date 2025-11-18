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
    
    // CRITICAL FIX: Check if we're truly in a remote dark sky area
    // If the strongest city influence is weak, use remote area analysis instead
    const strongestInfluence = cityInfluences[0];
    const isRemoteArea = strongestInfluence.contribution < 0.15 || // Less than 15% influence
                         strongestInfluence.distance > 100; // More than 100km from nearest city
    
    if (isRemoteArea) {
      console.log(`\n⚠ Remote area detected - switching to geographic analysis`);
      console.log(`  Nearest city: ${strongestInfluence.city.name} at ${strongestInfluence.distance.toFixed(1)}km`);
      console.log(`  City influence: ${(strongestInfluence.contribution * 100).toFixed(1)}%`);
      
      // Use remote area analysis instead of city-based calculation
      const remoteResult = getRemoteAreaBortle(latitude, longitude);
      
      // Blend with weak city influence if any
      let blendedBortle = remoteResult.bortleScale;
      if (strongestInfluence.contribution > 0.05) {
        const cityWeight = strongestInfluence.contribution * 2; // Amplify weak city influence slightly
        const remoteWeight = 1 - cityWeight;
        blendedBortle = (strongestInfluence.bortle * cityWeight + remoteResult.bortleScale * remoteWeight);
        console.log(`  Blending: ${remoteResult.bortleScale.toFixed(1)} (remote) + ${strongestInfluence.bortle.toFixed(1)} (city) = ${blendedBortle.toFixed(1)}`);
      }
      
      console.log(`\n✓ Final Bortle: ${blendedBortle.toFixed(2)} (Remote/Dark Sky Area)`);
      console.log(`==========================================\n`);
      
      return {
        bortleScale: Math.round(blendedBortle * 10) / 10,
        confidence: Math.max(remoteResult.confidence, strongestInfluence.confidence * 0.8),
        source: 'remote_dark_sky_analysis',
        timestamp: Date.now(),
        metadata: {
          ...remoteResult.metadata,
          nearestCity: strongestInfluence.city.name,
          distanceToNearestCity: strongestInfluence.distance,
          cityInfluence: strongestInfluence.contribution,
          analysisType: 'remote_area',
          totalCitiesInDatabase: CITY_LIGHT_DATABASE.length
        }
      };
    }
    
    // Use multi-city interference model for urban/suburban areas
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
 * Enhanced estimation for truly remote/dark sky areas
 * Uses geographic patterns and terrain analysis
 */
export function getRemoteAreaBortle(
  latitude: number,
  longitude: number,
  locationName?: string
): BortleDataSource {
  console.log(`Analyzing remote area at ${latitude.toFixed(4)}°, ${longitude.toFixed(4)}°`);
  
  // === DARK SKY REGIONS ===
  
  // Tibetan Plateau & Himalayas (世界屋脊 - Roof of the World)
  const isTibetanPlateau = 
    latitude >= 27.5 && latitude <= 36.5 && 
    longitude >= 78.0 && longitude <= 102.0;
  
  // Xinjiang & Taklamakan Desert (新疆塔克拉玛干)
  const isXinjiangDesert = 
    latitude >= 36.0 && latitude <= 43.0 && 
    longitude >= 76.0 && longitude <= 90.0;
  
  // Inner Mongolia Grasslands (内蒙古草原)
  const isInnerMongoliaGrassland = 
    latitude >= 40.0 && latitude <= 50.0 && 
    longitude >= 106.0 && longitude <= 122.0;
  
  // Qinghai Lake Region (青海湖)
  const isQinghaiRegion = 
    latitude >= 35.0 && latitude <= 38.5 && 
    longitude >= 97.0 && longitude <= 101.5;
  
  // Greater Khingan Range (大兴安岭)
  const isGreaterKhingan = 
    latitude >= 50.0 && latitude <= 53.5 && 
    longitude >= 121.0 && longitude <= 127.0;
  
  // Gobi Desert (戈壁沙漠)
  const isGobiDesert = 
    latitude >= 42.0 && latitude <= 46.0 && 
    longitude >= 100.0 && longitude <= 110.0;
  
  // Altai Mountains (阿尔泰山)
  const isAltai = 
    latitude >= 46.0 && latitude <= 49.5 && 
    longitude >= 85.0 && longitude <= 91.0;
  
  // === GLOBAL DARK SKY REGIONS ===
  
  // Atacama Desert (Chile) - One of darkest places on Earth
  const isAtacama = 
    latitude >= -27.0 && latitude <= -22.0 && 
    longitude >= -70.5 && longitude <= -68.0;
  
  // Sahara Desert
  const isSahara = 
    latitude >= 15.0 && latitude <= 35.0 && 
    longitude >= -10.0 && longitude <= 35.0;
  
  // Australian Outback
  const isAustralianOutback = 
    latitude >= -30.0 && latitude <= -20.0 && 
    longitude >= 125.0 && longitude <= 145.0;
  
  // Canadian/Alaskan Wilderness
  const isCanadianWilderness = 
    latitude >= 55.0 && latitude <= 70.0 && 
    longitude >= -140.0 && longitude <= -95.0;
  
  // Polar regions (Arctic/Antarctic)
  const isPolar = Math.abs(latitude) >= 66.5; // Arctic/Antarctic circles
  
  // Siberian Wilderness
  const isSiberia = 
    latitude >= 60.0 && latitude <= 75.0 && 
    longitude >= 80.0 && longitude <= 150.0;
  
  // === BORTLE CLASSIFICATION ===
  
  let baseBortle: number;
  let confidence: number;
  let region: string;
  
  // Class 1: World's Darkest Skies (Bortle 1.0-1.5)
  if (isAtacama) {
    baseBortle = 1.2;
    confidence = 0.85;
    region = "Atacama Desert";
  } else if (isPolar) {
    baseBortle = 1.3;
    confidence = 0.80;
    region = "Polar Region";
  } else if (isGreaterKhingan) {
    baseBortle = 1.5;
    confidence = 0.78;
    region = "Greater Khingan Mountains";
  } else if (isAltai) {
    baseBortle = 1.6;
    confidence = 0.75;
    region = "Altai Mountains";
  }
  
  // Class 2: Excellent Dark Sites (Bortle 1.8-2.3)
  else if (isXinjiangDesert) {
    baseBortle = 1.8;
    confidence = 0.75;
    region = "Xinjiang Desert";
  } else if (isQinghaiRegion) {
    baseBortle = 2.0;
    confidence = 0.73;
    region = "Qinghai Plateau";
  } else if (isTibetanPlateau) {
    baseBortle = 2.2;
    confidence = 0.72;
    region = "Tibetan Plateau";
  } else if (isSiberia) {
    baseBortle = 1.9;
    confidence = 0.70;
    region = "Siberian Wilderness";
  } else if (isGobiDesert) {
    baseBortle = 2.1;
    confidence = 0.68;
    region = "Gobi Desert";
  }
  
  // Class 3: Typical Dark Sites (Bortle 2.5-3.0)
  else if (isInnerMongoliaGrassland) {
    baseBortle = 2.5;
    confidence = 0.68;
    region = "Inner Mongolia Grasslands";
  } else if (isSahara) {
    baseBortle = 2.3;
    confidence = 0.65;
    region = "Sahara Desert";
  } else if (isAustralianOutback) {
    baseBortle = 2.4;
    confidence = 0.67;
    region = "Australian Outback";
  } else if (isCanadianWilderness) {
    baseBortle = 2.6;
    confidence = 0.66;
    region = "Canadian Wilderness";
  }
  
  // Class 4: Rural Sky (Bortle 3.2-3.8)
  else {
    baseBortle = 3.5;
    confidence = 0.55;
    region = "General Rural Area";
  }
  
  // === KEYWORD ADJUSTMENTS ===
  if (locationName) {
    const lowerName = locationName.toLowerCase();
    
    // Observatory or mountain peak = premium dark sky
    if (lowerName.includes('observatory') || lowerName.includes('观测') || 
        lowerName.includes('peak') || lowerName.includes('summit') || lowerName.includes('山峰')) {
      baseBortle = Math.max(1.0, baseBortle - 0.8);
      confidence = Math.min(0.90, confidence + 0.10);
      console.log(`  ✓ Observatory/Peak detected: -0.8 Bortle`);
    }
    
    // Dark Sky Reserve or Park
    if (lowerName.includes('dark sky') || lowerName.includes('reserve') || 
        lowerName.includes('暗夜公园') || lowerName.includes('保护区')) {
      baseBortle = Math.max(1.0, baseBortle - 0.6);
      confidence = Math.min(0.88, confidence + 0.08);
      console.log(`  ✓ Dark Sky Reserve detected: -0.6 Bortle`);
    }
    
    // Desert
    if (lowerName.includes('desert') || lowerName.includes('沙漠') || lowerName.includes('戈壁')) {
      baseBortle = Math.max(1.5, baseBortle - 0.4);
      confidence = Math.min(0.85, confidence + 0.05);
      console.log(`  ✓ Desert detected: -0.4 Bortle`);
    }
    
    // Mountain or plateau
    if (lowerName.includes('mountain') || lowerName.includes('plateau') || 
        lowerName.includes('高原') || lowerName.includes('山区')) {
      baseBortle = Math.max(1.8, baseBortle - 0.3);
      confidence = Math.min(0.82, confidence + 0.04);
      console.log(`  ✓ Mountain/Plateau detected: -0.3 Bortle`);
    }
    
    // National park or nature reserve
    if (lowerName.includes('national park') || lowerName.includes('nature') || 
        lowerName.includes('wilderness') || lowerName.includes('自然保护') || lowerName.includes('国家公园')) {
      baseBortle = Math.max(2.0, baseBortle - 0.3);
      confidence = Math.min(0.80, confidence + 0.03);
      console.log(`  ✓ Nature Reserve detected: -0.3 Bortle`);
    }
  }
  
  console.log(`Remote area classification: ${region}, Bortle ${baseBortle.toFixed(1)} (${(confidence * 100).toFixed(0)}% confidence)`);
  
  return {
    bortleScale: Math.round(baseBortle * 10) / 10,
    confidence,
    source: 'enhanced_remote_analysis',
    timestamp: Date.now(),
    metadata: {
      region,
      classificationType: baseBortle <= 1.5 ? 'world_class_dark' : 
                         baseBortle <= 2.3 ? 'excellent_dark' :
                         baseBortle <= 3.0 ? 'typical_dark' : 'rural'
    }
  };
}
