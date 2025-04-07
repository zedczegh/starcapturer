import { haversineDistance } from '@/utils/geoUtils';

/**
 * Find the nearest towns to a given location
 * This is used to get weather forecasts efficiently without making too many API calls
 * 
 * @param latitude - Latitude of the location
 * @param longitude - Longitude of the location
 * @param limit - Maximum number of towns to return
 * @returns Array of nearest towns with coordinates
 */
export const findNearestTowns = async (
  latitude: number,
  longitude: number,
  limit: number = 2
): Promise<Array<{name: string, latitude: number, longitude: number, distance: number}>> => {
  try {
    // We'll use a small set of known cities/towns to avoid too many API calls
    // In a real implementation, this would use a more comprehensive database
    const getTownDatabase = async () => {
      // This could be loaded from an API or static file in a real implementation
      return [
        // This is a simplified list - a real implementation would have many more entries
        { name: "Beijing", latitude: 39.9042, longitude: 116.4074 },
        { name: "Shanghai", latitude: 31.2304, longitude: 121.4737 },
        { name: "Guangzhou", latitude: 23.1291, longitude: 113.2644 },
        { name: "Shenzhen", latitude: 22.5431, longitude: 114.0579 },
        { name: "Chengdu", latitude: 30.5723, longitude: 104.0665 },
        { name: "Hangzhou", latitude: 30.2741, longitude: 120.1552 },
        { name: "Wuhan", latitude: 30.5928, longitude: 114.3055 },
        { name: "Xi'an", latitude: 34.3416, longitude: 108.9398 },
        { name: "Nanjing", latitude: 32.0603, longitude: 118.7969 },
        { name: "Tianjin", latitude: 39.3434, longitude: 117.3616 },
        { name: "Chongqing", latitude: 29.4316, longitude: 106.9123 },
        { name: "Suzhou", latitude: 31.2990, longitude: 120.5853 },
        { name: "Zhengzhou", latitude: 34.7466, longitude: 113.6253 },
        { name: "Kunming", latitude: 25.0389, longitude: 102.7183 },
        { name: "Dalian", latitude: 38.9140, longitude: 121.6147 },
        { name: "Qingdao", latitude: 36.0671, longitude: 120.3826 },
        { name: "Lhasa", latitude: 29.6500, longitude: 91.1000 },
        { name: "Urumqi", latitude: 43.8256, longitude: 87.6168 }
      ];
    };
    
    const towns = await getTownDatabase();
    
    // Calculate distance to each town
    const townsWithDistance = towns.map(town => ({
      ...town,
      distance: haversineDistance(latitude, longitude, town.latitude, town.longitude)
    }));
    
    // Sort by distance (closest first) and limit results
    return townsWithDistance
      .sort((a, b) => a.distance - b.distance)
      .slice(0, limit);
      
  } catch (error) {
    console.error("Error finding nearest towns:", error);
    return [];
  }
};

/**
 * Estimate Bortle scale for a location based on its name and coordinates
 * This is used as a fallback when no direct measurements are available
 * 
 * @param locationName - Name of the location
 * @param latitude - Latitude of the location 
 * @param longitude - Longitude of the location
 * @returns Estimated Bortle scale (1-9)
 */
export const estimateBortleScaleByLocation = (
  locationName: string,
  latitude: number,
  longitude: number
): number => {
  // Convert to lowercase for easier matching
  const name = locationName.toLowerCase();
  
  // Check for urban indicators in name
  const isUrban = [
    'city', 'town', 'urban', 'metropolis', 'downtown', 'district',
    '城市', '城区', '市区', '城镇', '郊区', '新区'
  ].some(term => name.includes(term));
  
  // Check for rural/natural indicators in name
  const isRural = [
    'village', 'rural', 'countryside', 'farm', 'hamlet',
    '村', '乡村', '农村', '庄园', '农场'
  ].some(term => name.includes(term));
  
  // Check for natural/dark sky indicators
  const isNatural = [
    'mountain', 'forest', 'wilderness', 'reserve', 'park', 'national park', 
    'peak', 'desert', 'canyon',
    '山', '林', '森林', '自然保护区', '公园', '国家公园', '峰', '沙漠', '峡谷'
  ].some(term => name.includes(term));
  
  // Base estimate starting at Bortle 5 (typical suburban/rural transition)
  let bortleEstimate = 5;
  
  // Adjust based on indicators in name
  if (isUrban) bortleEstimate += 2;
  if (isRural) bortleEstimate -= 1;
  if (isNatural) bortleEstimate -= 2;
  
  // Ensure value is within valid range
  return Math.max(1, Math.min(9, bortleEstimate));
};

/**
 * Find a spot with potentially lower light pollution within a given radius
 * 
 * @param latitude - Starting latitude
 * @param longitude - Starting longitude
 * @param radius - Search radius in kilometers
 * @returns Coordinates of a potentially darker spot
 */
export const findLowerLightPollutionSpot = (
  latitude: number,
  longitude: number,
  radius: number,
  bortleScale?: number
): {latitude: number, longitude: number} => {
  // Simple implementation - move slightly away from populated areas
  // In a real implementation, this would use actual light pollution data
  
  // If we have a low Bortle scale already (1-3), don't move
  if (bortleScale && bortleScale <= 3) {
    return {latitude, longitude};
  }
  
  // Generate a random direction (0-360 degrees)
  const angle = Math.random() * 2 * Math.PI;
  
  // Move 50-80% of the radius in that direction
  const distance = (0.5 + Math.random() * 0.3) * radius;
  
  // Convert to approximate lat/lng change
  // This is a simplified calculation that works for relatively small distances
  const latChange = (distance / 111.32) * Math.cos(angle);
  const lngChange = (distance / (111.32 * Math.cos(latitude * Math.PI / 180))) * Math.sin(angle);
  
  return {
    latitude: latitude + latChange,
    longitude: longitude + lngChange
  };
};

/**
 * Find the closest known location with accurate Bortle scale data
 */
export const findClosestKnownLocation = (
  latitude: number,
  longitude: number
): {
  name: string;
  bortleScale: number;
  distance: number;
} | null => {
  // Simple implementation that could be expanded
  try {
    const { findClosestLocationImpl } = require('../data/utils/locationFinder');
    return findClosestLocationImpl(latitude, longitude, []);
  } catch (error) {
    console.warn("Location finder not available:", error);
    return null;
  }
};

/**
 * Calculate haversine distance between two points
 * This function is also defined in geoUtils.ts but included here for completeness
 */
export const calculateDistance = (
  lat1: number, 
  lon1: number, 
  lat2: number, 
  lon2: number
): number => {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c; // Distance in km
  
  return distance;
};

function deg2rad(deg: number): number {
  return deg * (Math.PI/180);
}
