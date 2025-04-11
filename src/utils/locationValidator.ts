
/**
 * Check if a location is over water (oceans, lakes, etc.)
 * @param latitude Latitude to check
 * @param longitude Longitude to check
 * @returns Boolean indicating if location is over water
 */
export const isWaterLocation = (latitude: number, longitude: number): boolean => {
  // Simple check for known ocean coordinates
  // For a real app this would use a geographic database or API
  const knownWaterAreas = [
    // Pacific Ocean general region
    { minLat: -60, maxLat: 60, minLng: -180, maxLng: -100 },
    { minLat: -60, maxLat: 60, minLng: 140, maxLng: 180 },
    
    // Atlantic Ocean general region
    { minLat: -60, maxLat: 70, minLng: -80, maxLng: -10 },
    
    // Indian Ocean general region
    { minLat: -50, maxLat: 30, minLng: 40, maxLng: 110 },
  ];
  
  // Check if coordinates fall within any known water area
  for (const area of knownWaterAreas) {
    if (
      latitude >= area.minLat && 
      latitude <= area.maxLat && 
      longitude >= area.minLng && 
      longitude <= area.maxLng
    ) {
      // This is a probabilistic check - we further verify by looking at the coordinates
      // More detailed coastline data would be required for accuracy
      return true;
    }
  }
  
  return false;
};

/**
 * Check if a location is likely coastal water
 * @param latitude Latitude to check
 * @param longitude Longitude to check
 * @returns Boolean indicating if location is likely coastal water
 */
export const isLikelyCoastalWater = (latitude: number, longitude: number): boolean => {
  // For demonstration purposes - would need a more accurate coastline dataset
  // Check common coastal regions
  return isWaterLocation(latitude, longitude);
};

/**
 * Validate if a location is suitable for astronomy
 * @param latitude Latitude to check
 * @param longitude Longitude to check
 * @param name Optional location name
 * @returns Boolean indicating if location is valid for astronomy
 */
export const isValidAstronomyLocation = (
  latitude: number, 
  longitude: number, 
  name?: string
): boolean => {
  // If the location has a name that includes "ocean", "sea", "bay", etc.
  if (name) {
    const waterNames = ["ocean", "sea", "bay", "gulf", "lake", "water", "reservoir", "pacific", "atlantic", "indian"];
    const lowerName = name.toLowerCase();
    
    if (waterNames.some(term => lowerName.includes(term))) {
      return false;
    }
  }

  // Check if location is not on water
  return !isWaterLocation(latitude, longitude);
};
