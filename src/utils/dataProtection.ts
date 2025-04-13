
/**
 * Data validation and protection utilities
 * These functions help validate inputs and protect core algorithms
 */

import { SharedAstroSpot } from "@/lib/api/astroSpots";

/**
 * Validate location data to prevent errors and attacks
 * @param location Location to validate
 * @returns Validated location data
 */
export function validateLocation(location: Partial<SharedAstroSpot>): SharedAstroSpot {
  // Create a sanitized copy of the location
  const sanitized: SharedAstroSpot = {
    // Required properties with fallbacks
    id: location.id || `loc-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    name: sanitizeString(location.name || 'Unnamed Location'),
    latitude: sanitizeCoordinate(location.latitude, 0, -90, 90),
    longitude: sanitizeCoordinate(location.longitude, 0, -180, 180),
    
    // Optional properties
    chineseName: sanitizeString(location.chineseName),
    description: sanitizeString(location.description),
    bortleScale: sanitizeNumber(location.bortleScale, 4, 1, 9),
    siqs: sanitizeNumber(location.siqs, undefined, 0, 10),
    certification: sanitizeString(location.certification),
    isDarkSkyReserve: typeof location.isDarkSkyReserve === 'boolean' ? location.isDarkSkyReserve : false,
    distance: sanitizeNumber(location.distance),
    timestamp: location.timestamp || new Date().toISOString()
  };
  
  return sanitized;
}

/**
 * Sanitize a string value
 * @param value String to sanitize
 * @returns Sanitized string or undefined
 */
export function sanitizeString(value?: string): string | undefined {
  if (typeof value !== 'string') return undefined;
  // Basic XSS protection - remove script tags and limit length
  return value.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .substring(0, 1000); // Reasonable length limit
}

/**
 * Sanitize a numeric coordinate
 * @param value Coordinate value to sanitize
 * @param defaultValue Default value if invalid
 * @param min Minimum allowed value
 * @param max Maximum allowed value
 * @returns Sanitized coordinate value
 */
export function sanitizeCoordinate(
  value?: number, 
  defaultValue: number = 0,
  min: number = -180,
  max: number = 180
): number {
  if (typeof value !== 'number' || isNaN(value) || !isFinite(value)) {
    return defaultValue;
  }
  return Math.max(min, Math.min(max, value));
}

/**
 * Sanitize a numeric value
 * @param value Number to sanitize
 * @param defaultValue Default value if invalid
 * @param min Minimum allowed value
 * @param max Maximum allowed value
 * @returns Sanitized number or undefined
 */
export function sanitizeNumber(
  value?: number, 
  defaultValue?: number,
  min?: number,
  max?: number
): number | undefined {
  if (typeof value !== 'number' || isNaN(value) || !isFinite(value)) {
    return defaultValue;
  }
  
  if (min !== undefined && value < min) {
    return min;
  }
  
  if (max !== undefined && value > max) {
    return max;
  }
  
  return value;
}

/**
 * Validate array of locations
 * @param locations Array of locations to validate
 * @returns Array of validated locations
 */
export function validateLocations(locations: Array<Partial<SharedAstroSpot>>): SharedAstroSpot[] {
  if (!Array.isArray(locations)) return [];
  
  return locations
    .filter(loc => loc && typeof loc === 'object')
    .map(validateLocation);
}

/**
 * Create a deep copy of data to prevent reference manipulation
 * @param data Data to copy
 * @returns Deep copy of data
 */
export function deepCopy<T>(data: T): T {
  if (data === null || data === undefined) return data;
  return JSON.parse(JSON.stringify(data));
}
