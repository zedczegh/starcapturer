
/**
 * Utility functions for real-time SIQS calculations
 * Extracted from realTimeSiqsService for better modularity
 */

// Constants for cache duration
export const NIGHT_CACHE_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds
export const DAY_CACHE_DURATION = 15 * 60 * 1000; // 15 minutes in milliseconds

/**
 * Generate cache key for SIQS calculations
 * @param latitude Latitude of the location
 * @param longitude Longitude of the location
 * @returns Cache key string
 */
export const generateSiqsCacheKey = (latitude: number, longitude: number): string => {
  return `${latitude.toFixed(4)}-${longitude.toFixed(4)}`;
};

/**
 * Determine if it's nighttime for cache duration
 * @returns Boolean indicating if it's nighttime
 */
export const isNighttime = (): boolean => {
  const hour = new Date().getHours();
  return hour >= 18 || hour < 8; // 6 PM to 8 AM
};

/**
 * Get appropriate cache duration based on time of day
 * @returns Cache duration in milliseconds
 */
export const getCacheDuration = (): number => {
  return isNighttime() ? NIGHT_CACHE_DURATION : DAY_CACHE_DURATION;
};

/**
 * Safely process API response data
 * @param data API response data
 * @param defaultValue Default value to return if data is invalid
 * @returns Processed data or default value
 */
export const safeProcessData = <T>(data: any, defaultValue: T): T => {
  if (!data) return defaultValue;
  try {
    return data as T;
  } catch (error) {
    console.error("Error processing API data:", error);
    return defaultValue;
  }
};

/**
 * Ensure Bortle scale is within valid range
 * @param bortleScale Bortle scale value
 * @returns Valid Bortle scale (1-9)
 */
export const validateBortleScale = (bortleScale: number | undefined): number => {
  if (!bortleScale || bortleScale <= 0 || bortleScale > 9) {
    return 5; // Default fallback
  }
  return bortleScale;
};
