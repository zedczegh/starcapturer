/**
 * Utilities for validating astronomical observation locations
 */

/**
 * Check if a location is on water (ocean, lake, etc.)
 * This would typically use a GIS service in a production environment
 */
export function isWaterLocation(latitude: number, longitude: number): boolean {
  // Simple mockup that checks for some major ocean areas
  // In a real implementation, this would use a GIS service
  
  // Pacific Ocean (rough approximation)
  if (
    (latitude >= -60 && latitude <= 60) && 
    ((longitude >= 150 || longitude <= -120))
  ) {
    return true;
  }
  
  // Atlantic Ocean (rough approximation)
  if (
    (latitude >= -60 && latitude <= 60) && 
    (longitude >= -70 && longitude <= 0)
  ) {
    return true;
  }
  
  // Indian Ocean (rough approximation)
  if (
    (latitude >= -60 && latitude <= 30) && 
    (longitude >= 40 && longitude <= 120)
  ) {
    return true;
  }
  
  // Return false for all other locations (land)
  return false;
}

/**
 * Check if a location is valid for astronomical observations
 */
export function isValidAstronomyLocation(
  latitude: number,
  longitude: number,
  locationName: string
): boolean {
  // Check if location is on water
  if (isWaterLocation(latitude, longitude)) {
    return false;
  }
  
  // Other validation checks could go here (e.g., checking for restricted areas, etc.)
  
  return true;
}
