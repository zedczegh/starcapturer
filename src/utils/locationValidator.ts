
/**
 * Location validation utilities
 */

/**
 * Check if a location is likely in water (ocean, lake, etc.)
 * @param latitude 
 * @param longitude 
 * @returns True if location is likely in water
 */
export function isLikelyCoastalWater(
  latitude: number, 
  longitude: number,
  isCoastalCheckEnabled = true
): boolean {
  if (!isCoastalCheckEnabled) {
    return false;
  }
  
  // This is a simplified check that just looks at coordinates that are likely in oceans
  // A real implementation would use a GeoJSON database of coastlines
  
  // Simple check for Pacific Ocean
  if (longitude < -120 && longitude > -180 && latitude > -60 && latitude < 60) {
    return true;
  }
  
  // Atlantic Ocean
  if (longitude < -30 && longitude > -80 && latitude > -60 && latitude < 60) {
    return true;
  }
  
  // Indian Ocean
  if (longitude > 40 && longitude < 100 && latitude > -60 && latitude < 30) {
    return true;
  }
  
  // Arctic Ocean
  if (latitude > 70) {
    return true;
  }
  
  // Antarctic waters
  if (latitude < -60) {
    return true;
  }
  
  return false;
}

/**
 * Validate location data for completeness
 */
export function validateLocationData(location: any): boolean {
  if (!location) {
    return false;
  }
  
  // Check for required fields
  if (!location.latitude || !location.longitude) {
    return false;
  }
  
  // Check for valid coordinates
  if (
    typeof location.latitude !== 'number' || 
    typeof location.longitude !== 'number' ||
    isNaN(location.latitude) || 
    isNaN(location.longitude)
  ) {
    return false;
  }
  
  // Check for valid latitude range
  if (location.latitude < -90 || location.latitude > 90) {
    return false;
  }
  
  // Check for valid longitude range
  if (location.longitude < -180 || location.longitude > 180) {
    return false;
  }
  
  return true;
}

/**
 * Check if location has valid SIQS data
 */
export function hasValidSiqsData(location: any): boolean {
  // Check if location has SIQS score directly
  if (typeof location.siqs === 'number' && !isNaN(location.siqs)) {
    return true;
  }
  
  // Check if location has SIQS result object
  if (location.siqsResult && 
      (typeof location.siqsResult.siqs === 'number' || 
       typeof location.siqsResult.score === 'number')) {
    return true;
  }
  
  return false;
}
