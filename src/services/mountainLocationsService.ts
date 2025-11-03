import { SharedAstroSpot } from "@/lib/api/astroSpots";

// Cache for mountain locations
let cachedMountainLocations: SharedAstroSpot[] | null = null;
let lastCacheUpdate = 0;
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

/**
 * Famous mountains around the world with coordinates
 * Focus on high-altitude peaks with excellent dark sky conditions
 */
const famousMountains: SharedAstroSpot[] = [
  {
    id: 'mount-everest',
    name: 'Mount Everest',
    chineseName: '珠穆朗玛峰',
    latitude: 27.9881,
    longitude: 86.9250,
    isDarkSkyReserve: false,
    certification: 'Natural Mountain',
    timestamp: new Date().toISOString(),
    bortleScale: 1,
    siqs: 9.9
  },
  {
    id: 'k2',
    name: 'K2',
    chineseName: '乔戈里峰',
    latitude: 35.8825,
    longitude: 76.5133,
    isDarkSkyReserve: false,
    certification: 'Natural Mountain',
    timestamp: new Date().toISOString(),
    bortleScale: 1,
    siqs: 10.0
  },
  {
    id: 'kangchenjunga',
    name: 'Kangchenjunga',
    chineseName: '干城章嘉峰',
    latitude: 27.7025,
    longitude: 88.1475,
    isDarkSkyReserve: false,
    certification: 'Natural Mountain',
    timestamp: new Date().toISOString(),
    bortleScale: 1,
    siqs: 9.9
  },
  {
    id: 'lhotse',
    name: 'Lhotse',
    chineseName: '洛子峰',
    latitude: 27.9617,
    longitude: 86.9331,
    isDarkSkyReserve: false,
    certification: 'Natural Mountain',
    timestamp: new Date().toISOString(),
    bortleScale: 1,
    siqs: 9.9
  },
  {
    id: 'makalu',
    name: 'Makalu',
    chineseName: '马卡鲁峰',
    latitude: 27.8894,
    longitude: 87.0886,
    isDarkSkyReserve: false,
    certification: 'Natural Mountain',
    timestamp: new Date().toISOString(),
    bortleScale: 1,
    siqs: 9.9
  },
  {
    id: 'cho-oyu',
    name: 'Cho Oyu',
    chineseName: '卓奥友峰',
    latitude: 28.0942,
    longitude: 86.6608,
    isDarkSkyReserve: false,
    certification: 'Natural Mountain',
    timestamp: new Date().toISOString(),
    bortleScale: 1,
    siqs: 9.9
  },
  {
    id: 'denali',
    name: 'Denali',
    chineseName: '德纳里峰',
    latitude: 63.0695,
    longitude: -151.0074,
    isDarkSkyReserve: false,
    certification: 'Natural Mountain',
    timestamp: new Date().toISOString(),
    bortleScale: 1,
    siqs: 9.8
  },
  {
    id: 'mount-kilimanjaro',
    name: 'Mount Kilimanjaro',
    chineseName: '乞力马扎罗山',
    latitude: -3.0674,
    longitude: 37.3556,
    isDarkSkyReserve: false,
    certification: 'Natural Mountain',
    timestamp: new Date().toISOString(),
    bortleScale: 2,
    siqs: 9.6
  },
  {
    id: 'mont-blanc',
    name: 'Mont Blanc',
    chineseName: '勃朗峰',
    latitude: 45.8326,
    longitude: 6.8652,
    isDarkSkyReserve: false,
    certification: 'Natural Mountain',
    timestamp: new Date().toISOString(),
    bortleScale: 3,
    siqs: 8.9
  },
  {
    id: 'mount-elbrus',
    name: 'Mount Elbrus',
    chineseName: '厄尔布鲁士峰',
    latitude: 43.3499,
    longitude: 42.4453,
    isDarkSkyReserve: false,
    certification: 'Natural Mountain',
    timestamp: new Date().toISOString(),
    bortleScale: 2,
    siqs: 9.4
  },
  {
    id: 'aconcagua',
    name: 'Aconcagua',
    chineseName: '阿空加瓜山',
    latitude: -32.6532,
    longitude: -70.0109,
    isDarkSkyReserve: false,
    certification: 'Natural Mountain',
    timestamp: new Date().toISOString(),
    bortleScale: 1,
    siqs: 9.7
  },
  {
    id: 'mount-logan',
    name: 'Mount Logan',
    chineseName: '洛根山',
    latitude: 60.5672,
    longitude: -140.4055,
    isDarkSkyReserve: false,
    certification: 'Natural Mountain',
    timestamp: new Date().toISOString(),
    bortleScale: 1,
    siqs: 9.8
  },
  {
    id: 'puncak-jaya',
    name: 'Puncak Jaya',
    chineseName: '查亚峰',
    latitude: -4.0784,
    longitude: 137.1580,
    isDarkSkyReserve: false,
    certification: 'Natural Mountain',
    timestamp: new Date().toISOString(),
    bortleScale: 2,
    siqs: 9.5
  },
  {
    id: 'mount-vinson',
    name: 'Mount Vinson',
    chineseName: '文森峰',
    latitude: -78.5254,
    longitude: -85.6171,
    isDarkSkyReserve: false,
    certification: 'Natural Mountain',
    timestamp: new Date().toISOString(),
    bortleScale: 1,
    siqs: 10.0
  },
  {
    id: 'matterhorn',
    name: 'Matterhorn',
    chineseName: '马特洪峰',
    latitude: 45.9763,
    longitude: 7.6586,
    isDarkSkyReserve: false,
    certification: 'Natural Mountain',
    timestamp: new Date().toISOString(),
    bortleScale: 3,
    siqs: 8.8
  },
  {
    id: 'mount-fuji',
    name: 'Mount Fuji',
    chineseName: '富士山',
    latitude: 35.3606,
    longitude: 138.7274,
    isDarkSkyReserve: false,
    certification: 'Natural Mountain',
    timestamp: new Date().toISOString(),
    bortleScale: 4,
    siqs: 8.2
  },
  {
    id: 'mount-rainier',
    name: 'Mount Rainier',
    chineseName: '雷尼尔山',
    latitude: 46.8523,
    longitude: -121.7603,
    isDarkSkyReserve: false,
    certification: 'Natural Mountain',
    timestamp: new Date().toISOString(),
    bortleScale: 3,
    siqs: 8.9
  },
  {
    id: 'mount-shasta',
    name: 'Mount Shasta',
    chineseName: '沙斯塔山',
    latitude: 41.4092,
    longitude: -122.1949,
    isDarkSkyReserve: false,
    certification: 'Natural Mountain',
    timestamp: new Date().toISOString(),
    bortleScale: 2,
    siqs: 9.2
  },
  {
    id: 'mount-kenya',
    name: 'Mount Kenya',
    chineseName: '肯尼亚山',
    latitude: -0.1521,
    longitude: 37.3084,
    isDarkSkyReserve: false,
    certification: 'Natural Mountain',
    timestamp: new Date().toISOString(),
    bortleScale: 2,
    siqs: 9.5
  },
  {
    id: 'mount-ararat',
    name: 'Mount Ararat',
    chineseName: '亚拉腊山',
    latitude: 39.7017,
    longitude: 44.2978,
    isDarkSkyReserve: false,
    certification: 'Natural Mountain',
    timestamp: new Date().toISOString(),
    bortleScale: 2,
    siqs: 9.3
  },
  {
    id: 'annapurna',
    name: 'Annapurna',
    chineseName: '安纳布尔纳峰',
    latitude: 28.5958,
    longitude: 83.8203,
    isDarkSkyReserve: false,
    certification: 'Natural Mountain',
    timestamp: new Date().toISOString(),
    bortleScale: 1,
    siqs: 9.8
  },
  {
    id: 'nanga-parbat',
    name: 'Nanga Parbat',
    chineseName: '南迦帕尔巴特峰',
    latitude: 35.2372,
    longitude: 74.5894,
    isDarkSkyReserve: false,
    certification: 'Natural Mountain',
    timestamp: new Date().toISOString(),
    bortleScale: 1,
    siqs: 9.9
  },
  {
    id: 'gasherbrum',
    name: 'Gasherbrum I',
    chineseName: '加舒尔布鲁木峰',
    latitude: 35.7244,
    longitude: 76.6964,
    isDarkSkyReserve: false,
    certification: 'Natural Mountain',
    timestamp: new Date().toISOString(),
    bortleScale: 1,
    siqs: 10.0
  },
  {
    id: 'broad-peak',
    name: 'Broad Peak',
    chineseName: '布洛阿特峰',
    latitude: 35.8117,
    longitude: 76.5694,
    isDarkSkyReserve: false,
    certification: 'Natural Mountain',
    timestamp: new Date().toISOString(),
    bortleScale: 1,
    siqs: 10.0
  },
  {
    id: 'mount-cook',
    name: 'Aoraki / Mount Cook',
    chineseName: '库克山',
    latitude: -43.5950,
    longitude: 170.1419,
    isDarkSkyReserve: false,
    certification: 'Natural Mountain',
    timestamp: new Date().toISOString(),
    bortleScale: 2,
    siqs: 9.6
  },
  {
    id: 'mount-aspiring',
    name: 'Mount Aspiring',
    chineseName: '阿斯派灵山',
    latitude: -44.3831,
    longitude: 168.7350,
    isDarkSkyReserve: false,
    certification: 'Natural Mountain',
    timestamp: new Date().toISOString(),
    bortleScale: 2,
    siqs: 9.5
  },
  {
    id: 'jungfrau',
    name: 'Jungfrau',
    chineseName: '少女峰',
    latitude: 46.5369,
    longitude: 7.9625,
    isDarkSkyReserve: false,
    certification: 'Natural Mountain',
    timestamp: new Date().toISOString(),
    bortleScale: 3,
    siqs: 8.7
  },
  {
    id: 'eiger',
    name: 'Eiger',
    chineseName: '艾格峰',
    latitude: 46.5775,
    longitude: 8.0058,
    isDarkSkyReserve: false,
    certification: 'Natural Mountain',
    timestamp: new Date().toISOString(),
    bortleScale: 3,
    siqs: 8.7
  },
  {
    id: 'mount-whitney',
    name: 'Mount Whitney',
    chineseName: '惠特尼山',
    latitude: 36.5785,
    longitude: -118.2923,
    isDarkSkyReserve: false,
    certification: 'Natural Mountain',
    timestamp: new Date().toISOString(),
    bortleScale: 2,
    siqs: 9.4
  },
  {
    id: 'grand-teton',
    name: 'Grand Teton',
    chineseName: '大提顿峰',
    latitude: 43.7412,
    longitude: -110.8024,
    isDarkSkyReserve: false,
    certification: 'Natural Mountain',
    timestamp: new Date().toISOString(),
    bortleScale: 2,
    siqs: 9.3
  },
  {
    id: 'mount-hood',
    name: 'Mount Hood',
    chineseName: '胡德山',
    latitude: 45.3736,
    longitude: -121.6960,
    isDarkSkyReserve: false,
    certification: 'Natural Mountain',
    timestamp: new Date().toISOString(),
    bortleScale: 3,
    siqs: 8.8
  },
  {
    id: 'mount-etna',
    name: 'Mount Etna',
    chineseName: '埃特纳火山',
    latitude: 37.7510,
    longitude: 14.9934,
    isDarkSkyReserve: false,
    certification: 'Natural Mountain',
    timestamp: new Date().toISOString(),
    bortleScale: 4,
    siqs: 7.8
  },
  {
    id: 'mount-vesuvius',
    name: 'Mount Vesuvius',
    chineseName: '维苏威火山',
    latitude: 40.8214,
    longitude: 14.4266,
    isDarkSkyReserve: false,
    certification: 'Natural Mountain',
    timestamp: new Date().toISOString(),
    bortleScale: 6,
    siqs: 6.2
  },
  {
    id: 'mount-olympus',
    name: 'Mount Olympus',
    chineseName: '奥林匹斯山',
    latitude: 40.0853,
    longitude: 22.3583,
    isDarkSkyReserve: false,
    certification: 'Natural Mountain',
    timestamp: new Date().toISOString(),
    bortleScale: 4,
    siqs: 8.0
  },
  {
    id: 'mount-sinai',
    name: 'Mount Sinai',
    chineseName: '西奈山',
    latitude: 28.5392,
    longitude: 33.9751,
    isDarkSkyReserve: false,
    certification: 'Natural Mountain',
    timestamp: new Date().toISOString(),
    bortleScale: 2,
    siqs: 9.4
  },
  {
    id: 'table-mountain',
    name: 'Table Mountain',
    chineseName: '桌山',
    latitude: -33.9628,
    longitude: 18.4098,
    isDarkSkyReserve: false,
    certification: 'Natural Mountain',
    timestamp: new Date().toISOString(),
    bortleScale: 6,
    siqs: 6.5
  },
  {
    id: 'uluru-kata-tjuta',
    name: 'Kata Tjuta',
    chineseName: '卡塔丘塔',
    latitude: -25.3000,
    longitude: 130.7333,
    isDarkSkyReserve: false,
    certification: 'Natural Mountain',
    timestamp: new Date().toISOString(),
    bortleScale: 1,
    siqs: 9.7
  },
  {
    id: 'mount-kailash',
    name: 'Mount Kailash',
    chineseName: '冈仁波齐峰',
    latitude: 31.0667,
    longitude: 81.3167,
    isDarkSkyReserve: false,
    certification: 'Natural Mountain',
    timestamp: new Date().toISOString(),
    bortleScale: 1,
    siqs: 9.9
  },
  {
    id: 'mount-damavand',
    name: 'Mount Damavand',
    chineseName: '达马万德峰',
    latitude: 35.9553,
    longitude: 52.1092,
    isDarkSkyReserve: false,
    certification: 'Natural Mountain',
    timestamp: new Date().toISOString(),
    bortleScale: 2,
    siqs: 9.3
  },
  {
    id: 'pico-de-orizaba',
    name: 'Pico de Orizaba',
    chineseName: '奥里萨巴峰',
    latitude: 19.0303,
    longitude: -97.2679,
    isDarkSkyReserve: false,
    certification: 'Natural Mountain',
    timestamp: new Date().toISOString(),
    bortleScale: 2,
    siqs: 9.2
  }
];

