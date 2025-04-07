
/**
 * Calculate haversine distance between two points
 */
export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in km
  return distance;
};

/**
 * Convert degrees to radians
 */
export const deg2rad = (deg: number): number => {
  return deg * (Math.PI / 180);
};

/**
 * Format distance in a human-readable way
 */
export const formatDistance = (distance: number): string => {
  if (distance < 1) {
    return `${Math.round(distance * 1000)}m`;
  } else if (distance < 10) {
    return `${distance.toFixed(1)}km`;
  } else {
    return `${Math.round(distance)}km`;
  }
};

/**
 * Format SIQS score to display with one decimal place
 */
export const formatSIQSScore = (score?: number): string => {
  if (score === undefined || score === null) return "N/A";
  return score.toFixed(1);
};

/**
 * Haversine distance calculation - exported for compatibility
 */
export const haversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  return calculateDistance(lat1, lon1, lat2, lon2);
};
