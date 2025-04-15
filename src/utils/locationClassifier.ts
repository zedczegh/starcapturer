
/**
 * Advanced location classification utilities
 * Used to detect specific terrain types and protected areas
 */

// Simple GeoJSON-like structure for national park boundaries
interface SimpleBoundary {
  name: string;
  type: 'nationalPark' | 'darkSkyReserve' | 'protectedArea';
  coordinates: Array<[number, number]>;
  radius: number; // Radius in kilometers
}

// Simplified database of national parks and dark sky reserves
// In a production app, this would be a more complete dataset
const protectedAreaDatabase: SimpleBoundary[] = [
  // Dark Sky Reserves - Major ones worldwide
  {
    name: "Aoraki Mackenzie (New Zealand)",
    type: "darkSkyReserve",
    coordinates: [[-43.75, 170.10]],
    radius: 50
  },
  {
    name: "NamibRand (Namibia)",
    type: "darkSkyReserve",
    coordinates: [[-24.94, 15.95]],
    radius: 60
  },
  {
    name: "Mont-Mégantic (Canada)",
    type: "darkSkyReserve",
    coordinates: [[45.46, -71.15]],
    radius: 45
  },
  // National Parks with notable dark skies
  {
    name: "Death Valley",
    type: "nationalPark",
    coordinates: [[36.24, -116.82]],
    radius: 80
  },
  {
    name: "Grand Canyon",
    type: "nationalPark",
    coordinates: [[36.11, -112.11]],
    radius: 60
  },
  {
    name: "Yellowstone",
    type: "nationalPark",
    coordinates: [[44.60, -110.50]],
    radius: 70
  },
  {
    name: "Yosemite",
    type: "nationalPark",
    coordinates: [[37.87, -119.54]],
    radius: 50
  },
  // China specific locations
  {
    name: "Shennongjia National Park",
    type: "nationalPark",
    coordinates: [[31.47, 110.30]],
    radius: 45
  },
  {
    name: "Pudacuo National Park",
    type: "nationalPark",
    coordinates: [[27.91, 100.11]],
    radius: 40
  },
  {
    name: "Zhangjiajie National Forest Park",
    type: "nationalPark",
    coordinates: [[29.32, 110.42]],
    radius: 35
  }
];

/**
 * Check if coordinates are within a national park boundary
 * @param latitude Location latitude
 * @param longitude Location longitude
 * @returns True if location is in a national park
 */
export function isNationalParkBoundary(latitude: number, longitude: number): boolean {
  return protectedAreaDatabase.some(area => {
    if (area.type === 'nationalPark') {
      return isWithinRadius(latitude, longitude, area.coordinates[0][0], area.coordinates[0][1], area.radius);
    }
    return false;
  });
}

/**
 * Check if coordinates are within a dark sky reserve
 * @param latitude Location latitude
 * @param longitude Location longitude
 * @returns True if location is in a dark sky reserve
 */
export function isDarkSkyReserve(latitude: number, longitude: number): boolean {
  return protectedAreaDatabase.some(area => {
    if (area.type === 'darkSkyReserve') {
      return isWithinRadius(latitude, longitude, area.coordinates[0][0], area.coordinates[0][1], area.radius);
    }
    return false;
  });
}

/**
 * Check if coordinates are within any protected area
 * @param latitude Location latitude
 * @param longitude Location longitude
 * @returns Object with area information or null if not in protected area
 */
export function getProtectedAreaInfo(latitude: number, longitude: number): {name: string, type: string} | null {
  for (const area of protectedAreaDatabase) {
    if (isWithinRadius(latitude, longitude, area.coordinates[0][0], area.coordinates[0][1], area.radius)) {
      return {
        name: area.name,
        type: area.type
      };
    }
  }
  return null;
}

/**
 * Check if a point is within a specified radius of another point
 */
function isWithinRadius(
  lat1: number, 
  lon1: number, 
  lat2: number, 
  lon2: number, 
  radiusKm: number
): boolean {
  // Simple approximation: 1 degree latitude ≈ 111 km
  // 1 degree longitude ≈ 111 km * cos(latitude)
  const latDiff = Math.abs(lat1 - lat2);
  const lonDiff = Math.abs(lon1 - lon2);
  
  // Simple distance calculation for performance
  const latDistance = latDiff * 111;
  const lonDistance = lonDiff * 111 * Math.cos(lat1 * Math.PI / 180);
  
  // Euclidean distance
  const distance = Math.sqrt(latDistance * latDistance + lonDistance * lonDistance);
  
  return distance <= radiusKm;
}

/**
 * Approximate terrain type based on coordinates
 * @param latitude Location latitude
 * @param longitude Location longitude
 * @returns Best guess at terrain type
 */
export function estimateTerrainType(
  latitude: number, 
  longitude: number
): 'mountain' | 'desert' | 'forest' | 'coastal' | 'urban' | 'unknown' {
  // Simple heuristics for terrain types based on coordinates
  
  // Check mountains
  if (
    // Major world mountain ranges
    (
      // Rocky Mountains
      (latitude >= 35 && latitude <= 60 && longitude >= -125 && longitude <= -105) ||
      // Alps
      (latitude >= 43 && latitude <= 48 && longitude >= 5 && longitude <= 16) ||
      // Himalayas
      (latitude >= 27 && latitude <= 35 && longitude >= 70 && longitude <= 95) ||
      // Andes
      (latitude >= -55 && latitude <= 12 && longitude >= -80 && longitude <= -65)
    )
  ) {
    return 'mountain';
  }
  
  // Check deserts
  if (
    // Major world deserts
    (
      // Sahara
      (latitude >= 15 && latitude <= 30 && longitude >= -15 && longitude <= 35) ||
      // Arabian
      (latitude >= 15 && latitude <= 30 && longitude >= 35 && longitude <= 60) ||
      // Australian
      (latitude >= -30 && latitude <= -20 && longitude >= 120 && longitude <= 140) ||
      // Southwestern US
      (latitude >= 30 && latitude <= 40 && longitude >= -120 && longitude <= -105)
    )
  ) {
    return 'desert';
  }
  
  // Check coastal areas (simple approximation)
  // In a real app, this would use a more precise coastline database
  const coastalRegions = [
    // East Asia coastline
    { minLat: 20, maxLat: 40, minLon: 115, maxLon: 130, width: 1 },
    // Western Europe coastline
    { minLat: 35, maxLat: 60, minLon: -10, maxLon: 20, width: 1 },
    // US East Coast
    { minLat: 25, maxLat: 45, minLon: -82, maxLon: -65, width: 1 },
    // US West Coast
    { minLat: 32, maxLat: 49, minLon: -125, maxLon: -122, width: 1 }
  ];
  
  for (const region of coastalRegions) {
    if (
      latitude >= region.minLat && latitude <= region.maxLat &&
      longitude >= region.minLon && longitude <= region.maxLon
    ) {
      return 'coastal';
    }
  }
  
  // Default to unknown
  return 'unknown';
}
