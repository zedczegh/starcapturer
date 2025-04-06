
import { useCallback } from "react";
import { isInChina } from "@/utils/chinaBortleData";
import { detectTerrainType, getElevationBortleAdjustment } from "@/utils/terrainData"; 
import { getEnhancedBortleScale } from "@/utils/bortleScaleFactory";
import { findNearbyUserBortleMeasurement } from "@/lib/api/pollution";

/**
 * Hook for optimized Bortle scale updates with enhanced accuracy
 */
export function useBortleUpdater() {
  /**
   * Multi-source Bortle scale calculation with sophisticated validation
   * Prioritizes precision data sources and applies machine learning derived adjustments
   */
  const updateBortleScale = useCallback(async (
    latitude: number,
    longitude: number,
    locationName: string,
    existingBortleScale: number | null
  ): Promise<number | null> => {
    try {
      console.log(`Using enhanced terrain-aware algorithm for ${locationName}.`);
      
      // Check if coordinates are valid
      if (!isFinite(latitude) || !isFinite(longitude)) {
        return existingBortleScale;
      }
      
      // Use memory cache for very recent calculations to avoid redundant calls
      const cacheKey = `bortleCache-${latitude.toFixed(4)}-${longitude.toFixed(4)}`;
      const cachedResult = sessionStorage.getItem(cacheKey);
      if (cachedResult) {
        const parsed = JSON.parse(cachedResult);
        if (parsed.timestamp && (Date.now() - parsed.timestamp < 15 * 60 * 1000)) { // 15 min cache
          console.log(`Using cached Bortle scale: ${parsed.bortleScale}`);
          return parsed.bortleScale;
        }
      }
      
      // Check for user-provided measurements first (highest priority)
      const userMeasurement = findNearbyUserBortleMeasurement(latitude, longitude);
      if (userMeasurement) {
        console.log(`Using user-provided Bortle measurement: ${userMeasurement.bortleScale}`);
        
        // Cache result for 15 minutes
        sessionStorage.setItem(cacheKey, JSON.stringify({
          bortleScale: userMeasurement.bortleScale,
          timestamp: Date.now()
        }));
        
        return userMeasurement.bortleScale;
      }
      
      // Check for named city matches with known Bortle data
      if (locationName) {
        const cityResult = await checkKnownCityDatabase(locationName, latitude, longitude);
        if (cityResult) {
          console.log(`Using city database Bortle scale for ${locationName}: ${cityResult}`);
          
          // Cache result
          sessionStorage.setItem(cacheKey, JSON.stringify({
            bortleScale: cityResult,
            timestamp: Date.now()
          }));
          
          return cityResult;
        }
      }
      
      // Get enhanced Bortle scale using all available methods
      const enhancedResult = await getEnhancedBortleScale(latitude, longitude, locationName);
      
      console.log(`Enhanced Bortle scale calculation: ${enhancedResult.bortleScale} (source: ${enhancedResult.confidenceSource})`);
      
      // If we get a valid result, use it
      if (enhancedResult.bortleScale >= 1 && enhancedResult.bortleScale <= 9) {
        // Cache result
        sessionStorage.setItem(cacheKey, JSON.stringify({
          bortleScale: enhancedResult.bortleScale,
          timestamp: Date.now()
        }));
        
        return enhancedResult.bortleScale;
      }
      
      // Fallback to terrain-aware estimation with improved accuracy
      try {
        // Get terrain type for more accurate analysis
        const terrainType = await detectTerrainType(latitude, longitude);
        console.log(`Detected terrain type: ${terrainType}`);
        
        // Basic estimate based on terrain type
        let baseBortle = 4; // Default mid-range value
        
        switch (terrainType) {
          case 'mountain':
            baseBortle = 3;
            break;
          case 'plateau':
            baseBortle = 3.5;
            break;
          case 'hill':
            baseBortle = 4;
            break;
          case 'valley':
            baseBortle = 4.5;
            break;
          case 'plain':
            baseBortle = 4;
            break;
          case 'coast':
            baseBortle = 4;
            break;
          case 'urban':
            baseBortle = 6;
            break;
        }
        
        // Adjust for China regions which tend to have higher light pollution
        if (isInChina(latitude, longitude)) {
          baseBortle += 1;
        }
        
        // Apply additional location-based adjustments
        const finalBortle = applyLocationSpecificAdjustments(
          baseBortle,
          latitude, 
          longitude, 
          locationName
        );
        
        // Cache result
        sessionStorage.setItem(cacheKey, JSON.stringify({
          bortleScale: finalBortle,
          timestamp: Date.now()
        }));
        
        return finalBortle;
      } catch (error) {
        console.warn("Terrain estimation failed:", error);
      }
      
      // If we already have a valid Bortle scale, don't change it
      if (existingBortleScale !== null && 
          existingBortleScale !== undefined && 
          existingBortleScale >= 1 && 
          existingBortleScale <= 9) {
        return existingBortleScale;
      }
      
      // Ultimate fallback is middle of the scale
      return 4.5;
    } catch (error) {
      console.error("Error updating Bortle scale:", error);
      return existingBortleScale;
    }
  }, []);

  return { updateBortleScale };
}

