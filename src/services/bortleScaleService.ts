/**
 * Service to get Bortle scale estimations for locations
 */

interface BortleScaleResult {
  value: number;
  source: 'database' | 'estimation' | 'user' | 'fallback';
  description?: string;
}

// Known dark sky locations with their Bortle scales
const knownDarkSkyLocations = [
  { name: "Death Valley", latitude: 36.5323, longitude: -116.9325, bortleScale: 1.3 },
  { name: "Natural Bridges", latitude: 37.6014, longitude: -109.9753, bortleScale: 1.2 },
  { name: "Cherry Springs", latitude: 41.6649, longitude: -77.8261, bortleScale: 2.0 },
  { name: "Big Bend", latitude: 29.2498, longitude: -103.2502, bortleScale: 1.5 },
  { name: "Flagstaff", latitude: 35.1983, longitude: -111.6513, bortleScale: 3.0 },
  { name: "Brecon Beacons", latitude: 51.8480, longitude: -3.3907, bortleScale: 3.5 },
  { name: "Exmoor", latitude: 51.1788, longitude: -3.6527, bortleScale: 3.0 },
];

/**
 * Calculate distance between two points using Haversine formula
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Get nearest known dark sky location
 */
function getNearestDarkSite(latitude: number, longitude: number) {
  let nearest = null;
  let minDistance = Infinity;

  for (const site of knownDarkSkyLocations) {
    const distance = calculateDistance(latitude, longitude, site.latitude, site.longitude);
    if (distance < minDistance) {
      minDistance = distance;
      nearest = { ...site, distance };
    }
  }

  return { ...nearest, type: 'dark-site' };
}

/**
 * Estimate Bortle scale based on location
 */
function estimateBortleScale(latitude: number, longitude: number): number {
  const nearest = getNearestDarkSite(latitude, longitude);
  
  // If we're very close to a known site, use its value
  if (nearest.distance < 10) {
    return nearest.bortleScale;
  }
  
  // Otherwise, estimate based on distance from nearest dark site
  // The further we get, the higher (worse) the Bortle scale
  // This is a simple model and would be replaced with actual data in production
  const distanceFactor = Math.min(7, nearest.distance / 100);
  return Math.min(9, nearest.bortleScale + distanceFactor);
}

/**
 * Fetch or estimate Bortle scale for a given location
 */
export async function getBortleScale(latitude: number, longitude: number): Promise<BortleScaleResult> {
  try {
    // Get the nearest known dark site for logging purposes
    const nearest = getNearestDarkSite(latitude, longitude);
    console.log(`Using enhanced database for Bortle scale:`, nearest);
    
    // Calculate estimated Bortle scale
    const estimatedValue = estimateBortleScale(latitude, longitude);
    
    if (nearest.distance < 10) {
      // We're very close to a known dark site
      return {
        value: nearest.bortleScale,
        source: 'database',
        description: `${nearest.name} Dark Sky Site`
      };
    }
    
    console.log(`Using interpolated Bortle scale: ${estimatedValue}`);
    
    return {
      value: estimatedValue,
      source: 'estimation',
      description: `Estimated based on nearby dark sky sites`
    };
  } catch (error) {
    console.error("Error getting Bortle scale:", error);
    
    // Fallback to a default value
    return {
      value: 5,
      source: 'fallback',
      description: 'Default value due to error'
    };
  }
}
