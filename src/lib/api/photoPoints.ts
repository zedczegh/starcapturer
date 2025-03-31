
import { SharedAstroSpot } from "./astroSpots";

// Mock data for testing purposes
const mockPhotoPoints: SharedAstroSpot[] = [
  {
    id: "pp-1",
    name: "Mount Wilson Observatory",
    chineseName: "威尔逊山天文台",
    latitude: 34.2256,
    longitude: -118.0692,
    bortleScale: 4,
    siqs: 7.2,
    distance: 35,
    isViable: true,
    certification: "Gold Tier Dark Sky Park",
    timestamp: new Date().toISOString(),
    description: "Home to the 100-inch Hooker telescope, one of the most famous observatories in the world."
  },
  {
    id: "pp-2",
    name: "Joshua Tree National Park",
    chineseName: "约书亚树国家公园",
    latitude: 33.8734,
    longitude: -115.9010,
    bortleScale: 2,
    siqs: 8.5,
    distance: 120,
    isViable: true,
    isDarkSkyReserve: true,
    certification: "International Dark Sky Park",
    timestamp: new Date().toISOString(),
    description: "One of the darkest spots in Southern California, perfect for Milky Way photography."
  },
  {
    id: "pp-3",
    name: "Anza-Borrego Desert",
    chineseName: "安萨-博雷戈沙漠",
    latitude: 33.2550,
    longitude: -116.3761,
    bortleScale: 2,
    siqs: 8.2,
    distance: 140,
    isViable: true,
    timestamp: new Date().toISOString(),
    description: "Wide open desert with minimal light pollution and clear skies most of the year."
  }
];

/**
 * Gets recommended photography points near a given location
 */
export const getRecommendedPhotoPoints = async (
  latitude: number,
  longitude: number,
  maxDistance: number = 200
): Promise<SharedAstroSpot[]> => {
  try {
    // In a real implementation, this would fetch from a database or API
    // For now, we'll return mock data
    console.log(`Fetching photo points near ${latitude}, ${longitude}`);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Return mock data
    return mockPhotoPoints.filter(point => {
      // Calculate basic distance (very rough approximation)
      const latDiff = Math.abs(point.latitude - latitude);
      const lngDiff = Math.abs(point.longitude - longitude);
      
      // Convert to approximate km (rough calculation)
      const distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff) * 111;
      
      // Add distance to the point
      point.distance = distance;
      
      // Return true if within maxDistance
      return distance <= maxDistance;
    });
  } catch (error) {
    console.error("Error fetching recommended photo points:", error);
    return [];
  }
};

/**
 * Shares a user's astrophotography location with the community
 */
export const shareAstroSpot = (spotData: {
  name: string;
  latitude: number;
  longitude: number;
  description: string;
  bortleScale: number;
  photographer: string;
  photoUrl?: string;
  targets?: string[];
  siqs?: number;
  isViable?: boolean;
  timestamp: string;
}): Promise<{ success: boolean; message: string }> => {
  // In a real implementation, this would send data to a server
  console.log("Sharing astro spot:", spotData);
  
  // For demo purposes, simulate a successful API call
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ success: true, message: "Location shared successfully" });
    }, 1000);
  });
};
