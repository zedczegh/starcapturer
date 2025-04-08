
/**
 * Utility functions to validate location data
 */

// Simple check for water locations based on coordinates
// Water bodies are often in well-defined areas
export const isWaterLocation = (
  latitude: number, 
  longitude: number, 
  isCertified: boolean = false
): boolean => {
  // Never flag certified locations as water
  if (isCertified) return false;

  // Quick check for oceans based on major ocean boundaries
  // Pacific Ocean rough boundaries
  const isPacific = (
    ((longitude < -70 || longitude > 120) && (latitude < 60 && latitude > -60))
  );

  // Atlantic Ocean rough boundaries
  const isAtlantic = (
    (longitude > -70 && longitude < 20) && (latitude < 65 && latitude > -55)
  );

  // Indian Ocean rough boundaries
  const isIndian = (
    (longitude > 40 && longitude < 120) && (latitude < 25 && latitude > -50)
  );

  // Check against known large lakes and inland seas by rough boundaries
  // These are very simplified boundaries for demonstration
  const isLargeLake = 
    // Caspian Sea
    ((longitude > 46 && longitude < 56) && (latitude > 36 && latitude < 47)) ||
    // Great Lakes
    ((longitude > -93 && longitude < -76) && (latitude > 41 && latitude < 49)) ||
    // Lake Victoria
    ((longitude > 31 && longitude < 35) && (latitude > -3 && latitude < 1));

  return isPacific || isAtlantic || isIndian || isLargeLake;
};

/**
 * Check if location is likely in a coastal water area
 * This is a very basic implementation for compatibility
 */
export const isLikelyCoastalWater = (
  latitude: number, 
  longitude: number
): boolean => {
  return isWaterLocation(latitude, longitude, false);
};
