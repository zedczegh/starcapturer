/**
 * Types and functions for working with shared astronomy spots
 */

import { normalizeCoordinates } from './coordinates';

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
  photographer?: string; // Add photographer field to schema
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
 */
export async function getSharedAstroSpots(
  latitude: number,
  longitude: number,
  limit = 20,
  radiusKm = 100,
): Promise<SharedAstroSpot[]> {
  try {
    // Normalize coordinates to ensure valid values
    const coords = normalizeCoordinates({ latitude, longitude });

    // In a real implementation, this would make an API call
    // For now, simulate with mock data
    const mockSpots: SharedAstroSpot[] = generateMockSpots(coords.latitude, coords.longitude, limit, radiusKm);
    
    // Add a small delay to simulate network latency
    await new Promise(resolve => setTimeout(resolve, 600));
    
    return mockSpots;
  } catch (error) {
    console.error('Error fetching shared astronomy spots:', error);
    return [];
  }
}

/**
 * Fetch a specific shared astronomy spot by ID
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
      certification: id.includes('certified') ? "International Dark Sky Association" : undefined,
      photographer: "John Doe" // Add photographer field to mock spot
    };
  } catch (error) {
    console.error('Error fetching shared astronomy spot:', error);
    return null;
  }
}

/**
 * Share a new astronomy spot
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
 * Generate mock data for development and testing
 * Enhanced with more realistic dark sky locations
 */
function generateMockSpots(
  centerLat: number, 
  centerLng: number, 
  count: number,
  radiusKm: number
): SharedAstroSpot[] {
  const spots: SharedAstroSpot[] = [];
  
  // Names for randomly generated locations
  const englishNames = [
    "Starry Heights", "Meteor Valley", "Galaxy View Point", "Nebula Overlook",
    "Constellation Ridge", "Milky Way Vista", "Dark Sky Reserve", "Eclipse Point",
    "Astronomy Hill", "Cosmic Meadow", "Northern Lights Point", "Observatory Peak",
    "Celestial Valley", "Stellar Mountain", "Planetary View", "Jupiter's Watch",
    "Saturn's Rings Lookout", "Mars Observatory", "Venus Point", "Mercury Highlands"
  ];
  
  const chineseNames = [
    "星空高地", "流星谷", "银河观景点", "星云瞭望",
    "星座山脊", "银河美景", "暗夜保护区", "日食点",
    "天文山", "宇宙草地", "北极光点", "观测峰",
    "天体山谷", "星辰山", "行星景观", "木星观测点",
    "土星环瞭望台", "火星天文台", "金星点", "水星高地"
  ];
  
  // Add certified locations from Dark Sky International (about 30% of total)
  const certifiedCount = Math.floor(count * 0.3);
  
  // Certifications from Dark Sky International and other organizations
  const certifications = [
    "International Dark Sky Association Gold Tier",
    "International Dark Sky Association Silver Tier",
    "International Dark Sky Association Bronze Tier",
    "Dark Sky Preserve",
    "Starlight Reserve",
    "Urban Night Sky Place",
    "Dark Sky Sanctuary",
    "International Dark Sky Park",
    "International Dark Sky Reserve",
    "Dark Sky Community"
  ];
  
  for (let i = 0; i < certifiedCount; i++) {
    // Generate a position within the specified radius
    const randomPoint = generateRandomPoint(centerLat, centerLng, radiusKm * 0.8); // Keep certified points closer
    
    const nameIndex = i % englishNames.length;
    
    // Higher-quality spots for certified locations
    const bortleScale = Math.max(1, Math.min(3, Math.floor(Math.random() * 3) + 1));
    
    // Create a certified dark sky location
    spots.push({
      id: `certified-${i}-${Date.now()}`,
      name: `${englishNames[nameIndex]} Dark Sky ${i % 2 === 0 ? 'Park' : 'Reserve'}`,
      chineseName: `${chineseNames[nameIndex]}暗夜${i % 2 === 0 ? '公园' : '保护区'}`,
      latitude: randomPoint.latitude,
      longitude: randomPoint.longitude,
      bortleScale,
      siqs: 9 - Math.random() * 1.5, // SIQS between 7.5-9 for certified locations
      isViable: true,
      distance: randomPoint.distance,
      description: "An officially certified dark sky location with exceptional stargazing conditions.",
      timestamp: new Date().toISOString(),
      isDarkSkyReserve: true,
      certification: certifications[i % certifications.length]
    });
  }
  
  // Add regular spots
  for (let i = 0; i < count - certifiedCount; i++) {
    // Generate a position within the specified radius
    const randomPoint = generateRandomPoint(centerLat, centerLng, radiusKm);
    
    const nameIndex = i % englishNames.length;
    
    // Realistic Bortle scale distribution weighted toward darker skies
    // This creates a more realistic set of results that are actually good for astronomy
    let bortleScale;
    const rand = Math.random();
    if (rand < 0.4) {
      // 40% chance of good locations (Bortle 1-3)
      bortleScale = Math.floor(Math.random() * 3) + 1;
    } else if (rand < 0.7) {
      // 30% chance of moderate locations (Bortle 4-5)
      bortleScale = Math.floor(Math.random() * 2) + 4;
    } else {
      // 30% chance of poor locations (Bortle 6-9)
      bortleScale = Math.floor(Math.random() * 4) + 6;
    }
    
    // Calculate a realistic SIQS score based on Bortle scale
    // SIQS is roughly inverse to Bortle scale but with some randomness
    const baseSiqs = 10 - bortleScale;
    const siqs = Math.max(1, Math.min(9, baseSiqs + (Math.random() * 2 - 1)));
    
    spots.push({
      id: `spot-${i}-${Date.now()}`,
      name: englishNames[nameIndex],
      chineseName: chineseNames[nameIndex],
      latitude: randomPoint.latitude,
      longitude: randomPoint.longitude,
      bortleScale,
      siqs: siqs,
      isViable: bortleScale < 6,
      distance: randomPoint.distance,
      description: "A good location for astrophotography and stargazing.",
      timestamp: new Date().toISOString()
    });
  }
  
  return spots;
}

/**
 * Generate a random point within a given radius of a center point
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
  
  // Generate a random radius between 0 and radiusInDegrees
  const randomRadius = Math.random() * radiusInDegrees;
  
  // Calculate the new position
  const latitude = centerLat + randomRadius * Math.cos(randomAngle);
  const longitude = centerLng + randomRadius * Math.sin(randomAngle) / Math.cos(centerLat * Math.PI / 180);
  
  // Calculate actual distance in kilometers for accurate display
  const distance = haversineDistance(centerLat, centerLng, latitude, longitude);
  
  return { latitude, longitude, distance };
}

/**
 * Calculate the distance between two points using the Haversine formula
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
