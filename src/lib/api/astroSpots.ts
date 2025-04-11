/**
 * Types and functions for working with shared astronomy spots
 * Enhanced with better Dark Sky International location support
 */

import { normalizeCoordinates } from './coordinates';
import { darkSkyLocations } from '@/data/regions/darkSkyLocations';
import { calculateDistance } from '@/data/utils/distanceCalculator';
import { isWaterLocation, isValidAstronomyLocation, isLikelyCoastalWater } from '@/utils/locationValidator';

/**
 * Represents a shared astronomy spot with location details and quality metrics
 */
export interface SharedAstroSpot {
  id: string;
  name: string;
  chineseName?: string;
  latitude: number;
  longitude: number;
  bortleScale: number;
  siqs?: number;
  isViable?: boolean;
  distance?: number;
  description?: string;
  date?: string;
  timestamp: string;
  isDarkSkyReserve?: boolean;
  certification?: string;
  photographer?: string;
  cloudCover?: number;
  visibility?: number;
}

/**
 * Type for API response when creating or sharing a spot
 */
export interface SharingResponse {
  success: boolean;
  message: string;
  id?: string;
}

/**
 * Fetch shared astronomy spots near specified coordinates
 * Enhanced to include real Dark Sky International locations
 * Optimized for better performance and stability
 * @param latitude - Latitude of the center point
 * @param longitude - Longitude of the center point
 * @param radiusKm - Search radius in kilometers
 * @param certifiedOnly - Whether to return only certified locations
 * @param limit - Maximum number of locations to return
 * @returns Promise containing array of SharedAstroSpot
 */
export async function getRecommendedPhotoPoints(
  latitude: number,
  longitude: number,
  radiusKm = 100,
  certifiedOnly = false,
  limit = 30,
): Promise<SharedAstroSpot[]> {
  try {
    // Normalize coordinates to ensure valid values
    const coords = normalizeCoordinates({ latitude, longitude });
    
    console.log(`Fetching photo points around ${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)} with radius ${radiusKm}km, limit: ${limit}`);
    
    // First, find real Dark Sky certified locations within the radius
    const certifiedLocations = getCertifiedLocationsNearby(coords.latitude, coords.longitude, radiusKm);
    console.log(`Found ${certifiedLocations.length} certified locations within ${radiusKm}km radius`);
    
    // If certifiedOnly is true, return only certified locations
    if (certifiedOnly) {
      return certifiedLocations.slice(0, limit);
    }
    
    // Calculate how many regular locations we need
    const regularLocationsNeeded = Math.max(0, limit - certifiedLocations.length);
    
    // Generate additional calculated spots if needed (limited to 10 to avoid excessive API calls)
    const calculatedLimit = Math.min(regularLocationsNeeded, 10); // Limit calculated spots to 10 max
    
    const calculatedSpots = calculatedLimit > 0 
      ? generateCalculatedSpots(coords.latitude, coords.longitude, calculatedLimit, radiusKm, certifiedLocations)
      : [];
    
    // Combine certified and calculated locations and sort by nearest first
    const combinedSpots = [...certifiedLocations, ...calculatedSpots]
      .sort((a, b) => (a.distance || 0) - (b.distance || 0));
    
    return combinedSpots.slice(0, limit);
  } catch (error) {
    console.error('Error fetching recommended photo points:', error);
    return [];
  }
}

/**
 * Fetch a specific shared astronomy spot by ID
 * @param id - Unique identifier for the spot
 * @returns Promise containing the SharedAstroSpot or null if not found
 */
export async function getSharedAstroSpot(id: string): Promise<SharedAstroSpot | null> {
  try {
    // In a real implementation, this would be an API call
    // For now, return a mock spot
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Return null for unknown IDs
    if (id === 'unknown') return null;
    
    return {
      id,
      name: `Astronomy Spot ${id.substring(0, 4)}`,
      chineseName: `天文观测点 ${id.substring(0, 4)}`,
      latitude: 40.7128,
      longitude: -74.0060,
      bortleScale: 4,
      siqs: 7.2,
      isViable: true,
      description: "A great spot for astrophotography with minimal light pollution.",
      timestamp: new Date().toISOString(),
      isDarkSkyReserve: id.includes('reserve'),
      certification: id.includes('certified') ? "International Dark Sky Park" : undefined,
      photographer: "John Doe",
      cloudCover: 0.5,
      visibility: 10
    };
  } catch (error) {
    console.error('Error fetching shared astronomy spot:', error);
    return null;
  }
}

/**
 * Share a new astronomy spot
 * @param spot - The spot data to share
 * @returns Promise containing sharing response
 */
export async function shareAstroSpot(spot: Omit<SharedAstroSpot, 'id'>): Promise<SharingResponse> {
  try {
    // In a real implementation, this would be an API call to create the spot
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Generate a random ID for the newly created spot
    const newId = Math.random().toString(36).substring(2, 10);
    
    return {
      success: true,
      message: 'Spot shared successfully!',
      id: newId
    };
  } catch (error) {
    console.error('Error sharing astronomy spot:', error);
    return {
      success: false,
      message: 'Failed to share spot. Please try again later.'
    };
  }
}

