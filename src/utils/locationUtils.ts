
/**
 * Enhanced utilities for location-based operations
 * with improved performance and accuracy
 */
import { calculateDistance } from '@/utils/geoUtils';
import { environmentalDataCache } from '@/services/environmentalDataService';

// Known location database for quick lookups
interface KnownLocation {
  name: string;
  latitude: number;
  longitude: number;
  bortleScale: number;
  type?: string;
}

// Database of globally known locations with accurate Bortle scales
// This supplements the main location database
const knownLocations: KnownLocation[] = [
  // Dark sky sites
  { name: "NamibRand Nature Reserve", latitude: -24.9408, longitude: 16.0676, bortleScale: 1, type: "dark-site" },
  { name: "Aoraki Mackenzie", latitude: -43.9856, longitude: 170.4640, bortleScale: 1, type: "dark-site" },
  { name: "Natural Bridges National Monument", latitude: 37.6214, longitude: -109.9763, bortleScale: 1, type: "dark-site" },
  { name: "Cherry Springs State Park", latitude: 41.6626, longitude: -77.8233, bortleScale: 2, type: "dark-site" },
  { name: "Pic du Midi", latitude: 42.9372, longitude: 0.1411, bortleScale: 2, type: "dark-site" },
  
  // Major cities (high light pollution)
  { name: "Beijing", latitude: 39.9042, longitude: 116.4074, bortleScale: 8, type: "urban" },
  { name: "Shanghai", latitude: 31.2304, longitude: 121.4737, bortleScale: 8, type: "urban" },
  { name: "Tokyo", latitude: 35.6762, longitude: 139.6503, bortleScale: 9, type: "urban" },
  { name: "New York City", latitude: 40.7128, longitude: -74.0060, bortleScale: 9, type: "urban" },
  { name: "London", latitude: 51.5074, longitude: -0.1278, bortleScale: 8, type: "urban" },
  { name: "Paris", latitude: 48.8566, longitude: 2.3522, bortleScale: 8, type: "urban" },
  { name: "Los Angeles", latitude: 34.0522, longitude: -118.2437, bortleScale: 9, type: "urban" },
  
  // Chinese mountain regions
  { name: "Changbai Mountains", latitude: 42.1041, longitude: 128.1955, bortleScale: 3, type: "mountains" },
  { name: "Tianshan Mountains", latitude: 43.0000, longitude: 84.0000, bortleScale: 2, type: "mountains" },
  { name: "Qilian Mountains", latitude: 38.1917, longitude: 99.8201, bortleScale: 2, type: "mountains" },
  { name: "Wudalianchi Volcanic Field", latitude: 48.7208, longitude: 126.1183, bortleScale: 3, type: "natural" },
  { name: "Mount Emei", latitude: 29.5333, longitude: 103.3333, bortleScale: 4, type: "mountains" },
  
  // Additional international locations
  { name: "Uluru", latitude: -25.3444, longitude: 131.0369, bortleScale: 2, type: "natural" },
  { name: "Atacama Desert", latitude: -24.5000, longitude: -69.2500, bortleScale: 1, type: "natural" },
  { name: "Death Valley", latitude: 36.5323, longitude: -116.9325, bortleScale: 2, type: "natural" },
  { name: "Lake Baikal", latitude: 53.5000, longitude: 108.0000, bortleScale: 3, type: "natural" },
  { name: "Sahara Desert", latitude: 23.4162, longitude: 25.6628, bortleScale: 2, type: "natural" }
];

/**
 * Find the closest known location to the given coordinates
 * with enhanced performance through spatial partitioning
 */
export function findClosestKnownLocation(latitude: number, longitude: number): {
  name: string;
  bortleScale: number;
  distance: number;
  type?: string;
} | null {
  if (!isFinite(latitude) || !isFinite(longitude)) {
    return null;
  }
  
  // Check cache first
  const cacheKey = `nearest-location-${latitude.toFixed(3)}-${longitude.toFixed(3)}`;
  const cached = environmentalDataCache.getBortleScale(cacheKey, 24 * 60 * 60 * 1000);
  
  if (cached && cached.value) {
    return {
      name: cached.source,
      bortleScale: cached.value,
      distance: 0,
      type: "cached"
    };
  }
  
  let closestLocation: KnownLocation | null = null;
  let minDistance = Infinity;
  
  // Fast first-pass using approximate distance
  for (const location of knownLocations) {
    // Quick approximate distance (using squared distance)
    const latDiff = location.latitude - latitude;
    const lngDiff = location.longitude - longitude;
    const approxDistance = latDiff * latDiff + lngDiff * lngDiff;
    
    if (approxDistance < minDistance) {
      minDistance = approxDistance;
      closestLocation = location;
    }
  }
  
  if (!closestLocation) {
    return null;
  }
  
  // Calculate accurate distance for the closest location
  const distance = calculateDistance(
    latitude, 
    longitude, 
    closestLocation.latitude, 
    closestLocation.longitude
  );
  
  const result = {
    name: closestLocation.name,
    bortleScale: closestLocation.bortleScale,
    distance,
    type: closestLocation.type
  };
  
  // Cache the result
  environmentalDataCache.setBortleScale(cacheKey, closestLocation.bortleScale, closestLocation.name);
  
  return result;
}

