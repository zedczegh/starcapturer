
/**
 * Check if a location is in water
 * 
 * @param latitude The latitude to check
 * @param longitude The longitude to check
 * @returns Promise that resolves to true if location is water, false otherwise
 */
export const isWaterLocation = async (
  latitude: number, 
  longitude: number
): Promise<boolean> => {
  // This is a simplified mock implementation
  // In a real app, this would call a geographic API

  // Mock some known water locations
  const knownWaterLocations = [
    // Pacific Ocean
    { minLat: 20, maxLat: 45, minLng: -150, maxLng: -115 },
    // Atlantic Ocean
    { minLat: 20, maxLat: 45, minLng: -80, maxLng: -50 },
    // Mediterranean Sea
    { minLat: 30, maxLat: 45, minLng: -5, maxLng: 35 },
    // South China Sea
    { minLat: 5, maxLat: 25, minLng: 105, maxLng: 120 },
  ];
  
  // Check if location falls in any of these water areas
  for (const area of knownWaterLocations) {
    if (latitude >= area.minLat && latitude <= area.maxLat &&
        longitude >= area.minLng && longitude <= area.maxLng) {
      // Add some randomness to make it more realistic
      if (Math.random() > 0.3) {
        return true;
      }
    }
  }
  
  // Default: 10% chance of any location being water for testing purposes
  return Math.random() < 0.1;
};

// Export a simpler function that doesn't use the API
export const isWaterLocationSimple = (
  latitude: number, 
  longitude: number
): boolean => {
  // Simply check if the location is close to known water coordinates
  // Pacific Ocean
  if (latitude > 20 && latitude < 45 && longitude > -150 && longitude < -115) {
    return true;
  }
  // Atlantic Ocean
  if (latitude > 20 && latitude < 45 && longitude > -80 && longitude < -50) {
    return true;
  }
  
  // Default return
  return false;
};
