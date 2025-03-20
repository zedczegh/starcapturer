
/**
 * Northern China Light Pollution Data
 * Focused on rural areas in northern provinces
 */

// Interface for location data
interface LocationData {
  name: string;
  chineseName: string;
  coordinates: [number, number]; // [latitude, longitude]
  bortleScale: number;
  type: 'urban' | 'rural' | 'dark-site' | 'natural' | 'suburban';
  region: string;
}

// Northern provinces rural locations with accurate Bortle scale values
export const northernChinaRuralLocations: LocationData[] = [
  // Heilongjiang Province
  {
    name: "Xingkai Lake Area",
    chineseName: "兴凯湖地区",
    coordinates: [45.2833, 132.4333],
    bortleScale: 2,
    type: 'rural',
    region: 'Heilongjiang'
  },
  {
    name: "Greater Khingan Range",
    chineseName: "大兴安岭",
    coordinates: [53.1667, 123.0000],
    bortleScale: 1,
    type: 'dark-site',
    region: 'Heilongjiang'
  },
  {
    name: "Wudalianchi Volcanic Park",
    chineseName: "五大连池火山公园",
    coordinates: [48.7167, 126.1167],
    bortleScale: 3,
    type: 'natural',
    region: 'Heilongjiang'
  },
  {
    name: "Zhalong Nature Reserve",
    chineseName: "扎龙自然保护区",
    coordinates: [47.0833, 124.2500],
    bortleScale: 3,
    type: 'natural',
    region: 'Heilongjiang'
  },
  
  // Jilin Province
  {
    name: "Changbai Mountain",
    chineseName: "长白山",
    coordinates: [41.9000, 128.0833],
    bortleScale: 2,
    type: 'natural',
    region: 'Jilin'
  },
  {
    name: "Jingyue Lake Area",
    chineseName: "净月湖地区",
    coordinates: [43.8000, 125.4000],
    bortleScale: 4,
    type: 'rural',
    region: 'Jilin'
  },
  {
    name: "Songhua Lake",
    chineseName: "松花湖",
    coordinates: [43.4500, 127.1000],
    bortleScale: 3,
    type: 'rural',
    region: 'Jilin'
  },
  
  // Liaoning Province
  {
    name: "Yiwulü Mountain",
    chineseName: "医巫闾山",
    coordinates: [41.3667, 121.7333],
    bortleScale: 3,
    type: 'rural',
    region: 'Liaoning'
  },
  {
    name: "Dalian Bangchui Island",
    chineseName: "大连棒棰岛",
    coordinates: [38.8000, 121.5000],
    bortleScale: 5,
    type: 'rural',
    region: 'Liaoning'
  },
  
  // Inner Mongolia
  {
    name: "Xilamuren Grassland",
    chineseName: "希拉穆仁草原",
    coordinates: [41.3333, 111.9500],
    bortleScale: 2,
    type: 'rural',
    region: 'Inner Mongolia'
  },
  {
    name: "Kubuqi Desert",
    chineseName: "库布其沙漠",
    coordinates: [40.3333, 109.5000],
    bortleScale: 1,
    type: 'dark-site',
    region: 'Inner Mongolia'
  },
  {
    name: "Arxan National Forest Park",
    chineseName: "阿尔山国家森林公园",
    coordinates: [47.1667, 119.9500],
    bortleScale: 2,
    type: 'natural',
    region: 'Inner Mongolia'
  },
  {
    name: "Hongjianquan Desert Observatory",
    chineseName: "红碱淖沙漠观测站",
    coordinates: [38.3667, 107.7833],
    bortleScale: 1,
    type: 'dark-site',
    region: 'Inner Mongolia'
  },
  {
    name: "Hulun Buir Grassland",
    chineseName: "呼伦贝尔草原",
    coordinates: [49.2167, 119.7667],
    bortleScale: 1,
    type: 'dark-site',
    region: 'Inner Mongolia'
  },
  
  // Hebei Province
  {
    name: "Bashang Grassland",
    chineseName: "坝上草原",
    coordinates: [41.1500, 115.9833],
    bortleScale: 3,
    type: 'rural',
    region: 'Hebei'
  },
  {
    name: "Saihanba National Forest Park",
    chineseName: "塞罕坝国家森林公园",
    coordinates: [42.4333, 117.2333],
    bortleScale: 2,
    type: 'natural',
    region: 'Hebei'
  },
  {
    name: "Xinglong Observatory",
    chineseName: "兴隆观测站",
    coordinates: [40.3958, 117.5775],
    bortleScale: 3,
    type: 'natural',
    region: 'Hebei'
  },
  
  // Shanxi Province
  {
    name: "Wutai Mountain",
    chineseName: "五台山",
    coordinates: [39.0000, 113.6333],
    bortleScale: 3,
    type: 'natural',
    region: 'Shanxi'
  },
  {
    name: "Yuntai Mountain",
    chineseName: "云台山",
    coordinates: [38.0333, 112.6333],
    bortleScale: 4,
    type: 'rural',
    region: 'Shanxi'
  },
  
  // Shaanxi Province
  {
    name: "Huashan Mountain",
    chineseName: "华山",
    coordinates: [34.4833, 110.0833],
    bortleScale: 3,
    type: 'natural',
    region: 'Shaanxi'
  },
  {
    name: "Taibai Mountain",
    chineseName: "太白山",
    coordinates: [33.9500, 107.7667],
    bortleScale: 2,
    type: 'natural',
    region: 'Shaanxi'
  },
  
  // Gansu Province
  {
    name: "Zhangye Danxia Landform",
    chineseName: "张掖丹霞地貌",
    coordinates: [38.9500, 100.4333],
    bortleScale: 2,
    type: 'rural',
    region: 'Gansu'
  },
  {
    name: "Dunhuang Yardang",
    chineseName: "敦煌雅丹",
    coordinates: [40.0833, 94.6667],
    bortleScale: 1,
    type: 'dark-site',
    region: 'Gansu'
  }
];

