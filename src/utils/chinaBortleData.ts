
/**
 * China-specific Bortle scale data
 */

/**
 * Check if coordinates are in China
 */
export function isInChina(latitude: number, longitude: number): boolean {
  // China roughly spans from 18°N to 53°N and 73°E to 135°E
  return (
    latitude >= 18 && 
    latitude <= 53 && 
    longitude >= 73 && 
    longitude <= 135
  );
}

/**
 * Get Bortle scale for a specific city
 */
export function getCityBortleScale(latitude: number, longitude: number): number | null {
  // Check if coordinates are in China
  if (!isInChina(latitude, longitude)) {
    return null;
  }
  
  // Major cities in China with their Bortle scales
  const cities = [
    { name: "Beijing", lat: 39.9042, lng: 116.4074, bortle: 9 },
    { name: "Shanghai", lat: 31.2304, lng: 121.4737, bortle: 9 },
    { name: "Guangzhou", lat: 23.1291, lng: 113.2644, bortle: 8 },
    { name: "Chengdu", lat: 30.5728, lng: 104.0668, bortle: 8 },
    { name: "Lhasa", lat: 29.6500, lng: 91.1000, bortle: 4 },
    { name: "Urumqi", lat: 43.8250, lng: 87.6000, bortle: 6 },
    { name: "Harbin", lat: 45.8000, lng: 126.5333, bortle: 7 }
  ];
  
  // Find the closest city
  let closestCity = null;
  let minDistance = Infinity;
  
  for (const city of cities) {
    const distance = calculateDistance(latitude, longitude, city.lat, city.lng);
    if (distance < minDistance) {
      minDistance = distance;
      closestCity = city;
    }
  }
  
  // If we're close to a city (within 50km), use its Bortle scale
  if (closestCity && minDistance <= 50) {
    return closestCity.bortle;
  }
  
  return null;
}

/**
 * Calculate distance between two coordinates using Haversine formula
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance;
}
