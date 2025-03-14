
import { calculateDistance, getLocationInfo } from "@/data/locationDatabase";

// This is our local database for known locations with optimized structure for faster lookup
export const locationDatabase = [
  // Major Chinese cities with accurate data
  { name: "Guangzhou", coordinates: [23.1291, 113.2644], bortleScale: 7, type: 'urban' },
  { name: "Shenzhen", coordinates: [22.5431, 114.0579], bortleScale: 7, type: 'urban' },
  { name: "Hong Kong", coordinates: [22.3193, 114.1694], bortleScale: 8, type: 'urban' },
  { name: "Shanghai", coordinates: [31.2304, 121.4737], bortleScale: 8, type: 'urban' },
  { name: "Beijing", coordinates: [39.9042, 116.4074], bortleScale: 8, type: 'urban' },
  { name: "Chengdu", coordinates: [30.5723, 104.0665], bortleScale: 7, type: 'urban' },
  { name: "Wuhan", coordinates: [30.5928, 114.3055], bortleScale: 7, type: 'urban' },
  { name: "Xi'an", coordinates: [34.3416, 108.9398], bortleScale: 6, type: 'urban' },
  { name: "Nanjing", coordinates: [32.0603, 118.7969], bortleScale: 7, type: 'urban' },
  { name: "Hangzhou", coordinates: [30.2741, 120.1552], bortleScale: 7, type: 'urban' },
  { name: "Tianjin", coordinates: [39.3434, 117.3616], bortleScale: 7, type: 'urban' },
  { name: "Suzhou", coordinates: [31.2983, 120.5832], bortleScale: 7, type: 'urban' },
  { name: "Dongguan", coordinates: [23.0207, 113.7518], bortleScale: 7, type: 'urban' },
  { name: "Foshan", coordinates: [23.0229, 113.1322], bortleScale: 7, type: 'urban' },
  { name: "Zhengzhou", coordinates: [34.7533, 113.6653], bortleScale: 7, type: 'urban' },
  
  // Major global cities
  { name: "New York City", coordinates: [40.7128, -74.0060], bortleScale: 8, type: 'urban' },
  { name: "Los Angeles", coordinates: [34.0522, -118.2437], bortleScale: 8, type: 'urban' },
  { name: "London", coordinates: [51.5074, -0.1278], bortleScale: 8, type: 'urban' },
  { name: "Tokyo", coordinates: [35.6762, 139.6503], bortleScale: 9, type: 'urban' },
  { name: "Paris", coordinates: [48.8566, 2.3522], bortleScale: 9, type: 'urban' },
  
  // Dark sky sites
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
  
  // Chinese natural areas
  { name: "Zhangjiajie", coordinates: [29.1174, 110.4794], bortleScale: 4, type: 'natural' },
  { name: "Jiuzhaigou", coordinates: [33.2600, 103.9165], bortleScale: 3, type: 'natural' },
  { name: "Changbai Mountain", coordinates: [42.1215, 128.1118], bortleScale: 3, type: 'natural' },
  { name: "Qinghai Lake", coordinates: [36.8977, 100.1802], bortleScale: 2, type: 'natural' },
  { name: "Dunhuang", coordinates: [40.1413, 94.6618], bortleScale: 2, type: 'natural' },
];

// Create a spatial index for faster lookups - precomputed distance buckets
const spatialIndex = {
  northChina: locationDatabase.filter(loc => loc.coordinates[0] > 30 && loc.coordinates[1] > 90 && loc.coordinates[1] < 130),
  southChina: locationDatabase.filter(loc => loc.coordinates[0] <= 30 && loc.coordinates[0] > 0 && loc.coordinates[1] > 90 && loc.coordinates[1] < 130),
  northAmerica: locationDatabase.filter(loc => loc.coordinates[1] < -50),
  europe: locationDatabase.filter(loc => loc.coordinates[0] > 30 && loc.coordinates[1] > -20 && loc.coordinates[1] < 40),
  australasia: locationDatabase.filter(loc => loc.coordinates[0] < 0 && loc.coordinates[1] > 100),
  other: locationDatabase.filter(loc => 
    !((loc.coordinates[0] > 30 && loc.coordinates[1] > 90 && loc.coordinates[1] < 130) || 
      (loc.coordinates[0] <= 30 && loc.coordinates[0] > 0 && loc.coordinates[1] > 90 && loc.coordinates[1] < 130) ||
      (loc.coordinates[1] < -50) ||
      (loc.coordinates[0] > 30 && loc.coordinates[1] > -20 && loc.coordinates[1] < 40) ||
      (loc.coordinates[0] < 0 && loc.coordinates[1] > 100))
  )
};