/**
 * Find the closest rural location in northern China
 * @param latitude Latitude to search from
 * @param longitude Longitude to search from
 * @returns Closest location with its Bortle scale
 */
export function findClosestNorthernRuralLocation(latitude: number, longitude: number): {
  name: string;
  bortleScale: number;
  distance: number;
  type: string;
} {
  if (!northernChinaRuralLocations || northernChinaRuralLocations.length === 0) {
    return {
      name: `Unknown Location`,
      bortleScale: 4,
      distance: 0,
      type: 'rural'
    };
  }

  let closestLocation = northernChinaRuralLocations[0];
  let closestDistance = calculateDistance(
    latitude, 
    longitude, 
    closestLocation.coordinates[0], 
    closestLocation.coordinates[1]
  );

  northernChinaRuralLocations.forEach(location => {
    const distance = calculateDistance(
      latitude, 
      longitude, 
      location.coordinates[0], 
      location.coordinates[1]
    );

    if (distance < closestDistance) {
      closestDistance = distance;
      closestLocation = location;
    }
  });

  return {
    name: closestLocation.name,
    bortleScale: closestLocation.bortleScale,
    distance: closestDistance,
    type: closestLocation.type
  };
}

/**
 * Calculate distance between two geographic coordinates
 * @param lat1 Latitude of first point
 * @param lon1 Longitude of first point
 * @param lat2 Latitude of second point
 * @param lon2 Longitude of second point
 * @returns Distance in kilometers
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
}

/**
 * Convert degrees to radians
 * @param deg Angle in degrees
 * @returns Angle in radians
 */
function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Determine if location is in northern China
 * @param latitude Latitude to check
 * @param longitude Longitude to check
 * @returns Boolean indicating if location is in northern China
 */
export function isInNorthernChina(latitude: number, longitude: number): boolean {
  // Northern provinces generally above latitude 35°N
  // and within China's longitude range (approx 73°E to 135°E)
  return latitude >= 35 && longitude >= 73 && longitude <= 135;
}

/**
 * Get improved Bortle scale for northern China locations
 * @param latitude Latitude to check
 * @param longitude Longitude to check
 * @returns Bortle scale or null if not in northern China
 */
export function getNorthernChinaBortleScale(latitude: number, longitude: number): number | null {
  // Check if location is in northern China
  if (!isInNorthernChina(latitude, longitude)) {
    return null;
  }

  // Find closest rural location
  const closestLocation = findClosestNorthernRuralLocation(latitude, longitude);
  
  // If location is too far (>150km), interpolate based on distance
  if (closestLocation.distance > 150) {
    // Default rural area Bortle scale baseline for northern China
    const defaultBortleScale = 4;
    
    // If we're in very remote areas (far from any location in our database)
    if (closestLocation.distance > 300) {
      return defaultBortleScale;
    }
    
    // Interpolate between closest location and default value
    const distanceRatio = (closestLocation.distance - 150) / 150; // 0 to 1
    return closestLocation.bortleScale + (defaultBortleScale - closestLocation.bortleScale) * distanceRatio;
  }
  
  return closestLocation.bortleScale;
}
