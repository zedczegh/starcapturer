
import { detectWaterLocation, verifyLandLocation } from '../waterDetection/enhancedWaterDetector';

/**
 * Check if coordinates represent a water location
 */
export const isWaterLocation = (
  latitude: number, 
  longitude: number,
  isCertified: boolean = false
): boolean => {
  // Skip water detection for certified locations
  if (isCertified) return false;
  
  try {
    // First check if coordinates are valid
    if (!isFinite(latitude) || !isFinite(longitude) ||
        Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
      return false;
    }
    
    // Use enhanced water detection with a higher threshold to avoid false positives
    const result = detectWaterLocation(latitude, longitude);
    return result.isWater && result.confidence > 0.85; // Increased threshold to avoid false positives
  } catch (error) {
    console.error("Error in water location check:", error);
    return false; // Default to non-water on error to avoid filtering too many locations
  }
};

/**
 * Check if a location is likely to be coastal water
 */
export const isLikelyCoastalWater = (
  latitude: number,
  longitude: number
): boolean => {
  if (latitude < -60 || latitude > 75) {
    return false;
  }
  
  const knownCoastalZones = [
    [25, 45, -80, -70],   // US East Coast
    [36, 60, -10, 20],    // European coastline
    [20, 45, 110, 145]    // East Asian coastlines
  ];
  
  for (const [minLat, maxLat, minLng, maxLng] of knownCoastalZones) {
    if (latitude >= minLat && latitude <= maxLat && 
        longitude >= minLng && longitude <= maxLng) {
      
      const knownCoastalPoints = getCoastalPointsForZone(latitude, longitude);
      
      if (knownCoastalPoints.length > 0) {
        for (const [pointLat, pointLng, radius] of knownCoastalPoints) {
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

function getCoastalPointsForZone(lat: number, lng: number): [number, number, number][] {
  if (lat > 25 && lat < 45 && lng > -80 && lng < -70) {
    return [
      [40.7, -74.0, 0.4], // NYC area
      [42.3, -71.0, 0.4], // Boston area
      [38.9, -77.0, 0.3], // DC area
      [25.8, -80.2, 0.5], // Miami area
      [39.2, -76.5, 0.3], // Baltimore
      [29.7, -95.4, 0.5], // Houston
      [32.8, -79.9, 0.3], // Charleston
      [33.8, -78.7, 0.3]  // Myrtle Beach
    ];
  }
  
  if (lat > 36 && lat < 60 && lng > -10 && lng < 20) {
    return [
      [51.5, -0.1, 0.3],  // London
      [53.4, -3.0, 0.3],  // Liverpool
      [43.3, -3.0, 0.3],  // Northern Spain
      [41.4, 2.2, 0.3],   // Barcelona
      [43.7, 7.2, 0.2],   // Monaco/Nice
      [40.8, 14.2, 0.3],  // Naples
      [37.9, 23.7, 0.3]   // Athens
    ];
  }
  
  if (lat > 20 && lat < 45 && lng > 110 && lng < 145) {
    return [
      [35.6, 139.8, 0.3], // Tokyo Bay
      [31.2, 121.5, 0.3], // Shanghai
      [22.3, 114.2, 0.3], // Hong Kong
      [37.6, 126.8, 0.2], // Seoul/Incheon
      [35.2, 129.0, 0.2]  // Busan
    ];
  }
  
  return [];
}
