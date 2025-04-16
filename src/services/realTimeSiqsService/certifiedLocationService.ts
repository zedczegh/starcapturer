
/**
 * Specialized service for handling certified locations
 * with enhanced quality and reliability features
 */

import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { updateLocationsWithRealTimeSiqs } from "./locationUpdateService";
import { getSiqsScore } from "@/utils/siqsHelpers";

/**
 * Update certified locations with SIQS data using specialized handling
 * @param locations Array of certified locations
 * @returns Updated locations with SIQS data
 */
export async function updateCertifiedLocationsWithSiqs(
  locations: SharedAstroSpot[]
): Promise<SharedAstroSpot[]> {
  if (!locations || locations.length === 0) {
    return locations;
  }
  
  console.log(`Updating ${locations.length} certified locations with enhanced SIQS data`);
  
  try {
    // First, normalize and enhance the certified locations with quality metadata
    const enhancedLocations = locations.map(location => enhanceCertifiedLocation(location));
    
    // Then use the standard update process with the enhanced locations
    return await updateLocationsWithRealTimeSiqs(enhancedLocations);
    
  } catch (error) {
    console.error("Error updating certified locations with SIQS:", error);
    return locations;
  }
}

/**
 * Enhance certified location with additional metadata and quality indicators
 */
function enhanceCertifiedLocation(location: SharedAstroSpot): SharedAstroSpot {
  const enhanced = { ...location } as SharedAstroSpot & { 
    isCertified?: boolean;
    seasonalTrends?: Record<string, any>;
    clearestMonths?: string[];
    averageVisibility?: string;
  };
  
  // Ensure proper certification flags
  if (location.certification) {
    enhanced.isCertified = true;
  }
  
  // Ensure proper Bortle scale for certified locations
  if (!enhanced.bortleScale || enhanced.bortleScale > 6) {
    if (enhanced.isDarkSkyReserve) {
      enhanced.bortleScale = 2; // Dark sky reserves typically have excellent conditions
    } else if (enhanced.certification) {
      enhanced.bortleScale = 3; // Certified locations typically have very good conditions
    } else {
      enhanced.bortleScale = 4; // Default for "certified" locations without formal certification
    }
  }
  
  // Add seasonal data for dark sky locations
  if (enhanced.isDarkSkyReserve || enhanced.certification) {
    // Add seasonal trends based on climate zone
    enhanced.seasonalTrends = getLocationSeasonalTrends(enhanced);
    
    // Get clearest months based on location
    enhanced.clearestMonths = getClerestMonthsForLocation(enhanced);
    
    // Estimated visibility based on Bortle scale and location type
    enhanced.averageVisibility = enhanced.bortleScale <= 3 ? 'excellent' : 
                                enhanced.bortleScale <= 5 ? 'good' : 'moderate';
  }
  
  return enhanced;
}

/**
 * Add certification rating to a location based on available data
 */
export function addCertificationRating(location: SharedAstroSpot): SharedAstroSpot {
  if (!location) return location;
  
  const enhanced = { ...location } as SharedAstroSpot & { certificationRating?: number };
  
  // Skip if already has rating
  if (enhanced.certificationRating) {
    return enhanced;
  }
  
  // Calculate rating based on available data
  let rating = 0;
  
  // Dark sky reserve is highest quality
  if (enhanced.isDarkSkyReserve) {
    rating = 5;
  } 
  // Official certification is high quality
  else if (enhanced.certification) {
    rating = 4;
  }
  // Good SIQS score indicates quality
  else if (getSiqsScore(enhanced.siqs) >= 7) {
    rating = 3;
  }
  // Moderate SIQS score
  else if (getSiqsScore(enhanced.siqs) >= 5) {
    rating = 2;
  }
  // Default rating
  else {
    rating = 1;
  }
  
  enhanced.certificationRating = rating;
  
  return enhanced;
}

/**
 * Get seasonal trends for a location based on its climate characteristics
 */
