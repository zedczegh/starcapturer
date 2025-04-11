
/**
 * This file provides location database functions for the application
 */

// Basic type for location data
export interface LocationData {
  name: string;
  chineseName?: string;
  coordinates: [number, number]; // [latitude, longitude]
  bortleScale: number;
  certification?: string;
  isDarkSkyReserve?: boolean;
  distance?: number;
  radius?: number;
  type?: string;
}

// Example location database
export const locationDatabase: LocationData[] = [
  // Default locations
  {
    name: "Beijing",
    chineseName: "北京",
    coordinates: [39.9042, 116.4074],
    bortleScale: 9,
  },
  {
    name: "Shanghai",
    chineseName: "上海",
    coordinates: [31.2304, 121.4737],
    bortleScale: 9,
  },
  // Add more locations as needed...
];

/**
 * Find the closest location in the database based on coordinates
 */
export const findClosestLocation = (latitude: number, longitude: number) => {
  if (!locationDatabase || locationDatabase.length === 0) {
    return null;
  }
  
  let closestLocation = null;
  let minDistance = Infinity;
  
  // Calculate distance using Haversine formula
  for (const location of locationDatabase) {
    const [locLat, locLng] = location.coordinates;
    
    // Calculate distance using simplified distance formula
    const latDiff = Math.abs(latitude - locLat);
    const lngDiff = Math.abs(longitude - locLng);
    
    // Rough distance in degrees
    const distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff) * 111; // 111 km per degree
    
    if (distance < minDistance) {
      minDistance = distance;
      closestLocation = {
        ...location,
        distance
      };
    }
  }
  
  return closestLocation;
};
