
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { calculateDistance } from "@/utils/geoUtils";

// Database of IDA certified locations globally
const idaDarkSkyLocations: SharedAstroSpot[] = [
  // Asian Dark Sky Locations
  {
    id: "ida-yeongyang-firefly",
    name: "Yeongyang Firefly Ecological Park",
    chineseName: "英阳萤火虫生态公园",
    latitude: 36.6289,
    longitude: 129.1139,
    bortleScale: 3,
    siqs: 7.0,
    isDarkSkyReserve: true,
    certification: "International Dark Sky Park",
    description: "South Korea's first IDA-certified International Dark Sky Park",
    timestamp: new Date().toISOString()
  },
  {
    id: "ida-yaeyama",
    name: "Iriomote-Ishigaki National Park",
    chineseName: "西表石垣国立公园",
    latitude: 24.4082,
    longitude: 124.1754,
    bortleScale: 2,
    siqs: 8.0,
    isDarkSkyReserve: true,
    certification: "International Dark Sky Park",
    description: "Japan's first IDA-certified International Dark Sky Park in the Yaeyama Islands",
    timestamp: new Date().toISOString()
  },
  {
    id: "ida-alxa",
    name: "Alxa Desert National Park",
    chineseName: "阿拉善沙漠国家公园",
    latitude: 39.8282,
    longitude: 105.6807,
    bortleScale: 1,
    siqs: 9.0,
    isDarkSkyReserve: true,
    certification: "International Dark Sky Park",
    description: "China's first IDA-certified International Dark Sky Park",
    timestamp: new Date().toISOString()
  },
  {
    id: "ida-fenghuang",
    name: "Fenghuang Mountain Dark Sky Park",
    chineseName: "凤凰山暗夜公园",
    latitude: 29.9498,
    longitude: 121.9428,
    bortleScale: 3,
    siqs: 7.0,
    isDarkSkyReserve: true,
    certification: "International Dark Sky Park",
    description: "IDA-certified Dark Sky Park in Zhejiang Province, China",
    timestamp: new Date().toISOString()
  },
  
  // North American Dark Sky Locations (representative selection)
  {
    id: "ida-natural-bridges",
    name: "Natural Bridges National Monument",
    latitude: 37.6283,
    longitude: -110.0135,
    bortleScale: 1,
    siqs: 9.5,
    isDarkSkyReserve: true,
    certification: "International Dark Sky Park",
    description: "First IDA-certified International Dark Sky Park",
    timestamp: new Date().toISOString()
  },
  {
    id: "ida-death-valley",
    name: "Death Valley National Park",
    latitude: 36.5323,
    longitude: -116.9325,
    bortleScale: 1,
    siqs: 9.0,
    isDarkSkyReserve: true,
    certification: "International Dark Sky Park",
    description: "One of the darkest national parks in the US",
    timestamp: new Date().toISOString()
  },
  {
    id: "ida-grand-canyon",
    name: "Grand Canyon National Park",
    latitude: 36.1069,
    longitude: -112.1129,
    bortleScale: 1,
    siqs: 8.5,
    isDarkSkyReserve: true,
    certification: "International Dark Sky Park",
    description: "IDA-certified dark sky park with stunning night views",
    timestamp: new Date().toISOString()
  },
  
  // European Dark Sky Locations
  {
    id: "ida-northumberland",
    name: "Northumberland Dark Sky Park",
    latitude: 55.3000,
    longitude: -2.3000,
    bortleScale: 2,
    siqs: 8.0,
    isDarkSkyReserve: true,
    certification: "International Dark Sky Park",
    description: "Europe's largest dark sky park",
    timestamp: new Date().toISOString()
  },
  {
    id: "ida-exmoor",
    name: "Exmoor National Park",
    latitude: 51.1180,
    longitude: -3.6153,
    bortleScale: 2,
    siqs: 7.5,
    isDarkSkyReserve: true,
    certification: "International Dark Sky Reserve",
    description: "First dark sky reserve in Europe",
    timestamp: new Date().toISOString()
  },
  {
    id: "ida-alqueva",
    name: "Alqueva Dark Sky Reserve",
    latitude: 38.2000,
    longitude: -7.5000,
    bortleScale: 1,
    siqs: 8.5,
    isDarkSkyReserve: true,
    certification: "International Dark Sky Reserve",
    description: "First Starlight Tourism Destination in the world",
    timestamp: new Date().toISOString()
  },
  
  // Oceania Dark Sky Locations
  {
    id: "ida-aoraki",
    name: "Aoraki Mackenzie Dark Sky Reserve",
    latitude: -43.9837,
    longitude: 170.1376,
    bortleScale: 1,
    siqs: 9.5,
    isDarkSkyReserve: true,
    certification: "International Dark Sky Reserve",
    description: "Southern hemisphere's first dark sky reserve",
    timestamp: new Date().toISOString()
  },
  {
    id: "ida-warrumbungle",
    name: "Warrumbungle National Park",
    latitude: -31.2719,
    longitude: 149.0430,
    bortleScale: 1,
    siqs: 8.5,
    isDarkSkyReserve: true,
    certification: "International Dark Sky Park",
    description: "Australia's first dark sky park",
    timestamp: new Date().toISOString()
  },
];

/**
 * Get all IDA certified dark sky locations
 * @returns Array of SharedAstroSpot representing IDA certified locations
 */
export function getIDADarkSkyLocations(): SharedAstroSpot[] {
  return idaDarkSkyLocations;
}

/**
 * Get IDA certified locations within radius
 * @param latitude Center latitude
 * @param longitude Center longitude
 * @param radius Search radius in km
 * @returns Array of IDA certified locations within the radius
 */
export function getIDALocationsWithinRadius(
  latitude: number,
  longitude: number,
  radius: number
): SharedAstroSpot[] {
  return idaDarkSkyLocations
    .map(location => ({
      ...location,
      distance: calculateDistance(latitude, longitude, location.latitude, location.longitude)
    }))
    .filter(location => location.distance <= radius)
    .sort((a, b) => (a.distance || 0) - (b.distance || 0));
}

/**
 * Check if a location is IDA certified
 * @param location Location to check
 * @returns Boolean indicating certification status
 */
export function isIDALocation(location: SharedAstroSpot): boolean {
  return Boolean(location.isDarkSkyReserve || location.certification?.includes('International Dark Sky'));
}