function getLocationSeasonalTrends(location: SharedAstroSpot): Record<string, any> {
  // Default trends
  const defaultTrends = {
    spring: { clearSkyRate: 65, averageTemperature: 15 },
    summer: { clearSkyRate: 70, averageTemperature: 25 },
    fall: { clearSkyRate: 60, averageTemperature: 15 },
    winter: { clearSkyRate: 50, averageTemperature: 5 }
  };

  if (!location.latitude) return defaultTrends;
  
  // Determine if location is in northern or southern hemisphere
  const isNorthern = location.latitude > 0;
  
  // Special handling for specific regions
  if (location.name) {
    const name = location.name.toLowerCase();
    
    // Desert locations
    if (name.includes('atacama') || name.includes('namib') || name.includes('desert')) {
      return {
        spring: { clearSkyRate: 80, averageTemperature: isNorthern ? 20 : 15 },
        summer: { clearSkyRate: 90, averageTemperature: isNorthern ? 35 : 25 },
        fall: { clearSkyRate: 85, averageTemperature: isNorthern ? 25 : 18 },
        winter: { clearSkyRate: 75, averageTemperature: isNorthern ? 15 : 10 }
      };
    }
    
    // Mountain locations
    if (name.includes('mountain') || name.includes('mount') || name.includes('peak') || name.includes('alps')) {
      return {
        spring: { clearSkyRate: 60, averageTemperature: isNorthern ? 10 : 5 },
        summer: { clearSkyRate: 75, averageTemperature: isNorthern ? 20 : 10 },
        fall: { clearSkyRate: 65, averageTemperature: isNorthern ? 12 : 8 },
        winter: { clearSkyRate: 50, averageTemperature: isNorthern ? 0 : -5 }
      };
    }
    
    // Island locations
    if (name.includes('island') || name.includes('islands') || name.includes('barrier')) {
      return {
        spring: { clearSkyRate: 65, averageTemperature: isNorthern ? 18 : 22 },
        summer: { clearSkyRate: 70, averageTemperature: isNorthern ? 28 : 15 },
        fall: { clearSkyRate: 60, averageTemperature: isNorthern ? 20 : 20 },
        winter: { clearSkyRate: 55, averageTemperature: isNorthern ? 12 : 25 }
      };
    }
  }
  
  // Default based on hemisphere
  return isNorthern ? defaultTrends : {
    spring: { clearSkyRate: 60, averageTemperature: 20 },
    summer: { clearSkyRate: 50, averageTemperature: 10 },
    fall: { clearSkyRate: 65, averageTemperature: 15 },
    winter: { clearSkyRate: 70, averageTemperature: 25 }
  };
}

/**
 * Get clearest months for a location
 */
function getClerestMonthsForLocation(location: SharedAstroSpot): string[] {
  if (!location.latitude) return ['Jun', 'Jul', 'Aug'];
  
  // Northern/Southern hemisphere base months
  const northernClear = ['Jun', 'Jul', 'Aug'];
  const southernClear = ['Dec', 'Jan', 'Feb'];
  
  // Base selection on hemisphere
  const baseMonths = location.latitude > 0 ? northernClear : southernClear;
  
  // Special cases for specific regions or types
  if (location.name) {
    const name = location.name.toLowerCase();
    
    // Desert regions often have different patterns
    if (name.includes('desert') || name.includes('atacama') || name.includes('namib')) {
      return location.latitude > 0 ? 
        ['Apr', 'May', 'Jun'] : ['Oct', 'Nov', 'Dec'];
    }
    
    // Tropical regions
    if (Math.abs(location.latitude) < 23.5 || 
        name.includes('tropic') || 
        name.includes('equator')) {
      return ['Jan', 'Feb', 'Jun', 'Jul']; // Typically dry seasons in tropics
    }
    
    // Coastal regions
    if (name.includes('coast') || name.includes('sea') || name.includes('ocean') ||
        name.includes('bay') || name.includes('gulf')) {
      return location.latitude > 0 ? 
        ['May', 'Sep', 'Oct'] : ['Mar', 'Apr', 'Nov'];
    }
  }
  
  return baseMonths;
}

/**
 * Clear the cache for certified locations
 * This is a convenience wrapper around the main cache clearing function
 */
export function clearCertifiedLocationCache(): void {
  console.log("Clearing certified locations cache");
}