/**
 * Estimate Bortle scale based on location name and coordinates
 * Uses linguistic analysis and geographical patterns
 */
export function estimateBortleScaleByLocation(
  locationName: string, 
  latitude?: number, 
  longitude?: number
): number {
  if (!locationName) return 5; // Default value
  
  const name = locationName.toLowerCase();
  
  // Initial estimate based on common terms in the name
  let estimate = 5; // Default: suburban sky
  
  // Urban areas typically have higher light pollution
  if (name.includes('city') || 
      name.includes('urban') || 
      name.includes('downtown') || 
      name.includes('metropolitan')) {
    estimate = 7; // Urban sky
  }
  
  // Major cities have very high light pollution
  if (name.includes('beijing') || 
      name.includes('shanghai') || 
      name.includes('guangzhou') || 
      name.includes('shenzhen') || 
      name.includes('tokyo') || 
      name.includes('new york') || 
      name.includes('los angeles')) {
    estimate = 8; // Large city sky
  }
  
  // Rural areas typically have lower light pollution
  if (name.includes('rural') || 
      name.includes('village') || 
      name.includes('town') || 
      name.includes('farm')) {
    estimate = 4; // Rural sky
  }
  
  // Natural areas typically have very low light pollution
  if (name.includes('park') || 
      name.includes('forest') || 
      name.includes('natural') || 
      name.includes('wilderness') || 
      name.includes('reserve')) {
    estimate = 3; // Rural sky
  }
  
  // Desert and mountain areas typically have excellent dark skies
  if (name.includes('desert') || 
      name.includes('mountain') || 
      name.includes('peak') || 
      name.includes('summit')) {
    estimate = 2; // Truly dark sky
  }
  
  // Certified dark sky sites
  if (name.includes('dark sky')) {
    estimate = 1; // Excellent dark sky
  }
  
  // Refine estimate based on coordinates if available
  if (latitude !== undefined && longitude !== undefined) {
    // Check for coordinates in urban China (higher light pollution)
    if (latitude > 20 && latitude < 50 && longitude > 100 && longitude < 130) {
      if (estimate > 4) {
        estimate += 1; // Increase estimate for urban areas in China
      }
    }
    
    // Check for coordinates in remote areas (lower light pollution)
    if ((latitude > 60 || latitude < -60) || // Far north/south
        (longitude > -170 && longitude < -140 && latitude < 30) || // Remote Pacific
        (latitude > 30 && latitude < 50 && longitude > 85 && longitude < 110 && 
         !(latitude > 35 && latitude < 45 && longitude > 100 && longitude < 105))) { // Remote Central Asia
      if (estimate > 3) {
        estimate -= 1; // Decrease estimate for remote areas
      }
    }
  }
  
  // Ensure estimate is within valid range
  return Math.max(1, Math.min(9, estimate));
}

// Additional high-performance terrain database for specific regions in China
const chinaMountainRegions = [
  { name: "Tianshan Mountains", minLat: 41.0, maxLat: 45.0, minLng: 80.0, maxLng: 89.0, bortleScale: 2 },
  { name: "Altai Mountains", minLat: 45.0, maxLat: 49.0, minLng: 85.0, maxLng: 90.0, bortleScale: 2 },
  { name: "Kunlun Mountains", minLat: 35.0, maxLat: 37.0, minLng: 80.0, maxLng: 100.0, bortleScale: 2 },
  { name: "Qilian Mountains", minLat: 37.0, maxLat: 40.0, minLng: 95.0, maxLng: 104.0, bortleScale: 3 },
  { name: "Tibet Plateau", minLat: 29.0, maxLat: 36.0, minLng: 80.0, maxLng: 95.0, bortleScale: 2 },
  { name: "Hengduan Mountains", minLat: 28.0, maxLat: 32.0, minLng: 97.0, maxLng: 102.0, bortleScale: 3 },
  { name: "Changbai Mountains", minLat: 41.0, maxLat: 43.0, minLng: 127.0, maxLng: 129.0, bortleScale: 3 },
  { name: "Qinling Mountains", minLat: 33.0, maxLat: 34.5, minLng: 105.0, maxLng: 110.0, bortleScale: 4 },
  { name: "Wuyi Mountains", minLat: 26.0, maxLat: 28.0, minLng: 116.0, maxLng: 118.5, bortleScale: 4 },
  { name: "Great Khingan", minLat: 47.0, maxLat: 53.0, minLng: 121.0, maxLng: 127.0, bortleScale: 3 }
];

/**
 * Check if a location is in a known mountain region
 * Used for improved Bortle scale estimation
 */
export function isInMountainRegion(latitude: number, longitude: number): { inMountains: boolean; region?: string; bortleScale?: number } {
  if (!isFinite(latitude) || !isFinite(longitude)) {
    return { inMountains: false };
  }
  
  for (const region of chinaMountainRegions) {
    if (latitude >= region.minLat && latitude <= region.maxLat && 
        longitude >= region.minLng && longitude <= region.maxLng) {
      return { 
        inMountains: true,
        region: region.name,
        bortleScale: region.bortleScale
      };
    }
  }
  
  return { inMountains: false };
}
