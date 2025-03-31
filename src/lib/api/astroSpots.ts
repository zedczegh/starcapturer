
// This file contains functions and types related to shared astronomy spots

export type DarkSkyCertificationType = 'goldtier' | 'park' | 'reserve' | 'sanctuary' | 'community';

export interface SharedAstroSpot {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  bortleScale: number;
  description?: string;
  imageURL?: string;
  rating?: number;
  timestamp: string;
  chineseName?: string;
  siqs?: number;
  distance?: number;
  isViable?: boolean;
  isDarkSkyReserve?: boolean;
  certification?: string;
}

// Mock implementation of getting dark sky locations
export const getDarkSkyLocations = async (): Promise<SharedAstroSpot[]> => {
  // In a real implementation, this would fetch from a database or API
  const darkSkyLocations: SharedAstroSpot[] = [
    {
      id: "ds-1",
      name: "NamibRand Nature Reserve",
      chineseName: "纳米布兰自然保护区",
      latitude: -24.9307,
      longitude: 15.9541,
      bortleScale: 1,
      siqs: 9.5,
      isViable: true,
      isDarkSkyReserve: true,
      certification: "Gold Tier Dark Sky Reserve",
      timestamp: new Date().toISOString()
    },
    {
      id: "ds-2",
      name: "Aoraki Mackenzie",
      chineseName: "奥拉基麦肯齐",
      latitude: -43.7340,
      longitude: 170.1879,
      bortleScale: 1,
      siqs: 9.3,
      isViable: true,
      isDarkSkyReserve: true,
      certification: "Gold Tier Dark Sky Reserve",
      timestamp: new Date().toISOString()
    },
    {
      id: "ds-3",
      name: "Mont-Mégantic",
      chineseName: "梅甘蒂克山",
      latitude: 45.4414,
      longitude: -71.1315,
      bortleScale: 2,
      siqs: 8.8,
      isViable: true,
      isDarkSkyReserve: true,
      certification: "Silver Tier Dark Sky Reserve",
      timestamp: new Date().toISOString()
    }
  ];
  
  return darkSkyLocations;
};

// Get shared astro spots based on proximity to a location
export const getSharedAstroSpots = async (
  latitude: number,
  longitude: number,
  limit: number = 10,
  maxDistance: number = 1000
): Promise<SharedAstroSpot[]> => {
  // Combine dark sky locations with photo points for a complete list
  const darkSkyLocations = await getDarkSkyLocations();
  
  // In a real implementation, this would fetch from a database or API
  const sharedSpots: SharedAstroSpot[] = [
    ...darkSkyLocations,
    {
      id: "ss-1",
      name: "Joshua Tree National Park",
      chineseName: "约书亚树国家公园",
      latitude: 33.8734,
      longitude: -115.9010,
      bortleScale: 2,
      siqs: 8.5,
      isDarkSkyReserve: true,
      certification: "International Dark Sky Park",
      timestamp: new Date().toISOString()
    },
    {
      id: "ss-2",
      name: "Mauna Kea",
      chineseName: "莫纳克亚山",
      latitude: 19.8207,
      longitude: -155.4681,
      bortleScale: 1,
      siqs: 9.7,
      isDarkSkyReserve: true,
      certification: "Gold Tier Dark Sky Reserve",
      timestamp: new Date().toISOString()
    },
    {
      id: "ss-3",
      name: "Cherry Springs State Park",
      chineseName: "樱泉州立公园",
      latitude: 41.6626,
      longitude: -77.8287,
      bortleScale: 2,
      siqs: 8.3,
      isDarkSkyReserve: true,
      certification: "Gold Tier Dark Sky Park",
      timestamp: new Date().toISOString()
    }
  ];
  
  return sharedSpots;
};
