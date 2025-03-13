
/**
 * Offline Bortle scale database for major locations around the world
 * 
 * Bortle Scale:
 * 1: Excellent dark-sky site (no light pollution)
 * 2: Truly dark site (Milky Way casts shadows)
 * 3: Rural sky (some light pollution, Milky Way still visible)
 * 4: Rural/suburban transition (Milky Way visible but lacks detail)
 * 5: Suburban sky (Milky Way very dim or invisible)
 * 6: Bright suburban sky (no Milky Way, only brightest constellations)
 * 7: Suburban/urban transition (most stars washed out)
 * 8: Urban sky (few stars visible)
 * 9: Inner-city sky (only brightest stars and planets visible)
 */

export interface LocationBortleData {
  name: string;
  country?: string;
  region?: string;
  latitude: number;
  longitude: number;
  bortleScale: number;
  radius?: number; // Radius in km where this Bortle scale applies
}

// Database of known locations with their Bortle scale values
export const bortleScaleDatabase: LocationBortleData[] = [
  // Major cities (high light pollution)
  { name: "New York", country: "USA", latitude: 40.7128, longitude: -74.0060, bortleScale: 9, radius: 50 },
  { name: "Los Angeles", country: "USA", latitude: 34.0522, longitude: -118.2437, bortleScale: 9, radius: 50 },
  { name: "Chicago", country: "USA", latitude: 41.8781, longitude: -87.6298, bortleScale: 8, radius: 40 },
  { name: "Houston", country: "USA", latitude: 29.7604, longitude: -95.3698, bortleScale: 8, radius: 40 },
  { name: "Phoenix", country: "USA", latitude: 33.4484, longitude: -112.0740, bortleScale: 8, radius: 35 },
  { name: "Philadelphia", country: "USA", latitude: 39.9526, longitude: -75.1652, bortleScale: 8, radius: 35 },
  { name: "London", country: "UK", latitude: 51.5074, longitude: -0.1278, bortleScale: 9, radius: 50 },
  { name: "Paris", country: "France", latitude: 48.8566, longitude: 2.3522, bortleScale: 9, radius: 45 },
  { name: "Tokyo", country: "Japan", latitude: 35.6762, longitude: 139.6503, bortleScale: 9, radius: 60 },
  { name: "Beijing", country: "China", latitude: 39.9042, longitude: 116.4074, bortleScale: 9, radius: 60 },
  { name: "Shanghai", country: "China", latitude: 31.2304, longitude: 121.4737, bortleScale: 9, radius: 55 },
  { name: "Mumbai", country: "India", latitude: 19.0760, longitude: 72.8777, bortleScale: 9, radius: 45 },
  { name: "São Paulo", country: "Brazil", latitude: -23.5505, longitude: -46.6333, bortleScale: 9, radius: 50 },
  { name: "Mexico City", country: "Mexico", latitude: 19.4326, longitude: -99.1332, bortleScale: 9, radius: 50 },
  { name: "Cairo", country: "Egypt", latitude: 30.0444, longitude: 31.2357, bortleScale: 8, radius: 40 },
  { name: "Delhi", country: "India", latitude: 28.7041, longitude: 77.1025, bortleScale: 9, radius: 50 },
  { name: "Hong Kong", country: "China", latitude: 22.3193, longitude: 114.1694, bortleScale: 9, radius: 30 },
  { name: "Sydney", country: "Australia", latitude: -33.8688, longitude: 151.2093, bortleScale: 8, radius: 40 },
  { name: "Moscow", country: "Russia", latitude: 55.7558, longitude: 37.6173, bortleScale: 8, radius: 50 },
  { name: "Istanbul", country: "Turkey", latitude: 41.0082, longitude: 28.9784, bortleScale: 8, radius: 40 },
  
  // Medium cities (moderate light pollution)
  { name: "Portland", country: "USA", latitude: 45.5051, longitude: -122.6750, bortleScale: 7, radius: 30 },
  { name: "Denver", country: "USA", latitude: 39.7392, longitude: -104.9903, bortleScale: 7, radius: 30 },
  { name: "Austin", country: "USA", latitude: 30.2672, longitude: -97.7431, bortleScale: 7, radius: 25 },
  { name: "Nashville", country: "USA", latitude: 36.1627, longitude: -86.7816, bortleScale: 7, radius: 25 },
  { name: "Vancouver", country: "Canada", latitude: 49.2827, longitude: -123.1207, bortleScale: 7, radius: 30 },
  { name: "Manchester", country: "UK", latitude: 53.4808, longitude: -2.2426, bortleScale: 7, radius: 25 },
  { name: "Lyon", country: "France", latitude: 45.7640, longitude: 4.8357, bortleScale: 7, radius: 25 },
  { name: "Barcelona", country: "Spain", latitude: 41.3851, longitude: 2.1734, bortleScale: 7, radius: 30 },
  { name: "Munich", country: "Germany", latitude: 48.1351, longitude: 11.5820, bortleScale: 7, radius: 30 },
  { name: "Kyoto", country: "Japan", latitude: 35.0116, longitude: 135.7681, bortleScale: 7, radius: 25 },
  
  // Smaller towns (less light pollution)
  { name: "Sedona", country: "USA", latitude: 34.8697, longitude: -111.7610, bortleScale: 4, radius: 15 },
  { name: "Moab", country: "USA", latitude: 38.5733, longitude: -109.5498, bortleScale: 3, radius: 20 },
  { name: "Flagstaff", country: "USA", latitude: 35.1983, longitude: -111.6513, bortleScale: 5, radius: 15 },
  { name: "Ithaca", country: "USA", latitude: 42.4440, longitude: -76.5019, bortleScale: 5, radius: 15 },
  { name: "Banff", country: "Canada", latitude: 51.1784, longitude: -115.5708, bortleScale: 3, radius: 25 },
  { name: "Lake District", country: "UK", region: "Cumbria", latitude: 54.4609, longitude: -3.0886, bortleScale: 4, radius: 20 },
  { name: "Chamonix", country: "France", latitude: 45.9237, longitude: 6.8694, bortleScale: 4, radius: 20 },
  { name: "Hallstatt", country: "Austria", latitude: 47.5622, longitude: 13.6493, bortleScale: 3, radius: 20 },
  { name: "Queenstown", country: "New Zealand", latitude: -45.0312, longitude: 168.6626, bortleScale: 4, radius: 15 },
  
  // Dark sky sites (minimal light pollution)
  { name: "Death Valley", country: "USA", region: "California", latitude: 36.5323, longitude: -116.9325, bortleScale: 1, radius: 50 },
  { name: "Natural Bridges Dark Sky Park", country: "USA", region: "Utah", latitude: 37.6034, longitude: -110.0135, bortleScale: 1, radius: 40 },
  { name: "Big Bend National Park", country: "USA", region: "Texas", latitude: 29.1275, longitude: -103.2425, bortleScale: 1, radius: 50 },
  { name: "Cherry Springs State Park", country: "USA", region: "Pennsylvania", latitude: 41.6655, longitude: -77.8167, bortleScale: 2, radius: 30 },
  { name: "Jasper Dark Sky Preserve", country: "Canada", region: "Alberta", latitude: 52.8738, longitude: -118.0814, bortleScale: 2, radius: 40 },
  { name: "NamibRand Nature Reserve", country: "Namibia", latitude: -24.9453, longitude: 16.0664, bortleScale: 1, radius: 60 },
  { name: "Aoraki Mackenzie Dark Sky Reserve", country: "New Zealand", latitude: -43.9594, longitude: 170.2921, bortleScale: 1, radius: 50 },
  { name: "Brecon Beacons National Park", country: "UK", region: "Wales", latitude: 51.8475, longitude: -3.4595, bortleScale: 3, radius: 25 },
  { name: "Pic du Midi", country: "France", latitude: 42.9361, longitude: 0.1418, bortleScale: 1, radius: 30 },
  { name: "Alqueva Dark Sky Reserve", country: "Portugal", latitude: 38.3653, longitude: -7.3400, bortleScale: 2, radius: 40 },
  { name: "La Palma", country: "Spain", region: "Canary Islands", latitude: 28.7642, longitude: -17.8887, bortleScale: 2, radius: 30 },
  { name: "Atacama Desert", country: "Chile", latitude: -23.4500, longitude: -68.2000, bortleScale: 1, radius: 100 },
  { name: "Uluru-Kata Tjuta National Park", country: "Australia", latitude: -25.3444, longitude: 131.0369, bortleScale: 2, radius: 60 },
];

