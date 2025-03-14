
/**
 * Normalize longitude to the range [-180, 180]
 */
export function normalizeLongitude(longitude: number): number {
  // Handle values outside the -180 to 180 range
  let normalizedLongitude = longitude;
  while (normalizedLongitude > 180) {
    normalizedLongitude -= 360;
  }
  while (normalizedLongitude < -180) {
    normalizedLongitude += 360;
  }
  return normalizedLongitude;
}

/**
 * Normalize latitude to the range [-90, 90]
 */
export function normalizeLatitude(latitude: number): number {
  return Math.max(-90, Math.min(90, latitude));
}

/**
 * Validates and corrects coordinates to ensure they're within valid ranges
 */
export function validateCoordinates(coordinates: { latitude: number; longitude: number }): { latitude: number; longitude: number } {
  const { latitude, longitude } = coordinates;
  
  return {
    latitude: normalizeLatitude(latitude),
    longitude: normalizeLongitude(longitude)
  };
}

/**
 * Format coordinates to a user-friendly string
 */
export function formatCoordinates(latitude: number, longitude: number, decimals = 6): string {
  return `${latitude.toFixed(decimals)}°, ${longitude.toFixed(decimals)}°`;
}

/**
 * Calculate distance between two points using the Haversine formula
 * @param lat1 Latitude of point 1
 * @param lon1 Longitude of point 1
 * @param lat2 Latitude of point 2
 * @param lon2 Longitude of point 2
 * @returns Distance in kilometers
 */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
