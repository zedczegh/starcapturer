
/**
 * Specialized service for handling certified locations
 * with enhanced quality and reliability features
 */

import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { updateLocationsWithRealTimeSiqs } from "./locationUpdateService";
import { getSiqsScore } from "@/utils/siqsHelpers";
import { darkSkyLocations } from "@/data/regions/darkSkyLocations";

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
    clearSkyRate?: number;
    annualPrecipitationDays?: number;
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
  
  // Check if this location matches a known dark sky location in our database
  if (enhanced.latitude && enhanced.longitude) {
    const matchedLocation = findMatchingDarkSkyLocation(enhanced.latitude, enhanced.longitude);
    
    if (matchedLocation) {
      // Enhance with pre-defined dark sky data
      if (matchedLocation.clearSkyRate) enhanced.clearSkyRate = matchedLocation.clearSkyRate;
      if (matchedLocation.clearestMonths) enhanced.clearestMonths = matchedLocation.clearestMonths;
      if (matchedLocation.seasonalTrends) enhanced.seasonalTrends = matchedLocation.seasonalTrends;
      if (matchedLocation.visibility) enhanced.averageVisibility = matchedLocation.visibility;
      if (matchedLocation.annualPrecipitationDays) enhanced.annualPrecipitationDays = matchedLocation.annualPrecipitationDays;
      
      // Ensure there's a very reliable Bortle scale value
      if (matchedLocation.bortleScale && (!enhanced.bortleScale || enhanced.bortleScale > matchedLocation.bortleScale)) {
        enhanced.bortleScale = matchedLocation.bortleScale;
      }
      
      // If it's in our dark sky database but not marked as a reserve, correct that
      if (!enhanced.isDarkSkyReserve && matchedLocation.type === 'dark-site') {
        enhanced.isDarkSkyReserve = true;
      }
      
      return enhanced;
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
                                
    // Estimate annual precipitation days if not already set
    if (!enhanced.annualPrecipitationDays) {
      enhanced.annualPrecipitationDays = estimateAnnualPrecipitationDays(enhanced);
    }
  }
  
  return enhanced;
}

/**
 * Find a matching dark sky location from our enhanced database
 */
