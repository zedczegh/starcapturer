
/**
 * Location utilities
 */

/**
 * Estimate Bortle scale from location name
 */
export function estimateBortleScaleByLocation(
  name: string, 
  latitude: number, 
  longitude: number
): number {
  // Urban locations typically have higher Bortle scales
  const urbanKeywords = ['city', 'town', 'district', 'urban', 'downtown', '市', '城', '区'];
  // Rural locations typically have lower Bortle scales
  const ruralKeywords = ['park', 'reserve', 'forest', 'mountain', 'rural', 'wilderness', '公园', '保护区', '森林', '山', '乡村'];
  
  // Check for urban keywords
  for (const keyword of urbanKeywords) {
    if (name.toLowerCase().includes(keyword)) {
      return Math.min(9, Math.max(6, Math.floor(Math.random() * 4) + 6)); // 6-9
    }
  }
  
  // Check for rural keywords
  for (const keyword of ruralKeywords) {
    if (name.toLowerCase().includes(keyword)) {
      return Math.min(5, Math.max(2, Math.floor(Math.random() * 4) + 2)); // 2-5
    }
  }
  
  // Default: return a moderate Bortle scale
  return 5;
}

/**
 * Find closest known location
 */
export function findClosestKnownLocation(latitude: number, longitude: number) {
  // Define some known locations
  const knownLocations = [
    { name: 'Beijing', lat: 39.9042, lng: 116.4074, bortleScale: 9 },
    { name: 'Shanghai', lat: 31.2304, lng: 121.4737, bortleScale: 9 },
    { name: 'New York', lat: 40.7128, lng: -74.0060, bortleScale: 9 },
    { name: 'London', lat: 51.5074, lng: -0.1278, bortleScale: 8 },
    { name: 'Tokyo', lat: 35.6762, lng: 139.6503, bortleScale: 9 },
    { name: 'Cherry Springs State Park', lat: 41.6656, lng: -77.8237, bortleScale: 2 },
    { name: 'Death Valley', lat: 36.5323, lng: -116.9325, bortleScale: 2 }
  ];
  
  // Find the closest location
  let closestLocation = null;
  let closestDistance = Infinity;
  
  knownLocations.forEach(location => {
    const distance = calculateDistance(
      latitude, 
      longitude, 
      location.lat, 
      location.lng
    );
    
    if (distance < closestDistance) {
      closestDistance = distance;
      closestLocation = { 
        ...location, 
        distance 
      };
    }
  });
  
  return closestLocation;
}

/**
 * Calculate distance between two coordinates
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
