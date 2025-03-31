
/**
 * Service for fetching and managing dark sky locations
 */

import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { calculateDistance } from "@/data/utils/distanceCalculator";

// Small database of known dark sky locations (could be expanded)
const darkSkyLocations = [
  {
    id: "ds-01",
    name: "NamibRand Dark Sky Reserve",
    chineseName: "纳米布兰德暗夜保护区",
    latitude: -25.0,
    longitude: 16.0,
    bortleScale: 1,
    isDarkSkyReserve: true,
    certification: "Dark Sky Reserve",
    type: "reserve"
  },
  {
    id: "ds-02",
    name: "Aoraki Mackenzie Dark Sky Reserve",
    chineseName: "奥拉基麦肯齐暗夜保护区",
    latitude: -43.9,
    longitude: 170.5,
    bortleScale: 1,
    isDarkSkyReserve: true,
    certification: "Dark Sky Reserve",
    type: "reserve"
  },
  {
    id: "ds-03",
    name: "Mont-Mégantic Dark Sky Reserve",
    chineseName: "蒙梅甘蒂克暗夜保护区",
    latitude: 45.4,
    longitude: -71.1,
    bortleScale: 2,
    isDarkSkyReserve: true,
    certification: "Dark Sky Reserve",
    type: "reserve"
  },
  {
    id: "ds-04",
    name: "Death Valley National Park",
    chineseName: "死亡谷国家公园",
    latitude: 36.5,
    longitude: -117.1,
    bortleScale: 2,
    certification: "Dark Sky Park",
    type: "park"
  },
  {
    id: "ds-05",
    name: "Big Bend National Park",
    chineseName: "大弯国家公园",
    latitude: 29.3,
    longitude: -103.2,
    bortleScale: 1,
    certification: "Dark Sky Park",
    type: "park"
  },
  {
    id: "ds-06",
    name: "Kerry Dark Sky Reserve",
    chineseName: "凯里暗夜保护区",
    latitude: 51.9,
    longitude: -10.2,
    bortleScale: 2,
    isDarkSkyReserve: true,
    certification: "Dark Sky Reserve",
    type: "reserve"
  },
  {
    id: "ds-07",
    name: "Westhavelland Dark Sky Reserve",
    chineseName: "西哈维尔暗夜保护区",
    latitude: 52.7,
    longitude: 12.4,
    bortleScale: 3,
    isDarkSkyReserve: true,
    certification: "Dark Sky Reserve",
    type: "reserve"
  },
  {
    id: "ds-08",
    name: "Pic du Midi",
    chineseName: "米迪峰",
    latitude: 42.9,
    longitude: 0.1,
    bortleScale: 2,
    certification: "Dark Sky Reserve",
    type: "reserve"
  },
  {
    id: "ds-09",
    name: "Alpes Azur Mercantour",
    chineseName: "阿尔卑斯蓝色梅尔康图",
    latitude: 44.3,
    longitude: 6.8,
    bortleScale: 2,
    certification: "Dark Sky Reserve",
    type: "reserve"
  },
  {
    id: "ds-10",
    name: "Exmoor National Park",
    chineseName: "埃克斯穆尔国家公园",
    latitude: 51.1,
    longitude: -3.6,
    bortleScale: 2,
    certification: "Dark Sky Reserve",
    type: "reserve"
  },
  {
    id: "ds-11",
    name: "Northumberland Dark Sky Park",
    chineseName: "诺森伯兰暗夜公园",
    latitude: 55.3,
    longitude: -2.5,
    bortleScale: 3,
    certification: "Dark Sky Park",
    type: "park"
  },
  {
    id: "ds-12",
    name: "Galloway Forest Dark Sky Park",
    chineseName: "盖洛韦森林暗夜公园",
    latitude: 55.1,
    longitude: -4.5,
    bortleScale: 2,
    certification: "Dark Sky Park",
    type: "park"
  },
  {
    id: "ds-13",
    name: "Zhangjiajie Tianmen Mountain",
    chineseName: "张家界天门山",
    latitude: 29.0,
    longitude: 110.5,
    bortleScale: 3,
    certification: "Dark Sky Park",
    type: "park"
  }
];

/**
 * Get certified dark sky locations within a radius
 * @param latitude Center latitude
 * @param longitude Center longitude
 * @param radius Search radius in km
 * @returns Array of SharedAstroSpot with distance
 */
export function getCertifiedLocationsNearby(
  latitude: number,
  longitude: number,
  radius: number
): SharedAstroSpot[] {
  // Calculate distance to each location and filter by radius
  return darkSkyLocations.map(location => {
    const distance = calculateDistance(
      latitude,
      longitude,
      location.latitude,
      location.longitude
    );
    
    return {
      ...location,
      distance
    };
  }).filter(location => location.distance <= radius);
}

/**
 * Get all certified dark sky locations
 * @returns Array of all known dark sky locations
 */
export function getAllCertifiedLocations(): SharedAstroSpot[] {
  return [...darkSkyLocations];
}

/**
 * Check if a location is certified based on coordinates
 * @param latitude Latitude to check
 * @param longitude Longitude to check
 * @param toleranceKm Tolerance for coordinate matching in km
 * @returns True if location coordinates match a certified location
 */
export function isLocationCertified(
  latitude: number,
  longitude: number,
  toleranceKm: number = 10
): boolean {
  return darkSkyLocations.some(location => {
    const distance = calculateDistance(
      latitude,
      longitude,
      location.latitude,
      location.longitude
    );
    
    return distance <= toleranceKm;
  });
}
