/**
 * Enhanced global light pollution database with detailed Bortle scale values
 * for cities and astronomical sites around the world
 */

export interface LightPollutionEntry {
  name: string;
  coordinates: [number, number]; // [latitude, longitude]
  bortleScale: number;
  type: 'metropolis' | 'large-city' | 'medium-city' | 'small-city' | 'town' | 'rural' | 'dark-site';
  region: string;
}

/**
 * Comprehensive database of global cities with accurate Bortle scale values
 * Data sourced from light pollution maps and astronomical observations
 */
export const lightPollutionDatabase: LightPollutionEntry[] = [
  // Major Asian metropolises
  { name: "Tokyo", coordinates: [35.6762, 139.6503], bortleScale: 9, type: "metropolis", region: "Asia" },
  { name: "Seoul", coordinates: [37.5665, 126.9780], bortleScale: 9, type: "metropolis", region: "Asia" },
  { name: "Shanghai", coordinates: [31.2304, 121.4737], bortleScale: 8.8, type: "metropolis", region: "Asia" },
  { name: "Beijing", coordinates: [39.9042, 116.4074], bortleScale: 8.7, type: "metropolis", region: "Asia" },
  { name: "Hong Kong", coordinates: [22.3193, 114.1694], bortleScale: 8.7, type: "metropolis", region: "Asia" },
  { name: "Delhi", coordinates: [28.7041, 77.1025], bortleScale: 8.6, type: "metropolis", region: "Asia" },
  { name: "Mumbai", coordinates: [19.0760, 72.8777], bortleScale: 8.4, type: "metropolis", region: "Asia" },
  { name: "Bangkok", coordinates: [13.7563, 100.5018], bortleScale: 8.3, type: "metropolis", region: "Asia" },
  { name: "Singapore", coordinates: [1.3521, 103.8198], bortleScale: 8.5, type: "metropolis", region: "Asia" },
  { name: "Jakarta", coordinates: [-6.2088, 106.8456], bortleScale: 8.3, type: "metropolis", region: "Asia" },
  { name: "Manila", coordinates: [14.5995, 120.9842], bortleScale: 8.2, type: "metropolis", region: "Asia" },
  { name: "Kuala Lumpur", coordinates: [3.1390, 101.6869], bortleScale: 7.8, type: "metropolis", region: "Asia" },
  { name: "Taipei", coordinates: [25.0330, 121.5654], bortleScale: 8.1, type: "metropolis", region: "Asia" },
  
  // Major European cities
  { name: "London", coordinates: [51.5074, -0.1278], bortleScale: 8.3, type: "metropolis", region: "Europe" },
  { name: "Paris", coordinates: [48.8566, 2.3522], bortleScale: 8.2, type: "metropolis", region: "Europe" },
  { name: "Madrid", coordinates: [40.4168, -3.7038], bortleScale: 8.0, type: "metropolis", region: "Europe" },
  { name: "Rome", coordinates: [41.9028, 12.4964], bortleScale: 7.9, type: "large-city", region: "Europe" },
  { name: "Berlin", coordinates: [52.5200, 13.4050], bortleScale: 7.9, type: "large-city", region: "Europe" },
  { name: "Moscow", coordinates: [55.7558, 37.6173], bortleScale: 8.4, type: "metropolis", region: "Europe" },
  { name: "Istanbul", coordinates: [41.0082, 28.9784], bortleScale: 8.1, type: "metropolis", region: "Europe" },
  { name: "Amsterdam", coordinates: [52.3676, 4.9041], bortleScale: 7.6, type: "large-city", region: "Europe" },
  { name: "Stockholm", coordinates: [59.3293, 18.0686], bortleScale: 7.5, type: "large-city", region: "Europe" },
  { name: "Prague", coordinates: [50.0755, 14.4378], bortleScale: 7.4, type: "large-city", region: "Europe" },
  { name: "Vienna", coordinates: [48.2082, 16.3738], bortleScale: 7.5, type: "large-city", region: "Europe" },
  { name: "Warsaw", coordinates: [52.2297, 21.0122], bortleScale: 7.4, type: "large-city", region: "Europe" },
  { name: "Budapest", coordinates: [47.4979, 19.0402], bortleScale: 7.3, type: "large-city", region: "Europe" },
  { name: "Barcelona", coordinates: [41.3851, 2.1734], bortleScale: 7.9, type: "large-city", region: "Europe" },
  { name: "Athens", coordinates: [37.9838, 23.7275], bortleScale: 7.6, type: "large-city", region: "Europe" },
  
  // North American cities
  { name: "New York", coordinates: [40.7128, -74.0060], bortleScale: 8.5, type: "metropolis", region: "North America" },
  { name: "Los Angeles", coordinates: [34.0522, -118.2437], bortleScale: 8.4, type: "metropolis", region: "North America" },
  { name: "Chicago", coordinates: [41.8781, -87.6298], bortleScale: 8.2, type: "metropolis", region: "North America" },
  { name: "Toronto", coordinates: [43.6532, -79.3832], bortleScale: 8.0, type: "metropolis", region: "North America" },
  { name: "Mexico City", coordinates: [19.4326, -99.1332], bortleScale: 8.5, type: "metropolis", region: "North America" },
  { name: "Houston", coordinates: [29.7604, -95.3698], bortleScale: 7.9, type: "large-city", region: "North America" },
  { name: "Montreal", coordinates: [45.5017, -73.5673], bortleScale: 7.8, type: "large-city", region: "North America" },
  { name: "San Francisco", coordinates: [37.7749, -122.4194], bortleScale: 7.7, type: "large-city", region: "North America" },
  { name: "Miami", coordinates: [25.7617, -80.1918], bortleScale: 7.6, type: "large-city", region: "North America" },
  { name: "Washington DC", coordinates: [38.9072, -77.0369], bortleScale: 7.8, type: "large-city", region: "North America" },
  { name: "Seattle", coordinates: [47.6062, -122.3321], bortleScale: 7.5, type: "large-city", region: "North America" },
  { name: "Vancouver", coordinates: [49.2827, -123.1207], bortleScale: 7.4, type: "large-city", region: "North America" },
  { name: "Denver", coordinates: [39.7392, -104.9903], bortleScale: 7.3, type: "large-city", region: "North America" },
  { name: "Dallas", coordinates: [32.7767, -96.7970], bortleScale: 7.7, type: "large-city", region: "North America" },
  { name: "Phoenix", coordinates: [33.4484, -112.0740], bortleScale: 7.4, type: "large-city", region: "North America" },
  
  // South American cities
  { name: "São Paulo", coordinates: [-23.5505, -46.6333], bortleScale: 8.3, type: "metropolis", region: "South America" },
  { name: "Buenos Aires", coordinates: [-34.6037, -58.3816], bortleScale: 8.1, type: "metropolis", region: "South America" },
  { name: "Rio de Janeiro", coordinates: [-22.9068, -43.1729], bortleScale: 7.9, type: "large-city", region: "South America" },
  { name: "Bogotá", coordinates: [4.7110, -74.0721], bortleScale: 7.7, type: "large-city", region: "South America" },
  { name: "Lima", coordinates: [-12.0464, -77.0428], bortleScale: 7.8, type: "large-city", region: "South America" },
  { name: "Santiago", coordinates: [-33.4489, -70.6693], bortleScale: 7.6, type: "large-city", region: "South America" },
  { name: "Caracas", coordinates: [10.4806, -66.9036], bortleScale: 7.4, type: "large-city", region: "South America" },
  { name: "Quito", coordinates: [-0.1807, -78.4678], bortleScale: 7.2, type: "large-city", region: "South America" },
  
  // Oceania cities
  { name: "Sydney", coordinates: [-33.8688, 151.2093], bortleScale: 7.7, type: "large-city", region: "Oceania" },
  { name: "Melbourne", coordinates: [-37.8136, 144.9631], bortleScale: 7.6, type: "large-city", region: "Oceania" },
  { name: "Brisbane", coordinates: [-27.4698, 153.0251], bortleScale: 7.3, type: "large-city", region: "Oceania" },
  { name: "Perth", coordinates: [-31.9505, 115.8605], bortleScale: 7.2, type: "large-city", region: "Oceania" },
  { name: "Auckland", coordinates: [-36.8509, 174.7645], bortleScale: 7.1, type: "large-city", region: "Oceania" },
  { name: "Adelaide", coordinates: [-34.9285, 138.6007], bortleScale: 7.0, type: "medium-city", region: "Oceania" },
  { name: "Gold Coast", coordinates: [-28.0167, 153.4000], bortleScale: 6.8, type: "medium-city", region: "Oceania" },
  { name: "Canberra", coordinates: [-35.2809, 149.1300], bortleScale: 6.5, type: "medium-city", region: "Oceania" },
  { name: "Wellington", coordinates: [-41.2865, 174.7762], bortleScale: 6.7, type: "medium-city", region: "Oceania" },
  { name: "Hobart", coordinates: [-42.8821, 147.3272], bortleScale: 6.3, type: "medium-city", region: "Oceania" },
  
  // African cities
  { name: "Cairo", coordinates: [30.0444, 31.2357], bortleScale: 8.3, type: "metropolis", region: "Africa" },
  { name: "Lagos", coordinates: [6.5244, 3.3792], bortleScale: 8.1, type: "metropolis", region: "Africa" },
  { name: "Kinshasa", coordinates: [-4.4419, 15.2663], bortleScale: 7.8, type: "large-city", region: "Africa" },
  { name: "Johannesburg", coordinates: [-26.2041, 28.0473], bortleScale: 7.7, type: "large-city", region: "Africa" },
  { name: "Algiers", coordinates: [36.7538, 3.0588], bortleScale: 7.5, type: "large-city", region: "Africa" },
  { name: "Casablanca", coordinates: [33.5731, -7.5898], bortleScale: 7.6, type: "large-city", region: "Africa" },
  { name: "Nairobi", coordinates: [-1.2921, 36.8219], bortleScale: 7.3, type: "large-city", region: "Africa" },
  { name: "Cape Town", coordinates: [-33.9249, 18.4241], bortleScale: 7.2, type: "large-city", region: "Africa" },
  { name: "Addis Ababa", coordinates: [9.0320, 38.7469], bortleScale: 7.1, type: "large-city", region: "Africa" },
  
  // Middle Eastern cities
  { name: "Dubai", coordinates: [25.2048, 55.2708], bortleScale: 8.3, type: "metropolis", region: "Middle East" },
  { name: "Riyadh", coordinates: [24.7136, 46.6753], bortleScale: 8.0, type: "metropolis", region: "Middle East" },
  { name: "Tel Aviv", coordinates: [32.0853, 34.7818], bortleScale: 7.9, type: "large-city", region: "Middle East" },
  { name: "Baghdad", coordinates: [33.3152, 44.3661], bortleScale: 7.7, type: "large-city", region: "Middle East" },
  { name: "Tehran", coordinates: [35.6892, 51.3890], bortleScale: 7.9, type: "metropolis", region: "Middle East" },
  { name: "Doha", coordinates: [25.2854, 51.5310], bortleScale: 7.6, type: "large-city", region: "Middle East" },
  { name: "Abu Dhabi", coordinates: [24.4539, 54.3773], bortleScale: 7.5, type: "large-city", region: "Middle East" },
  
  // Additional Chinese cities
  { name: "Guangzhou", coordinates: [23.1291, 113.2644], bortleScale: 8.2, type: "metropolis", region: "Asia" },
  { name: "Shenzhen", coordinates: [22.5431, 114.0579], bortleScale: 8.1, type: "metropolis", region: "Asia" },
  { name: "Tianjin", coordinates: [39.3434, 117.3616], bortleScale: 8.0, type: "metropolis", region: "Asia" },
  { name: "Wuhan", coordinates: [30.5928, 114.3055], bortleScale: 7.9, type: "large-city", region: "Asia" },
  { name: "Chengdu", coordinates: [30.5723, 104.0665], bortleScale: 7.8, type: "large-city", region: "Asia" },
  { name: "Nanjing", coordinates: [32.0603, 118.7969], bortleScale: 7.6, type: "large-city", region: "Asia" },
  { name: "Xi'an", coordinates: [34.3416, 108.9398], bortleScale: 7.5, type: "large-city", region: "Asia" },
  { name: "Hangzhou", coordinates: [30.2741, 120.1552], bortleScale: 7.7, type: "large-city", region: "Asia" },
  { name: "Chongqing", coordinates: [29.4316, 106.9123], bortleScale: 7.8, type: "large-city", region: "Asia" },
  { name: "Suzhou", coordinates: [31.2983, 120.5832], bortleScale: 7.6, type: "large-city", region: "Asia" },
  { name: "Harbin", coordinates: [45.8038, 126.5340], bortleScale: 7.2, type: "large-city", region: "Asia" },
  { name: "Nanchang", coordinates: [28.6820, 115.8579], bortleScale: 7.1, type: "medium-city", region: "Asia" },
  { name: "Guilin", coordinates: [25.2736, 110.2902], bortleScale: 6.3, type: "medium-city", region: "Asia" },
  { name: "Lijiang", coordinates: [26.8721, 100.2281], bortleScale: 5.1, type: "small-city", region: "Asia" },
  { name: "Dali", coordinates: [25.6064, 100.2677], bortleScale: 5.4, type: "small-city", region: "Asia" },
  { name: "Yangshuo", coordinates: [24.7781, 110.4960], bortleScale: 5.5, type: "town", region: "Asia" },
  
  // Medium and smaller cities worldwide
  { name: "Reykjavik", coordinates: [64.1466, -21.9426], bortleScale: 6.8, type: "medium-city", region: "Europe" },
  { name: "Fairbanks", coordinates: [64.8378, -147.7164], bortleScale: 5.9, type: "small-city", region: "North America" },
  { name: "Ushuaia", coordinates: [-54.8019, -68.3030], bortleScale: 5.7, type: "small-city", region: "South America" },
  { name: "Alice Springs", coordinates: [-23.6980, 133.8807], bortleScale: 5.5, type: "small-city", region: "Oceania" },
  { name: "Tromsø", coordinates: [69.6492, 18.9553], bortleScale: 5.6, type: "small-city", region: "Europe" },
  { name: "Churchill", coordinates: [58.7684, -94.1650], bortleScale: 4.8, type: "town", region: "North America" },
  { name: "Kirkenes", coordinates: [69.7269, 30.0454], bortleScale: 5.0, type: "town", region: "Europe" },
  { name: "Invercargill", coordinates: [-46.4131, 168.3538], bortleScale: 5.8, type: "small-city", region: "Oceania" },
  { name: "Longyearbyen", coordinates: [78.2232, 15.6267], bortleScale: 4.5, type: "town", region: "Europe" },
  
  // Dark sky sites and remote locations
  { name: "Atacama Desert", coordinates: [-23.4500, -69.2500], bortleScale: 1.0, type: "dark-site", region: "South America" },
  { name: "Mauna Kea", coordinates: [19.8207, -155.4681], bortleScale: 1.0, type: "dark-site", region: "North America" },
  { name: "NamibRand", coordinates: [-24.9500, 16.0000], bortleScale: 1.0, type: "dark-site", region: "Africa" },
  { name: "Great Basin National Park", coordinates: [38.9832, -114.3000], bortleScale: 1.1, type: "dark-site", region: "North America" },
  { name: "Natural Bridges", coordinates: [37.6014, -109.9753], bortleScale: 1.2, type: "dark-site", region: "North America" },
  { name: "Cherry Springs", coordinates: [41.6626, -77.8169], bortleScale: 1.9, type: "dark-site", region: "North America" },
  { name: "Aoraki Mackenzie", coordinates: [-43.9841, 170.4644], bortleScale: 1.0, type: "dark-site", region: "Oceania" },
  { name: "Uluru", coordinates: [-25.3444, 131.0369], bortleScale: 1.0, type: "dark-site", region: "Oceania" },
  { name: "La Palma", coordinates: [28.7636, -17.8834], bortleScale: 1.2, type: "dark-site", region: "Europe" },
  { name: "Iriomote Island", coordinates: [24.3858, 123.8161], bortleScale: 2.0, type: "rural", region: "Asia" },
  { name: "Brecon Beacons", coordinates: [51.8476, -3.4767], bortleScale: 3.5, type: "rural", region: "Europe" },
  { name: "Death Valley", coordinates: [36.5323, -116.9325], bortleScale: 1.3, type: "dark-site", region: "North America" },
  { name: "Alqueva Dark Sky Reserve", coordinates: [38.2000, -7.5000], bortleScale: 1.5, type: "dark-site", region: "Europe" },
  { name: "Tekapo", coordinates: [-44.0046, 170.4831], bortleScale: 1.8, type: "rural", region: "Oceania" },
  { name: "Tibetan Plateau", coordinates: [33.0000, 86.0000], bortleScale: 1.5, type: "dark-site", region: "Asia" },
  { name: "Denali", coordinates: [63.0695, -151.0074], bortleScale: 1.0, type: "dark-site", region: "North America" },
  { name: "Sagarmatha", coordinates: [27.9881, 86.9250], bortleScale: 2.0, type: "dark-site", region: "Asia" },
  { name: "Yellowstone", coordinates: [44.4280, -110.5885], bortleScale: 2.0, type: "dark-site", region: "North America" },
  { name: "Jasper Dark Sky Preserve", coordinates: [52.8734, -117.9540], bortleScale: 1.8, type: "dark-site", region: "North America" },
  { name: "Exmoor National Park", coordinates: [51.1180, -3.6427], bortleScale: 3.2, type: "rural", region: "Europe" }
];

