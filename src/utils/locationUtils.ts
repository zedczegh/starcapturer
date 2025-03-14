import { calculateDistance } from "@/data/locationDatabase";
import { findClosestCity, interpolateBortleScale } from "@/utils/lightPollutionData";

// Import the correct location database from the utils file
import { quickLocationDatabase } from "./locationDatabase";

/**
 * Find the closest known location from our database
 * Using spatial indexing for faster lookups and more accurate results
 */
export function findClosestKnownLocation(latitude: number, longitude: number): {
  name: string;
  bortleScale: number;
  distance: number;
  type: string;
} {
  if (!quickLocationDatabase || !quickLocationDatabase.length) {
    return { name: "Unknown", bortleScale: 4, distance: 999, type: 'unknown' };
  }

  // First try the enhanced light pollution database for better accuracy
  try {
    const closestCity = findClosestCity(latitude, longitude);
    if (closestCity.distance < 100) {
      return closestCity;
    }
  } catch (error) {
    console.error("Error using enhanced database:", error);
    // Fall back to legacy database if enhanced database fails
  }

  // Find closest location in the legacy database
  let closestLocation = quickLocationDatabase[0];
  let shortestDistance = calculateDistance(
    latitude, longitude, 
    quickLocationDatabase[0].coordinates[0], 
    quickLocationDatabase[0].coordinates[1]
  );

  for (let i = 1; i < quickLocationDatabase.length; i++) {
    const location = quickLocationDatabase[i];
    const distance = calculateDistance(
      latitude, longitude, 
      location.coordinates[0], 
      location.coordinates[1]
    );

    if (distance < shortestDistance) {
      shortestDistance = distance;
      closestLocation = location;
    }
  }

  return {
    name: closestLocation.name,
    bortleScale: closestLocation.bortleScale,
    distance: shortestDistance,
    type: closestLocation.type || 'unknown'
  };
}

/**
 * Estimate Bortle scale based on location name and coordinates
 * With optimized logic for faster processing and more accurate results
 */
export function estimateBortleScaleByLocation(
  locationName: string, 
  latitude?: number, 
  longitude?: number
): number {
  // If we have coordinates, use the enhanced interpolation method
  if (typeof latitude === 'number' && typeof longitude === 'number') {
    try {
      return interpolateBortleScale(latitude, longitude);
    } catch (error) {
      console.error("Error interpolating Bortle scale:", error);
      // Fall back to database lookup if interpolation fails
    }
    
    // Try to find closest known location
    const closestLocation = findClosestKnownLocation(latitude, longitude);
    
    // If location is close enough, use its Bortle scale
    if (closestLocation.distance <= 100) {
      return closestLocation.bortleScale;
    }
  }
  
  // Try to match by name - use lowercase for case-insensitive matching
  if (locationName && locationName.length > 0) {
    const lowercaseName = locationName.toLowerCase();
    
    // First check for specific location names that are in our database
    for (const location of quickLocationDatabase) {
      if (lowercaseName.includes(location.name.toLowerCase())) {
        return location.bortleScale;
      }
    }
  
    // Check for keywords that indicate dark skies
    if (
      lowercaseName.includes('desert') || 
      lowercaseName.includes('outback') || 
      lowercaseName.includes('wilderness') ||
      lowercaseName.includes('remote') ||
      lowercaseName.includes('observatory') ||
      lowercaseName.includes('national park') ||
      lowercaseName.includes('mountain') ||
      lowercaseName.includes('森林') ||
      lowercaseName.includes('山脉') ||
      lowercaseName.includes('沙漠')
    ) {
      return 3; // Likely has minimal light pollution
    }
    
    // Check for keywords that indicate moderate light pollution
    if (
      lowercaseName.includes('rural') || 
      lowercaseName.includes('village') || 
      lowercaseName.includes('town') ||
      lowercaseName.includes('县') ||
      lowercaseName.includes('镇')
    ) {
      return 5; // Moderate light pollution
    }
    
    // Check for keywords that indicate significant light pollution
    if (
      lowercaseName.includes('city') || 
      lowercaseName.includes('urban') || 
      lowercaseName.includes('downtown') ||
      lowercaseName.includes('市') ||
      lowercaseName.includes('区')
    ) {
      return 7; // Heavy light pollution
    }
  }
  
  // For coordinates with no matching name or location, use population density estimate
  if (typeof latitude === 'number' && typeof longitude === 'number') {
    // China's eastern seaboard is generally high light pollution
    if (longitude > 108 && latitude > 20 && latitude < 40) {
      return 7;
    }
    
    // Western China is generally darker
    if (longitude < 100 && latitude > 30 && latitude < 45) {
      return 4;
    }
    
    // Central China has moderate light pollution
    if (longitude > 100 && longitude < 108 && latitude > 25 && latitude < 40) {
      return 6;
    }
  }
  
  // Default value when we can't determine
  return 5;
}
