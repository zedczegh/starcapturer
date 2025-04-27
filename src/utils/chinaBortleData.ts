
/**
 * Chinese Bortle Scale Data Utility
 * 
 * Enhanced functionality for determining Bortle scale values in Chinese locations
 * using a comprehensive database of cities, regions, and known light pollution levels.
 */

interface ChineseLocationData {
  name: string;
  latitude: number;
  longitude: number;
  bortleScale: number;
  population?: number;
  isCapital?: boolean;
  region?: string;
}

// Example database of Chinese cities with known Bortle scale values
const chineseLocationDatabase: ChineseLocationData[] = [
  { name: "Beijing", latitude: 39.9042, longitude: 116.4074, bortleScale: 9, population: 21540000, isCapital: true, region: "North" },
  { name: "Shanghai", latitude: 31.2304, longitude: 121.4737, bortleScale: 9, population: 24280000, region: "East" },
  { name: "Guangzhou", latitude: 23.1291, longitude: 113.2644, bortleScale: 8, population: 13080500, region: "South" },
  { name: "Shenzhen", latitude: 22.5431, longitude: 114.0579, bortleScale: 8, population: 12590000, region: "South" },
  { name: "Chengdu", latitude: 30.5728, longitude: 104.0668, bortleScale: 7, population: 16330000, region: "Southwest" },
  { name: "Wuhan", latitude: 30.5928, longitude: 114.3055, bortleScale: 8, population: 11080000, region: "Central" },
  { name: "Tianjin", latitude: 39.3434, longitude: 117.3616, bortleScale: 8, population: 15600000, region: "North" },
  { name: "Xi'an", latitude: 34.3416, longitude: 108.9398, bortleScale: 7, population: 12950000, region: "Northwest" },
  { name: "Chongqing", latitude: 29.4316, longitude: 106.9123, bortleScale: 7, population: 31020000, region: "Southwest" },
  { name: "Hangzhou", latitude: 30.2741, longitude: 120.1551, bortleScale: 7, population: 9800000, region: "East" },
  { name: "Nanjing", latitude: 32.0603, longitude: 118.7969, bortleScale: 7, population: 8470000, region: "East" },
  { name: "Jinan", latitude: 36.6683, longitude: 116.9972, bortleScale: 7, population: 7460000, region: "East" },
  { name: "Shenyang", latitude: 41.8057, longitude: 123.4315, bortleScale: 7, population: 8290000, region: "Northeast" },
  { name: "Harbin", latitude: 45.8038, longitude: 126.5340, bortleScale: 7, population: 10635000, region: "Northeast" },
  { name: "Changchun", latitude: 43.8172, longitude: 125.3240, bortleScale: 7, population: 7920000, region: "Northeast" },
  { name: "Dalian", latitude: 38.9140, longitude: 121.6147, bortleScale: 6, population: 6700000, region: "Northeast" },
  { name: "Qingdao", latitude: 36.0671, longitude: 120.3826, bortleScale: 6, population: 9050000, region: "East" },
  { name: "Ningbo", latitude: 29.8683, longitude: 121.5440, bortleScale: 6, population: 7640000, region: "East" },
  { name: "Kunming", latitude: 25.0389, longitude: 102.7183, bortleScale: 6, population: 6850000, region: "Southwest" },
  { name: "Zhengzhou", latitude: 34.7466, longitude: 113.6253, bortleScale: 7, population: 10120000, region: "Central" },
  { name: "Changsha", latitude: 28.2282, longitude: 112.9388, bortleScale: 7, population: 7040000, region: "Central" },
  { name: "Urumqi", latitude: 43.8256, longitude: 87.6168, bortleScale: 6, population: 3550000, region: "Northwest" },
  { name: "Lhasa", latitude: 29.6500, longitude: 91.1000, bortleScale: 4, population: 559300, region: "Tibet" },
  { name: "Hohhot", latitude: 40.8424, longitude: 111.7490, bortleScale: 6, population: 3060000, region: "Inner Mongolia" },
  { name: "Nanning", latitude: 22.8170, longitude: 108.3665, bortleScale: 6, population: 6910000, region: "South" },
  { name: "Guiyang", latitude: 26.6470, longitude: 106.6302, bortleScale: 6, population: 4850000, region: "Southwest" },
  // Natural dark sky areas and remote locations
  { name: "Nagqu", latitude: 31.4757, longitude: 92.0600, bortleScale: 2, region: "Tibet" },
  { name: "Hoh Xil", latitude: 35.4000, longitude: 93.0000, bortleScale: 1, region: "Qinghai" },
  { name: "Altay", latitude: 47.8453, longitude: 88.1147, bortleScale: 3, region: "Xinjiang" },
  { name: "Greater Khingan", latitude: 50.0000, longitude: 122.0000, bortleScale: 2, region: "Inner Mongolia" },
  { name: "Qilian Mountains", latitude: 38.4500, longitude: 99.5000, bortleScale: 2, region: "Qinghai/Gansu" },
  { name: "Changbai Mountain", latitude: 42.0382, longitude: 128.0614, bortleScale: 3, region: "Northeast" }
];

/**
 * Get the Bortle scale value for a specific Chinese city or location
 * @param cityName The name of the city or location
 * @returns The Bortle scale value (1-9) or null if not found
 */
