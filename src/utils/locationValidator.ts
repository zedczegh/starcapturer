
/**
 * Utility functions for validating location data
 */

import { haversineDistance } from './geoUtils';

// Water body locations (simplified representation)
const majorWaterBodies = [
  { name: 'Pacific Ocean', lat: 0, lon: -160 },
  { name: 'Atlantic Ocean', lat: 0, lon: -30 },
  { name: 'Indian Ocean', lat: -10, lon: 80 },
  { name: 'Mediterranean Sea', lat: 35, lon: 18 },
  { name: 'Caribbean Sea', lat: 15, lon: -75 },
  { name: 'South China Sea', lat: 15, lon: 115 },
  { name: 'Bay of Bengal', lat: 15, lon: 90 },
  { name: 'Gulf of Mexico', lat: 25, lon: -90 },
  { name: 'Arabian Sea', lat: 15, lon: 65 },
];

/**
 * Check if a location is likely to be on water
 * @param latitude Latitude
 * @param longitude Longitude
 * @param useExtensiveCheck Use more intensive checking (optional)
 * @returns True if location is likely on water
 */
export function isWaterLocation(
  latitude: number, 
  longitude: number,
  useExtensiveCheck: boolean = false
): boolean {
  // Skip extensive checks for coast locations
  // This is a simplified check - in a real app we would use GeoJSON data
  for (const waterBody of majorWaterBodies) {
    const distance = haversineDistance(
      latitude, 
      longitude, 
      waterBody.lat, 
      waterBody.lon
    );
    
    // Different water bodies have different sizes
    let threshold = 0;
    
    // Adjust threshold based on water body
    switch (waterBody.name) {
      case 'Pacific Ocean':
      case 'Atlantic Ocean':
      case 'Indian Ocean':
        threshold = 1500; // Large oceans
        break;
      case 'Mediterranean Sea':
      case 'Caribbean Sea':
      case 'South China Sea':
      case 'Bay of Bengal':
      case 'Gulf of Mexico':
      case 'Arabian Sea':
        threshold = 500; // Smaller seas
        break;
      default:
        threshold = 300;
    }
    
    if (distance < threshold) {
      return true;
    }
  }
  
  return false;
}

/**
 * Check if a location is likely a valid astronomy spot
 */
export function isValidAstronomyLocation(
  latitude: number,
  longitude: number,
  locationName?: string
): boolean {
  // Check if location is on water
  if (isWaterLocation(latitude, longitude)) {
    return false;
  }
  
  // Check for null island (0,0) - common error case
  if (Math.abs(latitude) < 0.01 && Math.abs(longitude) < 0.01) {
    return false;
  }
  
  // Check for obviously incorrect coordinates
  if (latitude > 90 || latitude < -90 || longitude > 180 || longitude < -180) {
    return false;
  }
  
  // Location name blacklist (simplified)
  if (locationName) {
    const lowerName = locationName.toLowerCase();
    const blacklist = ['ocean', 'sea', 'bay', 'gulf', 'strait', 'lake'];
    
    for (const term of blacklist) {
      if (lowerName.includes(term)) {
        return false;
      }
    }
  }
  
  return true;
}
