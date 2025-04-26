
/**
 * China-specific Bortle scale data
 * 
 * This module provides specialized Bortle scale estimation for locations in China,
 * which often have unique light pollution characteristics.
 */

// Detect if a location is within China's borders
export function isInChina(latitude: number, longitude: number): boolean {
  // Simple bounding box check for mainland China
  return (
    latitude >= 18 && latitude <= 53 &&
    longitude >= 73 && longitude <= 135
  );
}

// Lookup table for known cities in China with accurate Bortle measurements
interface CityBortleData {
  latitude: number;
  longitude: number;
  bortleScale: number;
  name: string;
  chineseName: string;
  radius: number; // km
}

// Some major cities with their approximate Bortle scales
const CHINA_CITIES: CityBortleData[] = [
  { latitude: 39.9042, longitude: 116.4074, bortleScale: 9, name: "Beijing", chineseName: "北京", radius: 50 },
  { latitude: 31.2304, longitude: 121.4737, bortleScale: 9, name: "Shanghai", chineseName: "上海", radius: 45 },
  { latitude: 22.5431, longitude: 114.0579, bortleScale: 8.5, name: "Shenzhen", chineseName: "深圳", radius: 30 },
  { latitude: 23.1291, longitude: 113.2644, bortleScale: 8.5, name: "Guangzhou", chineseName: "广州", radius: 35 },
  { latitude: 30.5928, longitude: 114.3055, bortleScale: 8, name: "Wuhan", chineseName: "武汉", radius: 25 },
  { latitude: 29.5516, longitude: 106.5478, bortleScale: 8, name: "Chongqing", chineseName: "重庆", radius: 30 },
  { latitude: 28.2280, longitude: 112.9388, bortleScale: 7.5, name: "Changsha", chineseName: "长沙", radius: 20 },
  { latitude: 34.2583, longitude: 108.9286, bortleScale: 7.5, name: "Xi'an", chineseName: "西安", radius: 20 },
  { latitude: 43.8256, longitude: 87.6168, bortleScale: 7, name: "Urumqi", chineseName: "乌鲁木齐", radius: 15 },
  { latitude: 36.6512, longitude: 101.7535, bortleScale: 6, name: "Xining", chineseName: "西宁", radius: 10 },
  { latitude: 29.6500, longitude: 91.1000, bortleScale: 5, name: "Lhasa", chineseName: "拉萨", radius: 8 }
];

// Calculate the distance between two points using the Haversine formula
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
 * Get the Bortle scale for a known Chinese city based on precise coordinates
 * 
 * @param latitude Latitude coordinate
 * @param longitude Longitude coordinate
 * @returns Bortle scale if location is within a known city, null otherwise
 */
export function getCityBortleScale(latitude: number, longitude: number): number | null {
  for (const city of CHINA_CITIES) {
    const distance = calculateDistance(latitude, longitude, city.latitude, city.longitude);
    if (distance <= city.radius) {
      // For locations within the city, calculate a gradient based on distance from center
      // City centers have higher light pollution
      const distanceFactor = distance / city.radius; // 0 at center, 1 at edge
      const bortleReduction = distanceFactor * 0.5; // Up to 0.5 reduction at edges
      
      return Math.max(1, city.bortleScale - bortleReduction);
    }
  }
  
  return null; // Not within any known city
}

/**
 * Get additional information about a Chinese location including recommended
 * viewing times and seasonal considerations
 */
export function getChineseLocationInfo(latitude: number, longitude: number): {
  bestTimeOfYear: string;
  notes: string;
  pollutionFactor: number;
} {
  // Default values
  let bestTimeOfYear = "Winter (December-February)";
  let notes = "Best viewing on clear nights away from urban areas.";
  let pollutionFactor = 1.0;
  
  // Northern China: generally better winter viewing due to reduced air pollution
  if (latitude > 35) {
    bestTimeOfYear = "Late autumn to early spring";
    notes = "Winter has clearest skies but cold temperatures. Check air quality reports before observing.";
    pollutionFactor = 1.2; // Higher pollution impact in northern regions
  } 
  // Southern China: more affected by monsoon season
  else if (latitude < 30) {
    bestTimeOfYear = "October to March";
    notes = "Avoid summer monsoon season (June-August) when humidity and cloud cover are high.";
    pollutionFactor = 0.9; // Lower pollution impact in southern regions
  }
  
  // Western regions: generally better viewing conditions
  if (longitude < 105) {
    notes += " Higher elevation areas offer significantly better transparency.";
    pollutionFactor *= 0.8; // Western regions often have less industrial pollution
  }
  
  return {
    bestTimeOfYear,
    notes,
    pollutionFactor
  };
}
