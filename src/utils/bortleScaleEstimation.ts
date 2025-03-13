
// Utility functions for estimating Bortle scale when API data is unavailable

interface City {
  name: string;
  lat: number;
  lon: number;
  bortleScale: number;
}

/**
 * Major cities with known Bortle scale values
 */
export const majorCities: City[] = [
  { name: "tokyo", lat: 35.6895, lon: 139.6917, bortleScale: 9 },
  { name: "new york", lat: 40.7128, lon: -74.0060, bortleScale: 9 },
  { name: "shanghai", lat: 31.2304, lon: 121.4737, bortleScale: 9 },
  { name: "beijing", lat: 39.9042, lon: 116.4074, bortleScale: 9 },
  { name: "london", lat: 51.5074, lon: -0.1278, bortleScale: 8 },
  { name: "paris", lat: 48.8566, lon: 2.3522, bortleScale: 8 },
  { name: "hong kong", lat: 22.3193, lon: 114.1694, bortleScale: 8 },
  { name: "singapore", lat: 1.3521, lon: 103.8198, bortleScale: 8 },
  { name: "seoul", lat: 37.5665, lon: 126.9780, bortleScale: 8 },
  { name: "delhi", lat: 28.7041, lon: 77.1025, bortleScale: 8 }
];

/**
 * Estimate Bortle scale based on location name and coordinates
 */
export const estimateBortleScaleByLocation = (locationName: string, lat: number, lon: number): number => {
  const lowerName = locationName.toLowerCase();
  
  // First check by name for exact matches
  for (const city of majorCities) {
    if (lowerName.includes(city.name)) {
      return city.bortleScale;
    }
  }
  
  // Check for proximity to known cities
  for (const city of majorCities) {
    const distance = calculateHaversineDistance(lat, lon, city.lat, city.lon);
    if (distance < 50) { // Within 50km of a major city
      return city.bortleScale - 1; // One level less than city center
    } else if (distance < 100) { // Within 100km
      return city.bortleScale - 2; // Two levels less
    }
  }
  
  // Apply generic estimation based on location name patterns
  if (/\b(city center|downtown|central|cbd)\b/i.test(lowerName)) {
    return 8; // Downtown/city center
  }
  
  if (/\b(city|urban|metro|municipal)\b/i.test(lowerName)) {
    return 7; // Urban area
  }
  
  if (/\b(suburb|residential|borough|district)\b/i.test(lowerName)) {
    return 6; // Suburban area
  }
  
  if (/\b(town|township|village)\b/i.test(lowerName)) {
    return 5; // Small town
  }
  
  if (/\b(rural|countryside|farmland|agricultural)\b/i.test(lowerName)) {
    return 4; // Rural area
  }
  
  if (/\b(park|forest|national|reserve|preserve)\b/i.test(lowerName)) {
    return 3; // Natural area
  }
  
  if (/\b(desert|mountain|remote|wilderness|isolated)\b/i.test(lowerName)) {
    return 2; // Remote area
  }
  
  // Default - moderate light pollution assumption
  return 5;
};

/**
 * Calculate distance between two coordinates using Haversine formula
 */
export const calculateHaversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Earth radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

/**
 * Convert degrees to radians
 */
const toRad = (value: number): number => {
  return value * Math.PI / 180;
};
