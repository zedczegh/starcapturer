
/**
 * Utility for estimating Bortle scale based on terrain and population
 */

import { getTerrainElevation, detectTerrainType } from './terrainData';

/**
 * Estimate Bortle scale using terrain and population data
 * @param latitude Location latitude
 * @param longitude Location longitude
 * @returns Estimated Bortle scale (1-9) or null if estimation failed
 */
export async function estimateBortleFromTerrainAndPopulation(
  latitude: number,
  longitude: number
): Promise<number | null> {
  try {
    // Get basic terrain information
    const terrainType = await detectTerrainType(latitude, longitude);
    const elevation = await getTerrainElevation(latitude, longitude);
    
    if (!terrainType || elevation === null) {
      return null;
    }
    
    // Base value depending on terrain type
    let baseBortle: number;
    
    switch (terrainType) {
      case 'mountain':
        baseBortle = 2.5;
        break;
      case 'plateau':
        baseBortle = 3;
        break;
      case 'hill':
        baseBortle = 3.5;
        break;
      case 'water':
        baseBortle = 2; // Open water generally has less light pollution
        break;
      case 'valley':
        baseBortle = 4.5; // Valleys can trap light pollution
        break;
      case 'plain':
        baseBortle = 4;
        break;
      default:
        baseBortle = 4;
    }
    
    // Adjust for elevation - higher elevation typically means less light pollution
    // Each 1000m of elevation can improve (reduce) Bortle scale by up to 0.6
    const elevationAdjustment = -(Math.min(elevation, 3000) / 1000) * 0.6;
    
    // Estimate population density based on location
    // This is a simplified approximation
    const populationFactor = estimatePopulationFactor(latitude, longitude);
    
    // Calculate final Bortle scale value
    let finalBortle = baseBortle + elevationAdjustment + populationFactor;
    
    // Ensure the value stays within valid range
    finalBortle = Math.max(1, Math.min(9, finalBortle));
    
    return finalBortle;
  } catch (error) {
    console.error("Error estimating Bortle from terrain:", error);
    return null;
  }
}

/**
 * Estimate population density factor for a location
 * Higher values indicate more light pollution
 * @param latitude Location latitude
 * @param longitude Location longitude
 * @returns Population density factor (0-6)
 */
function estimatePopulationFactor(latitude: number, longitude: number): number {
  // Check for known metropolitan areas
  const cities = [
    { lat: 40.7128, lng: -74.0060, name: "New York", radius: 50, factor: 5 },
    { lat: 34.0522, lng: -118.2437, name: "Los Angeles", radius: 50, factor: 4.5 },
    { lat: 51.5074, lng: -0.1278, name: "London", radius: 40, factor: 4.5 },
    { lat: 39.9042, lng: 116.4074, name: "Beijing", radius: 60, factor: 5 },
    { lat: 19.4326, lng: -99.1332, name: "Mexico City", radius: 50, factor: 4.5 },
    { lat: 35.6762, lng: 139.6503, name: "Tokyo", radius: 50, factor: 5.5 },
    { lat: 28.6139, lng: 77.2090, name: "Delhi", radius: 50, factor: 4.5 },
    { lat: 37.7749, lng: -122.4194, name: "San Francisco", radius: 40, factor: 4 },
    { lat: 55.7558, lng: 37.6173, name: "Moscow", radius: 40, factor: 4.5 },
    { lat: 31.2304, lng: 121.4737, name: "Shanghai", radius: 50, factor: 5 }
  ];
  
  for (const city of cities) {
    const distance = calculateDistance(latitude, longitude, city.lat, city.lng);
    if (distance < city.radius) {
      // The closer to center, the stronger the effect
      const proximityFactor = 1 - (distance / city.radius);
      return city.factor * proximityFactor;
    }
  }
  
  // Check if in urban regions
  if (isLikelyUrbanRegion(latitude, longitude)) {
    return 3; // Moderate light pollution for general urban areas
  }
  
  // Default for rural/wilderness regions
  return 1;
}

/**
 * Calculate distance between two points on Earth
 * @param lat1 Latitude of first point
 * @param lon1 Longitude of first point
 * @param lat2 Latitude of second point
 * @param lon2 Longitude of second point
 * @returns Distance in kilometers
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * Check if location is likely in an urban region
 * @param latitude Location latitude 
 * @param longitude Location longitude
 * @returns Boolean indicating if location is in urban region
 */
function isLikelyUrbanRegion(latitude: number, longitude: number): boolean {
  // Simple heuristic based on common urban areas
  // East Coast US
  if (longitude > -80 && longitude < -70 && latitude > 35 && latitude < 45) {
    return true;
  }
  
  // Western Europe
  if (longitude > -5 && longitude < 20 && latitude > 43 && latitude < 55) {
    return true;
  }
  
  // East Asia
  if (longitude > 115 && longitude < 145 && latitude > 30 && latitude < 45) {
    return true;
  }
  
  // India
  if (longitude > 70 && longitude < 90 && latitude > 8 && latitude < 35) {
    return true;
  }
  
  return false;
}
