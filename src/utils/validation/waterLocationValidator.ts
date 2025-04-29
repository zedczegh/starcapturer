
import { isWaterLocation as checkWaterLocation } from "@/utils/locationWaterCheck";

/**
 * Check if coordinates represent a water location
 * This is a critical function for filtering out unusable spots
 * Now with enhanced water detection including coastlines and large water bodies
 */
export const isWaterLocation = (
  latitude: number, 
  longitude: number,
  isCertified: boolean = false
): boolean => {
  // CRITICAL: If it's a certified location, NEVER consider it a water location
  // This ensures certified locations are always displayed regardless of location
  if (isCertified) return false;
  
  // First check: Basic water detection
  if (checkWaterLocation(latitude, longitude, false)) {
    return true;
  }
  
  // Second check: Coastline detection
  if (isLikelyCoastalWater(latitude, longitude)) {
    return true;
  }
  
  return false;
};

/**
 * Enhanced water detection for coastal areas
 */
export const isLikelyCoastalWater = (
  latitude: number,
  longitude: number
): boolean => {
  // Known coastal waters lookup table (compressed for better performance)
  const coastalZones = [
    // Major coastlines (lat1, lat2, lng1, lng2)
    [25, 50, -130, -115], // US West Coast
    [25, 45, -85, -75],   // US East Coast
    [35, 60, -10, 20],    // European Coast
    [30, 45, 115, 145],   // East Asian Coast
    [0, 25, 110, 125],    // Southeast Asian Waters
  ];
  
  // Check if point falls within any coastal zone
  for (const [minLat, maxLat, minLng, maxLng] of coastalZones) {
    if (latitude >= minLat && latitude <= maxLat && 
        longitude >= minLng && longitude <= maxLng) {
      return true;
    }
  }
  
  return false;
};

/**
 * Check if a location is likely to be coastal water
 * Enhanced detection for coastal areas with faster processing
 * @param latitude Location latitude
 * @param longitude Location longitude
 * @returns boolean indicating if location is likely coastal water
 */
export const isLikelyCoastalWaterOld = (
  latitude: number,
  longitude: number
): boolean => {
  // Enhanced coastal waters detection
  // First, quickly check if it's a remote area before doing more intensive checks
  if (latitude < -60 || latitude > 75) {
    return false; // No need to check coastal areas in polar regions
  }
  
  // Lookup tables for faster performance rather than calculating distances
  const knownCoastalZones = [
    // US East Coast - compressed representation
    [25, 45, -80, -70],
    // European coastline
    [36, 60, -10, 20],
    // East Asian coastlines
    [20, 45, 110, 145]
  ];
  
  // First, do a quick check if we're in any of the coastal zones
  for (const [minLat, maxLat, minLng, maxLng] of knownCoastalZones) {
    if (latitude >= minLat && latitude <= maxLat && 
        longitude >= minLng && longitude <= maxLng) {
      
      // Now check specific coastal points - only if we're in the general area
      const knownCoastalPoints = getCoastalPointsForZone(latitude, longitude);
      
      if (knownCoastalPoints.length > 0) {
        for (const [pointLat, pointLng, radius] of knownCoastalPoints) {
          // Use squared distance for performance (avoid sqrt)
          const squaredDistance = Math.pow(latitude - pointLat, 2) + 
                                 Math.pow(longitude - pointLng, 2);
          
          if (squaredDistance < radius * radius) {
            return true;
          }
        }
      }
    }
  }
  
  return false;
};

/**
 * Helper function to get coastal points for a specific zone
 * This optimizes performance by only loading points relevant to the area
 */
function getCoastalPointsForZone(lat: number, lng: number): [number, number, number][] {
  // US East Coast
  if (lat > 25 && lat < 45 && lng > -80 && lng < -70) {
    return [
      [40.7, -74.0, 0.4], // NYC area
      [42.3, -71.0, 0.4], // Boston area
      [38.9, -77.0, 0.3], // DC area
      [25.8, -80.2, 0.5], // Miami area
      [39.2, -76.5, 0.3], // Baltimore
      [29.7, -95.4, 0.5], // Houston
      [32.8, -79.9, 0.3], // Charleston
      [33.8, -78.7, 0.3], // Myrtle Beach
    ];
  }
  
  // European coastline
  if (lat > 36 && lat < 60 && lng > -10 && lng < 20) {
    return [
      [51.5, -0.1, 0.3], // London
      [53.4, -3.0, 0.3], // Liverpool
      [43.3, -3.0, 0.3], // Northern Spain
      [41.4, 2.2, 0.3],  // Barcelona
      [43.7, 7.2, 0.2],  // Monaco/Nice
      [40.8, 14.2, 0.3], // Naples
      [37.9, 23.7, 0.3], // Athens
    ];
  }
  
  // East Asian coastlines
  if (lat > 20 && lat < 45 && lng > 110 && lng < 145) {
    return [
      [35.6, 139.8, 0.3], // Tokyo Bay
      [31.2, 121.5, 0.3], // Shanghai
      [22.3, 114.2, 0.3], // Hong Kong
      [37.6, 126.8, 0.2], // Seoul/Incheon
      [35.2, 129.0, 0.2], // Busan
    ];
  }
  
  return [];
}
