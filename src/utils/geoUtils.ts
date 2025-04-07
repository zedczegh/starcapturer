
/**
 * Calculate distance between two geographic coordinates
 * @param lat1 Latitude of first point
 * @param lon1 Longitude of first point
 * @param lat2 Latitude of second point
 * @param lon2 Longitude of second point
 * @returns Distance in kilometers
 */
export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
};

/**
 * Convert degrees to radians
 * @param deg Angle in degrees
 * @returns Angle in radians
 */
export const deg2rad = (deg: number): number => {
  return deg * (Math.PI / 180);
};

/**
 * Haversine formula for calculating distance between two points
 * This is identical to calculateDistance but kept for backward compatibility
 * @param lat1 Latitude of first point
 * @param lon1 Longitude of first point
 * @param lat2 Latitude of second point
 * @param lon2 Longitude of second point
 * @returns Distance in kilometers
 */
export const haversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  return calculateDistance(lat1, lon1, lat2, lon2);
};

/**
 * Format distance in a user-friendly way
 * @param distance Distance in kilometers
 * @returns Formatted distance string
 */
export const formatDistance = (distance: number): string => {
  if (distance < 1) {
    return `${Math.round(distance * 1000)} m`;
  }
  return `${distance.toFixed(1)} km`;
};

/**
 * Sort locations by distance from a reference point
 * @param locations Array of locations with lat/lng
 * @param refLat Reference latitude
 * @param refLng Reference longitude
 * @returns Sorted array with added distance property
 */
export const sortLocationsByDistance = (
  locations: Array<{ latitude: number; longitude: number }>,
  refLat: number,
  refLng: number
): Array<{ latitude: number; longitude: number; distance: number }> => {
  return locations
    .map(location => ({
      ...location,
      distance: calculateDistance(refLat, refLng, location.latitude, location.longitude)
    }))
    .sort((a, b) => a.distance - b.distance);
};

/**
 * Get a safe SIQS score value from potentially complex SIQS data
 * @param siqs SIQS value that could be a number or an object
 * @returns Numeric SIQS score or 0 if unavailable
 */
export const getSafeScore = (siqs?: number | { score: number; isViable: boolean }): number => {
  if (siqs === undefined) return 0;
  if (typeof siqs === 'number') return siqs;
  return siqs.score;
};

/**
 * Format a SIQS score to a fixed decimal place
 * @param siqs SIQS value that could be a number or an object
 * @param decimals Number of decimal places
 * @returns Formatted string or 'N/A' if unavailable
 */
export const formatSIQSScore = (
  siqs?: number | { score: number; isViable: boolean }, 
  decimals: number = 1
): string => {
  const score = getSafeScore(siqs);
  return score ? score.toFixed(decimals) : 'N/A';
};