/**
 * Find the closest known location from our database
 * Using spatial indexing for faster lookups and more accurate results
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

  // Determine which spatial bucket to search first based on coordinates
  let searchSet: typeof locationDatabase = [];
  
  if (latitude > 30 && longitude > 90 && longitude < 130) {
    searchSet = spatialIndex.northChina;
  } else if (latitude <= 30 && latitude > 0 && longitude > 90 && longitude < 130) {
    searchSet = spatialIndex.southChina;
  } else if (longitude < -50) {
    searchSet = spatialIndex.northAmerica;
  } else if (latitude > 30 && longitude > -20 && longitude < 40) {
    searchSet = spatialIndex.europe;
  } else if (latitude < 0 && longitude > 100) {
    searchSet = spatialIndex.australasia;
  } else {
    searchSet = spatialIndex.other;
  }
  
  // If the bucket is empty, search the full database
  if (searchSet.length === 0) {
    searchSet = locationDatabase;
  }

  // Find closest location in the search set
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

  // If closest location is too far, try full database
  if (shortestDistance > 100 && searchSet !== locationDatabase) {
    // Retry with full database
    let fullSearchClosest = locationDatabase[0];
    let fullSearchDistance = calculateDistance(
      latitude, longitude,
      fullSearchClosest.coordinates[0],
      fullSearchClosest.coordinates[1]
    );

    for (let i = 1; i < locationDatabase.length; i++) {
      const location = locationDatabase[i];
      const distance = calculateDistance(
        latitude, longitude,
        location.coordinates[0],
        location.coordinates[1]
      );

      if (distance < fullSearchDistance) {
        fullSearchDistance = distance;
        fullSearchClosest = location;
      }
    }

    if (fullSearchDistance < shortestDistance) {
      closestLocation = fullSearchClosest;
      shortestDistance = fullSearchDistance;
    }
  }

  return {
    name: closestLocation.name,
    bortleScale: closestLocation.bortleScale,
    distance: shortestDistance,
    type: closestLocation.type || 'unknown'
  };
}

/**
 * Estimate Bortle scale based on location name and coordinates
 * With optimized logic for faster processing and more accurate results
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
    if (closestLocation.distance <= 100) {
      return closestLocation.bortleScale;
    }
  }
  
  // Try to match by name - use lowercase for case-insensitive matching
  if (locationName && locationName.length > 0) {
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
      lowercaseName.includes('national park') ||
      lowercaseName.includes('mountain') ||
      lowercaseName.includes('森林') ||
      lowercaseName.includes('山脉') ||
      lowercaseName.includes('沙漠')
    ) {
      return 3; // Likely has minimal light pollution
    }
    
    // Check for keywords that indicate moderate light pollution
    if (
      lowercaseName.includes('rural') || 
      lowercaseName.includes('village') || 
      lowercaseName.includes('town') ||
      lowercaseName.includes('县') ||
      lowercaseName.includes('镇')
    ) {
      return 5; // Moderate light pollution
    }
    
    // Check for keywords that indicate significant light pollution
    if (
      lowercaseName.includes('city') || 
      lowercaseName.includes('urban') || 
      lowercaseName.includes('downtown') ||
      lowercaseName.includes('市') ||
      lowercaseName.includes('区')
    ) {
      return 7; // Heavy light pollution
    }
  }
  
  // For coordinates with no matching name or location, use population density estimate
  if (typeof latitude === 'number' && typeof longitude === 'number') {
    // China's eastern seaboard is generally high light pollution
    if (longitude > 108 && latitude > 20 && latitude < 40) {
      return 7;
    }
    
    // Western China is generally darker
    if (longitude < 100 && latitude > 30 && latitude < 45) {
      return 4;
    }
    
    // Central China has moderate light pollution
    if (longitude > 100 && longitude < 108 && latitude > 25 && latitude < 40) {
      return 6;
    }
  }
  
  // Default value when we can't determine
  return 5;
}
