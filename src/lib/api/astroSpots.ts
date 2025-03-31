
import { calculateDistance } from "@/utils/geoUtils";
import { getLocationNameForCoordinates } from "@/components/location/map/LocationNameService";
import { toast } from "sonner";

// Base type for astronomical observation spots
export interface AstroSpot {
  id: string;
  name: string;
  chineseName?: string;
  latitude: number;
  longitude: number;
  bortleScale: number;
  distance?: number;
}

// Enhanced type for shared locations
export interface SharedAstroSpot extends AstroSpot {
  siqs?: number;
  isViable?: boolean;
  description?: string;
  date?: string;
  timestamp?: string;
  isDarkSkyReserve?: boolean;
  darkSkyCertification?: 'goldtier' | 'park' | 'reserve' | 'sanctuary' | 'community';
}

// Dark Sky certification types
export type DarkSkyCertificationType = 'goldtier' | 'park' | 'reserve' | 'sanctuary' | 'community';

// Base database of dark sky locations
const darkSkyLocations: (AstroSpot & { isDarkSkyReserve: boolean; darkSkyCertification: DarkSkyCertificationType })[] = [
  {
    id: "ds-1",
    name: "NamibRand Nature Reserve",
    chineseName: "纳米布兰自然保护区",
    latitude: -24.9076,
    longitude: 16.0639,
    bortleScale: 1,
    isDarkSkyReserve: true,
    darkSkyCertification: 'reserve'
  },
  {
    id: "ds-2",
    name: "Aoraki Mackenzie",
    chineseName: "奥拉基麦肯齐",
    latitude: -43.9856,
    longitude: 170.4641,
    bortleScale: 1,
    isDarkSkyReserve: true,
    darkSkyCertification: 'reserve'
  },
  {
    id: "ds-3",
    name: "Mont-Mégantic",
    chineseName: "梅根提克山",
    latitude: 45.4572,
    longitude: -71.1533,
    bortleScale: 2,
    isDarkSkyReserve: true,
    darkSkyCertification: 'reserve'
  },
  {
    id: "ds-4",
    name: "Exmoor National Park",
    chineseName: "埃克斯穆尔国家公园",
    latitude: 51.1187,
    longitude: -3.6648,
    bortleScale: 3,
    isDarkSkyReserve: true,
    darkSkyCertification: 'reserve'
  },
  {
    id: "ds-5",
    name: "Cherry Springs State Park",
    chineseName: "樱泉州立公园",
    latitude: 41.6626,
    longitude: -77.8227,
    bortleScale: 2,
    isDarkSkyReserve: true,
    darkSkyCertification: 'park'
  },
  {
    id: "ds-6",
    name: "Death Valley National Park",
    chineseName: "死亡谷国家公园",
    latitude: 36.5323,
    longitude: -116.9325,
    bortleScale: 1,
    isDarkSkyReserve: true,
    darkSkyCertification: 'park'
  },
  {
    id: "ds-7",
    name: "Natural Bridges National Monument",
    chineseName: "自然桥国家纪念碑",
    latitude: 37.6088,
    longitude: -109.9754,
    bortleScale: 1,
    isDarkSkyReserve: true,
    darkSkyCertification: 'goldtier'
  },
  {
    id: "ds-8",
    name: "Westhavelland Nature Park",
    chineseName: "韦斯特哈弗兰自然公园",
    latitude: 52.7967,
    longitude: 12.4675,
    bortleScale: 3,
    isDarkSkyReserve: true,
    darkSkyCertification: 'reserve'
  },
  {
    id: "ds-9",
    name: "Jasper National Park",
    chineseName: "贾斯珀国家公园",
    latitude: 52.8732,
    longitude: -117.9535,
    bortleScale: 2,
    isDarkSkyReserve: true,
    darkSkyCertification: 'park'
  },
  {
    id: "ds-10",
    name: "Northumberland National Park",
    chineseName: "诺森伯兰国家公园",
    latitude: 55.2849,
    longitude: -2.2294,
    bortleScale: 2,
    isDarkSkyReserve: true,
    darkSkyCertification: 'park'
  },
  {
    id: "ds-11",
    name: "Yeongyang Firefly Eco Park",
    chineseName: "英阳萤火虫生态公园",
    latitude: 36.1527,
    longitude: 129.1087,
    bortleScale: 3,
    isDarkSkyReserve: true,
    darkSkyCertification: 'park'
  },
  {
    id: "ds-12",
    name: "Pic du Midi",
    chineseName: "米迪峰",
    latitude: 42.9367,
    longitude: 0.1425,
    bortleScale: 2,
    isDarkSkyReserve: true,
    darkSkyCertification: 'reserve'
  },
  {
    id: "ds-13",
    name: "Hehuan Mountain",
    chineseName: "合欢山",
    latitude: 24.1463,
    longitude: 121.2739,
    bortleScale: 2,
    isDarkSkyReserve: true,
    darkSkyCertification: 'park'
  },
  {
    id: "ds-14",
    name: "Alqueva Dark Sky Reserve",
    chineseName: "阿尔克瓦暗夜保护区",
    latitude: 38.2000,
    longitude: -7.5000,
    bortleScale: 2,
    isDarkSkyReserve: true,
    darkSkyCertification: 'reserve'
  },
  {
    id: "ds-15",
    name: "Brecon Beacons National Park",
    chineseName: "布雷肯比肯斯国家公园",
    latitude: 51.8823,
    longitude: -3.4629,
    bortleScale: 3,
    isDarkSkyReserve: true,
    darkSkyCertification: 'reserve'
  }
];

