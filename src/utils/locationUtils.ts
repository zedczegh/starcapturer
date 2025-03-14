
import { calculateDistance, getLocationInfo } from "@/data/locationDatabase";

// This is our local database for known locations with optimized structure for faster lookup
export const locationDatabase = [
  { name: "New York City", coordinates: [40.7128, -74.0060], bortleScale: 8, type: 'urban' },
  { name: "Los Angeles", coordinates: [34.0522, -118.2437], bortleScale: 8, type: 'urban' },
  { name: "London", coordinates: [51.5074, -0.1278], bortleScale: 8, type: 'urban' },
  { name: "Tokyo", coordinates: [35.6762, 139.6503], bortleScale: 9, type: 'urban' },
  { name: "Beijing", coordinates: [39.9042, 116.4074], bortleScale: 8, type: 'urban' },
  { name: "Shanghai", coordinates: [31.2304, 121.4737], bortleScale: 8, type: 'urban' },
  { name: "Atacama Desert", coordinates: [-23.4500, -69.2500], bortleScale: 1, type: 'dark-site' },
  { name: "Mauna Kea", coordinates: [19.8207, -155.4681], bortleScale: 1, type: 'dark-site' },
  { name: "Namibia Desert", coordinates: [-24.7499, 15.1644], bortleScale: 1, type: 'dark-site' },
  { name: "La Palma", coordinates: [28.7136, -17.8834], bortleScale: 2, type: 'dark-site' },
  { name: "Cherry Springs State Park", coordinates: [41.6611, -77.8216], bortleScale: 2, type: 'dark-site' },
  { name: "Death Valley", coordinates: [36.5323, -116.9325], bortleScale: 2, type: 'natural' },
  { name: "Grand Canyon", coordinates: [36.0544, -112.1401], bortleScale: 3, type: 'natural' },
  { name: "Yellowstone", coordinates: [44.4280, -110.5885], bortleScale: 3, type: 'natural' },
  { name: "Sedona", coordinates: [34.8697, -111.7610], bortleScale: 3, type: 'natural' },
  { name: "Banff National Park", coordinates: [51.4968, -115.9281], bortleScale: 2, type: 'natural' },
  { name: "Australian Outback", coordinates: [-25.3450, 131.0369], bortleScale: 1, type: 'natural' },
  { name: "Tibetan Plateau", coordinates: [31.6927, 88.7083], bortleScale: 2, type: 'natural' },
  { name: "Paris", coordinates: [48.8566, 2.3522], bortleScale: 9, type: 'urban' },
  { name: "Hong Kong", coordinates: [22.3193, 114.1694], bortleScale: 8, type: 'urban' },
  { name: "Zhangjiajie", coordinates: [29.1174, 110.4794], bortleScale: 4, type: 'natural' },
  { name: "Everest Base Camp", coordinates: [28.0008, 86.8530], bortleScale: 1, type: 'natural' },
  // Add smaller towns with famous names
  { name: "Denmark, Wisconsin", coordinates: [44.3405, -87.8327], bortleScale: 4, type: 'rural' },
  { name: "Paris, Texas", coordinates: [33.6609, -95.5555], bortleScale: 5, type: 'rural' },
  { name: "Moscow, Idaho", coordinates: [46.7324, -117.0002], bortleScale: 4, type: 'rural' },
  { name: "Dublin, Ohio", coordinates: [40.0992, -83.1141], bortleScale: 6, type: 'rural' },
  { name: "Berlin, New Hampshire", coordinates: [44.4787, -71.1856], bortleScale: 4, type: 'rural' },
  { name: "Oxford, Mississippi", coordinates: [34.3668, -89.5195], bortleScale: 5, type: 'rural' },
  { name: "Cambridge, Massachusetts", coordinates: [42.3736, -71.1097], bortleScale: 7, type: 'urban' }
];