/**
 * Get all mountain locations sorted by SIQS score
 */
export async function getAllMountainLocations(): Promise<SharedAstroSpot[]> {
  // Check cache
  if (cachedMountainLocations && (Date.now() - lastCacheUpdate < CACHE_TTL)) {
    return cachedMountainLocations;
  }

  // Sort by SIQS score (highest first)
  const sortedLocations = [...famousMountains].sort((a, b) => {
    const siqsA = typeof a.siqs === 'number' ? a.siqs : (a.siqs?.score || 0);
    const siqsB = typeof b.siqs === 'number' ? b.siqs : (b.siqs?.score || 0);
    return siqsB - siqsA;
  });

  // Update cache
  cachedMountainLocations = sortedLocations;
  lastCacheUpdate = Date.now();

  // Save to localStorage
  try {
    localStorage.setItem('cachedMountainLocations', JSON.stringify(sortedLocations));
  } catch (error) {
    console.error("Error caching mountain locations:", error);
  }

  console.log(`Loaded ${sortedLocations.length} mountain locations`);
  return sortedLocations;
}

/**
 * Preload mountain locations from cache or fetch fresh
 */
export async function preloadMountainLocations(): Promise<SharedAstroSpot[]> {
  // Try localStorage first
  const storedLocations = localStorage.getItem('cachedMountainLocations');
  if (storedLocations) {
    try {
      const parsed = JSON.parse(storedLocations);
      if (Array.isArray(parsed) && parsed.length > 0) {
        cachedMountainLocations = parsed;
        console.log(`Using ${parsed.length} cached mountain locations`);
        return parsed;
      }
    } catch (error) {
      console.error("Error parsing cached mountain locations:", error);
    }
  }

  return getAllMountainLocations();
}

/**
 * Force refresh mountain locations
 */
export async function forceMountainLocationsRefresh(): Promise<SharedAstroSpot[]> {
  cachedMountainLocations = null;
  lastCacheUpdate = 0;
  
  try {
    localStorage.removeItem('cachedMountainLocations');
  } catch (error) {
    console.error("Error clearing cached mountain locations:", error);
  }
  
  return getAllMountainLocations();
}
