
/**
 * Geographic utilities
 * IMPORTANT: These functions perform critical calculations.
 * Any changes should be carefully tested against edge cases.
 */

/**
 * Earth's radius in kilometers
 */
export const EARTH_RADIUS = 6371; 

/**
 * Convert degrees to radians
 */
export const degToRad = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};

/**
 * Format distance in kilometers
 * @param distance Distance in kilometers
 * @returns Formatted distance string
 */
export const formatDistance = (distance: number): string => {
  if (distance < 1) {
    return `${(distance * 1000).toFixed(0)} m`;
  } else {
    return `${distance.toFixed(1)} km`;
  }
};

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param lat1 Latitude of first point in degrees
 * @param lon1 Longitude of first point in degrees
 * @param lat2 Latitude of second point in degrees
 * @param lon2 Longitude of second point in degrees
 * @returns Distance in kilometers
 */
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = EARTH_RADIUS; // Earth's radius in kilometers
  const dLat = degToRad(lat2 - lat1);
  const dLon = degToRad(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(degToRad(lat1)) * Math.cos(degToRad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

/**
 * Helper functions for SIQS score handling
 */

/**
 * Get a safe SIQS score regardless of input format
 */
export const getSafeScore = (siqs?: number | { score: number; isViable: boolean }): number => {
  if (siqs === undefined) return 0;
  if (typeof siqs === 'number') return siqs;
  return siqs.score;
};

/**
 * Format SIQS score for display
 */
export const formatSIQSScore = (
  siqs?: number | { score: number; isViable: boolean }, 
  decimals: number = 1
): string => {
  const score = getSafeScore(siqs);
  return score ? score.toFixed(decimals) : 'N/A';
};

/**
 * Check if a location is in water
 */
export const isWaterLocation = (lat: number, lon: number, checkCoastal: boolean = true): boolean => {
  // Import utility from locationValidator to prevent circular imports
  try {
    const { isWaterLocation: checkWaterLocation } = require('@/utils/locationValidator');
    return checkWaterLocation(lat, lon, checkCoastal);
  } catch (error) {
    // Fallback implementation if import fails
    return false;
  }
};