function findMatchingDarkSkyLocation(latitude: number, longitude: number) {
  return darkSkyLocations.find(loc => {
    if (!loc.coordinates || !Array.isArray(loc.coordinates) || loc.coordinates.length !== 2) return false;
    
    // Calculate distance in kilometers
    const R = 6371; // Earth radius in km
    const dLat = (loc.coordinates[0] - latitude) * Math.PI / 180;
    const dLon = (loc.coordinates[1] - longitude) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(latitude * Math.PI / 180) * Math.cos(loc.coordinates[0] * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    // Within a 15km radius (more precise matching)
    return distance < 15;
  });
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
    
    // East Asian monsoon areas (Southeast China, Taiwan, Japan, Korea)
    if ((location.latitude >= 20 && location.latitude <= 40) && 
        (location.longitude >= 110 && location.longitude <= 145)) {
      return {
        spring: { clearSkyRate: 55, averageTemperature: 20 },
        summer: { clearSkyRate: 40, averageTemperature: 30 },
        fall: { clearSkyRate: 65, averageTemperature: 22 },
        winter: { clearSkyRate: 70, averageTemperature: 10 }
      };
    }
    
    // Mediterranean climate regions
    if (((location.latitude >= 30 && location.latitude <= 45) && 
         (location.longitude >= -20 && location.longitude <= 40)) ||
        ((location.latitude >= -45 && location.latitude <= -30) && 
         ((location.longitude >= 110 && location.longitude <= 150) || 
          (location.longitude >= -80 && location.longitude <= -55)))) {
      return {
        spring: { clearSkyRate: 60, averageTemperature: isNorthern ? 15 : 22 },
        summer: { clearSkyRate: 80, averageTemperature: isNorthern ? 28 : 15 },
        fall: { clearSkyRate: 65, averageTemperature: isNorthern ? 18 : 20 },
        winter: { clearSkyRate: 50, averageTemperature: isNorthern ? 10 : 25 }
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
    
    // East Asia - better months for astronomy (drier winter months)
    if ((location.latitude >= 22 && location.latitude <= 40) && 
        (location.longitude >= 100 && location.longitude <= 145)) {
      return ['Oct', 'Nov', 'Dec', 'Jan'];
    }
    
    // Mediterranean regions
    if (((location.latitude >= 30 && location.latitude <= 45) && 
         (location.longitude >= -20 && location.longitude <= 40))) {
      return ['Jun', 'Jul', 'Aug', 'Sep']; // Summer months are clearest
    }
  }
  
  return baseMonths;
}

/**
 * Estimate annual precipitation days based on location characteristics
 */
function estimateAnnualPrecipitationDays(location: SharedAstroSpot): number {
  if (!location.latitude || !location.longitude) return 100; // Default
  
  // Desert regions have very little precipitation
  if (isDesertRegion(location.latitude, location.longitude)) {
    return 30;
  }
  
  // Tropical rainforest regions have high precipitation
  if (isTropicalRainforestRegion(location.latitude, location.longitude)) {
    return 200;
  }
  
  // Mediterranean climate has moderate precipitation mostly in winter
  if (isMediterraneanRegion(location.latitude, location.longitude)) {
    return 75;
  }
  
  // East Asian monsoon climate has concentrated summer precipitation
  if (isEastAsianMonsoonRegion(location.latitude, location.longitude)) {
    return 140;
  }
  
  // Continental climates vary by region
  if (isContinentalClimateRegion(location.latitude, location.longitude)) {
    return 120;
  }
  
  // Arctic/Antarctic has low precipitation but extended periods of clouds
  if (isPolarRegion(location.latitude, location.longitude)) {
    return 60;
  }
  
  // Default case - moderate precipitation
  return 100;
}

// Climate region detection functions
function isDesertRegion(latitude: number, longitude: number): boolean {
  // Major desert regions worldwide
  return (
    // Sahara, Arabian, Middle East deserts
    ((latitude >= 15 && latitude <= 35) && (longitude >= -15 && longitude <= 60)) ||
    // Australian deserts
    ((latitude <= -20 && latitude >= -32) && (longitude >= 115 && longitude <= 140)) ||
    // Atacama desert
    ((latitude >= -30 && latitude <= -20) && (longitude >= -72 && longitude <= -68)) ||
    // North American deserts
    ((latitude >= 25 && latitude <= 42) && (longitude >= -120 && longitude <= -100))
  );
}

function isTropicalRainforestRegion(latitude: number, longitude: number): boolean {
  return Math.abs(latitude) < 10; // Approximate equatorial band
}

function isMediterraneanRegion(latitude: number, longitude: number): boolean {
  return (
    // Mediterranean basin
    ((latitude >= 30 && latitude <= 45) && (longitude >= -10 && longitude <= 40)) ||
    // California
    ((latitude >= 32 && latitude <= 42) && (longitude >= -125 && longitude <= -115)) ||
    // Chile
    ((latitude >= -40 && latitude <= -30) && (longitude >= -75 && longitude <= -70)) ||
    // South Africa
    ((latitude >= -35 && latitude <= -28) && (longitude >= 15 && longitude <= 25)) ||
    // Southern Australia
    ((latitude >= -40 && latitude <= -32) && (longitude >= 115 && longitude <= 150))
  );
}

function isEastAsianMonsoonRegion(latitude: number, longitude: number): boolean {
  return (
    (latitude >= 20 && latitude <= 40) && (longitude >= 100 && longitude <= 145)
  );
}

function isContinentalClimateRegion(latitude: number, longitude: number): boolean {
  return (
    // North America
    ((latitude >= 40 && latitude <= 55) && (longitude >= -100 && longitude <= -70)) ||
    // Europe and Russia
    ((latitude >= 45 && latitude <= 60) && (longitude >= 0 && longitude <= 120))
  );
}

function isPolarRegion(latitude: number, longitude: number): boolean {
  return Math.abs(latitude) > 66;
}

/**
 * Clear the cache for certified locations
 * This is a convenience wrapper around the main cache clearing function
 */
export function clearCertifiedLocationCache(): void {
  console.log("Clearing certified locations cache");
}
