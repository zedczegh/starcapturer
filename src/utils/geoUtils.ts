
/**
 * Calculate the distance between two points using the Haversine formula
 * @param lat1 Latitude of the first point
 * @param lon1 Longitude of the first point
 * @param lat2 Latitude of the second point
 * @param lon2 Longitude of the second point
 * @returns Distance in kilometers
 */
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in km
  
  return distance;
};

/**
 * Convert degrees to radians
 * @param deg Degrees
 * @returns Radians
 */
export const deg2rad = (deg: number): number => {
  return deg * (Math.PI / 180);
};

// Alias for backward compatibility
export const degToRad = deg2rad;

/**
 * Check if a location is within a specific radius of another location
 * @param centerLat Center point latitude
 * @param centerLon Center point longitude
 * @param pointLat Point to check latitude
 * @param pointLon Point to check longitude
 * @param radiusKm Radius in kilometers
 * @returns Boolean indicating if the point is within the radius
 */
export const isWithinRadius = (
  centerLat: number,
  centerLon: number,
  pointLat: number,
  pointLon: number,
  radiusKm: number
): boolean => {
  const distance = calculateDistance(centerLat, centerLon, pointLat, pointLon);
  return distance <= radiusKm;
};

/**
 * Format distance in kilometers with appropriate units
 * @param distance - Distance in kilometers
 * @returns Formatted distance string
 */
export const formatDistance = (distance: number): string => {
  if (distance === undefined || distance === null) return '';
  
  // For small distances, show in meters
  if (distance < 1) {
    const meters = Math.round(distance * 1000);
    return `${meters} m`;
  }
  
  // For medium distances, show with 1 decimal
  if (distance < 10) {
    return `${distance.toFixed(1)} km`;
  }
  
  // For larger distances, show as whole number
  return `${Math.round(distance)} km`;
};
