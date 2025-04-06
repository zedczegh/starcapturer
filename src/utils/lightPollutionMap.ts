
/**
 * Utility for retrieving Bortle scale information from light pollution maps
 */

// Default light pollution map regions with known Bortle values
const lightPollutionRegions = [
  { name: 'Dark Sky Reserve', bortle: 1, bounds: [[-90, -180], [90, 180]] },
  // This is a simplified placeholder for demonstration
  // In a real implementation, this would contain actual mapped regions
];

/**
 * Get Bortle scale value from light pollution map data for given coordinates
 * @param latitude Location latitude
 * @param longitude Location longitude
 * @returns Bortle scale value (1-9) or null if not found
 */
export async function getBortleFromLightPollutionMap(
  latitude: number,
  longitude: number
): Promise<number | null> {
  try {
    console.log(`Getting light pollution map data for: ${latitude}, ${longitude}`);
    
    // In a real implementation, this would query actual light pollution map data
    // For now, we'll return a value based on simple heuristics
    
    // Check if point is in a known mapped region
    for (const region of lightPollutionRegions) {
      const [[minLat, minLng], [maxLat, maxLng]] = region.bounds;
      if (
        latitude >= minLat && latitude <= maxLat &&
        longitude >= minLng && longitude <= maxLng
      ) {
        return region.bortle;
      }
    }
    
    // Default: Approximate based on coordinates
    // This is an extremely simplified approximation
    // A real implementation would use actual light pollution data
    
    // Check for city centers (likely higher light pollution)
    const cityCenters = [
      { lat: 40.7128, lng: -74.0060, name: "New York", radius: 50, bortle: 9 },
      { lat: 34.0522, lng: -118.2437, name: "Los Angeles", radius: 50, bortle: 8 },
      { lat: 51.5074, lng: -0.1278, name: "London", radius: 40, bortle: 8 },
      { lat: 39.9042, lng: 116.4074, name: "Beijing", radius: 60, bortle: 9 },
      { lat: 19.4326, lng: -99.1332, name: "Mexico City", radius: 50, bortle: 8 }
    ];
    
    for (const city of cityCenters) {
      const distance = haversineDistance(latitude, longitude, city.lat, city.lng);
      if (distance < city.radius) {
        return city.bortle;
      }
    }

    // Simplified estimation for everywhere else
    return getEstimatedBortleValue(latitude, longitude);
  } catch (error) {
    console.error("Error getting light pollution map data:", error);
    return null;
  }
}

/**
 * Calculate haversine distance between two points on Earth
 * @param lat1 Latitude of first point
 * @param lon1 Longitude of first point
 * @param lat2 Latitude of second point
 * @param lon2 Longitude of second point
 * @returns Distance in kilometers
 */
function haversineDistance(
  lat1: number, 
  lon1: number, 
  lat2: number, 
  lon2: number
): number {
  const R = 6371; // Earth radius in kilometers
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
 * Estimate Bortle scale value based on general geography
 * @param latitude Location latitude
 * @param longitude Location longitude
 * @returns Estimated Bortle scale value
 */
function getEstimatedBortleValue(latitude: number, longitude: number): number {
  // Extremely remote regions (oceans, poles, deserts)
  if (
    // Antarctica
    (latitude < -60) ||
    // Arctic
    (latitude > 75) ||
    // Remote Pacific
    (latitude > -30 && latitude < 30 && longitude > 170 && longitude < -140) ||
    // Central Australia
    (latitude < -25 && latitude > -30 && longitude > 130 && longitude < 140)
  ) {
    return 1;
  }
  
  // Moderately remote regions
  if (
    // Sahara/Central Africa
    (latitude > 15 && latitude < 30 && longitude > 15 && longitude < 30) ||
    // Central Asia
    (latitude > 40 && latitude < 50 && longitude > 80 && longitude < 100) ||
    // Northern Canada
    (latitude > 60 && latitude < 70 && longitude > -120 && longitude < -90)
  ) {
    return 2;
  }
  
  // Default for other regions - moderate light pollution
  return 4;
}
