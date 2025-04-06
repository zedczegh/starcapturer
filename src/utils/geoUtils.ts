
/**
 * Format SIQS score for display
 * @param score The raw SIQS score
 * @returns Formatted string representation of the score
 */
export const formatSIQSScore = (score?: number): string => {
  if (score === undefined || score === null) return '—';
  if (score <= 0) return '0';
  return score.toFixed(1);
};

/**
 * Calculate distance between two points in kilometers
 * @param lat1 Latitude of first point
 * @param lon1 Longitude of first point
 * @param lat2 Latitude of second point
 * @param lon2 Longitude of second point
 * @returns Distance in kilometers
 */
export const getDistanceFromLatLonInKm = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

/**
 * Convert degrees to radians
 * @param deg Angle in degrees
 * @returns Angle in radians
 */
const deg2rad = (deg: number): number => {
  return deg * (Math.PI/180);
};

/**
 * Format location name based on available information
 * @param name Primary name
 * @param chineseName Chinese name if available
 * @returns Properly formatted location name
 */
export const formatLocationName = (name?: string, chineseName?: string): string => {
  if (!name && !chineseName) return 'Unknown Location';
  if (!name) return chineseName!;
  if (!chineseName) return name;
  return `${name} (${chineseName})`;
};