/**
 * Get a list of shared astro spots near a given location
 */
export async function getSharedAstroSpots(
  latitude: number,
  longitude: number,
  limit: number = 10,
  maxDistance: number = 500
): Promise<SharedAstroSpot[]> {
  try {
    // In a real app, this would be a database query
    // For now, we'll simulate some data and calculate distances
    
    // Combine database locations with dark sky locations
    const allLocations = [...mockSharedLocations, ...darkSkyLocations];
    
    // Calculate distances and filter by max distance
    const locationsWithDistance = allLocations
      .map(location => {
        const distance = calculateDistance(
          latitude,
          longitude,
          location.latitude,
          location.longitude
        );
        
        return {
          ...location,
          distance
        };
      })
      .filter(location => location.distance <= maxDistance);
    
    // Sort by distance and limit
    const sortedLocations = locationsWithDistance
      .sort((a, b) => (a.distance || 0) - (b.distance || 0))
      .slice(0, limit);
    
    // Add estimated SIQS scores based on Bortle scale and location
    return sortedLocations.map(location => ({
      ...location,
      siqs: estimateSIQS(location.bortleScale),
      isViable: location.bortleScale < 5,
      timestamp: new Date().toISOString(),
      isDarkSkyReserve: Boolean(location.isDarkSkyReserve),
      darkSkyCertification: location.darkSkyCertification
    }));
  } catch (error) {
    console.error("Error fetching shared astro spots:", error);
    return [];
  }
}

// Simple SIQS estimator based on Bortle scale
function estimateSIQS(bortleScale: number): number {
  // Convert Bortle (1-9) to SIQS (0-10)
  // Bortle 1 = 9-10, Bortle 9 = 0-1
  return Math.max(0, Math.min(10, 11 - bortleScale));
}

// Mock shared locations database
const mockSharedLocations: SharedAstroSpot[] = [
  {
    id: "shared-1",
    name: "Mount Wilson Observatory",
    chineseName: "威尔逊山天文台",
    latitude: 34.2256,
    longitude: -118.0571,
    bortleScale: 4,
    description: "Historic observatory with great views of Los Angeles"
  },
  {
    id: "shared-2",
    name: "Mauna Kea",
    chineseName: "莫纳克亚",
    latitude: 19.8207,
    longitude: -155.4681,
    bortleScale: 1,
    description: "World-class astronomical observing site"
  },
  {
    id: "shared-3",
    name: "Kitt Peak National Observatory",
    chineseName: "基特峰国家天文台",
    latitude: 31.9639,
    longitude: -111.5997,
    bortleScale: 2,
    description: "Home to one of the largest collections of optical telescopes"
  },
  {
    id: "shared-4",
    name: "Atacama Desert",
    chineseName: "阿塔卡马沙漠",
    latitude: -23.8634,
    longitude: -69.1328,
    bortleScale: 1,
    description: "One of the driest places on Earth with exceptional night skies"
  },
  {
    id: "shared-5",
    name: "Pic du Midi Observatory",
    chineseName: "米迪峰天文台",
    latitude: 42.9361,
    longitude: 0.1419,
    bortleScale: 2,
    description: "Mountain observatory with exceptional conditions"
  }
];
