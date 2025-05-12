
// Cache configuration for SIQS calculator

// Cache durations for different scenarios
export const NIGHT_CACHE_DURATION = 20 * 60 * 1000; // 20 minutes at night
export const DAY_CACHE_DURATION = 10 * 60 * 1000;  // 10 minutes during day
export const AUTO_CLEANUP_INTERVAL = 5 * 60 * 1000; // Automatic cleanup every 5 minutes

/**
 * Determine if it's nighttime for cache duration purposes
 */
export const isNighttime = (): boolean => {
  const hour = new Date().getHours();
  return hour >= 18 || hour < 8; // 6 PM to 8 AM
};

/**
 * Get the appropriate cache duration based on time of day
 */
export const getCacheDuration = (): number => {
  return isNighttime() ? NIGHT_CACHE_DURATION : DAY_CACHE_DURATION;
};

/**
 * Generate a consistent cache key for a location
 * @param latitude Latitude of the location
 * @param longitude Longitude of the location
 */
export const getLocationKey = (latitude: number, longitude: number): string => {
  return `${latitude.toFixed(4)}-${longitude.toFixed(4)}`;
};
