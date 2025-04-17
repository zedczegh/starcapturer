
/**
 * Bortle scale service for light pollution estimation
 */

// Define the Bortle scale ranges
const BORTLE_RANGES = [
  { min: 21.7, max: 22.0, scale: 1 }, // Class 1: Excellent dark sky
  { min: 21.5, max: 21.7, scale: 2 }, // Class 2: Typical truly dark sky
  { min: 21.3, max: 21.5, scale: 3 }, // Class 3: Rural sky
  { min: 20.4, max: 21.3, scale: 4 }, // Class 4: Rural/suburban transition
  { min: 19.1, max: 20.4, scale: 5 }, // Class 5: Suburban sky
  { min: 18.0, max: 19.1, scale: 6 }, // Class 6: Bright suburban sky
  { min: 18.0, max: 18.0, scale: 7 }, // Class 7: Suburban/urban transition
  { min: 17.0, max: 18.0, scale: 8 }, // Class 8: City sky
  { min: 0.0, max: 17.0, scale: 9 }   // Class 9: Inner city sky
];

/**
 * Get Bortle scale from sky brightness in mag/arcsec²
 */
export function getBortleFromSkyBrightness(skyBrightness: number): number {
  // Find the appropriate Bortle scale class
  for (const range of BORTLE_RANGES) {
    if (skyBrightness >= range.min && skyBrightness <= range.max) {
      return range.scale;
    }
  }
  
  // Default to worst case if outside range
  return 9;
}

/**
 * Estimate Bortle scale based on location factors (latitude, longitude)
 */
export function estimateBortleScale(latitude: number, longitude: number): number {
  // Simple estimation algorithm based on latitude
  // In a real app, this would use light pollution data or population density
  
  // Get distance from major city centers (simplified for demo)
  const distanceFromUrban = Math.min(
    calculateDistanceFromUrban(latitude, longitude),
    150 // Cap at 150km
  );
  
  if (distanceFromUrban < 10) {
    return 8; // Very close to urban centers
  } else if (distanceFromUrban < 30) {
    return 6; // Suburbs
  } else if (distanceFromUrban < 70) {
    return 4; // Rural/suburban
  } else if (distanceFromUrban < 120) {
    return 3; // Rural
  } else {
    return 2; // Truly dark
  }
}

/**
 * Mock function to calculate distance from urban centers
 */
function calculateDistanceFromUrban(latitude: number, longitude: number): number {
  // This is a simple placeholder that simulates distance from urban centers
  // In a real application, this would use a database of city coordinates
  // and calculate actual distances
  
  // For demo purposes, we'll just use a simple formula based on coordinates
  const urbanFactor = Math.abs(Math.sin(latitude * 0.0174533) * 50) + 
                     Math.abs(Math.cos(longitude * 0.0174533) * 50);
  
  // Return simulated distance in kilometers
  return urbanFactor + Math.random() * 20;
}

/**
 * Get description of a Bortle scale value
 */
export function getBortleScaleDescription(scale: number): string {
  switch (Math.round(scale)) {
    case 1:
      return "Excellent dark sky, no light pollution";
    case 2:
      return "Truly dark sky, slight light domes";
    case 3:
      return "Rural sky, some light pollution";
    case 4:
      return "Rural/suburban transition";
    case 5:
      return "Suburban sky, moderate light pollution";
    case 6:
      return "Bright suburban sky";
    case 7:
      return "Suburban/urban transition";
    case 8:
      return "City sky, poor viewing conditions";
    case 9:
      return "Inner city sky, very poor viewing";
    default:
      return "Unknown sky conditions";
  }
}
