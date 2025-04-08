
/**
 * Utility functions for validating location data
 */

/**
 * Check if the given coordinates are likely to be in a water body
 * @param latitude Latitude to check
 * @param longitude Longitude to check
 * @param logResult Whether to log the result (default: false)
 * @returns Boolean indicating if the location is likely water
 */
export function isWaterLocation(
  latitude: number,
  longitude: number,
  logResult: boolean = false
): boolean {
  // This is a simplified check, in reality would use a GeoJSON database
  // Water detection would typically be more sophisticated
  
  // Large ocean coordinates (very simplified approach)
  const pacificOcean = longitude < -120 || (longitude > 135 && latitude < 45);
  const atlanticOcean = longitude < -30 && longitude > -80 && (latitude < 45 && latitude > -40);
  const indianOcean = longitude > 40 && longitude < 120 && latitude < 20;
  
  // Major lakes
  const greatLakes = 
    (latitude > 41 && latitude < 49.5 && longitude > -93 && longitude < -76);
    
  // Known large water bodies
  const knownWaterBodies = pacificOcean || atlanticOcean || indianOcean || greatLakes;
  
  if (logResult && knownWaterBodies) {
    console.log(`Water body detected at [${latitude.toFixed(4)}, ${longitude.toFixed(4)}]`);
  }
  
  return knownWaterBodies;
}

/**
 * Check if the coordinates are likely coastal waters
 * Uses more precise detection for coastlines
 * @param latitude Latitude to check
 * @param longitude Longitude to check
 * @returns Boolean indicating if the location is likely coastal water
 */
export function isLikelyCoastalWater(
  latitude: number, 
  longitude: number
): boolean {
  // This would ideally use a proper coastline dataset
  // Here we're using a simplified approach
  
  // Define some known coastline boundaries (very simplified)
  
  // US West Coast (rough approximation)
  if (longitude < -117 && longitude > -125 && latitude > 32 && latitude < 49) {
    // Check distance from coastline (simple approximation)
    const distanceFromCoast = Math.abs(longitude + 121); // Rough distance from coast
    return distanceFromCoast > 0.7; // If we're more than ~0.7 degrees into the ocean
  }
  
  // US East Coast (rough approximation)
  if (longitude < -65 && longitude > -82 && latitude > 25 && latitude < 45) {
    // Check distance from average coastline
    const distanceFromCoast = Math.abs(longitude + 75); // Rough distance
    return longitude < -75 && distanceFromCoast > 0.8;
  }
  
  // European coastlines (very rough approximation)
  if (longitude > -15 && longitude < 30 && latitude > 35 && latitude < 60) {
    // Mediterranean and Atlantic coastlines are complex
    // This would need a proper GeoJSON database
    // For now just do a very rough check
    return false; // Disable for now to avoid false positives
  }
  
  // Asian coastlines (very rough approximation)
  if (longitude > 100 && longitude < 145 && latitude > 20 && latitude < 45) {
    // East Asia coastlines
    return false; // Disable for now to avoid false positives
  }
  
  return false;
}

/**
 * Check if a location is valid for astronomy purposes
 * @param latitude Location latitude
 * @param longitude Location longitude
 * @param name Optional location name
 * @returns Boolean indicating if the location is valid
 */
export function isValidAstronomyLocation(
  latitude: number,
  longitude: number,
  name?: string
): boolean {
  // Invalid if it's water
  if (isWaterLocation(latitude, longitude)) {
    return false;
  }
  
  // Invalid if it's in coastal waters
  if (isLikelyCoastalWater(latitude, longitude)) {
    return false;
  }
  
  // Check for valid coordinate range
  const isValidLatitude = latitude >= -90 && latitude <= 90;
  const isValidLongitude = longitude >= -180 && longitude <= 180;
  
  if (!isValidLatitude || !isValidLongitude) {
    return false;
  }
  
  // If name is provided, check for water-related keywords
  if (name) {
    const lowerName = name.toLowerCase();
    const waterKeywords = ['ocean', 'sea', 'lake', 'bay', 'gulf', 'strait', 'channel', 'water'];
    
    // If name contains water keywords, it's probably water
    if (waterKeywords.some(keyword => lowerName.includes(keyword))) {
      return false;
    }
  }
  
  return true;
}