/**
 * Gets the Bortle scale for a given latitude and longitude by checking against the database
 * @param latitude The latitude to check
 * @param longitude The longitude to check
 * @returns The Bortle scale for the location, or an estimated value based on proximity
 */
export function getBortleScaleFromDatabase(latitude: number, longitude: number): number {
  // Normalize the longitude to the range [-180, 180]
  const normLongitude = ((longitude + 180) % 360 + 360) % 360 - 180;
  
  // Calculate the distance to each known location and find the closest match
  let bestMatch: { location: LocationBortleData; distance: number } | null = null;
  
  for (const location of bortleScaleDatabase) {
    const distance = calculateDistance(latitude, normLongitude, location.latitude, location.longitude);
    
    // Check if this location is within its defined radius
    if (location.radius && distance <= location.radius) {
      // If this is our first match or it's closer than the previous best match
      if (!bestMatch || distance < bestMatch.distance) {
        bestMatch = { location, distance };
      }
    }
  }
  
  // If we found a match within a defined radius, use that Bortle scale
  if (bestMatch) {
    return bestMatch.location.bortleScale;
  }
  
  // If no direct match, estimate based on nearest locations and their distances
  // Get distances to all locations
  const distancesWithBortle = bortleScaleDatabase.map(location => ({
    distance: calculateDistance(latitude, normLongitude, location.latitude, location.longitude),
    bortleScale: location.bortleScale
  }));
  
  // Sort by distance
  distancesWithBortle.sort((a, b) => a.distance - b.distance);
  
  // Take the 3 closest locations
  const closest = distancesWithBortle.slice(0, 3);
  
  // If all are very far (>200km), default to rural-like values
  if (closest[0].distance > 200) {
    return 4; // Default to rural/suburban transition
  }
  
  // Calculate weighted average based on inverse distance
  let totalWeight = 0;
  let weightedSum = 0;
  
  for (const item of closest) {
    // Use inverse square of distance as weight (closer locations have much more influence)
    const weight = 1 / Math.max(item.distance * item.distance, 0.1);
    weightedSum += item.bortleScale * weight;
    totalWeight += weight;
  }
  
  const estimatedBortle = Math.round(weightedSum / totalWeight);
  
  // Ensure the value is within valid Bortle scale range
  return Math.max(1, Math.min(9, estimatedBortle));
}

/**
 * Calculate distance between two points in km using Haversine formula
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;  // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  const distance = R * c;  // Distance in km
  return distance;
}

/**
 * Convert degrees to radians
 */
function deg2rad(deg: number): number {
  return deg * (Math.PI/180);
}
