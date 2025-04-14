
/**
 * Basic geographic calculations and conversions
 */

// Earth radius in kilometers
export const EARTH_RADIUS = 6371;

/**
 * Convert degrees to radians
 */
export const degToRad = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};

/**
 * Calculate the great-circle distance between two points using the Haversine formula
 * @param lat1 Latitude of point 1 in degrees
 * @param lon1 Longitude of point 1 in degrees
 * @param lat2 Latitude of point 2 in degrees
 * @param lon2 Longitude of point 2 in degrees
 * @returns Distance in kilometers
 */
export const calculateDistance = (
  lat1: number, 
  lon1: number, 
  lat2: number, 
  lon2: number
): number => {
  const dLat = degToRad(lat2 - lat1);
  const dLon = degToRad(lon2 - lon1);
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(degToRad(lat1)) * Math.cos(degToRad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return EARTH_RADIUS * c;
};

/**
 * Normalize coordinates to ensure they're within standard ranges
 * This can help when comparing locations internationally
 */
export const normalizeCoordinates = (coords: { latitude: number, longitude: number }) => {
  return {
    latitude: Math.max(-90, Math.min(90, coords.latitude)),
    longitude: ((coords.longitude + 180) % 360 + 360) % 360 - 180
  };
};

/**
 * Validate coordinates to ensure they're within valid ranges
 */
export const validateCoordinates = (coords: { latitude: number, longitude: number }) => {
  let { latitude, longitude } = coords;
  
  // Clamp latitude to valid range
  latitude = Math.max(-90, Math.min(90, latitude));
  
  // Normalize longitude to -180 to 180 range
  longitude = ((longitude + 180) % 360 + 360) % 360 - 180;
  
  return { latitude, longitude };
};
