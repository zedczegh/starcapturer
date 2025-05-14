
import { SharedAstroSpot } from "@/lib/api/astroSpots";

/**
 * Validate location coordinates are within valid ranges
 * @param location Location to validate
 * @returns boolean indicating if location is valid
 */
export const hasValidCoordinates = (location: SharedAstroSpot): boolean => {
  return Boolean(
    location && 
    typeof location.latitude === 'number' && 
    typeof location.longitude === 'number' &&
    isFinite(location.latitude) &&
    isFinite(location.longitude) &&
    Math.abs(location.latitude) <= 90 &&
    Math.abs(location.longitude) <= 180
  );
};

/**
 * Create a unique ID for a location
 * @param location Location to create ID for
 * @returns string ID
 */
export const getLocationId = (location: SharedAstroSpot): string => {
  return location.id || 
    `location-${location.latitude?.toFixed(6)}-${location.longitude?.toFixed(6)}`;
};

/**
 * Check if a location is a certified dark sky location
 * @param location Location to check
 * @returns boolean indicating if location is certified
 */
export const isCertifiedLocation = (location: SharedAstroSpot): boolean => {
  return location.isDarkSkyReserve === true || 
    (location.certification && location.certification !== '');
};

/**
 * Parse coordinate string input into latitude and longitude
 * Supports various input formats:
 * - "23.131710, 113.266270"
 * - "23.131710 113.266270"
 * - "23.131710,113.266270"
 * - "23°7'54.2"N 113°15'58.6"E" (DMS format)
 * 
 * @param input Coordinate string to parse
 * @returns Object with latitude and longitude if valid, null if invalid
 */
export const parseCoordinateInput = (input: string): { latitude: number, longitude: number } | null => {
  // Trim the input
  const trimmedInput = input.trim();
  
  // Try to match standard decimal format with various separators
  const decimalRegex = /^\s*(-?\d+\.?\d*)\s*[ ,;]\s*(-?\d+\.?\d*)\s*$/;
  const decimalMatch = trimmedInput.match(decimalRegex);
  
  if (decimalMatch) {
    const lat = parseFloat(decimalMatch[1]);
    const lng = parseFloat(decimalMatch[2]);
    
    if (isNaN(lat) || isNaN(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
      return null;
    }
    
    return { latitude: lat, longitude: lng };
  }
  
  // Try to match DMS format
  // This is a simplified DMS parser that handles common formats
  const dmsRegex = /(\d+)°\s*(\d+)?['′]?\s*(\d+\.?\d*)?["″]?\s*([NSns])\s*(\d+)°\s*(\d+)?['′]?\s*(\d+\.?\d*)?["″]?\s*([EWew])/;
  const dmsMatch = trimmedInput.match(dmsRegex);
  
  if (dmsMatch) {
    try {
      // Parse latitude
      const latDeg = parseInt(dmsMatch[1], 10);
      const latMin = dmsMatch[2] ? parseInt(dmsMatch[2], 10) : 0;
      const latSec = dmsMatch[3] ? parseFloat(dmsMatch[3]) : 0;
      const latDir = dmsMatch[4].toUpperCase();
      
      // Parse longitude
      const lngDeg = parseInt(dmsMatch[5], 10);
      const lngMin = dmsMatch[6] ? parseInt(dmsMatch[6], 10) : 0;
      const lngSec = dmsMatch[7] ? parseFloat(dmsMatch[7]) : 0;
      const lngDir = dmsMatch[8].toUpperCase();
      
      // Calculate decimal degrees
      let latitude = latDeg + (latMin / 60) + (latSec / 3600);
      if (latDir === 'S') latitude = -latitude;
      
      let longitude = lngDeg + (lngMin / 60) + (lngSec / 3600);
      if (lngDir === 'W') longitude = -longitude;
      
      if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
        return null;
      }
      
      return { latitude, longitude };
    } catch (e) {
      return null;
    }
  }
  
  return null;
};

/**
 * Validate if a string is a valid coordinate input
 * @param input String to validate
 * @returns boolean indicating if input is valid coordinates
 */
export const isCoordinateInputValid = (input: string): boolean => {
  return parseCoordinateInput(input) !== null;
};
