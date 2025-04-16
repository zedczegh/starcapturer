
/**
 * Specialized service for handling certified locations
 * with enhanced quality and reliability features
 */

import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { updateLocationsWithRealTimeSiqs } from "./locationUpdateService";

/**
 * Update certified locations with SIQS data using specialized handling
 * @param locations Array of certified locations
 * @param concurrency Number of parallel requests (default: 2)
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
  const enhanced = { ...location };
  
  // Ensure proper certification flags
  if (location.certification && !enhanced.isCertified) {
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
  
  return enhanced;
}

/**
 * Add certification rating to a location based on available data
 */
export function addCertificationRating(location: SharedAstroSpot): SharedAstroSpot {
  if (!location) return location;
  
  const enhanced = { ...location };
  
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
  else if (enhanced.siqs && enhanced.siqs >= 7) {
    rating = 3;
  }
  // Moderate SIQS score
  else if (enhanced.siqs && enhanced.siqs >= 5) {
    rating = 2;
  }
  // Default rating
  else {
    rating = 1;
  }
  
  enhanced.certificationRating = rating;
  
  return enhanced;
}