/**
 * Get the closest city to given coordinates
 * @param latitude Latitude
 * @param longitude Longitude
 * @returns Closest city with Bortle scale and distance
 */
export const findClosestCity = (
  latitude: number, 
  longitude: number
): { name: string; bortleScale: number; distance: number; type: string } => {
  if (!isFinite(latitude) || !isFinite(longitude)) {
    return { name: "Unknown", bortleScale: 5, distance: 0, type: "unknown" };
  }

  let closestLocation = lightPollutionDatabase[0];
  let shortestDistance = calculateDistance(
    latitude, longitude, 
    lightPollutionDatabase[0].coordinates[0], 
    lightPollutionDatabase[0].coordinates[1]
  );

  for (let i = 1; i < lightPollutionDatabase.length; i++) {
    const location = lightPollutionDatabase[i];
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
};

/**
 * Calculate distance between two points using the Haversine formula
 */
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

/**
 * Interpolate Bortle scale based on surrounding cities
 * @param latitude Latitude
 * @param longitude Longitude
 * @returns Interpolated Bortle scale value
 */
export const interpolateBortleScale = (latitude: number, longitude: number): number => {
  // Find the 3 closest cities for interpolation
  const cities = [...lightPollutionDatabase]
    .map(city => ({
      ...city,
      distance: calculateDistance(latitude, longitude, city.coordinates[0], city.coordinates[1])
    }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 3);
  
  // If all cities are too far away, use default estimation
  if (cities[0].distance > 300) {
    return estimateBortleScaleFromGeography(latitude, longitude);
  }
  
  // Weight by inverse distance (closer cities have more influence)
  let totalWeight = 0;
  let weightedBortleSum = 0;
  
  for (const city of cities) {
    // For very close cities, use their value directly
    if (city.distance < 10) {
      return city.bortleScale;
    }
    
    // Otherwise calculate weighted average
    const weight = 1 / Math.max(1, city.distance);
    totalWeight += weight;
    weightedBortleSum += city.bortleScale * weight;
  }
  
  if (totalWeight === 0) {
    return 4; // Default if no weights (shouldn't happen)
  }
  
  return weightedBortleSum / totalWeight;
};

/**
 * Estimate Bortle scale based on geography when no cities are nearby
 */
function estimateBortleScaleFromGeography(latitude: number, longitude: number): number {
  // Check if in known dark sky regions
  if (
    // Central Australia
    (latitude < -18 && latitude > -30 && longitude > 125 && longitude < 140) ||
    // Sahara
    (latitude > 15 && latitude < 30 && longitude > 0 && longitude < 30) ||
    // Amazon Basin
    (latitude > -10 && latitude < 5 && longitude > -70 && longitude < -50) ||
    // Tibetan Plateau
    (latitude > 28 && latitude < 36 && longitude > 80 && longitude < 95) ||
    // Northern Canada
    (latitude > 60 && longitude > -130 && longitude < -80) ||
    // Antarctica
    (latitude < -70)
  ) {
    return 1.5; // Very dark skies
  }
  
  // Check if in moderately populated areas
  if (
    // Southeast Asia
    (latitude > 0 && latitude < 20 && longitude > 95 && longitude < 110) ||
    // Central Europe
    (latitude > 45 && latitude < 55 && longitude > 5 && longitude < 20) ||
    // Eastern USA
    (latitude > 30 && latitude < 45 && longitude > -90 && longitude < -75)
  ) {
    return 5.5; // Moderate light pollution
  }
  
  // Default middle-range value
  return 4;
}

/**
 * Get light pollution value for a given location
 * @param latitude Latitude
 * @param longitude Longitude
 * @returns Light pollution value (Bortle scale)
 */
export const getLightPollution = async (latitude: number, longitude: number): Promise<number> => {
  // Use interpolated Bortle scale as light pollution value
  return interpolateBortleScale(latitude, longitude);
};
