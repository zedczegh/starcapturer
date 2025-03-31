
// This file contains functions and types related to shared astronomy spots

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
  siqs?: number | {
    score: number;
    isViable: boolean;
  };
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