export function getChineseCityBortleScale(cityName: string): number | null {
  const normalizedName = cityName.toLowerCase();
  
  // Search for exact match first
  const exactMatch = chineseLocationDatabase.find(
    city => city.name.toLowerCase() === normalizedName
  );
  
  if (exactMatch) {
    return exactMatch.bortleScale;
  }
  
  // Check for partial matches (e.g., if city name is part of a larger string)
  const partialMatch = chineseLocationDatabase.find(
    city => normalizedName.includes(city.name.toLowerCase())
  );
  
  return partialMatch ? partialMatch.bortleScale : null;
}

/**
 * Get the Bortle scale for specific coordinates in China
 * @param latitude Latitude
 * @param longitude Longitude
 * @returns The Bortle scale value (1-9) or null if not identified
 */
export function getCityBortleScale(latitude: number, longitude: number): number | null {
  // Convert to numbers if they're strings
  const lat = typeof latitude === 'string' ? parseFloat(latitude) : latitude;
  const lng = typeof longitude === 'string' ? parseFloat(longitude) : longitude;
  
  // Find the closest city in our database
  const closestCities = chineseLocationDatabase
    .map(city => ({
      location: city,
      distance: calculateDistance(lat, lng, city.latitude, city.longitude)
    }))
    .sort((a, b) => a.distance - b.distance);
  
  // If the closest city is within 50km, use its Bortle scale
  if (closestCities.length > 0 && closestCities[0].distance < 50) {
    return closestCities[0].location.bortleScale;
  }
  
  // If we have multiple matches, use a weighted average based on distance
  if (closestCities.length >= 2 && closestCities[1].distance < 100) {
    const city1 = closestCities[0];
    const city2 = closestCities[1];
    const totalDistance = city1.distance + city2.distance;
    
    if (totalDistance > 0) {
      const weight1 = 1 - (city1.distance / totalDistance);
      const weight2 = 1 - (city2.distance / totalDistance);
      
      return Math.round(
        (city1.location.bortleScale * weight1 + city2.location.bortleScale * weight2) / 
        (weight1 + weight2)
      );
    }
  }
  
  // Estimate based on geographic rules if we don't have a close match
  return estimateBortleScaleByGeography(lat, lng);
}

/**
 * Check if coordinates are within China
 * @param latitude Latitude
 * @param longitude Longitude
 * @returns boolean indicating if the location is in China
 */
export function isInChina(latitude: number, longitude: number): boolean {
  // Simple bounding box for China (approximate)
  return latitude >= 18 && latitude <= 53 && longitude >= 73 && longitude <= 135;
}

/**
 * Estimate Bortle scale based on geography when no city data is available
 * @param latitude Latitude
 * @param longitude Longitude
 * @returns Estimated Bortle scale value (1-9)
 */
function estimateBortleScaleByGeography(latitude: number, longitude: number): number {
  // Tibet plateau (high altitude, low population)
  if (latitude >= 28 && latitude <= 36 && longitude >= 80 && longitude <= 95) {
    return 1; // Extremely dark skies
  }
  
  // Xinjiang desert regions
  if (latitude >= 36 && latitude <= 49 && longitude >= 75 && longitude <= 90) {
    return 2; // Very dark skies
  }
  
  // Inner Mongolia grasslands
  if (latitude >= 40 && latitude <= 50 && longitude >= 107 && longitude <= 125) {
    return 3; // Dark skies
  }
  
  // Western mountain regions (Qinghai, Gansu)
  if (latitude >= 32 && latitude <= 40 && longitude >= 92 && longitude <= 105) {
    return 2; // Very dark skies
  }
  
  // Eastern China (generally more developed and populated)
  if (longitude > 114) {
    return 6; // Bright suburban skies
  }
  
  // Default for unknown areas
  return 5; // Suburban skies
}

/**
 * Calculate the distance in kilometers between two points
 * @param lat1 Latitude of point 1
 * @param lon1 Longitude of point 1
 * @param lat2 Latitude of point 2
 * @param lon2 Longitude of point 2
 * @returns Distance in kilometers
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * Get region information for Chinese location
 */
export function getChineseRegion(latitude: number, longitude: number): string | null {
  // Convert to numbers if they're strings
  const lat = typeof latitude === 'string' ? parseFloat(latitude) : latitude;
  const lng = typeof longitude === 'string' ? parseFloat(longitude) : longitude;
  
  // Check if coordinates are in China
  if (!isInChina(lat, lng)) {
    return null;
  }
  
  // Find the closest city with region information
  const closestWithRegion = chineseLocationDatabase
    .filter(city => city.region)
    .map(city => ({
      location: city,
      distance: calculateDistance(lat, lng, city.latitude, city.longitude)
    }))
    .sort((a, b) => a.distance - b.distance);
  
  if (closestWithRegion.length > 0) {
    return closestWithRegion[0].location.region || null;
  }
  
  // Determine region by geography when no city is nearby
  if (lng < 90) return "Western China";
  if (lng > 120) return "Eastern China";
  if (lat > 40) return "Northern China";
  if (lat < 25) return "Southern China";
  
  return "Central China";
}