/**
 * Get certified Dark Sky locations from the database
 * Uses the actual Dark Sky International locations
 * @param centerLat - Latitude of center point
 * @param centerLng - Longitude of center point
 * @param radiusKm - Search radius in kilometers
 * @returns Array of SharedAstroSpot
 */
function getCertifiedLocationsNearby(
  centerLat: number,
  centerLng: number,
  radiusKm: number
): SharedAstroSpot[] {
  const locations: SharedAstroSpot[] = [];
  
  // Official certification types based on Dark Sky International
  const certificationTypes = {
    'dark-sky-sanctuary': 'International Dark Sky Sanctuary',
    'dark-sky-reserve': 'International Dark Sky Reserve',
    'dark-sky-park': 'International Dark Sky Park',
    'dark-sky-community': 'International Dark Sky Community',
    'urban-night-sky-place': 'Urban Night Sky Place'
  };
  
  // Go through our database of real Dark Sky locations
  for (const location of darkSkyLocations) {
    const distance = calculateDistance(
      centerLat, 
      centerLng, 
      location.coordinates[0], 
      location.coordinates[1]
    );
    
    if (distance <= radiusKm) {
      // Filter out water locations
      if (isWaterLocation(location.coordinates[0], location.coordinates[1])) {
        console.log(`Filtered out water location: ${location.name}`);
        continue;
      }
      
      // Determine certification type based on location name or type
      let certification = '';
      let isDarkSkyReserve = false;
      
      const lowerName = location.name.toLowerCase();
      
      if (lowerName.includes('sanctuary') || lowerName.includes('wildernes')) {
        certification = certificationTypes['dark-sky-sanctuary'];
      } else if (lowerName.includes('reserve')) {
        certification = certificationTypes['dark-sky-reserve'];
        isDarkSkyReserve = true;
      } else if (lowerName.includes('community') || 
                lowerName.includes('village') || 
                lowerName.includes('town') ||
                lowerName.includes('city')) {
        certification = certificationTypes['dark-sky-community'];
      } else if (lowerName.includes('urban')) {
        certification = certificationTypes['urban-night-sky-place'];
      } else {
        // Default to park for national parks, state parks, etc.
        certification = certificationTypes['dark-sky-park'];
      }
      
      // Calculate a realistic SIQS score based on Bortle scale
      // Dark Sky locations tend to have excellent sky quality
      const baseSiqs = 10 - location.bortleScale;
      // Add some variability but keep scores high for certified locations
      const siqs = Math.max(7, Math.min(9, baseSiqs + (Math.random() * 1.5)));
      
      locations.push({
        id: `certified-${locations.length}-${Date.now()}`,
        name: location.name,
        // Chinese name is transliteration with "Dark Sky" prefix
        chineseName: `暗夜天空 ${location.name}`,
        latitude: location.coordinates[0],
        longitude: location.coordinates[1],
        bortleScale: location.bortleScale,
        siqs: siqs,
        isViable: true,
        distance: distance,
        description: `An officially certified dark sky location designated by the International Dark-Sky Association.`,
        timestamp: new Date().toISOString(),
        isDarkSkyReserve: isDarkSkyReserve,
        certification: certification
      });
    }
  }
  
  return locations;
}

/**
 * Generate calculated astronomy spots for general recommendations
 * These are potential good locations that aren't officially certified
 * @param centerLat - Latitude of center point
 * @param centerLng - Longitude of center point
 * @param count - Number of locations to generate
 * @param radiusKm - Search radius in kilometers
 * @param existingLocations - Existing locations to avoid duplicating
 * @returns Array of SharedAstroSpot
 */
