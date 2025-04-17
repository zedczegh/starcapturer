
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

// Coastlines with known water presence (simplified)
const coastalRegions = [
  { name: 'US West Coast', minLat: 32, maxLat: 49, minLon: -125, maxLon: -122 },
  { name: 'US East Coast', minLat: 25, maxLat: 45, minLon: -82, maxLon: -75 },
  { name: 'Mediterranean Coast', minLat: 30, maxLat: 45, minLon: -5, maxLon: 36 },
  { name: 'China East Coast', minLat: 18, maxLat: 41, minLon: 117, maxLon: 124 },
  { name: 'Japan Coast', minLat: 31, maxLat: 46, minLon: 129, maxLon: 142 },
  { name: 'Australia Coast', minLat: -39, maxLat: -10, minLon: 113, maxLon: 154 },
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
 * Check if a location is likely in a coastal water area
 * @param latitude Latitude
 * @param longitude Longitude
 * @returns True if location is likely coastal water
 */
export function isLikelyCoastalWater(latitude: number, longitude: number): boolean {
  // Normalize longitude to -180 to 180 range
  const normalizedLon = ((longitude + 180) % 360 + 360) % 360 - 180;
  
  // Check if in a known coastal region first
  for (const region of coastalRegions) {
    if (
      latitude >= region.minLat && 
      latitude <= region.maxLat && 
      normalizedLon >= region.minLon && 
      normalizedLon <= region.maxLon
    ) {
      // For coastal regions, we need additional checks to determine
      // if the location is actually in water or on land
      
      // This is a simplified approach - real implementation would use 
      // shoreline GeoJSON data for precise water/land detection
      
      // Increased probability of being in water as we move toward major water bodies
      for (const waterBody of majorWaterBodies) {
        const distance = haversineDistance(latitude, longitude, waterBody.lat, waterBody.lon);
        // Within coastal region and also close to major water body - likely in water
        if (distance < 100) {
          return true;
        }
      }
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