// Create a spatial index for faster lookups - precomputed distance buckets
const spatialIndex = {
  north: locationDatabase.filter(loc => loc.coordinates[0] > 45),
  south: locationDatabase.filter(loc => loc.coordinates[0] < -20),
  east: locationDatabase.filter(loc => loc.coordinates[1] > 100),
  west: locationDatabase.filter(loc => loc.coordinates[1] < -100),
  central: locationDatabase.filter(
    loc => loc.coordinates[0] >= -20 && loc.coordinates[0] <= 45 && 
           loc.coordinates[1] >= -100 && loc.coordinates[1] <= 100
  )
};

/**
 * Find the closest known location from our database
 * Using spatial indexing for faster lookups
 */
export function findClosestKnownLocation(latitude: number, longitude: number): {
  name: string;
  bortleScale: number;
  distance: number;
  type: string;
} {
  if (!locationDatabase || !locationDatabase.length) {
    return { name: "Unknown", bortleScale: 4, distance: 999, type: 'unknown' };
  }

  // Determine which spatial bucket to search first
  let searchSet = locationDatabase;
  
  if (latitude > 45) {
    searchSet = spatialIndex.north;
  } else if (latitude < -20) {
    searchSet = spatialIndex.south;
  } else if (longitude > 100) {
    searchSet = spatialIndex.east;
  } else if (longitude < -100) {
    searchSet = spatialIndex.west;
  } else {
    searchSet = spatialIndex.central;
  }
  
  // If the bucket is empty, search the full database
  if (searchSet.length === 0) {
    searchSet = locationDatabase;
  }

  let closestLocation = searchSet[0];
  let shortestDistance = calculateDistance(
    latitude, longitude, 
    searchSet[0].coordinates[0], 
    searchSet[0].coordinates[1]
  );

  for (let i = 1; i < searchSet.length; i++) {
    const location = searchSet[i];
    const distance = calculateDistance(
      latitude, longitude, 
      location.coordinates[0], 
      location.coordinates[1]
    );

    if (distance < shortestDistance) {
      shortestDistance = distance;
      closestLocation = location;
    }
  }

  return {
    name: closestLocation.name,
    bortleScale: closestLocation.bortleScale,
    distance: shortestDistance,
    type: closestLocation.type
  };
}

/**
 * Estimate Bortle scale based on location name and coordinates
 * With optimized logic for faster processing
 */
export function estimateBortleScaleByLocation(
  locationName: string, 
  latitude?: number, 
  longitude?: number
): number {
  // If we have coordinates, first try to find closest known location
  if (typeof latitude === 'number' && typeof longitude === 'number') {
    const closestLocation = findClosestKnownLocation(latitude, longitude);
    
    // If location is close enough, use its Bortle scale
    if (closestLocation.distance <= 50) {
      return closestLocation.bortleScale;
    }
  }
  
  // Try to match by name - use lowercase for case-insensitive matching
  const lowercaseName = locationName.toLowerCase();
  
  // First check for specific location names that are in our database
  for (const location of locationDatabase) {
    if (lowercaseName.includes(location.name.toLowerCase())) {
      return location.bortleScale;
    }
  }
  
  // Check for keywords that indicate dark skies
  if (
    lowercaseName.includes('desert') || 
    lowercaseName.includes('outback') || 
    lowercaseName.includes('wilderness') ||
    lowercaseName.includes('remote') ||
    lowercaseName.includes('observatory') ||
    lowercaseName.includes('national park')
  ) {
    return 3; // Likely has minimal light pollution
  }
  
  // Check for keywords that indicate moderate light pollution
  if (
    lowercaseName.includes('rural') || 
    lowercaseName.includes('village') || 
    lowercaseName.includes('town') ||
    lowercaseName.includes('mountain')
  ) {
    return 4; // Moderate light pollution
  }
  
  // Check for keywords that indicate significant light pollution
  if (
    lowercaseName.includes('city') || 
    lowercaseName.includes('urban') || 
    lowercaseName.includes('downtown')
  ) {
    return 7; // Heavy light pollution
  }
  
  // Default value when we can't determine
  return 5;
}