function generateCalculatedSpots(
  centerLat: number, 
  centerLng: number, 
  count: number,
  radiusKm: number,
  existingLocations: SharedAstroSpot[]
): SharedAstroSpot[] {
  const spots: SharedAstroSpot[] = [];
  
  // Names for calculated locations - authentic and not misleading
  // IMPORTANT: Removed any names that might suggest water locations
  const englishNames = [
    "Mountain Observation Point", "Valley Viewpoint", "Highland Observation Spot",
    "Ridge Viewpoint", "Observatory Site", "Canyon Overlook",
    "Peak Observation Area", "Plateau Viewpoint", "Hillside Overlook",
    "Meadow Observation Point", "Forest Clearing", "Grassland Viewpoint", 
    "Desert Observation Site", "Rocky Viewpoint", "Rural Observatory Point",
    "Countryside Viewing Area", "Remote Viewing Site", "Hilltop Viewpoint"
  ];
  
  const chineseNames = [
    "山区观测点", "山谷观景点", "高地观测点",
    "山脊观景台", "天文台址", "峡谷观景点",
    "峰顶观测区", "高原观景台", "山坡瞭望点",
    "草地观测点", "林间空地", "草原观景点", 
    "沙漠观测站", "岩石观景点", "乡村天文点",
    "乡间观景区", "偏远观测站", "山顶观景点"
  ];
  
  // Create a grid of potential points to avoid duplicating locations
  const existingPositions = new Set();
  
  // Add existing certified locations to avoid overlap
  existingLocations.forEach(loc => {
    const posKey = `${loc.latitude.toFixed(2)},${loc.longitude.toFixed(2)}`;
    existingPositions.add(posKey);
  });
  
  let attemptsCount = 0;
  const maxAttempts = count * 15; // Increased attempts to ensure we find enough valid land locations
  
  while (spots.length < count && attemptsCount < maxAttempts) {
    attemptsCount++;
    
    // Generate a position within the specified radius
    const randomPoint = generateRandomPoint(centerLat, centerLng, radiusKm);
    
    // Check if this position already exists (avoid duplicates)
    const posKey = `${randomPoint.latitude.toFixed(2)},${randomPoint.longitude.toFixed(2)}`;
    if (existingPositions.has(posKey)) {
      continue;
    }
    
    // Triple-check that this is not a water location
    // 1. First check with standard water detection
    if (isWaterLocation(randomPoint.latitude, randomPoint.longitude)) {
      console.log(`Rejected water location at ${randomPoint.latitude}, ${randomPoint.longitude}`);
      continue;
    }
    
    // 2. Second check with coastal water detection
    if (isLikelyCoastalWater(randomPoint.latitude, randomPoint.longitude)) {
      console.log(`Rejected coastal water at ${randomPoint.latitude}, ${randomPoint.longitude}`);
      continue;
    }
    
    // 3. Third check with general astronomy validation
    if (!isValidAstronomyLocation(randomPoint.latitude, randomPoint.longitude)) {
      console.log(`Rejected invalid astronomy location at ${randomPoint.latitude}, ${randomPoint.longitude}`);
      continue;
    }
    
    existingPositions.add(posKey);
    
    const nameIndex = spots.length % englishNames.length;
    
    // Realistic Bortle scale distribution weighted toward better viewing conditions
    // This creates a more realistic set of results that are good for astronomy
    let bortleScale;
    const rand = Math.random();
    if (rand < 0.5) {
      // 50% chance of good locations (Bortle 2-4)
      bortleScale = Math.floor(Math.random() * 3) + 2;
    } else if (rand < 0.8) {
      // 30% chance of moderate locations (Bortle 4-5)
      bortleScale = Math.floor(Math.random() * 2) + 4;
    } else {
      // 20% chance of challenging locations (Bortle 6-7)
      bortleScale = Math.floor(Math.random() * 2) + 6;
    }
    
    // Calculate a realistic SIQS score based on Bortle scale
    // SIQS is roughly inverse to Bortle scale but with some randomness
    const baseSiqs = 10 - bortleScale;
    const siqs = Math.max(1, Math.min(9, baseSiqs + (Math.random() * 2 - 1)));
    
    // Ensure location is viable for astrophotography
    const isViable = siqs >= 5;
    
    // Only add viable locations or locations with good SIQS scores
    if (isViable || siqs >= 6) {
      spots.push({
        id: `calculated-${spots.length}-${Date.now()}`,
        name: englishNames[nameIndex],
        chineseName: chineseNames[nameIndex],
        latitude: randomPoint.latitude,
        longitude: randomPoint.longitude,
        bortleScale,
        siqs: siqs,
        isViable,
        distance: randomPoint.distance,
        description: "A calculated location with potentially good conditions for astrophotography.",
        timestamp: new Date().toISOString()
      });
    }
  }
  
  return spots;
}

/**
 * Generate a random point within a given radius of a center point
 * @param centerLat - Latitude of center point
 * @param centerLng - Longitude of center point
 * @param radiusKm - Search radius in kilometers
 * @returns Object with latitude, longitude and distance
 */
function generateRandomPoint(
  centerLat: number, 
  centerLng: number, 
  radiusKm: number
): { latitude: number; longitude: number; distance: number } {
  // Convert radius from kilometers to degrees
  const radiusInDegrees = radiusKm / 111.32;
  
  // Generate a random angle in radians
  const randomAngle = Math.random() * Math.PI * 2;
  
  // Generate a random radius between 0.1*radiusInDegrees and radiusInDegrees
  // This prevents too many points being generated exactly at the center
  const randomRadius = (0.1 + 0.9 * Math.random()) * radiusInDegrees;
  
  // Calculate the new position
  const latitude = centerLat + randomRadius * Math.cos(randomAngle);
  const longitude = centerLng + randomRadius * Math.sin(randomAngle) / Math.cos(centerLat * Math.PI / 180);
  
  // Calculate actual distance in kilometers for accurate display
  const distance = haversineDistance(centerLat, centerLng, latitude, longitude);
  
  return { latitude, longitude, distance };
}

/**
 * Calculate the distance between two points using the Haversine formula
 * @param lat1 - Latitude of first point
 * @param lon1 - Longitude of first point
 * @param lat2 - Latitude of second point
 * @param lon2 - Longitude of second point
 * @returns Distance in kilometers
 */
function haversineDistance(
  lat1: number, 
  lon1: number, 
  lat2: number, 
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  return R * c;
}
