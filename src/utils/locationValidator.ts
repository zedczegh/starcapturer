
/**
 * Utility functions to validate astronomy locations
 */

// Simple land/water check based on coordinates
// This is a basic implementation - in a real app, this would use more sophisticated 
// geo API to check if a location is on water
export function isWaterLocation(latitude: number, longitude: number, strictCheck = false): boolean {
  // This is a simplified check that considers common ocean areas
  // In reality, you would use a proper geodata service
  
  // Check for extreme ocean coordinates
  const isPacificOcean = 
    (longitude < -120 && longitude > -180 && latitude < 40 && latitude > -60) || 
    (longitude > 140 && longitude < 180 && latitude < 60 && latitude > -60);
  
  const isAtlanticOcean = 
    (longitude < -30 && longitude > -80 && latitude < 60 && latitude > -60) ||
    (longitude > -30 && longitude < 0 && latitude > 30 && latitude < 60);
  
  const isIndianOcean = 
    (longitude > 50 && longitude < 100 && latitude < 10 && latitude > -50);
  
  const isSouthernOcean =
    (latitude < -60);
  
  // Strict check looks at more potential water areas
  if (strictCheck) {
    // Additional water bodies for strict check
    const isArcticOcean = (latitude > 75);
    const isMediterranean = (longitude > 0 && longitude < 40 && latitude > 30 && latitude < 45);
    
    return isPacificOcean || isAtlanticOcean || isIndianOcean || isSouthernOcean || isArcticOcean || isMediterranean;
  }
  
  return isPacificOcean || isAtlanticOcean || isIndianOcean || isSouthernOcean;
}

/**
 * Checks if a location is valid for astronomy
 * @param latitude Location latitude
 * @param longitude Location longitude
 * @param name Optional location name for logging
 * @returns Boolean indicating if this is a valid astronomy location
 */
export function isValidAstronomyLocation(latitude: number, longitude: number, name?: string): boolean {
  // Check for invalid coordinates
  if (isNaN(latitude) || isNaN(longitude) || 
      latitude < -90 || latitude > 90 || 
      longitude < -180 || longitude > 180) {
    console.log(`Invalid coordinates: ${latitude}, ${longitude}`);
    return false;
  }
  
  // Skip water location check for named locations
  if (name && name.length > 0 && 
      !name.includes("Location at") && 
      !name.includes("位置在") && 
      !name.includes("coordinates")) {
    return true;
  }
  
  // Check if location is on water
  if (isWaterLocation(latitude, longitude)) {
    return false;
  }
  
  return true;
}