/**
 * Check for known city or location matches in database
 * @param locationName Location name to check
 * @param latitude Latitude for verification
 * @param longitude Longitude for verification
 * @returns Bortle scale if match found, null otherwise
 */
async function checkKnownCityDatabase(
  locationName: string, 
  latitude: number, 
  longitude: number
): Promise<number | null> {
  // This would typically query a database of known locations
  // For now, we'll use a simplified approach with common cities
  
  const lowercaseName = locationName.toLowerCase();
  
  // Major city patterns with approximate Bortle values
  const cityPatterns: [RegExp, number][] = [
    [/\b(new york|nyc)\b/i, 9],
    [/\b(los angeles|la)\b/i, 8.5],
    [/\bchicago\b/i, 8.5],
    [/\b(london|londres)\b/i, 8.5],
    [/\b(paris|parís)\b/i, 8.5],
    [/\b(tokyo|tōkyō|東京)\b/i, 9],
    [/\b(beijing|北京)\b/i, 8.5],
    [/\b(shanghai|上海)\b/i, 8.5],
    [/\b(mumbai|bombay)\b/i, 8],
    [/\b(delhi|new delhi)\b/i, 8],
    [/\b(mexico city|ciudad de méxico)\b/i, 8],
    [/\b(são paulo|sao paulo)\b/i, 8],
    [/\b(cairo|القاهرة)\b/i, 7.5],
    [/\b(istanbul|istanbul)\b/i, 8],
    [/\b(seoul|서울)\b/i, 8.5],
    [/\b(singapore|新加坡)\b/i, 7.5],
    [/\bsydney\b/i, 7],
    [/\bmelbourne\b/i, 7],
    [/\bmoscow\b/i, 8],
    [/\bberlin\b/i, 7.5],
    [/\bmadrid\b/i, 7.5],
    [/\brome\b/i, 7.5],
    [/\b(toronto|montréal|montreal)\b/i, 7],
    [/\b(denver)\b/i, 7.3],
    [/\b(las vegas)\b/i, 7.8],
    [/\b(hohhot|呼和浩特)\b/i, 4],
    [/\b(lhasa|拉萨)\b/i, 3]
  ];
  
  // Check for city name matches
  for (const [pattern, bortleValue] of cityPatterns) {
    if (pattern.test(lowercaseName)) {
      return bortleValue;
    }
  }
  
  // National park patterns with approximate Bortle values
  const parkPatterns: [RegExp, number][] = [
    [/\b(yellowstone|yosemite|grand canyon)\b/i, 2],
    [/\b(death valley|death)\b/i, 1.5],
    [/\b(bryce canyon|zion|arches|canyonlands)\b/i, 2],
    [/\b(glacier|olympic|everglades)\b/i, 2.5],
    [/\b(serengeti|kruger|kakadu)\b/i, 1],
    [/\b(national park|reserve)\b/i, 2.5],
    [/\b(dark sky)\b/i, 2]
  ];
  
  // Check for park name matches
  for (const [pattern, bortleValue] of parkPatterns) {
    if (pattern.test(lowercaseName)) {
      return bortleValue;
    }
  }
  
  return null;
}

/**
 * Apply location-specific adjustments to the Bortle scale
 * @param baseBortle Base Bortle scale value
 * @param latitude Latitude for geographic adjustments
 * @param longitude Longitude for geographic adjustments
 * @param locationName Location name for context
 * @returns Adjusted Bortle scale value
 */
function applyLocationSpecificAdjustments(
  baseBortle: number,
  latitude: number,
  longitude: number,
  locationName: string
): number {
  let adjustedBortle = baseBortle;
  
  // Check for special keywords in the location name
  const lowercaseName = locationName.toLowerCase();
  
  // Dark sky sites
  if (lowercaseName.includes('dark sky') || 
      lowercaseName.includes('stargazing') || 
      lowercaseName.includes('observatory')) {
    adjustedBortle -= 1.5;
  }
  
  // Remote areas
  if (lowercaseName.includes('remote') || 
      lowercaseName.includes('wilderness')) {
    adjustedBortle -= 1.0;
  }
  
  // National parks and protected areas
  if (lowercaseName.includes('national park') || 
      lowercaseName.includes('reserve') || 
      lowercaseName.includes('protected')) {
    adjustedBortle -= 0.8;
  }
  
  // Urban areas
  if (lowercaseName.includes('city') || 
      lowercaseName.includes('downtown') || 
      lowercaseName.includes('urban')) {
    adjustedBortle += 0.5;
  }
  
  // Geographic adjustments for specific regions
  
  // Extremely remote regions typically have very dark skies
  if ((latitude > 60 || latitude < -60) || // Far northern/southern latitudes
      (latitude > -30 && latitude < 30 && longitude > 130 && longitude < 170) || // Remote Pacific
      (latitude > 15 && latitude < 35 && longitude > -120 && longitude < -100 && locationName.includes('desert'))) { // US Southwest deserts
    adjustedBortle = Math.min(adjustedBortle, 2.5);
  }
  
  // Ensure the result is within valid range
  return Math.max(1, Math.min(9, adjustedBortle));
}
